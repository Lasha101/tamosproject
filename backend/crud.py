from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, inspect
from sqlalchemy.sql.functions import concat
import models, schemas, auth
import secrets
from datetime import datetime, timedelta, timezone, date
from typing import Optional, List, Dict
import json

# --- History Log Helper ---
def json_serializer(obj):
    """Custom JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def create_history_log(db: Session, user_id: int, action: str, entity, changes: dict):
    # Sanitize changes to ensure they are JSON-serializable
    sanitized_changes = json.loads(json.dumps(changes, default=json_serializer))

    db_log = models.HistoryLog(
        user_id=user_id,
        action=action,
        entity_type=entity.__class__.__name__,
        entity_id=entity.id,
        changes=sanitized_changes
    )
    # If the entity is a Patient or has a patient_id, link it for easy filtering
    if isinstance(entity, models.Patient):
        db_log.patient_id = entity.id
    elif hasattr(entity, 'patient_id') and entity.patient_id:
        db_log.patient_id = entity.patient_id
    
    db.add(db_log)

# --- User Functions ---
def get_user(db: Session, user_id: int): return db.query(models.User).filter(models.User.id == user_id).first()
def get_user_by_username(db: Session, username: str): return db.query(models.User).filter(models.User.user_name == username).first()
def get_user_by_email(db: Session, email: str): return db.query(models.User).filter(models.User.email == email).first()
def get_users(db: Session, skip: int = 0, limit: int = 100): return db.query(models.User).filter(models.User.user_name != "admin").offset(skip).limit(limit).all()
def get_all_users_basic(db: Session): return db.query(models.User).filter(models.User.is_approved == True).all()

def create_user(db: Session, user: schemas.UserCreate, token: Optional[str] = None, current_user: Optional[models.User] = None):
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
    db.add(db_user); db.flush()

    if current_user: # Admin manual creation
        create_history_log(db, current_user.id, "CREATE", db_user, user.model_dump(exclude={'password'}))

    db.commit(); db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate, current_user: models.User):
    db_user = get_user(db, user_id)
    if not db_user: return None
    
    changes = {}
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        db_user.hashed_password = auth.get_password_hash(update_data["password"])
        changes["password"] = {"before": "********", "after": "********"}

    for key, value in update_data.items():
        if key != "password":
            old_value = getattr(db_user, key)
            if old_value != value:
                changes[key] = {"before": old_value, "after": value}
            setattr(db_user, key, value)
    
    if changes:
        create_history_log(db, current_user.id, "UPDATE", db_user, changes)

    db.commit(); db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int, current_user: models.User):
    db_user = get_user(db, user_id)
    if db_user:
        inspector = inspect(db_user)
        state = {c.key: getattr(db_user, c.key) for c in inspector.mapper.column_attrs if c.key != 'hashed_password'}
        create_history_log(db, current_user.id, "DELETE", db_user, state)
        db.delete(db_user)
        db.commit()
    return db_user

def approve_user(db: Session, user_id: int, role: str, current_user: models.User):
    db_user = get_user(db, user_id)
    if db_user:
        changes = {
            "is_approved": {"before": db_user.is_approved, "after": True},
            "role": {"before": db_user.role, "after": role}
        }
        db_user.is_approved = True
        db_user.role = role
        create_history_log(db, current_user.id, "UPDATE", db_user, changes)
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
            funder_search = filters["funder"].lower()
            if 'self' in funder_search:
                query = query.join(models.Patient.anex_records).filter(models.AnexRecord.finance_id.is_(None))
            else:
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

    db.add(db_patient); db.flush()
    create_history_log(db, user_id, "CREATE", db_patient, patient.model_dump())
    db.commit(); db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, patient_update: schemas.PatientUpdate, current_user: models.User):
    db_patient = get_patient(db, patient_id)
    if not db_patient: return None

    changes = {}
    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        old_value = getattr(db_patient, key)
        if old_value != value:
            changes[key] = {"before": old_value, "after": value}
        setattr(db_patient, key, value)

    if changes:
        create_history_log(db, current_user.id, "UPDATE", db_patient, changes)

    db.commit(); db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int, current_user: models.User):
    db_patient = get_patient(db, patient_id)
    if db_patient:
        inspector = inspect(db_patient)
        state = {c.key: getattr(db_patient, c.key) for c in inspector.mapper.column_attrs}
        create_history_log(db, current_user.id, "DELETE", db_patient, state)
        db.delete(db_patient)
        db.commit()
    return db_patient

def delete_patient_by_personal_number(db: Session, personal_number: str, current_user: models.User):
    db_patient = get_patient_by_personal_number(db, personal_number)
    if db_patient:
        # Re-use the id-based delete function which already contains logging logic
        return delete_patient(db, db_patient.id, current_user)
    return None

def sync_anex_records(db: Session, patient_id: int, records: List[schemas.AnexRecordUpdate], current_user: models.User):
    db_patient = db.query(models.Patient).options(joinedload(models.Patient.anex_records)).filter(models.Patient.id == patient_id).first()
    if not db_patient: return None

    existing_records_map = {r.id: r for r in db_patient.anex_records}
    incoming_record_ids = {r.id for r in records if r.id is not None}

    if current_user.role == 'admin':
        ids_to_delete = set(existing_records_map.keys()) - incoming_record_ids
        if ids_to_delete:
            records_to_delete = db.query(models.AnexRecord).filter(models.AnexRecord.id.in_(ids_to_delete)).all()
            for rec in records_to_delete:
                inspector = inspect(rec)
                state = {c.key: getattr(rec, c.key) for c in inspector.mapper.column_attrs}
                create_history_log(db, current_user.id, "DELETE", rec, state)
            db.query(models.AnexRecord).filter(models.AnexRecord.id.in_(ids_to_delete)).delete(synchronize_session=False)

    for record_data in records:
        record_dict = record_data.model_dump()
        record_id = record_dict.pop('id', None)
        
        if record_id is not None and record_id in existing_records_map:
            # Update
            existing_record = existing_records_map[record_id]
            changes = {}
            for key, value in record_dict.items():
                old_value = getattr(existing_record, key)
                if old_value != value:
                    changes[key] = {"before": old_value, "after": value}
            
            if changes:
                db.query(models.AnexRecord).filter(models.AnexRecord.id == record_id).update(record_dict, synchronize_session=False)
                create_history_log(db, current_user.id, "UPDATE", existing_record, changes)
        else:
            # Add new record
            new_record = models.AnexRecord(**record_dict, patient_id=patient_id)
            db.add(new_record); db.flush()
            create_history_log(db, current_user.id, "CREATE", new_record, record_dict)
    
    db.commit()
    
    return db.query(models.Patient).options(joinedload(models.Patient.anex_records)).filter(models.Patient.id == patient_id).first()


# --- Finance Functions ---
def get_finance(db: Session, finance_id: int): return db.query(models.Finance).filter(models.Finance.id == finance_id).first()
def get_finances(db: Session, skip: int = 0, limit: int = 100): return db.query(models.Finance).offset(skip).limit(limit).all()
def create_finance(db: Session, finance: schemas.FinanceCreate, current_user: models.User):
    db_finance = models.Finance(**finance.model_dump())
    db.add(db_finance); db.flush()
    create_history_log(db, current_user.id, "CREATE", db_finance, finance.model_dump())
    db.commit(); db.refresh(db_finance)
    return db_finance

def update_finance(db: Session, finance_id: int, finance_update: schemas.FinanceUpdate, current_user: models.User):
    db_finance = get_finance(db, finance_id)
    if not db_finance: return None
    changes = {}
    update_data = finance_update.model_dump()
    for key, value in update_data.items():
        old_value = getattr(db_finance, key)
        if old_value != value:
            changes[key] = {"before": old_value, "after": value}
        setattr(db_finance, key, value)
    if changes:
        create_history_log(db, current_user.id, "UPDATE", db_finance, changes)
    db.commit(); db.refresh(db_finance)
    return db_finance

def delete_finance(db: Session, finance_id: int, current_user: models.User):
    db_finance = get_finance(db, finance_id)
    if db_finance:
        inspector = inspect(db_finance)
        state = {c.key: getattr(db_finance, c.key) for c in inspector.mapper.column_attrs}
        create_history_log(db, current_user.id, "DELETE", db_finance, state)
        db.delete(db_finance)
        db.commit()
    return db_finance

# --- Service Functions ---
def get_service(db: Session, service_id: int): return db.query(models.Service).filter(models.Service.id == service_id).first()
def get_services(db: Session, skip: int = 0, limit: int = 100): return db.query(models.Service).offset(skip).limit(limit).all()
def create_service(db: Session, service: schemas.ServiceCreate, current_user: models.User):
    db_service = models.Service(**service.model_dump())
    db.add(db_service); db.flush()
    create_history_log(db, current_user.id, "CREATE", db_service, service.model_dump())
    db.commit(); db.refresh(db_service)
    return db_service

def update_service(db: Session, service_id: int, service_update: schemas.ServiceUpdate, current_user: models.User):
    db_service = get_service(db, service_id)
    if not db_service: return None
    changes = {}
    update_data = service_update.model_dump()
    for key, value in update_data.items():
        old_value = getattr(db_service, key)
        if old_value != value:
            changes[key] = {"before": old_value, "after": value}
        setattr(db_service, key, value)
    if changes:
        create_history_log(db, current_user.id, "UPDATE", db_service, changes)
    db.commit(); db.refresh(db_service)
    return db_service

def delete_service(db: Session, service_id: int, current_user: models.User):
    db_service = get_service(db, service_id)
    if db_service:
        inspector = inspect(db_service)
        state = {c.key: getattr(db_service, c.key) for c in inspector.mapper.column_attrs}
        create_history_log(db, current_user.id, "DELETE", db_service, state)
        db.delete(db_service); db.commit()
    return db_service

# --- History Log Functions ---
def get_history_logs(db: Session, skip: int, limit: int, filters: Dict[str, Optional[str]]):
    query = db.query(models.HistoryLog).options(
        joinedload(models.HistoryLog.user),
        joinedload(models.HistoryLog.patient)
    )

    if filters:
        if filters.get("author"):
            query = query.join(models.User).filter(models.User.user_name.ilike(f"%{filters['author']}%"))
        if filters.get("date"):
            # Filter for the entire day, assuming date is a datetime.date object
            start_of_day = datetime.combine(filters['date'], datetime.min.time()).replace(tzinfo=timezone.utc)
            end_of_day = start_of_day + timedelta(days=1)
            query = query.filter(models.HistoryLog.timestamp >= start_of_day, models.HistoryLog.timestamp < end_of_day)
        if filters.get("patient"):
            search_like = f"%{filters['patient']}%"
            # Use outer join in case a log is not associated with a patient (e.g., User creation)
            query = query.outerjoin(models.HistoryLog.patient).filter(
                or_(
                    models.Patient.personal_number.ilike(search_like),
                    concat(models.Patient.first_name, ' ', models.Patient.last_name).ilike(search_like)
                )
            )

    return query.order_by(models.HistoryLog.timestamp.desc()).offset(skip).limit(limit).all()