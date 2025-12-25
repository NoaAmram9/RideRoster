"""
Fuel logs API endpoints.
Handles fuel log creation and retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.connection import get_db
from ..schemas.schemas import FuelLogCreate, FuelLogResponse
from ..services.fuel_service import FuelLogService
from ..services.websocket_manager import manager
from ..core.security import get_current_user_id, get_current_user_group_id


router = APIRouter(prefix="/fuel-logs", tags=["Fuel Logs"])


@router.post("", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
async def create_fuel_log(
    fuel_log_data: FuelLogCreate,
    user_id: int = Depends(get_current_user_id),
    group_id: int = Depends(get_current_user_group_id),
    db: Session = Depends(get_db)
):
    """
    Create a new fuel log.
    
    Records fuel usage for a reservation and updates user's fuel balance.
    """
    fuel_log = FuelLogService.create_fuel_log(db, user_id, fuel_log_data)
    
    # Broadcast to WebSocket clients
    fuel_log_dict = FuelLogResponse.model_validate(fuel_log).model_dump(mode='json')
    await manager.broadcast_fuel_log_created(fuel_log_dict, group_id)
    
    return fuel_log


@router.get("", response_model=List[FuelLogResponse])
def get_fuel_logs(
    user_id_filter: Optional[int] = Query(None, alias="user_id"),
    reservation_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get fuel logs with optional filters.
    
    Query parameters:
    - user_id: Filter by user ID
    - reservation_id: Filter by reservation ID
    """
    fuel_logs = FuelLogService.get_fuel_logs(db, user_id_filter, reservation_id)
    return fuel_logs


@router.get("/summary/{user_id}")
def get_user_fuel_summary(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get fuel usage summary for a user.
    
    Returns total trips, fuel added, and costs paid.
    """
    return FuelLogService.get_user_fuel_summary(db, user_id)


@router.get("/my-summary")
def get_my_fuel_summary(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get fuel usage summary for the current user.
    """
    return FuelLogService.get_user_fuel_summary(db, user_id)
