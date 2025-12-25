"""
Rules API endpoints.
Handles CRUD operations for group rules (admin only).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..schemas.schemas import RuleCreate, RuleUpdate, RuleResponse
from ..models.models import Rule
from ..core.security import get_current_user_group_id, require_admin


router = APIRouter(prefix="/rules", tags=["Rules"])


@router.post("", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    rule_data: RuleCreate,
    group_id: int = Depends(get_current_user_group_id),
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new rule (admin only).
    """
    new_rule = Rule(
        group_id=group_id,
        rule_type=rule_data.rule_type,
        rule_value=rule_data.rule_value,
        description=rule_data.description,
        is_active=rule_data.is_active
    )
    
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    
    return new_rule


@router.get("", response_model=List[RuleResponse])
def get_rules(
    group_id: int = Depends(get_current_user_group_id),
    db: Session = Depends(get_db)
):
    """
    Get all rules for the group.
    """
    rules = db.query(Rule).filter(Rule.group_id == group_id).all()
    return rules


@router.get("/active", response_model=List[RuleResponse])
def get_active_rules(
    group_id: int = Depends(get_current_user_group_id),
    db: Session = Depends(get_db)
):
    """
    Get active rules for the group.
    """
    rules = db.query(Rule).filter(
        Rule.group_id == group_id,
        Rule.is_active == True
    ).all()
    return rules


@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(
    rule_id: int,
    update_data: RuleUpdate,
    group_id: int = Depends(get_current_user_group_id),
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update a rule (admin only).
    """
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.group_id == group_id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(rule, key, value)
    
    db.commit()
    db.refresh(rule)
    
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: int,
    group_id: int = Depends(get_current_user_group_id),
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a rule (admin only).
    """
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.group_id == group_id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    db.delete(rule)
    db.commit()
    
    return None
