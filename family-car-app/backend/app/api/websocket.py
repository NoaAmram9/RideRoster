"""
WebSocket endpoint for real-time updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..services.websocket_manager import manager
from ..core.security import decode_access_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint for real-time updates.
    
    Clients must provide a valid JWT token as a query parameter.
    Messages are broadcasted to all clients in the same group.
    
    Query parameters:
    - token: JWT authentication token
    """
    try:
        # Verify token and extract group_id
        payload = decode_access_token(token)
        group_id = payload.get("group_id")
        user_id = payload.get("sub")
        
        if not group_id or not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Connect to WebSocket
        await manager.connect(websocket, group_id)
        
        # Send connection confirmation
        await manager.send_personal_message({
            "type": "connected",
            "data": {"user_id": user_id, "group_id": group_id}
        }, websocket)
        
        # Keep connection alive and listen for messages
        try:
            while True:
                # Receive messages (for ping/pong or client-initiated events)
                data = await websocket.receive_text()
                
                # Echo back for now (can be extended for client-initiated events)
                await manager.send_personal_message({
                    "type": "echo",
                    "data": data
                }, websocket)
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, group_id)
            logger.info(f"Client disconnected from group {group_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass
