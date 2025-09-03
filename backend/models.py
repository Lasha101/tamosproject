from sqlalchemy import (
    Boolean, Column, Integer, Float, String, 
    Date, ForeignKey, Table, DateTime
)
from sqlalchemy.orm import relationship
from database import Base

# ==============================================================================
# Association Tables for Many-to-Many Relationships
# ==============================================================================
# These tables link other tables together without having their own data columns.

# Links Doctors and Patients
doctor_patient_association = Table('doctor_patient_association', Base.metadata,
    Column('doctor_id', Integer, ForeignKey('doctors.id'), primary_key=True),
    Column('patient_id', Integer, ForeignKey('patients.id'), primary_key=True)
)

# Links Staff and Patients
staff_patient_association = Table('staff_patient_association', Base.metadata,
    Column('staff_id', Integer, ForeignKey('staffs.id'), primary_key=True),
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

# Links Doctors and Specialisations
doctor_specialisation_association = Table('doctor_specialisation_association', Base.metadata,
    Column('doctor_id', Integer, ForeignKey('doctors.id'), primary_key=True),
    Column('specialisation_id', Integer, ForeignKey('specialisations.id'), primary_key=True)
)

# Links Staff and Specialisations
staff_specialisation_association = Table('staff_specialisation_association', Base.metadata,
    Column('staff_id', Integer, ForeignKey('staffs.id'), primary_key=True),
    Column('specialisation_id', Integer, ForeignKey('specialisations.id'), primary_key=True)
)


# ==============================================================================
# Main Data Models
# ==============================================================================

class Specialisation(Base):
    """
    Represents a medical or administrative specialisation.
    (e.g., Cardiology, Pediatrics, Billing).
    """
    __tablename__ = "specialisations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    # Many-to-Many relationships back to Doctors and Staff
    doctors = relationship("Doctor", secondary=doctor_specialisation_association, back_populates="specialisations")
    staffs = relationship("Staff", secondary=staff_specialisation_association, back_populates="specialisations")


class Staff(Base):
    """Represents a non-doctor staff member."""
    __tablename__ = "staffs"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String)
    user_name = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="staff")
    
    # Many-to-Many relationship to Patient
    patients = relationship("Patient", secondary=staff_patient_association, back_populates="staffs")
    # Many-to-Many relationship to Specialisation
    specialisations = relationship("Specialisation", secondary=staff_specialisation_association, back_populates="staffs")


class Doctor(Base):
    """Represents a doctor."""
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String)
    user_name = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="doctor")

    # Many-to-Many relationship to Patient
    patients = relationship("Patient", secondary=doctor_patient_association, back_populates="doctors")
    # Many-to-Many relationship to Specialisation
    specialisations = relationship("Specialisation", secondary=doctor_specialisation_association, back_populates="doctors")


class Patient(Base):
    """Represents a patient."""
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    birth_date = Column(Date)
    delivery_date = Column(Date)
    expiration_date = Column(Date)
    nationality = Column(String, index=True)
    personal_number = Column(String, index=True, nullable=False)
    address = Column(String, index=True)

    # Many-to-Many relationships
    doctors = relationship("Doctor", secondary=doctor_patient_association, back_populates="patients")
    staffs = relationship("Staff", secondary=staff_patient_association, back_populates="patients")
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


