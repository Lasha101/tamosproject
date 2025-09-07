from sqlalchemy.orm import Session, joinedload
import models, schemas, auth
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

# --- User Functions ---
def get_user(db: Session, user_id: int): return db.query(models.User).filter(models.User.id == user_id).first()
def get_user_by_username(db: Session, username: str): return db.query(models.User).filter(models.User.user_name == username).first()
def get_user_by_email(db: Session, email: str): return db.query(models.User).filter(models.User.email == email).first()
def get_users(db: Session, skip: int = 0, limit: int = 100): return db.query(models.User).filter(models.User.user_name != "admin").offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate, token: Optional[str] = None):
    is_approved_status = False if token else True
    # If called via registration, role will be a default, to be set on approval.
    # If called by admin, role is taken from the UserCreate schema.
    role_to_set = user.role if hasattr(user, 'role') else 'staff'
    
    if token:
        invitation = get_invitation_by_token(db, token)
        if not invitation or invitation.is_used or invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc): return None
        invitation.is_used = True
        # For registrations, role is not set until approval.
        role_to_set = 'staff' # Default pending role
    
    db_user = models.User(
        **user.model_dump(exclude={"password", "role"}),
        hashed_password=auth.get_password_hash(user.password),
        role=role_to_set, is_approved=is_approved_status
    )
    db.add(db_user); db.commit(); db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user: return None
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        db_user.hashed_password = auth.get_password_hash(update_data["password"])
    for key, value in update_data.items():
        if key != "password": setattr(db_user, key, value)
    db.commit(); db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user: db.delete(db_user); db.commit()
    return db_user

def approve_user(db: Session, user_id: int, role: str):
    db_user = get_user(db, user_id)
    if db_user:
        db_user.is_approved = True
        db_user.role = role
        db.commit()
        db.refresh(db_user)
    return db_user

# --- Invitation Functions ---
def create_invitation(db: Session, email: str):
    db_invitation = models.Invitation(email=email, token=secrets.token_urlsafe(32), expires_at=datetime.now(timezone.utc) + timedelta(hours=24))
    db.add(db_invitation); db.commit(); db.refresh(db_invitation)
    return db_invitation
def get_invitation_by_token(db: Session, token: str): return db.query(models.Invitation).filter(models.Invitation.token == token).first()
def get_invitation_by_email(db: Session, email: str): return db.query(models.Invitation).filter(models.Invitation.email == email).first()

# --- Patient Functions ---
def get_patient(db: Session, patient_id: int): return db.query(models.Patient).filter(models.Patient.id == patient_id).first()
def get_patient_by_personal_number(db: Session, personal_number: str): return db.query(models.Patient).filter(models.Patient.personal_number == personal_number).first()
def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Patient).options(
        joinedload(models.Patient.users),
        joinedload(models.Patient.services),
        joinedload(models.Patient.finances)
    ).order_by(models.Patient.id).offset(skip).limit(limit).all()

def create_patient(db: Session, patient: schemas.PatientCreate, user_id: int):
    db_patient = models.Patient(**patient.model_dump(exclude={'service_ids', 'finance_ids'}))
    
    admin_user = get_user(db, user_id)
    if admin_user: db_patient.users.append(admin_user)

    if patient.service_ids:
        services = db.query(models.Service).filter(models.Service.id.in_(patient.service_ids)).all()
        db_patient.services.extend(services)
    
    if patient.finance_ids:
        finances = db.query(models.Finance).filter(models.Finance.id.in_(patient.finance_ids)).all()
        db_patient.finances.extend(finances)

    db.add(db_patient); db.commit(); db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, patient_update: schemas.PatientUpdate):
    db_patient = get_patient(db, patient_id)
    if not db_patient: return None

    for key, value in patient_update.model_dump(exclude={'service_ids', 'finance_ids'}, exclude_unset=True).items():
        setattr(db_patient, key, value)
    
    if patient_update.service_ids is not None:
        services = db.query(models.Service).filter(models.Service.id.in_(patient_update.service_ids)).all()
        db_patient.services = services
        
    if patient_update.finance_ids is not None:
        finances = db.query(models.Finance).filter(models.Finance.id.in_(patient_update.finance_ids)).all()
        db_patient.finances = finances

    db.commit(); db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int):
    db_patient = get_patient(db, patient_id)
    if db_patient: db.delete(db_patient); db.commit()
    return db_patient

# --- Finance Functions ---
def get_finance(db: Session, finance_id: int): return db.query(models.Finance).filter(models.Finance.id == finance_id).first()
def get_finances(db: Session, skip: int = 0, limit: int = 100): return db.query(models.Finance).offset(skip).limit(limit).all()
def create_finance(db: Session, finance: schemas.FinanceCreate):
    db_finance = models.Finance(**finance.model_dump())
    db.add(db_finance); db.commit(); db.refresh(db_finance)
    return db_finance
def update_finance(db: Session, finance_id: int, finance_update: schemas.FinanceUpdate):
    db_finance = get_finance(db, finance_id)
    if not db_finance: return None
    for key, value in finance_update.model_dump().items(): setattr(db_finance, key, value)
    db.commit(); db.refresh(db_finance)
    return db_finance
def delete_finance(db: Session, finance_id: int):
    db_finance = get_finance(db, finance_id)
    if db_finance: db.delete(db_finance); db.commit()
    return db_finance

# --- Service Functions ---
def get_service(db: Session, service_id: int): return db.query(models.Service).filter(models.Service.id == service_id).first()
def get_services(db: Session, skip: int = 0, limit: int = 100): return db.query(models.Service).offset(skip).limit(limit).all()
def create_service(db: Session, service: schemas.ServiceCreate):
    db_service = models.Service(**service.model_dump())
    db.add(db_service); db.commit(); db.refresh(db_service)
    return db_service
def update_service(db: Session, service_id: int, service_update: schemas.ServiceUpdate):
    db_service = get_service(db, service_id)
    if not db_service: return None
    for key, value in service_update.model_dump().items(): setattr(db_service, key, value)
    db.commit(); db.refresh(db_service)
    return db_service
def delete_service(db: Session, service_id: int):
    db_service = get_service(db, service_id)
    if db_service: db.delete(db_service); db.commit()
    return db_service

