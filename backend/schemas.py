from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime

# --- Base Schemas (for nesting) ---
class Service(BaseModel):
    id: int
    service_number: str
    research_name: str
    class Config: from_attributes = True

class Finance(BaseModel):
    id: int
    funder_name: str
    class Config: from_attributes = True
    
class User(BaseModel):
    id: int
    user_name: str
    role: str # Added role here to be visible on patient view
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
    role: Optional[str] = None # Allow role updates

class UserApprove(BaseModel):
    role: str

class UserInDB(UserBase):
    id: int
    role: str
    is_approved: bool
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
    service_ids: Optional[List[int]] = []
    finance_ids: Optional[List[int]] = []

class PatientUpdate(PatientBase):
    service_ids: Optional[List[int]] = []
    finance_ids: Optional[List[int]] = []

class Patient(PatientBase):
    id: int
    services: List[Service] = []
    finances: List[Finance] = []
    users: List[User] = []
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
class FinanceBase(BaseModel):
    funder_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    paid_amount: float
    payable_amount: float

class FinanceCreate(FinanceBase): pass
class FinanceUpdate(FinanceBase): pass
class FinanceInDB(FinanceBase):
    id: int
    class Config: from_attributes = True

# --- Service Schemas (Full) ---
class ServiceBase(BaseModel):
    service_number: str
    research_name: str
    laboratory_name: str
    deadline: Optional[date] = None

class ServiceCreate(ServiceBase): pass
class ServiceUpdate(ServiceBase): pass
class ServiceInDB(ServiceBase):
    id: int
    class Config: from_attributes = True

# --- Misc Schemas ---
class PasswordVerify(BaseModel):
    password: str

# Update forward references
Patient.model_rebuild()

