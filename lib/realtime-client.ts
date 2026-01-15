// Realtime Client for Mobile App - Receives commands from Admin Panel
// Enables live exam data sync, password sharing, and device control

import AsyncStorage from '@react-native-async-storage/async-storage';

interface DeviceInfo {
  deviceId: string;
  operatorId: string;
  centreCode: string;
  examId: string;
  appVersion: string;
  osVersion: string;
}

class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private listeners: Map<string, Function[]> = new Map();
  private deviceInfo: DeviceInfo | null = null;
  private adminPanelUrl: string = 'http://13.204.65.158/api/v1';

  constructor() {}

  /**
   * Connect to Admin Panel WebSocket
   */
  async connect(operatorId: string, examId: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get device info
        this.deviceInfo = await this.getDeviceInfo(operatorId, examId);

        // Use WebSocket for real-time communication with Admin Panel
        const wsUrl = this.adminPanelUrl.replace('http', 'ws') + 
                      `/ws/device/${operatorId}/${examId}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to Admin Panel');
          this.reconnectAttempts = 0;
          
          // Send device info to admin panel
          this.sendDeviceInfo();
          
          this.emit('connected', { operatorId, examId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleAdminCommand(data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from Admin Panel');
          this.attemptReconnect(operatorId, examId);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(operatorId: string, examId: string): Promise<DeviceInfo> {
    const deviceId = await AsyncStorage.getItem('deviceId') || 'unknown';
    const centreCode = await AsyncStorage.getItem('centreCode') || 'unknown';

    return {
      deviceId,
      operatorId,
      centreCode,
      examId,
      appVersion: '1.0.0',
      osVersion: '14.0'
    };
  }

  /**
   * Send device info to admin panel
   */
  private sendDeviceInfo(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'DEVICE_INFO',
      payload: this.deviceInfo,
      timestamp: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle commands from Admin Panel
   */
  private handleAdminCommand(data: any): void {
    const { type, command, payload } = data;

    if (type === 'COMMAND') {
      switch (command) {
        case 'SYNC_TRIGGER':
          this.emit('syncTrigger', payload);
          break;
        case 'LOGOUT_ALL':
          this.emit('logoutCommand', payload);
          break;
        case 'SHARE_PASSWORD':
          this.emit('passwordReceived', payload);
          break;
        case 'SHARE_EXAM_DATA':
          this.emit('examDataReceived', payload);
          break;
        case 'GET_STATUS':
          this.sendStatusUpdate();
          break;
        default:
          console.log('Unknown command:', command);
      }
    }
  }

  /**
   * Send status update to Admin Panel
   */
  async sendStatusUpdate(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const status = {
      type: 'STATUS_UPDATE',
      payload: {
        deviceId: this.deviceInfo?.deviceId,
        operatorId: this.deviceInfo?.operatorId,
        isOnline: true,
        lastUpdate: new Date().toISOString(),
        batteryLevel: 85, // Should get from device
        networkType: 'wifi' // Should get from device
      }
    };

    this.ws.send(JSON.stringify(status));
  }

  /**
   * Send verification data to Admin Panel
   */
  sendVerificationData(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      type: 'VERIFICATION_DATA',
      payload: {
        ...data,
        deviceId: this.deviceInfo?.deviceId,
        operatorId: this.deviceInfo?.operatorId,
        timestamp: new Date().toISOString()
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send sync status to Admin Panel
   */
  sendSyncStatus(status: 'syncing' | 'synced' | 'failed', details?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'SYNC_STATUS',
      payload: {
        status,
        deviceId: this.deviceInfo?.deviceId,
        operatorId: this.deviceInfo?.operatorId,
        details,
        timestamp: new Date().toISOString()
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(operatorId: string, examId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(operatorId, examId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export default RealtimeClient;
