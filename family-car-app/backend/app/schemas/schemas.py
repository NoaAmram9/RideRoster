"""
Pydantic schemas for request/response validation.
Defines the structure of data sent to and from the API.
"""

from pydantic import BaseModel, Field, validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum


# ============================================
# Enums
# ============================================

class ReservationStatus(str, Enum):
    """Status of a reservation."""
    PENDING = "pending"
    APPROVED = "approved"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============================================
# Authentication Schemas
# ============================================

class LoginRequest(BaseModel):
    """Request schema for user login."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    """Response schema for successful login."""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)
    group_name: Optional[str] = Field(None, max_length=100)
    car_model: Optional[str] = Field(None, max_length=100)
    is_admin: bool = False


# ============================================
# User Schemas
# ============================================

class UserBase(BaseModel):
    """Base user schema."""
    username: str
    full_name: str
    is_admin: bool = False


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=6)
    group_id: int


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(UserBase):
    """Response schema for user data."""
    id: int
    group_id: int
    fuel_balance: Decimal
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# Group Schemas
# ============================================

class GroupBase(BaseModel):
    """Base group schema."""
    name: str = Field(..., min_length=2, max_length=100)
    car_model: Optional[str] = Field(None, max_length=100)


class GroupCreate(GroupBase):
    """Schema for creating a new group."""
    pass


class GroupUpdate(BaseModel):
    """Schema for updating a group."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    car_model: Optional[str] = Field(None, max_length=100)


class GroupResponse(GroupBase):
    """Response schema for group data."""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# Reservation Schemas
# ============================================

class ReservationBase(BaseModel):
    """Base reservation schema."""
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    
    @validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        """Validate that end_time is after start_time."""
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class ReservationCreate(ReservationBase):
    """Schema for creating a new reservation."""
    pass


class ReservationUpdate(BaseModel):
    """Schema for updating a reservation."""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[ReservationStatus] = None
    notes: Optional[str] = None
    
    @validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        """Validate that end_time is after start_time if both are provided."""
        if v and 'start_time' in values and values['start_time'] and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class ReservationResponse(ReservationBase):
    """Response schema for reservation data."""
    id: int
    user_id: int
    group_id: int
    status: ReservationStatus
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# Fuel Log Schemas
# ============================================

class FuelLogBase(BaseModel):
    """Base fuel log schema."""
    fuel_before: Decimal = Field(..., ge=0, le=100, description="Fuel level before (0-100%)")
    fuel_after: Decimal = Field(..., ge=0, le=100, description="Fuel level after (0-100%)")
    fuel_added_liters: Decimal = Field(default=0, ge=0)
    cost_paid: Decimal = Field(default=0, ge=0)


class FuelLogCreate(FuelLogBase):
    """Schema for creating a new fuel log."""
    reservation_id: int


class FuelLogUpdate(BaseModel):
    """Schema for updating a fuel log."""
    fuel_before: Optional[Decimal] = Field(None, ge=0, le=100)
    fuel_after: Optional[Decimal] = Field(None, ge=0, le=100)
    fuel_added_liters: Optional[Decimal] = Field(None, ge=0)
    cost_paid: Optional[Decimal] = Field(None, ge=0)


class FuelLogResponse(FuelLogBase):
    """Response schema for fuel log data."""
    id: int
    reservation_id: int
    user_id: int
    logged_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# Rule Schemas
# ============================================

class RuleBase(BaseModel):
    """Base rule schema."""
    rule_type: str = Field(..., min_length=1, max_length=50)
    rule_value: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: bool = True


class RuleCreate(RuleBase):
    """Schema for creating a new rule."""
    pass


class RuleUpdate(BaseModel):
    """Schema for updating a rule."""
    rule_value: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RuleResponse(RuleBase):
    """Response schema for rule data."""
    id: int
    group_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# WebSocket Message Schemas
# ============================================

class WSMessage(BaseModel):
    """WebSocket message schema."""
    type: str  # 'reservation_created', 'reservation_updated', 'fuel_log_created', etc.
    data: dict


# ============================================
# Statistics/Summary Schemas
# ============================================

class UserFuelSummary(BaseModel):
    """Summary of user's fuel usage."""
    user_id: int
    full_name: str
    fuel_balance: Decimal
    total_trips: int
    total_fuel_added: Decimal
    total_paid: Decimal


class GroupStats(BaseModel):
    """Group statistics."""
    total_users: int
    total_reservations: int
    active_reservations: int
    total_trips_completed: int


# Update forward references
LoginResponse.model_rebuild()
