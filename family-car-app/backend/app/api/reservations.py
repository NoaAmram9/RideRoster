"""
Reservations API endpoints.
Handles CRUD operations for car reservations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database.connection import get_db
from ..schemas.schemas import (
    ReservationCreate, ReservationUpdate, ReservationResponse, ReservationStatus
)
from ..services.reservation_service import ReservationService
from ..services.websocket_manager import manager
from ..core.security import get_current_user_id, get_current_user_group_id, get_current_user_is_admin


router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation_data: ReservationCreate,
    user_id: int = Depends(get_current_user_id),
    group_id: int = Depends(get_current_user_group_id),
    is_admin: bool = Depends(get_current_user_is_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new reservation.
    
    Validates against rules and checks for overlaps.
    Broadcasts to WebSocket clients on success.
    """
    reservation = ReservationService.create_reservation(
        db, user_id, group_id, reservation_data, is_admin
    )
    
    # Broadcast to WebSocket clients
    reservation_dict = ReservationResponse.model_validate(reservation).model_dump(mode='json')
    await manager.broadcast_reservation_created(reservation_dict, group_id)
    
    return reservation


@router.get("", response_model=List[ReservationResponse])
def get_reservations(
    status: Optional[ReservationStatus] = Query(None),
    user_id_filter: Optional[int] = Query(None, alias="user_id"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_id: int = Depends(get_current_user_group_id),
    db: Session = Depends(get_db)
):
    """
    Get reservations with optional filters.
    
    Query parameters:
    - status: Filter by reservation status
    - user_id: Filter by user ID
    - start_date: Filter by start date (reservations starting after this date)
    - end_date: Filter by end date (reservations ending before this date)
    """
    reservations = ReservationService.get_reservations(
        db, group_id, status, user_id_filter, start_date, end_date
    )
    return reservations


@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: int,
    group_id: int = Depends(get_current_user_group_id),
    db: Session = Depends(get_db)
):
    """
    Get a specific reservation by ID.
    """
    from ..models.models import Reservation
    
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.group_id == group_id
    ).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    return reservation


@router.put("/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(
    reservation_id: int,
    update_data: ReservationUpdate,
    user_id: int = Depends(get_current_user_id),
    group_id: int = Depends(get_current_user_group_id),
    is_admin: bool = Depends(get_current_user_is_admin),
    db: Session = Depends(get_db)
):
    """
    Update a reservation.
    
    Users can update their own reservations.
    Admins can update any reservation.
    """
    reservation = ReservationService.update_reservation(
        db, reservation_id, user_id, group_id, update_data, is_admin
    )
    
    # Broadcast to WebSocket clients
    reservation_dict = ReservationResponse.model_validate(reservation).model_dump(mode='json')
    await manager.broadcast_reservation_updated(reservation_dict, group_id)
    
    return reservation


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation(
    reservation_id: int,
    user_id: int = Depends(get_current_user_id),
    group_id: int = Depends(get_current_user_group_id),
    is_admin: bool = Depends(get_current_user_is_admin),
    db: Session = Depends(get_db)
):
    """
    Delete/cancel a reservation.
    
    Users can delete their own reservations.
    Admins can delete any reservation.
    """
    ReservationService.delete_reservation(db, reservation_id, user_id, is_admin)
    
    # Broadcast to WebSocket clients
    await manager.broadcast_reservation_deleted(reservation_id, group_id)
    
    return None
