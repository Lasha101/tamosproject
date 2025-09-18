import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import crud, models, schemas
from database import get_db

# --- Configuration ---
# Load from environment variables for security
SECRET_KEY = os.getenv("SECRET_KEY", "a_default_secret_key_for_development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- JWT Token ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- User Authentication ---
def authenticate_user(db: Session, username: str, password: str):
    user = crud.get_user_by_username(db, username=username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    # --- MODIFIED: Check if the user is blocked ---
    if user.is_blocked:
        return "BLOCKED"
    # IMPORTANT: Check if the user's account has been approved by an admin
    if not user.is_approved:
        return "NOT_APPROVED"
    return user

# --- Dependency for Getting Current User ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    # --- MODIFIED: Added check for blocked status on every API call ---
    if current_user.is_blocked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is blocked.")
    return current_user

# --- Dependency for Admin-Only Routes ---
def require_admin(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user

# --- Dependency for Modify Access (Admin, Staff, Doctor) ---
def require_modify_access(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role not in ["admin", "staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges for this action.",
        )
    return current_user

