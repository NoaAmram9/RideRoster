"""
WebSocket connection manager for real-time updates.
Manages WebSocket connections and broadcasts messages to connected clients.
"""

from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by group_id."""
    
    def __init__(self):
        # Dictionary mapping group_id to set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, group_id: int):
        """
        Accept and register a new WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            group_id: Group ID the connection belongs to
        """
        await websocket.accept()
        
        if group_id not in self.active_connections:
            self.active_connections[group_id] = set()
        
        self.active_connections[group_id].add(websocket)
        logger.info(f"WebSocket connected for group {group_id}. Total connections: {len(self.active_connections[group_id])}")
    
    def disconnect(self, websocket: WebSocket, group_id: int):
        """
        Remove a WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            group_id: Group ID the connection belongs to
        """
        if group_id in self.active_connections:
            self.active_connections[group_id].discard(websocket)
            
            # Clean up empty group
            if len(self.active_connections[group_id]) == 0:
                del self.active_connections[group_id]
            
            logger.info(f"WebSocket disconnected for group {group_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection.
        
        Args:
            message: Message dictionary to send
            websocket: WebSocket connection
        """
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast_to_group(self, message: dict, group_id: int):
        """
        Broadcast a message to all connections in a group.
        
        Args:
            message: Message dictionary to broadcast
            group_id: Group ID to broadcast to
        """
        if group_id not in self.active_connections:
            logger.debug(f"No active connections for group {group_id}")
            return
        
        # Create a copy to avoid modification during iteration
        connections = self.active_connections[group_id].copy()
        
        disconnected = []
        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except WebSocketDisconnect:
                disconnected.append(connection)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, group_id)
    
    async def broadcast_reservation_created(self, reservation_data: dict, group_id: int):
        """
        Broadcast a reservation_created event.
        
        Args:
            reservation_data: Reservation data dictionary
            group_id: Group ID
        """
        message = {
            "type": "reservation_created",
            "data": reservation_data
        }
        await self.broadcast_to_group(message, group_id)
    
    async def broadcast_reservation_updated(self, reservation_data: dict, group_id: int):
        """
        Broadcast a reservation_updated event.
        
        Args:
            reservation_data: Reservation data dictionary
            group_id: Group ID
        """
        message = {
            "type": "reservation_updated",
            "data": reservation_data
        }
        await self.broadcast_to_group(message, group_id)
    
    async def broadcast_reservation_deleted(self, reservation_id: int, group_id: int):
        """
        Broadcast a reservation_deleted event.
        
        Args:
            reservation_id: Reservation ID
            group_id: Group ID
        """
        message = {
            "type": "reservation_deleted",
            "data": {"id": reservation_id}
        }
        await self.broadcast_to_group(message, group_id)
    
    async def broadcast_fuel_log_created(self, fuel_log_data: dict, group_id: int):
        """
        Broadcast a fuel_log_created event.
        
        Args:
            fuel_log_data: Fuel log data dictionary
            group_id: Group ID
        """
        message = {
            "type": "fuel_log_created",
            "data": fuel_log_data
        }
        await self.broadcast_to_group(message, group_id)
    
    def get_connection_count(self, group_id: int) -> int:
        """
        Get the number of active connections for a group.
        
        Args:
            group_id: Group ID
            
        Returns:
            Number of active connections
        """
        if group_id not in self.active_connections:
            return 0
        return len(self.active_connections[group_id])


# Global connection manager instance
manager = ConnectionManager()
