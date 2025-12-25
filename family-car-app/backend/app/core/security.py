"""
Security and authentication utilities.
Handles JWT tokens, password hashing, and user verification.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme for token authentication
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary of data to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = data.copy()
    # Ensure 'sub' is a string
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    Dependency to extract current user ID from JWT token.
    
    Args:
        credentials: HTTP bearer token credentials
        
    Returns:
        User ID from token
        
    Raises:
        HTTPException: If token is invalid or user_id is missing
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    # Convert to int if it's a string
    try:
        return int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )


def get_current_user_group_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    Dependency to extract current user's group ID from JWT token.
    
    Args:
        credentials: HTTP bearer token credentials
        
    Returns:
        Group ID from token
        
    Raises:
        HTTPException: If token is invalid or group_id is missing
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    group_id = payload.get("group_id")
    if group_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    # Convert to int if it's a string
    try:
        return int(group_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid group ID in token",
        )


def get_current_user_is_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """
    Dependency to check if current user is admin from JWT token.
    
    Args:
        credentials: HTTP bearer token credentials
        
    Returns:
        Boolean indicating if user is admin
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    is_admin: bool = payload.get("is_admin", False)
    return is_admin


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """
    Dependency that requires the user to be an admin.
    
    Args:
        credentials: HTTP bearer token credentials
        
    Returns:
        True if user is admin
        
    Raises:
        HTTPException: If user is not an admin
    """
    is_admin = get_current_user_is_admin(credentials)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return True