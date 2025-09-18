from sqlalchemy import (
    Boolean, Column, Integer, Float, String, 
    Date, ForeignKey, Table, DateTime, JSON
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone


# Links Users (staff) and Patients for general assignment
user_patient_association = Table('user_patient_association', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('patient_id', Integer, ForeignKey('patients.id'), primary_key=True)
)

# Links Users (doctors or staff) and Specialisations
user_specialisation_association = Table('user_specialisation_association', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('specialisation_id', Integer, ForeignKey('specialisations.id'), primary_key=True)
)


class User(Base):
    """Represents any user of the system, like a doctor or staff member."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String)
    user_name = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, index=True, nullable=False) # e.g., "doctor", "staff"
    is_approved = Column(Boolean, default=False)
    # --- MODIFIED: Added is_blocked column ---
    is_blocked = Column(Boolean, default=False, nullable=False)
    
    # Many-to-Many relationship for general staff assignment to a Patient
    patients_assigned = relationship("Patient", secondary=user_patient_association, back_populates="staff_assigned")
    
    # Many-to-Many relationship to Specialisation
    specialisations = relationship("Specialisation", secondary=user_specialisation_association, back_populates="users")

    # One-to-Many relationship for tracking changes made by this user
    history_logs = relationship("HistoryLog", back_populates="user")


class Specialisation(Base):
    """
    Represents a medical or administrative specialisation.
    (e.g., Cardiology, Pediatrics, Billing).
    """
    __tablename__ = "specialisations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    # Many-to-Many relationship back to Users
    users = relationship("User", secondary=user_specialisation_association, back_populates="specialisations")


class Patient(Base):
    """Represents a patient."""
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    birth_date = Column(Date)
    nationality = Column(String, index=True)
    personal_number = Column(String, index=True, nullable=False, unique=True)
    address = Column(String, index=True)

    # Many-to-Many for general staff assignment
    staff_assigned = relationship("User", secondary=user_patient_association, back_populates="patients_assigned")
    
    # One-to-Many for detailed Doctor->Service->Funder records
    anex_records = relationship("AnexRecord", back_populates="patient", cascade="all, delete-orphan")


class AnexRecord(Base):
    """ Links a Patient to a specific Doctor, Service, and Funder with amounts. """
    __tablename__ = "anex_records"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    # --- MODIFIED: Added ondelete='SET NULL' to preserve records if a doctor is deleted ---
    doctor_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=False)
    finance_id = Column(Integer, ForeignKey('finances.id'), nullable=True) # Nullable for self-funding
    payable_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)

    patient = relationship("Patient", back_populates="anex_records")
    doctor = relationship("User")
    service = relationship("Service")
    finance = relationship("Finance")


class Service(Base):
    """Represents a medical service or research item."""
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    service_number = Column(String, index=True)
    research_name = Column(String, index=True)
    laboratory_name = Column(String, index=True, nullable=False)
    deadline = Column(Date)
    

class Finance(Base):
    """Represents a financial record or transaction."""
    __tablename__ = "finances"
    id = Column(Integer, primary_key=True, index=True)
    funder_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String)
    

class Invitation(Base):
    """Represents a one-time invitation for user registration."""
    __tablename__ = "invitations"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)

class HistoryLog(Base):
    """Represents a record of a change made in the system."""
    __tablename__ = "history_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # --- MODIFIED: Added ondelete='SET NULL' to preserve history logs ---
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(String, index=True) # e.g., CREATE, UPDATE, DELETE
    entity_type = Column(String, index=True) # e.g., Patient, User
    entity_id = Column(Integer)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=True, index=True)
    changes = Column(JSON) # Stores a dict of changes, e.g., {"field": {"before": "...", "after": "..."}}

    user = relationship("User", back_populates="history_logs")
    patient = relationship("Patient")
