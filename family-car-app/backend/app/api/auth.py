"""
Authentication API endpoints.
Handles user login and registration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.schemas import LoginRequest, LoginResponse, RegisterRequest
from ..services.auth_service import AuthService
from ..core.security import get_current_user_id


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint.
    
    Authenticates user and returns JWT token with user data.
    """
    return AuthService.login(db, login_data)


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(register_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registration endpoint.
    
    Creates a new user and optionally a new group.
    Returns JWT token with user data.
    """
    return AuthService.register(db, register_data)


@router.post("/verify")
def verify_token(user_id: int = Depends(get_current_user_id)):
    """
    Verify token endpoint.
    
    Verifies that the provided token is valid.
    Returns user ID if valid.
    """
    return {"valid": True, "user_id": user_id}