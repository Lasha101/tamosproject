import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from datetime import datetime, timezone

import crud, models, schemas, auth
from database import SessionLocal, engine, get_db

load_dotenv()
models.Base.metadata.create_all(bind=engine)
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    if not crud.get_user_by_username(db, username="admin"):
        ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
        if ADMIN_PASSWORD:
            admin_schema = schemas.UserCreate(first_name="Admin", last_name="User", email="admin@example.com", user_name="admin", password=ADMIN_PASSWORD, role="admin")
            crud.create_user(db=db, user=admin_schema)
    db.close()
    yield

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda req, exc: HTTPException(429, "Too Many Requests"))
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Auth & Registration ---
@app.post("/token", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if user == "NOT_APPROVED": raise HTTPException(status.HTTP_403_FORBIDDEN, "Account not approved by admin.")
    if not user: raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect username or password")
    return {"access_token": auth.create_access_token({"sub": user.user_name}), "token_type": "bearer"}

@app.post("/users/", response_model=schemas.UserInDB)
def register(user: schemas.UserCreate, token: str = Query(...), db: Session = Depends(get_db)):
    created_user = crud.create_user(db=db, user=user, token=token)
    if not created_user: raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired invitation token.")
    return created_user

# --- Admin Routes ---
@app.post("/admin/verify-password", status_code=status.HTTP_204_NO_CONTENT)
def verify_admin_password(payload: schemas.PasswordVerify, current_user: models.User = Depends(auth.require_admin)):
    if not auth.verify_password(payload.password, current_user.hashed_password): raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect password.")

@app.get("/admin/users/", response_model=List[schemas.UserInDB], dependencies=[Depends(auth.require_admin)])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)): return crud.get_users(db, skip, limit)

@app.post("/admin/users/", response_model=schemas.UserInDB, dependencies=[Depends(auth.require_admin)])
def create_user_manual(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email) or crud.get_user_by_username(db, user.user_name): raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email or username already registered.")
    return crud.create_user(db=db, user=user)

@app.put("/admin/users/{user_id}", response_model=schemas.UserInDB, dependencies=[Depends(auth.require_admin)])
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = crud.update_user(db, user_id, user_update)
    if not db_user: raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return db_user

@app.delete("/admin/users/{user_id}", response_model=schemas.UserInDB, dependencies=[Depends(auth.require_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.delete_user(db, user_id)
    if not db_user: raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return db_user

@app.post("/admin/users/{user_id}/approve", response_model=schemas.UserInDB, dependencies=[Depends(auth.require_admin)])
def approve_user(user_id: int, approval_data: schemas.UserApprove, db: Session = Depends(get_db)):
    db_user = crud.approve_user(db, user_id, role=approval_data.role)
    if not db_user: raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return db_user

@app.post("/admin/invitations/", response_model=schemas.Invitation, dependencies=[Depends(auth.require_admin)])
def create_invitation(invitation: schemas.InvitationCreate, db: Session = Depends(get_db)):
    return crud.create_invitation(db=db, email=invitation.email)

# --- Patient Routes ---
@app.get("/patients/", response_model=List[schemas.Patient], dependencies=[Depends(auth.get_current_active_user)])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_patients(db, skip, limit)

@app.post("/patients/", response_model=schemas.Patient, dependencies=[Depends(auth.require_admin)])
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    if crud.get_patient_by_personal_number(db, patient.personal_number): raise HTTPException(status.HTTP_400_BAD_REQUEST, "Patient with this personal number already exists.")
    return crud.create_patient(db, patient, user_id=current_user.id)

@app.put("/patients/{patient_id}", response_model=schemas.Patient, dependencies=[Depends(auth.require_admin)])
def update_patient(patient_id: int, patient_update: schemas.PatientUpdate, db: Session = Depends(get_db)):
    db_patient = crud.update_patient(db, patient_id, patient_update)
    if not db_patient: raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return db_patient

@app.delete("/patients/{patient_id}", response_model=schemas.Patient, dependencies=[Depends(auth.require_admin)])
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    db_patient = crud.delete_patient(db, patient_id)
    if not db_patient: raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return db_patient

# --- Finance Routes (Admin Only) ---
@app.get("/finances/", response_model=List[schemas.FinanceInDB], dependencies=[Depends(auth.require_admin)])
def get_finances(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)): return crud.get_finances(db, skip, limit)

@app.post("/finances/", response_model=schemas.FinanceInDB, dependencies=[Depends(auth.require_admin)])
def create_finance(finance: schemas.FinanceCreate, db: Session = Depends(get_db)): return crud.create_finance(db, finance)

@app.put("/finances/{finance_id}", response_model=schemas.FinanceInDB, dependencies=[Depends(auth.require_admin)])
def update_finance(finance_id: int, finance_update: schemas.FinanceUpdate, db: Session = Depends(get_db)):
    db_finance = crud.update_finance(db, finance_id, finance_update)
    if not db_finance: raise HTTPException(status.HTTP_404_NOT_FOUND, "Finance record not found")
    return db_finance

@app.delete("/finances/{finance_id}", response_model=schemas.FinanceInDB, dependencies=[Depends(auth.require_admin)])
def delete_finance(finance_id: int, db: Session = Depends(get_db)):
    db_finance = crud.delete_finance(db, finance_id)
    if not db_finance: raise HTTPException(status.HTTP_404_NOT_FOUND, "Finance record not found")
    return db_finance

# --- Service Routes (Admin Only) ---
@app.get("/services/", response_model=List[schemas.ServiceInDB], dependencies=[Depends(auth.require_admin)])
def get_services(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)): return crud.get_services(db, skip, limit)

@app.post("/services/", response_model=schemas.ServiceInDB, dependencies=[Depends(auth.require_admin)])
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db)): return crud.create_service(db, service)

@app.put("/services/{service_id}", response_model=schemas.ServiceInDB, dependencies=[Depends(auth.require_admin)])
def update_service(service_id: int, service_update: schemas.ServiceUpdate, db: Session = Depends(get_db)):
    db_service = crud.update_service(db, service_id, service_update)
    if not db_service: raise HTTPException(status.HTTP_404_NOT_FOUND, "Service record not found")
    return db_service

@app.delete("/services/{service_id}", response_model=schemas.ServiceInDB, dependencies=[Depends(auth.require_admin)])
def delete_service(service_id: int, db: Session = Depends(get_db)):
    db_service = crud.delete_service(db, service_id)
    if not db_service: raise HTTPException(status.HTTP_404_NOT_FOUND, "Service record not found")
    return db_service

