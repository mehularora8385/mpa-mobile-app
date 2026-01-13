/**
 * Enhanced API Service with Real-Time Admin Integration
 * Includes: Data downloading, sync, auto logout, real-time connection
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from './websocket-service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface DownloadedData {
  exams: any[];
  candidates: any[];
  slots: any[];
  centres: any[];
}

class EnhancedApiService {
  private api: AxiosInstance;
  private wsService: WebSocketService | null = null;
  private apiUrl: string;
  private token: string | null = null;
  private operatorId: string | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncIntervalMs = 30000; // 30 seconds

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;

    this.api = axios.create({
      baseURL: apiUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.handleTokenExpired();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize real-time connection with admin
   */
  async initializeRealTimeConnection(token: string, operatorId: string): Promise<void> {
    try {
      this.token = token;
      this.operatorId = operatorId;

      // Initialize WebSocket
      this.wsService = new WebSocketService(this.apiUrl);
      await this.wsService.connect(token, operatorId);

      // Start auto-sync
      this.startAutoSync();

      console.log('✅ Real-time connection established');
    } catch (error) {
      console.error('❌ Failed to initialize real-time connection:', error);
      throw error;
    }
  }

  /**
   * Download exam data from admin panel
   */
  async downloadExamData(examId: string, password: string): Promise<any[]> {
    try {
      console.log(`📥 Downloading exam data for exam ${examId}...`);

      const response = await this.api.post<ApiResponse<any[]>>(
        '/api/mobile/download/exams',
        {
          examId,
          password,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to download exam data');
      }

      // Store locally
      await AsyncStorage.setItem(
        `exam_data_${examId}`,
        JSON.stringify(response.data.data)
      );

      // Notify admin
      await this.notifyDataDownload('exams', examId, response.data.data?.length || 0);

      console.log(`✅ Downloaded ${response.data.data?.length || 0} exam records`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Failed to download exam data:', error);
      throw error;
    }
  }

  /**
   * Download candidate data from admin panel
   */
  async downloadCandidateData(examId: string, centreCode: string, password: string): Promise<any[]> {
    try {
      console.log(`📥 Downloading candidate data for exam ${examId}...`);

      const response = await this.api.post<ApiResponse<any[]>>(
        '/api/mobile/download/candidates',
        {
          examId,
          centreCode,
          password,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to download candidate data');
      }

      // Store locally
      await AsyncStorage.setItem(
        `candidates_${examId}_${centreCode}`,
        JSON.stringify(response.data.data)
      );

      // Notify admin
      await this.notifyDataDownload('candidates', examId, response.data.data?.length || 0);

      console.log(`✅ Downloaded ${response.data.data?.length || 0} candidate records`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Failed to download candidate data:', error);
      throw error;
    }
  }

  /**
   * Download slot data from admin panel
   */
  async downloadSlotData(examId: string, password: string): Promise<any[]> {
    try {
      console.log(`📥 Downloading slot data for exam ${examId}...`);

      const response = await this.api.post<ApiResponse<any[]>>(
        '/api/mobile/download/slots',
        {
          examId,
          password,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to download slot data');
      }

      // Store locally
      await AsyncStorage.setItem(
        `slots_${examId}`,
        JSON.stringify(response.data.data)
      );

      // Notify admin
      await this.notifyDataDownload('slots', examId, response.data.data?.length || 0);

      console.log(`✅ Downloaded ${response.data.data?.length || 0} slot records`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Failed to download slot data:', error);
      throw error;
    }
  }

  /**
   * Sync all data with admin in real-time
   */
  async syncDataWithAdmin(): Promise<void> {
    try {
      if (!this.wsService?.isConnected()) {
        console.warn('⚠️ WebSocket not connected, skipping sync');
        return;
      }

      console.log('🔄 Syncing data with admin...');

      // Get local data
      const localData = await this.getLocalData();

      // Send via WebSocket
      await this.wsService.sendDataToAdmin('SYNC_REQUEST', {
        operatorId: this.operatorId,
        data: localData,
        timestamp: Date.now(),
      });

      console.log('✅ Data synced with admin');
    } catch (error) {
      console.error('❌ Failed to sync data:', error);
    }
  }

  /**
   * Mark attendance in real-time
   */
  async markAttendanceRealTime(candidateId: string, attendanceData: any): Promise<void> {
    try {
      console.log(`📊 Marking attendance for candidate ${candidateId}...`);

      // Save locally first
      const existingData = await AsyncStorage.getItem('attendance_data');
      const attendanceList = existingData ? JSON.parse(existingData) : [];
      attendanceList.push({
        candidateId,
        ...attendanceData,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem('attendance_data', JSON.stringify(attendanceList));

      // Send to admin in real-time
      if (this.wsService?.isConnected()) {
        await this.wsService.sendDataToAdmin('ATTENDANCE_UPDATE', {
          candidateId,
          ...attendanceData,
          timestamp: Date.now(),
        });
      }

      // Also sync with backend
      await this.api.post('/api/mobile/attendance/mark', {
        candidateId,
        ...attendanceData,
      });

      console.log('✅ Attendance marked and synced');
    } catch (error) {
      console.error('❌ Failed to mark attendance:', error);
      throw error;
    }
  }

  /**
   * Upload biometric data in real-time
   */
  async uploadBiometricRealTime(candidateId: string, biometricData: any): Promise<void> {
    try {
      console.log(`🔐 Uploading biometric for candidate ${candidateId}...`);

      // Save locally first
      const existingData = await AsyncStorage.getItem('biometric_data');
      const biometricList = existingData ? JSON.parse(existingData) : [];
      biometricList.push({
        candidateId,
        ...biometricData,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem('biometric_data', JSON.stringify(biometricList));

      // Send to admin in real-time
      if (this.wsService?.isConnected()) {
        await this.wsService.sendDataToAdmin('BIOMETRIC_UPDATE', {
          candidateId,
          ...biometricData,
          timestamp: Date.now(),
        });
      }

      // Also sync with backend
      await this.api.post('/api/mobile/biometric/upload', {
        candidateId,
        ...biometricData,
      });

      console.log('✅ Biometric uploaded and synced');
    } catch (error) {
      console.error('❌ Failed to upload biometric:', error);
      throw error;
    }
  }

  /**
   * Handle auto logout from admin
   */
  async handleAutoLogout(): Promise<void> {
    try {
      console.log('🚪 Handling auto logout...');

      // Stop auto-sync
      this.stopAutoSync();

      // Disconnect WebSocket
      this.wsService?.disconnect();

      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('operatorId');
      await AsyncStorage.removeItem('operatorData');

      console.log('✅ Auto logout completed');
    } catch (error) {
      console.error('❌ Failed to handle auto logout:', error);
    }
  }

  /**
   * Notify admin about data download
   */
  private async notifyDataDownload(dataType: string, examId: string, count: number): Promise<void> {
    try {
      if (!this.wsService?.isConnected()) {
        return;
      }

      await this.wsService.sendDataToAdmin('DOWNLOAD_NOTIFICATION', {
        dataType,
        examId,
        count,
        operatorId: this.operatorId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('❌ Failed to notify admin:', error);
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
   * Start auto-sync with admin
   */
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncDataWithAdmin();
      } catch (error) {
        console.error('❌ Auto-sync failed:', error);
      }
    }, this.syncIntervalMs);

    console.log('✅ Auto-sync started');
  }

  /**
   * Stop auto-sync
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('✅ Auto-sync stopped');
    }
  }

  /**
   * Handle token expiration
   */
  private async handleTokenExpired(): Promise<void> {
    console.log('⚠️ Token expired, logging out...');
    await this.handleAutoLogout();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.wsService?.getStatus() || 'DISCONNECTED';
  }

  /**
   * Check if connected to admin
   */
  isConnectedToAdmin(): boolean {
    return this.wsService?.isConnected() || false;
  }

  /**
   * Disconnect from admin
   */
  disconnect(): void {
    this.stopAutoSync();
    this.wsService?.disconnect();
  }
}

export default EnhancedApiService;
