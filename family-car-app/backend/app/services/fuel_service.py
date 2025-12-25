"""
Fuel log service.
Handles fuel log creation and user fuel balance calculations.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from decimal import Decimal
from ..models.models import FuelLog, Reservation, User
from ..schemas.schemas import FuelLogCreate, FuelLogUpdate


class FuelLogService:
    """Service for fuel log operations."""
    
    @staticmethod
    def create_fuel_log(
        db: Session,
        user_id: int,
        fuel_log_data: FuelLogCreate
    ) -> FuelLog:
        """
        Create a new fuel log and update user's fuel balance.
        
        Args:
            db: Database session
            user_id: User ID creating the log
            fuel_log_data: Fuel log data
            
        Returns:
            Created fuel log
            
        Raises:
            HTTPException: If reservation not found or not authorized
        """
        # Verify reservation exists and belongs to user
        reservation = db.query(Reservation).filter(
            Reservation.id == fuel_log_data.reservation_id
        ).first()
        
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        
        if reservation.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to log fuel for this reservation",
            )
        
        # Create fuel log
        new_fuel_log = FuelLog(
            reservation_id=fuel_log_data.reservation_id,
            user_id=user_id,
            fuel_before=fuel_log_data.fuel_before,
            fuel_after=fuel_log_data.fuel_after,
            fuel_added_liters=fuel_log_data.fuel_added_liters,
            cost_paid=fuel_log_data.cost_paid
        )
        
        db.add(new_fuel_log)
        
        # Update user's fuel balance
        FuelLogService.update_fuel_balance(db, user_id, new_fuel_log)
        
        db.commit()
        db.refresh(new_fuel_log)
        
        return new_fuel_log
    
    @staticmethod
    def update_fuel_balance(db: Session, user_id: int, fuel_log: FuelLog) -> None:
        """
        Update user's fuel balance based on fuel log.
        
        Logic:
        - User pays for fuel added (positive to balance)
        - User is charged for fuel consumed (negative from balance)
        - Assumes 50L tank capacity, $1.50 per liter
        
        Args:
            db: Database session
            user_id: User ID
            fuel_log: Fuel log to process
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        
        # Calculate fuel consumed in percentage
        fuel_consumed_pct = float(fuel_log.fuel_before - fuel_log.fuel_after)
        
        # Convert to liters (assuming 50L tank)
        TANK_CAPACITY = 50.0
        fuel_consumed_liters = (fuel_consumed_pct / 100.0) * TANK_CAPACITY
        
        # Calculate cost
        COST_PER_LITER = 1.50
        fuel_consumed_cost = Decimal(str(fuel_consumed_liters * COST_PER_LITER))
        
        # Update balance: add what they paid, subtract what they consumed
        balance_change = fuel_log.cost_paid - fuel_consumed_cost
        user.fuel_balance = user.fuel_balance + balance_change
    
    @staticmethod
    def get_fuel_logs(
        db: Session,
        user_id: int = None,
        reservation_id: int = None
    ) -> List[FuelLog]:
        """
        Get fuel logs with optional filters.
        
        Args:
            db: Database session
            user_id: Optional user ID filter
            reservation_id: Optional reservation ID filter
            
        Returns:
            List of fuel logs
        """
        query = db.query(FuelLog)
        
        if user_id:
            query = query.filter(FuelLog.user_id == user_id)
        
        if reservation_id:
            query = query.filter(FuelLog.reservation_id == reservation_id)
        
        return query.order_by(FuelLog.logged_at.desc()).all()
    
    @staticmethod
    def get_user_fuel_summary(db: Session, user_id: int) -> dict:
        """
        Get summary of user's fuel usage.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with fuel usage summary
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        fuel_logs = db.query(FuelLog).filter(FuelLog.user_id == user_id).all()
        
        total_trips = len(fuel_logs)
        total_fuel_added = sum(log.fuel_added_liters for log in fuel_logs)
        total_paid = sum(log.cost_paid for log in fuel_logs)
        
        return {
            "user_id": user.id,
            "full_name": user.full_name,
            "fuel_balance": float(user.fuel_balance),
            "total_trips": total_trips,
            "total_fuel_added": float(total_fuel_added),
            "total_paid": float(total_paid)
        }
