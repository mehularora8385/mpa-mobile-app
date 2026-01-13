/**
 * WebSocket Service for Real-Time Admin-Mobile App Integration
 * Handles: Data sync, auto logout, real-time commands, attendance sync
 */

import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WebSocketMessage {
  type: 'SYNC_DATA' | 'LOGOUT' | 'DOWNLOAD_DATA' | 'UPDATE_EXAM' | 'ATTENDANCE_UPDATE';
  payload: any;
  timestamp: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private apiUrl: string;
  private token: string | null = null;
  private operatorId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Initialize WebSocket connection
   */
  async connect(token: string, operatorId: string): Promise<void> {
    try {
      this.token = token;
      this.operatorId = operatorId;

      this.socket = io(this.apiUrl, {
        auth: {
          token,
          operatorId,
          type: 'mobile',
        },
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        this.socket?.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket?.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for real-time messages
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Listen for sync commands from admin
    this.socket.on('SYNC_DATA', async (data) => {
      console.log('📥 Sync command received from admin:', data);
      await this.handleSyncCommand(data);
    });

    // Listen for logout commands from admin
    this.socket.on('LOGOUT', async (data) => {
      console.log('🚪 Logout command received from admin:', data);
      await this.handleLogoutCommand(data);
    });

    // Listen for data download commands
    this.socket.on('DOWNLOAD_DATA', async (data) => {
      console.log('📥 Download data command:', data);
      await this.handleDownloadCommand(data);
    });

    // Listen for exam updates
    this.socket.on('UPDATE_EXAM', async (data) => {
      console.log('📝 Exam update received:', data);
      await this.handleExamUpdate(data);
    });

    // Listen for attendance sync requests
    this.socket.on('SYNC_ATTENDANCE', async (data) => {
      console.log('📊 Attendance sync request:', data);
      await this.handleAttendanceSync(data);
    });

    // Handle disconnection
    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.handleDisconnection();
    });

    // Handle errors
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  /**
   * Handle sync command from admin
   */
  private async handleSyncCommand(data: any): Promise<void> {
    try {
      console.log('🔄 Syncing data with admin...');

      // Get local data
      const localData = await this.getLocalData();

      // Send to admin
      this.socket?.emit('SYNC_RESPONSE', {
        operatorId: this.operatorId,
        data: localData,
        timestamp: Date.now(),
      });

      console.log('✅ Sync completed');
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.socket?.emit('SYNC_ERROR', {
        operatorId: this.operatorId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle logout command from admin
   */
  private async handleLogoutCommand(data: any): Promise<void> {
    try {
      console.log('🚪 Logging out operator...');

      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('operatorId');
      await AsyncStorage.removeItem('operatorData');

      // Emit logout confirmation
      this.socket?.emit('LOGOUT_CONFIRMED', {
        operatorId: this.operatorId,
        timestamp: Date.now(),
      });

      // Disconnect WebSocket
      this.disconnect();

      // Trigger app logout (emit event to app)
      this.socket?.emit('APP_LOGOUT_REQUIRED', {
        reason: 'Admin triggered logout',
      });

      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  }

  /**
   * Handle data download command
   */
  private async handleDownloadCommand(data: any): Promise<void> {
    try {
      const { examId, centreCode, dataType } = data;

      console.log(`📥 Downloading ${dataType} for exam ${examId}...`);

      // Fetch data from backend
      const downloadedData = await this.fetchDownloadData(examId, centreCode, dataType);

      // Store locally
      await AsyncStorage.setItem(
        `downloaded_${dataType}_${examId}`,
        JSON.stringify(downloadedData)
      );

      // Emit download completion
      this.socket?.emit('DOWNLOAD_COMPLETED', {
        operatorId: this.operatorId,
        examId,
        dataType,
        recordCount: downloadedData.length,
        timestamp: Date.now(),
      });

      console.log(`✅ Downloaded ${downloadedData.length} ${dataType} records`);
    } catch (error) {
      console.error('❌ Download failed:', error);
      this.socket?.emit('DOWNLOAD_ERROR', {
        operatorId: this.operatorId,
        error: error instanceof Error ? error.message : 'Download failed',
      });
    }
  }

  /**
   * Handle exam updates from admin
   */
  private async handleExamUpdate(data: any): Promise<void> {
    try {
      const { examId, examData } = data;

      console.log(`📝 Updating exam ${examId}...`);

      // Store updated exam data
      await AsyncStorage.setItem(
        `exam_${examId}`,
        JSON.stringify(examData)
      );

      // Emit update confirmation
      this.socket?.emit('EXAM_UPDATE_CONFIRMED', {
        operatorId: this.operatorId,
        examId,
        timestamp: Date.now(),
      });

      console.log(`✅ Exam ${examId} updated`);
    } catch (error) {
      console.error('❌ Exam update failed:', error);
    }
  }

  /**
   * Handle attendance sync
   */
  private async handleAttendanceSync(data: any): Promise<void> {
    try {
      console.log('📊 Syncing attendance...');

      // Get local attendance data
      const attendanceData = await AsyncStorage.getItem('attendance_data');
      const parsedData = attendanceData ? JSON.parse(attendanceData) : [];

      // Send to admin
      this.socket?.emit('ATTENDANCE_SYNC_RESPONSE', {
        operatorId: this.operatorId,
        attendance: parsedData,
        timestamp: Date.now(),
      });

      console.log(`✅ Synced ${parsedData.length} attendance records`);
    } catch (error) {
      console.error('❌ Attendance sync failed:', error);
    }
  }

  /**
   * Send real-time data to admin
   */
  async sendDataToAdmin(dataType: string, data: any): Promise<void> {
    try {
      if (!this.socket?.connected) {
        throw new Error('WebSocket not connected');
      }

      this.socket.emit('DATA_UPDATE', {
        operatorId: this.operatorId,
        dataType,
        data,
        timestamp: Date.now(),
      });

      console.log(`✅ Sent ${dataType} to admin`);
    } catch (error) {
      console.error('❌ Failed to send data:', error);
      throw error;
    }
  }

  /**
   * Fetch download data from backend
   */
  private async fetchDownloadData(
    examId: string,
    centreCode: string,
    dataType: string
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/mobile/download/${dataType}?examId=${examId}&centreCode=${centreCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${dataType}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch download data:', error);
      throw error;
    }
  }

  /**
   * Get local data for sync
   */
  private async getLocalData(): Promise<any> {
    try {
      const attendance = await AsyncStorage.getItem('attendance_data');
      const biometric = await AsyncStorage.getItem('biometric_data');
      const registrations = await AsyncStorage.getItem('registrations_data');

      return {
        attendance: attendance ? JSON.parse(attendance) : [],
        biometric: biometric ? JSON.parse(biometric) : [],
        registrations: registrations ? JSON.parse(registrations) : [],
      };
    } catch (error) {
      console.error('❌ Failed to get local data:', error);
      return {};
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(): void {
    console.log('🔄 Attempting to reconnect...');
    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      // Trigger offline mode
      this.socket?.emit('OFFLINE_MODE_ACTIVATED', {
        operatorId: this.operatorId,
      });
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('✅ WebSocket disconnected');
    }
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status
   */
  getStatus(): string {
    if (!this.socket) return 'DISCONNECTED';
    if (this.socket.connected) return 'CONNECTED';
    return 'CONNECTING';
  }
}

export default WebSocketService;
