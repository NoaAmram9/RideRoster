"""
Reservation service.
Handles reservation creation, updates, and overlap detection.
"""

import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from datetime import datetime, timezone
from typing import List, Optional
from ..models.models import Reservation, ReservationStatus, Rule
from ..schemas.schemas import ReservationCreate, ReservationUpdate, ReservationResponse


class ReservationService:
    """Service for reservation operations."""
    
    @staticmethod
    def check_overlap(
        db: Session,
        group_id: int,
        start_time: datetime,
        end_time: datetime,
        exclude_reservation_id: Optional[int] = None
    ) -> bool:
        """
        Check if a reservation overlaps with existing reservations.
        
        Args:
            db: Database session
            group_id: Group ID to check within
            start_time: Start time of reservation
            end_time: End time of reservation
            exclude_reservation_id: Optional reservation ID to exclude from check (for updates)
            
        Returns:
            True if there's an overlap, False otherwise
        """
        query = db.query(Reservation).filter(
            and_(
                Reservation.group_id == group_id,
                Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.APPROVED]),
                or_(
                    # New reservation starts during existing reservation
                    and_(
                        Reservation.start_time <= start_time,
                        Reservation.end_time > start_time
                    ),
                    # New reservation ends during existing reservation
                    and_(
                        Reservation.start_time < end_time,
                        Reservation.end_time >= end_time
                    ),
                    # New reservation completely contains existing reservation
                    and_(
                        Reservation.start_time >= start_time,
                        Reservation.end_time <= end_time
                    )
                )
            )
        )
        
        # Exclude the current reservation if updating
        if exclude_reservation_id:
            query = query.filter(Reservation.id != exclude_reservation_id)
        
        overlapping = query.first()
        return overlapping is not None
    
    @staticmethod
    def validate_reservation_rules(
        db: Session,
        group_id: int,
        start_time: datetime,
        end_time: datetime
    ) -> None:
        """
        Validate reservation against group rules, using timezone-aware datetimes.
        """
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        if end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)

        now_utc = datetime.now(timezone.utc)

        rules = db.query(Rule).filter(
            Rule.group_id == group_id,
            Rule.is_active == True
        ).all()

        rule_dict = {rule.rule_type: rule.rule_value for rule in rules}

        # Check max_reservation_hours
        if 'max_reservation_hours' in rule_dict:
            max_hours = float(rule_dict['max_reservation_hours'])
            duration_hours = (end_time - start_time).total_seconds() / 3600
            logging.info(f"[Rule Check] max_reservation_hours={max_hours}, reservation_duration={duration_hours}")
            if duration_hours > max_hours:
                logging.warning(f"Reservation violates max_reservation_hours: {duration_hours} > {max_hours}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Reservation cannot exceed {max_hours} hours",
                )

        # Check advance_booking_days
        if 'advance_booking_days' in rule_dict:
            max_days = int(rule_dict['advance_booking_days'])
            days_in_advance = (start_time - now_utc).days
            logging.info(f"[Rule Check] advance_booking_days={max_days}, days_in_advance={days_in_advance}")
            if days_in_advance > max_days:
                logging.warning(f"Reservation violates advance_booking_days: {days_in_advance} > {max_days}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot book more than {max_days} days in advance",
                )
            if days_in_advance < 0:
                logging.warning(f"Reservation in the past: days_in_advance={days_in_advance}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reservation cannot be in the past",
                )
                
    @staticmethod
    def create_reservation(
        db: Session,
        user_id: int,
        group_id: int,
        reservation_data: ReservationCreate,
        is_admin: bool = False
    ) -> Reservation:
        """
        Create a new reservation.
        
        Args:
            db: Database session
            user_id: User ID creating the reservation
            group_id: Group ID
            reservation_data: Reservation data
            is_admin: Whether the user is an admin
            
        Returns:
            Created reservation
            
        Raises:
            HTTPException: If reservation is invalid or overlaps
        """
        # Validate against rules
        ReservationService.validate_reservation_rules(
            db, group_id, reservation_data.start_time, reservation_data.end_time
        )
        
        # Check for overlaps
        if ReservationService.check_overlap(
            db, group_id, reservation_data.start_time, reservation_data.end_time
        ):
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Reservation overlaps with an existing reservation",
                )
        
        # Determine initial status
        rules = db.query(Rule).filter(
            and_(
                Rule.group_id == group_id,
                Rule.rule_type == 'admin_approval_required',
                Rule.is_active == True
            )
        ).first()
        
        requires_approval = rules and rules.rule_value.lower() == 'true'
        initial_status = ReservationStatus.PENDING if (requires_approval and not is_admin) else ReservationStatus.APPROVED
        
        # Create reservation
        new_reservation = Reservation(
            user_id=user_id,
            group_id=group_id,
            start_time=reservation_data.start_time,
            end_time=reservation_data.end_time,
            status=initial_status,
            notes=reservation_data.notes
        )
        
        db.add(new_reservation)
        db.commit()
        db.refresh(new_reservation)
        
        return new_reservation
    
    @staticmethod
    def get_reservations(
        db: Session,
        group_id: int,
        status: Optional[ReservationStatus] = None,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Reservation]:
        """
        Get reservations with optional filters.
        
        Args:
            db: Database session
            group_id: Group ID
            status: Optional status filter
            user_id: Optional user ID filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            List of reservations
        """
        query = db.query(Reservation).filter(Reservation.group_id == group_id)
        
        if status:
            query = query.filter(Reservation.status == status)
        
        if user_id:
            query = query.filter(Reservation.user_id == user_id)
        
        if start_date:
            query = query.filter(Reservation.start_time >= start_date)
        
        if end_date:
            query = query.filter(Reservation.end_time <= end_date)
        
        return query.order_by(Reservation.start_time.desc()).all()
    
    @staticmethod
    def update_reservation(
        db: Session,
        reservation_id: int,
        user_id: int,
        group_id: int,
        update_data: ReservationUpdate,
        is_admin: bool = False
    ) -> Reservation:
        """
        Update a reservation.
        
        Args:
            db: Database session
            reservation_id: Reservation ID to update
            user_id: User ID making the update
            group_id: Group ID
            update_data: Update data
            is_admin: Whether the user is an admin
            
        Returns:
            Updated reservation
            
        Raises:
            HTTPException: If reservation not found or user not authorized
        """
        reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
        
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        
        # Check authorization
        if reservation.user_id != user_id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this reservation",
            )
        
        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # If times are being updated, check for overlaps
        new_start = update_dict.get('start_time', reservation.start_time)
        new_end = update_dict.get('end_time', reservation.end_time)
        
        if 'start_time' in update_dict or 'end_time' in update_dict:
            if ReservationService.check_overlap(
                db, group_id, new_start, new_end, exclude_reservation_id=reservation_id
            ):
                if not is_admin:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Updated reservation overlaps with an existing reservation",
                    )
        
        # Apply updates
        for key, value in update_dict.items():
            setattr(reservation, key, value)
        
        db.commit()
        db.refresh(reservation)
        
        return reservation
    
    @staticmethod
    def delete_reservation(
        db: Session,
        reservation_id: int,
        user_id: int,
        is_admin: bool = False
    ) -> None:
        """
        Delete/cancel a reservation.
        
        Args:
            db: Database session
            reservation_id: Reservation ID to delete
            user_id: User ID making the request
            is_admin: Whether the user is an admin
            
        Raises:
            HTTPException: If reservation not found or user not authorized
        """
        reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
        
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        
        # Check authorization
        if reservation.user_id != user_id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this reservation",
            )
        
        # Mark as cancelled instead of deleting
        reservation.status = ReservationStatus.CANCELLED
        db.commit()
