/**
 * Offline Mode and Data Persistence Service
 * Handles offline functionality and queue management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface QueuedRequest {
  id: string;
  method: string;
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineData {
  attendance: any[];
  biometric: any[];
  registrations: any[];
  queuedRequests: QueuedRequest[];
}

class OfflineService {
  private isOnline: boolean = true;
  private requestQueue: QueuedRequest[] = [];
  private readonly QUEUE_KEY = 'REQUEST_QUEUE';
  private readonly OFFLINE_DATA_KEY = 'OFFLINE_DATA';
  private syncInProgress: boolean = false;

  constructor() {
    this.setupNetworkListener();
  }

  /**
   * Setup network listener
   */
  private setupNetworkListener(): void {
    // For React Native, use NetInfo
    // For web, use online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Handle going online
   */
  private async handleOnline(): Promise<void> {
    console.log('🌐 Going online...');
    this.isOnline = true;
    await this.syncQueuedRequests();
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    console.log('📴 Going offline...');
    this.isOnline = false;
  }

  /**
   * Check if online
   */
  isConnected(): boolean {
    return this.isOnline;
  }

  /**
   * Queue request for offline
   */
  async queueRequest(method: string, endpoint: string, data: any): Promise<string> {
    try {
      const request: QueuedRequest = {
        id: `${Date.now()}_${Math.random()}`,
        method,
        endpoint,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      this.requestQueue.push(request);
      await this.saveQueue();

      console.log(`📋 Request queued: ${method} ${endpoint}`);
      return request.id;
    } catch (error) {
      console.error('❌ Failed to queue request:', error);
      throw error;
    }
  }

  /**
   * Get queued requests
   */
  getQueuedRequests(): QueuedRequest[] {
    return [...this.requestQueue];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.requestQueue.length;
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    try {
      this.requestQueue = [];
      await AsyncStorage.removeItem(this.QUEUE_KEY);
      console.log('✅ Queue cleared');
    } catch (error) {
      console.error('❌ Failed to clear queue:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('❌ Failed to save queue:', error);
    }
  }

  /**
   * Load queue from storage
   */
  async loadQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (data) {
        this.requestQueue = JSON.parse(data);
        console.log(`✅ Loaded ${this.requestQueue.length} queued requests`);
      }
    } catch (error) {
      console.error('❌ Failed to load queue:', error);
    }
  }

  /**
   * Sync queued requests
   */
  async syncQueuedRequests(onProgress?: (processed: number, total: number) => void): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      console.warn('⚠️ Sync already in progress or offline');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log(`🔄 Syncing ${this.requestQueue.length} queued requests...`);

      const total = this.requestQueue.length;
      let processed = 0;

      for (const request of [...this.requestQueue]) {
        try {
          console.log(`📤 Processing: ${request.method} ${request.endpoint}`);

          // Execute request
          const response = await fetch(request.endpoint, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: request.data ? JSON.stringify(request.data) : undefined,
          });

          if (response.ok) {
            // Remove from queue
            this.requestQueue = this.requestQueue.filter(r => r.id !== request.id);
            processed++;
            console.log(`✅ Request synced: ${request.id}`);
          } else if (response.status >= 500) {
            // Server error, retry later
            request.retryCount++;
            console.warn(`⚠️ Server error, will retry: ${request.id}`);
          } else {
            // Client error, remove from queue
            this.requestQueue = this.requestQueue.filter(r => r.id !== request.id);
            console.error(`❌ Client error, removing from queue: ${request.id}`);
          }

          if (onProgress) {
            onProgress(processed, total);
          }
        } catch (error) {
          console.error(`❌ Failed to process request ${request.id}:`, error);
          request.retryCount++;
        }
      }

      await this.saveQueue();
      console.log(`✅ Sync completed: ${processed}/${total} requests synced`);
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Save offline data
   */
  async saveOfflineData(data: Partial<OfflineData>): Promise<void> {
    try {
      const existing = await this.getOfflineData();
      const merged = { ...existing, ...data };
      await AsyncStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(merged));
      console.log('✅ Offline data saved');
    } catch (error) {
      console.error('❌ Failed to save offline data:', error);
    }
  }

  /**
   * Get offline data
   */
  async getOfflineData(): Promise<OfflineData> {
    try {
      const data = await AsyncStorage.getItem(this.OFFLINE_DATA_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return {
        attendance: [],
        biometric: [],
        registrations: [],
        queuedRequests: [],
      };
    } catch (error) {
      console.error('❌ Failed to get offline data:', error);
      return {
        attendance: [],
        biometric: [],
        registrations: [],
        queuedRequests: [],
      };
    }
  }

  /**
   * Clear offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_DATA_KEY);
      console.log('✅ Offline data cleared');
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
    }
  }

  /**
   * Get offline status
   */
  getStatus(): {
    isOnline: boolean;
    queueSize: number;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queueSize: this.requestQueue.length,
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Add attendance to offline queue
   */
  async addAttendanceOffline(candidateId: string, data: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData.attendance.push({
        candidateId,
        ...data,
        timestamp: Date.now(),
      });
      await this.saveOfflineData(offlineData);
      console.log(`✅ Attendance added to offline queue: ${candidateId}`);
    } catch (error) {
      console.error('❌ Failed to add attendance offline:', error);
    }
  }

  /**
   * Add biometric to offline queue
   */
  async addBiometricOffline(candidateId: string, data: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData.biometric.push({
        candidateId,
        ...data,
        timestamp: Date.now(),
      });
      await this.saveOfflineData(offlineData);
      console.log(`✅ Biometric added to offline queue: ${candidateId}`);
    } catch (error) {
      console.error('❌ Failed to add biometric offline:', error);
    }
  }

  /**
   * Get offline statistics
   */
  async getOfflineStats(): Promise<{
    attendance: number;
    biometric: number;
    registrations: number;
    queuedRequests: number;
  }> {
    try {
      const data = await this.getOfflineData();
      return {
        attendance: data.attendance.length,
        biometric: data.biometric.length,
        registrations: data.registrations.length,
        queuedRequests: data.queuedRequests.length,
      };
    } catch (error) {
      console.error('❌ Failed to get offline stats:', error);
      return {
        attendance: 0,
        biometric: 0,
        registrations: 0,
        queuedRequests: 0,
      };
    }
  }
}

export default new OfflineService();
