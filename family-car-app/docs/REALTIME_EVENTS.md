# Real-Time Event Flow Documentation

This document explains how real-time updates work in the Family Car Manager application using WebSockets.

## Overview

The application uses WebSockets to provide instant updates to all connected users in the same group when data changes. This ensures everyone sees the latest information without needing to refresh.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   User A    │         │   Backend   │         │   User B    │
│  (Browser)  │         │  (FastAPI)  │         │  (Browser)  │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. HTTP: Create       │                       │
       │    Reservation        │                       │
       ├──────────────────────→│                       │
       │                       │                       │
       │ 2. Save to Database   │                       │
       │                       │ (MySQL)               │
       │                       │                       │
       │ 3. HTTP Response      │                       │
       │←──────────────────────┤                       │
       │                       │                       │
       │                       │ 4. WS: Broadcast      │
       │                       │    reservation_created│
       │←──────────────────────┤──────────────────────→│
       │                       │                       │
       │ 5. UI Updates         │                       │ 5. UI Updates
       │    Automatically      │                       │    Automatically
       │                       │                       │
```

## WebSocket Connection Flow

### 1. Connection Establishment

When a user logs in:

```javascript
// Frontend: src/context/AuthContext.jsx
const login = async (credentials) => {
  const response = await authAPI.login(credentials);
  const { access_token } = response.data;
  
  // Connect to WebSocket with JWT token
  wsService.connect(access_token);
};
```

The WebSocket connection is established with the JWT token for authentication:

```javascript
// Frontend: src/services/websocket.js
connect(token) {
  const wsUrl = `ws://localhost:8000/ws?token=${token}`;
  this.ws = new WebSocket(wsUrl);
}
```

Backend validates the token and groups connections by `group_id`:

```python
# Backend: app/api/websocket.py
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    payload = decode_access_token(token)
    group_id = payload.get("group_id")
    
    await manager.connect(websocket, group_id)
```

### 2. Connection Management

The `ConnectionManager` maintains active connections grouped by `group_id`:

```python
# Backend: app/services/websocket_manager.py
class ConnectionManager:
    def __init__(self):
        # Dict[group_id, Set[WebSocket]]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
```

This ensures broadcasts only reach users in the same group.

## Event Types

### 1. Reservation Events

#### reservation_created

**Triggered when**: A user creates a new reservation

**Backend Flow**:
```python
# Backend: app/api/reservations.py
@router.post("")
async def create_reservation(...):
    reservation = ReservationService.create_reservation(...)
    
    # Broadcast to all group members
    await manager.broadcast_reservation_created(
        reservation_dict, 
        group_id
    )
```

**Frontend Handling**:
```javascript
// Frontend: src/pages/Dashboard.jsx
useEffect(() => {
  const handleReservationCreated = (data) => {
    setReservations((prev) => [data, ...prev]);
    toast.success('New reservation created!');
  };
  
  wsService.on('reservation_created', handleReservationCreated);
}, []);
```

**Message Format**:
```json
{
  "type": "reservation_created",
  "data": {
    "id": 123,
    "user_id": 1,
    "group_id": 1,
    "start_time": "2024-01-15T10:00:00",
    "end_time": "2024-01-15T12:00:00",
    "status": "approved",
    "notes": "Going to the store"
  }
}
```

#### reservation_updated

**Triggered when**: A reservation is modified (time change, status change, etc.)

**Backend Flow**:
```python
@router.put("/{reservation_id}")
async def update_reservation(...):
    reservation = ReservationService.update_reservation(...)
    
    await manager.broadcast_reservation_updated(
        reservation_dict,
        group_id
    )
```

**Frontend Handling**:
```javascript
const handleReservationUpdated = (data) => {
  setReservations((prev) =>
    prev.map((res) => (res.id === data.id ? data : res))
  );
  toast.success('Reservation updated!');
};
```

#### reservation_deleted

**Triggered when**: A reservation is cancelled

**Backend Flow**:
```python
@router.delete("/{reservation_id}")
async def delete_reservation(...):
    ReservationService.delete_reservation(...)
    
    await manager.broadcast_reservation_deleted(
        reservation_id,
        group_id
    )
```

**Frontend Handling**:
```javascript
const handleReservationDeleted = (data) => {
  setReservations((prev) => 
    prev.filter((res) => res.id !== data.id)
  );
  toast.success('Reservation cancelled!');
};
```

### 2. Fuel Log Events

#### fuel_log_created

**Triggered when**: A user logs fuel usage

**Backend Flow**:
```python
# Backend: app/api/fuel_logs.py
@router.post("")
async def create_fuel_log(...):
    fuel_log = FuelLogService.create_fuel_log(...)
    
    await manager.broadcast_fuel_log_created(
        fuel_log_dict,
        group_id
    )
```

**Frontend Handling**:
```javascript
wsService.on('fuel_log_created', (data) => {
  // Refresh fuel logs and summary
  loadData();
  toast.success('Fuel log added!');
});
```

## Broadcast Implementation

### Backend Broadcast Function

```python
# Backend: app/services/websocket_manager.py
async def broadcast_to_group(self, message: dict, group_id: int):
    """Send message to all connections in a group."""
    if group_id not in self.active_connections:
        return
    
    connections = self.active_connections[group_id].copy()
    disconnected = []
    
    for connection in connections:
        try:
            await connection.send_text(json.dumps(message))
        except Exception as e:
            disconnected.append(connection)
    
    # Clean up failed connections
    for connection in disconnected:
        self.disconnect(connection, group_id)
```

### Frontend Event Listener

```javascript
// Frontend: src/services/websocket.js
handleMessage(message) {
  const { type, data } = message;
  this.emit(type, data);  // Trigger registered callbacks
}

on(event, callback) {
  if (!this.listeners[event]) {
    this.listeners[event] = [];
  }
  this.listeners[event].push(callback);
}
```

## Error Handling

### Connection Failures

**Backend**: Automatically removes failed connections from the pool

```python
try:
    await connection.send_text(json.dumps(message))
except Exception as e:
    disconnected.append(connection)
```

**Frontend**: Automatic reconnection with exponential backoff

```javascript
attemptReconnect(token) {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
    return;
  }
  
  this.reconnectAttempts++;
  setTimeout(() => {
    this.connect(token);
  }, this.reconnectDelay);
}
```

### Message Parse Errors

```javascript
this.ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    this.handleMessage(message);
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
};
```

## Performance Considerations

### 1. Connection Pooling
- Connections are grouped by `group_id`
- Only users in the same group receive updates
- Reduces unnecessary message processing

### 2. Message Batching
- Currently sends individual messages
- Can be extended to batch multiple updates

### 3. Heartbeat/Ping-Pong
- Can implement periodic ping to keep connection alive
- Detect stale connections early

```javascript
// Example heartbeat implementation
setInterval(() => {
  if (this.ws?.readyState === WebSocket.OPEN) {
    this.send({ type: 'ping' });
  }
}, 30000);  // Every 30 seconds
```

## Security

### Authentication
- JWT token required for WebSocket connection
- Token validated on connection
- Connection rejected if invalid

### Authorization
- Messages only broadcast to same group
- Group ID extracted from JWT token
- No cross-group message leakage

## Testing WebSocket Events

### Using Browser Console

```javascript
// Connect
const ws = new WebSocket('ws://localhost:8000/ws?token=YOUR_TOKEN');

// Listen for messages
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};

// Send test message
ws.send(JSON.stringify({ type: 'test', data: {} }));
```

### Using wscat (Command Line)

```bash
npm install -g wscat
wscat -c 'ws://localhost:8000/ws?token=YOUR_TOKEN'
```

## Debugging

### Backend Logging

```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"WebSocket connected for group {group_id}")
logger.info(f"Broadcasting message: {message}")
```

### Frontend Logging

```javascript
// Enable detailed WebSocket logging
wsService.on('*', (event, data) => {
  console.log(`WS Event: ${event}`, data);
});
```

## Future Enhancements

1. **Presence Detection**: Show who's online
2. **Typing Indicators**: Show when someone is creating a reservation
3. **Message Queue**: Handle offline message delivery
4. **Compression**: Compress large payloads
5. **Binary Messages**: For better performance
6. **Room-based Broadcasting**: More granular control

## Summary

The real-time system provides instant synchronization across all users through:

1. **WebSocket Connections**: Persistent, bidirectional communication
2. **Group-based Broadcasting**: Messages only sent to relevant users
3. **Event-driven Updates**: Automatic UI updates on data changes
4. **Reliable Delivery**: Error handling and reconnection logic
5. **Secure Communication**: JWT authentication and authorization

This ensures all family members always see the latest car availability and reservations without manual refreshing.
