"""
SQLAlchemy ORM models for database tables.
Defines the structure and relationships of all database entities.
"""

from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, TIMESTAMP, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from ..database.connection import Base


class ReservationStatus(str, enum.Enum):
    """Enum for reservation status."""
    PENDING = "pending"
    APPROVED = "approved"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Group(Base):
    """Group/Household that shares a car."""
    __tablename__ = "cgroups"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    car_model = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relationships
    users = relationship("User", back_populates="group", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="group", cascade="all, delete-orphan")
    rules = relationship("Rule", back_populates="group", cascade="all, delete-orphan")


class User(Base):
    """User in the system."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("cgroups.id", ondelete="RESTRICT"), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_admin = Column(Boolean, default=False, index=True)
    fuel_balance = Column(DECIMAL(10, 2), default=0.00)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relationships
    group = relationship("Group", back_populates="users")
    reservations = relationship("Reservation", back_populates="user", cascade="all, delete-orphan")
    fuel_logs = relationship("FuelLog", back_populates="user", cascade="all, delete-orphan")


class Reservation(Base):
    """Car reservation."""
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    group_id = Column(Integer, ForeignKey("cgroups.id", ondelete="RESTRICT"), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    status = Column(SQLEnum(ReservationStatus), default=ReservationStatus.PENDING, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="reservations")
    group = relationship("Group", back_populates="reservations")
    fuel_logs = relationship("FuelLog", back_populates="reservation", cascade="all, delete-orphan")


class FuelLog(Base):
    """Fuel usage log for a reservation."""
    __tablename__ = "fuel_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    fuel_before = Column(DECIMAL(5, 2), nullable=False, comment="Fuel level before (0-100%)")
    fuel_after = Column(DECIMAL(5, 2), nullable=False, comment="Fuel level after (0-100%)")
    fuel_added_liters = Column(DECIMAL(6, 2), default=0.00, comment="Fuel added during trip")
    cost_paid = Column(DECIMAL(8, 2), default=0.00, comment="Cost paid for fuel")
    logged_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relationships
    reservation = relationship("Reservation", back_populates="fuel_logs")
    user = relationship("User", back_populates="fuel_logs")


class Rule(Base):
    """Admin-defined rules for the group."""
    __tablename__ = "rules"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("cgroups.id", ondelete="CASCADE"), nullable=False)
    rule_type = Column(String(50), nullable=False, comment="Type: min_fuel_level, max_reservation_hours, etc.")
    rule_value = Column(String(255), nullable=False, comment="Value for the rule")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relationships
    group = relationship("Group", back_populates="rules")
