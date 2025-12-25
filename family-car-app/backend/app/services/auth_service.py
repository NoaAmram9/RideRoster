"""
Authentication service.
Handles user authentication, registration, and token management.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import timedelta
from ..models.models import User, Group
from ..schemas.schemas import LoginRequest, RegisterRequest, LoginResponse, UserResponse
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.config import settings


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> User:
        """
        Authenticate a user with username and password.
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            Authenticated user
            
        Raises:
            HTTPException: If credentials are invalid
        """
        user = db.query(User).filter(User.username == login_data.username).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        
        return user
    
    @staticmethod
    def create_user_token(user: User) -> str:
        """
        Create a JWT token for a user.
        
        Args:
            user: User object
            
        Returns:
            JWT token string
        """
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.id,
                "username": user.username,
                "group_id": user.group_id,
                "is_admin": user.is_admin,
            },
            expires_delta=access_token_expires
        )
        return access_token
    
    @staticmethod
    def login(db: Session, login_data: LoginRequest) -> LoginResponse:
        """
        Login a user and return token with user data.
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            Login response with token and user data
        """
        user = AuthService.authenticate_user(db, login_data)
        token = AuthService.create_user_token(user)
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
    
    @staticmethod
    def register(db: Session, register_data: RegisterRequest) -> LoginResponse:
        """
        Register a new user and optionally create a new group.
        
        Args:
            db: Database session
            register_data: Registration data
            
        Returns:
            Login response with token and user data
            
        Raises:
            HTTPException: If username already exists
        """
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == register_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        
        # Create new group if group_name is provided
        if register_data.group_name:
            group = Group(
                name=register_data.group_name,
                car_model=register_data.car_model
            )
            db.add(group)
            db.flush()  # Get the group ID
            group_id = group.id
        else:
            # If no group_name, user must provide group_id (not implemented in this simple version)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group name is required for new users",
            )
        
        # Create new user
        new_user = User(
            username=register_data.username,
            password_hash=get_password_hash(register_data.password),
            full_name=register_data.full_name,
            group_id=group_id,
            is_admin=register_data.is_admin
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create token
        token = AuthService.create_user_token(new_user)
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(new_user)
        )
