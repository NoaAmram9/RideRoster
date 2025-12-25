"""
Users API endpoints.
Handles user-related operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..schemas.schemas import UserResponse
from ..models.models import User
from ..core.security import get_current_user_id, get_current_user_group_id


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("", response_model=List[UserResponse])
def get_group_users(
    group_id: int = Depends(get_current_user_group_id),
    db: Session = Depends(get_db)
):
    """
    Get all users in the current user's group.
    """
    users = db.query(User).filter(User.group_id == group_id).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    group_id: int = Depends(get_current_user_group_id),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID (must be in same group).
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.group_id == group_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user
