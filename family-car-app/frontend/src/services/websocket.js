/**
 * WebSocket service for real-time updates.
 * Manages WebSocket connection and event handling.
 */

const WS_BASE_URL = 'ws://localhost:8000';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  /**
   * Connect to WebSocket server.
   */
  connect(token) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = `${WS_BASE_URL}/ws?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected', {});
        this.attemptReconnect(token);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  /**
   * Attempt to reconnect to WebSocket.
   */
  attemptReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect(token);
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from WebSocket server.
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Handle incoming WebSocket message.
   */
  handleMessage(message) {
    const { type, data } = message;
    this.emit(type, data);
  }

  /**
   * Register an event listener.
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove an event listener.
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Emit an event to all registered listeners.
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Send a message through WebSocket.
   */
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;
