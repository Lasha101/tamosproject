from sqlalchemy import (
    Boolean, Column, Integer, Float, String, 
    Date, ForeignKey, Table, DateTime
)
from sqlalchemy.orm import relationship
from database import Base



# Links Users (doctors or staff) and Patients
user_patient_association = Table('user_patient_association', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('patient_id', Integer, ForeignKey('patients.id'), primary_key=True)
)

# Links Patients and Services
patient_service_association = Table('patient_service_association', Base.metadata,
    Column('patient_id', Integer, ForeignKey('patients.id'), primary_key=True),
    Column('service_id', Integer, ForeignKey('services.id'), primary_key=True)
)

# Links Patients and Finances
patient_finance_association = Table('patient_finance_association', Base.metadata,
    Column('patient_id', Integer, ForeignKey('patients.id'), primary_key=True),
    Column('finance_id', Integer, ForeignKey('finances.id'), primary_key=True)
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
    
    # Many-to-Many relationship to Patient
    patients = relationship("Patient", secondary=user_patient_association, back_populates="users")
    # Many-to-Many relationship to Specialisation
    specialisations = relationship("Specialisation", secondary=user_specialisation_association, back_populates="users")


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
    personal_number = Column(String, index=True, nullable=False)
    address = Column(String, index=True)

    # Many-to-Many relationships
    users = relationship("User", secondary=user_patient_association, back_populates="patients")
    services = relationship("Service", secondary=patient_service_association, back_populates="patients")
    finances = relationship("Finance", secondary=patient_finance_association, back_populates="patients")


class Service(Base):
    """Represents a medical service or research item."""
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    service_number = Column(String, index=True)
    research_name = Column(String, index=True)
    laboratory_name = Column(String, index=True, nullable=False)
    deadline = Column(Date)
    
    # Many-to-Many relationship to Patient
    patients = relationship("Patient", secondary=patient_service_association, back_populates="services")


class Finance(Base):
    """Represents a financial record or transaction."""
    __tablename__ = "finances"
    id = Column(Integer, primary_key=True, index=True)
    funder_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String)
    paid_amount = Column(Float, index=True)
    payable_amount = Column(Float, index=True)
    
    # Many-to-Many relationship to Patient
    patients = relationship("Patient", secondary=patient_finance_association, back_populates="finances")


class Invitation(Base):
    """Represents a one-time invitation for user registration."""
    __tablename__ = "invitations"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)

