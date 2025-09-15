from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime

# --- Base Schemas (for nesting) ---
class ServiceBase(BaseModel):
    service_number: str
    research_name: str
    laboratory_name: str
    deadline: Optional[date] = None

class Service(ServiceBase):
    id: int
    class Config: from_attributes = True

class FinanceBase(BaseModel):
    funder_name: str
    email: EmailStr
    phone_number: Optional[str] = None

class Finance(FinanceBase):
    id: int
    class Config: from_attributes = True
    
class User(BaseModel):
    id: int
    user_name: str
    first_name: str
    last_name: str
    role: str
    class Config: from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User Schemas (Full) ---
class UserBase(BaseModel):
    email: EmailStr
    user_name: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    
class UserCreate(UserBase):
    password: str
    role: str = 'staff' # Admin can set this on manual creation

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    user_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserApprove(BaseModel):
    role: str

class UserInDB(UserBase):
    id: int
    role: str
    is_approved: bool
    class Config: from_attributes = True

# --- Anex Schemas ---
class AnexRecordBase(BaseModel):
    doctor_id: int
    service_id: int
    finance_id: Optional[int] = None
    payable_amount: float = 0.0
    paid_amount: float = 0.0

class AnexRecordCreate(AnexRecordBase):
    pass

class AnexRecordUpdate(AnexRecordBase):
    id: Optional[int] = None

class AnexRecord(AnexRecordBase):
    id: int
    doctor: Optional[User] = None
    service: Optional[Service] = None
    finance: Optional[Finance] = None
    class Config: from_attributes = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    birth_date: date
    nationality: str
    personal_number: str
    address: Optional[str] = None

class PatientCreate(PatientBase):
    pass # Simplified

class PatientUpdate(PatientBase):
    pass # Simplified

class Patient(PatientBase):
    id: int
    staff_assigned: List[User] = []
    anex_records: List[AnexRecord] = []
    class Config: from_attributes = True

# --- Invitation Schemas ---
class InvitationBase(BaseModel): email: EmailStr
class InvitationCreate(InvitationBase): pass
class Invitation(InvitationBase):
    id: int
    token: str
    expires_at: datetime
    is_used: bool
    class Config: from_attributes = True

# --- Finance Schemas (Full) ---
class FinanceCreate(FinanceBase): pass
class FinanceUpdate(FinanceBase): pass
class FinanceInDB(FinanceBase):
    id: int
    class Config: from_attributes = True

# --- Service Schemas (Full) ---
class ServiceCreate(ServiceBase): pass
class ServiceUpdate(ServiceBase): pass
class ServiceInDB(ServiceBase):
    id: int
    class Config: from_attributes = True

# --- History Log Schemas ---
class UserForHistory(BaseModel):
    id: int
    user_name: str
    class Config: from_attributes = True

class PatientForHistory(BaseModel):
    id: int
    first_name: str
    last_name: str
    personal_number: str
    class Config: from_attributes = True

class HistoryLog(BaseModel):
    id: int
    timestamp: datetime
    action: str
    entity_type: str
    entity_id: int
    changes: dict
    user: UserForHistory
    patient: Optional[PatientForHistory] = None
    class Config: from_attributes = True

# --- Misc Schemas ---
class PasswordVerify(BaseModel):
    password: str

class AdminPatientDelete(BaseModel):
    personal_number: str
    password: str

# Update forward references
Patient.model_rebuild()
HistoryLog.model_rebuild()