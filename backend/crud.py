from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from sqlalchemy.sql.functions import concat
import models, schemas, auth
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict

# --- User Functions ---
def get_user(db: Session, user_id: int): return db.query(models.User).filter(models.User.id == user_id).first()
def get_user_by_username(db: Session, username: str): return db.query(models.User).filter(models.User.user_name == username).first()
def get_user_by_email(db: Session, email: str): return db.query(models.User).filter(models.User.email == email).first()
def get_users(db: Session, skip: int = 0, limit: int = 100): return db.query(models.User).filter(models.User.user_name != "admin").offset(skip).limit(limit).all()
def get_all_users_basic(db: Session): return db.query(models.User).filter(models.User.is_approved == True).all()

def create_user(db: Session, user: schemas.UserCreate, token: Optional[str] = None):
    is_approved_status = False if token else True
    role_to_set = user.role if hasattr(user, 'role') and user.role else 'staff'
    
    if token:
        invitation = get_invitation_by_token(db, token)
        if not invitation or invitation.is_used or invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc): return None
        invitation.is_used = True
        role_to_set = 'staff'
    
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
def get_patients(db: Session, skip: int = 0, limit: int = 100, filters: Dict[str, Optional[str]] = None):
    query = db.query(models.Patient).options(
        joinedload(models.Patient.staff_assigned),
        joinedload(models.Patient.anex_records).joinedload(models.AnexRecord.doctor),
        joinedload(models.Patient.anex_records).joinedload(models.AnexRecord.service),
        joinedload(models.Patient.anex_records).joinedload(models.AnexRecord.finance),
    )

    if filters:
        if filters.get("personal_number"):
            query = query.filter(models.Patient.personal_number.ilike(f"%{filters['personal_number']}%"))
        if filters.get("lastname"):
            query = query.filter(models.Patient.last_name.ilike(f"%{filters['lastname']}%"))
        if filters.get("firstname"):
            query = query.filter(models.Patient.first_name.ilike(f"%{filters['firstname']}%"))
        if filters.get("doctor"):
            search_like = f"%{filters['doctor']}%"
            query = query.join(models.Patient.anex_records).join(models.AnexRecord.doctor).filter(
                concat(models.User.first_name, ' ', models.User.last_name).ilike(search_like)
            )
        if filters.get("funder"):
            query = query.join(models.Patient.anex_records).join(models.AnexRecord.finance).filter(models.Finance.funder_name.ilike(f"%{filters['funder']}%"))
        if filters.get("research"):
            query = query.join(models.Patient.anex_records).join(models.AnexRecord.service).filter(models.Service.research_name.ilike(f"%{filters['research']}%"))
        if filters.get("staff"):
            query = query.join(models.Patient.staff_assigned).filter(models.User.user_name.ilike(f"%{filters['staff']}%"))
    
    return query.distinct().order_by(models.Patient.id).offset(skip).limit(limit).all()

def create_patient(db: Session, patient: schemas.PatientCreate, user_id: int):
    db_patient = models.Patient(**patient.model_dump())
    
    current_user = get_user(db, user_id)
    if current_user:
        db_patient.staff_assigned.append(current_user)

    db.add(db_patient); db.commit(); db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, patient_update: schemas.PatientUpdate):
    db_patient = get_patient(db, patient_id)
    if not db_patient: return None

    for key, value in patient_update.model_dump(exclude_unset=True).items():
        setattr(db_patient, key, value)
    
    db.commit(); db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int):
    db_patient = get_patient(db, patient_id)
    if db_patient: db.delete(db_patient); db.commit()
    return db_patient

def sync_anex_records(db: Session, patient_id: int, records: List[schemas.AnexRecordUpdate], current_user: models.User):
    db_patient = db.query(models.Patient).options(joinedload(models.Patient.anex_records)).filter(models.Patient.id == patient_id).first()
    if not db_patient:
        return None

    existing_record_ids = {r.id for r in db_patient.anex_records}
    incoming_record_ids = {r.id for r in records if r.id is not None}

    # Only an admin can delete records by omitting them from the list
    if current_user.role == 'admin':
        ids_to_delete = existing_record_ids - incoming_record_ids
        if ids_to_delete:
            db.query(models.AnexRecord).filter(
                models.AnexRecord.patient_id == patient_id,
                models.AnexRecord.id.in_(ids_to_delete)
            ).delete(synchronize_session=False)

    for record_data in records:
        record_dict = record_data.model_dump()
        record_id = record_dict.pop('id', None)
        
        if record_id is not None and record_id in existing_record_ids:
            # Update existing record
            db.query(models.AnexRecord).filter(models.AnexRecord.id == record_id).update(record_dict)
        else:
            # Add new record
            new_record = models.AnexRecord(**record_dict, patient_id=patient_id)
            db.add(new_record)
    
    db.commit()
    
    # Re-fetch the patient to get the updated state
    updated_patient = db.query(models.Patient).options(
        joinedload(models.Patient.anex_records)
    ).filter(models.Patient.id == patient_id).first()

    return updated_patient


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