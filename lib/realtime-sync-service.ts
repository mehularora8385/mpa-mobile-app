import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

interface SyncRecord {
  type: 'attendance' | 'verification';
  data: any;
  timestamp: string;
  synced: boolean;
}

interface SyncStatus {
  totalRegistered: number;
  synced: number;
  pending: number;
  verified: number;
  pendingVerification: number;
  lastSync: string;
  nextSync?: string;
}

interface StudentData {
  rollNo: string;
  name: string;
  present: boolean;
  verified: boolean;
  syncStatus: 'synced' | 'pending';
  lastUpdated: string;
}

class RealtimeSyncService {
  private readonly PENDING_RECORDS_KEY = 'pendingRecords';
  private readonly SYNC_STATUS_KEY = 'syncStatus';
  private readonly STUDENT_DATA_KEY = 'studentData';
  private readonly BACKEND_URL = 'http://13.204.65.158/api/v1';
  
  private syncInterval: NodeJS.Timer | null = null;
  private appState: AppStateStatus = 'active';
  private isOnline: boolean = true;

  /**
   * Initialize sync service
   */
  async initialize(token: string): Promise<void> {
    try {
      console.log('Initializing real-time sync service');
      
      // Start auto-sync every 1 minute
      this.startAutoSync(token);
      
      // Listen for app state changes
      AppState.addEventListener('change', (state) => this.handleAppStateChange(state, token));
      
      // Initial sync
      await this.syncAll(token);
    } catch (error) {
      console.error('Error initializing sync service:', error);
    }
  }

  /**
   * Start auto-sync (every 1 minute)
   */
  private startAutoSync(token: string): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline && this.appState === 'active') {
        console.log('Auto-sync triggered');
        await this.syncAll(token);
      }
    }, 60000); // 1 minute
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(state: AppStateStatus, token: string): void {
    this.appState = state;
    
    if (state === 'active') {
      console.log('App is active - starting sync');
      this.startAutoSync(token);
    } else if (state === 'background') {
      console.log('App is in background - stopping sync');
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    }
  }

  /**
   * Add record to pending sync
   */
  async addPendingRecord(
    type: 'attendance' | 'verification',
    data: any
  ): Promise<void> {
    try {
      const records = await this.getPendingRecords();
      
      const record: SyncRecord = {
        type,
        data,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      records.push(record);
      await AsyncStorage.setItem(this.PENDING_RECORDS_KEY, JSON.stringify(records));
      
      console.log(`Added pending ${type} record`);
    } catch (error) {
      console.error('Error adding pending record:', error);
    }
  }

  /**
   * Get pending records
   */
  async getPendingRecords(): Promise<SyncRecord[]> {
    try {
      const records = await AsyncStorage.getItem(this.PENDING_RECORDS_KEY);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('Error getting pending records:', error);
      return [];
    }
  }

  /**
   * Sync all pending records
   */
  async syncAll(token: string): Promise<{ success: boolean; synced: number; failed: number }> {
    try {
      const records = await this.getPendingRecords();
      let synced = 0;
      let failed = 0;

      for (const record of records) {
        if (record.synced) continue;

        try {
          if (record.type === 'attendance') {
            await this.syncAttendance(record.data, token);
          } else if (record.type === 'verification') {
            await this.syncVerification(record.data, token);
          }
          
          record.synced = true;
          synced++;
        } catch (error) {
          console.error(`Error syncing ${record.type}:`, error);
          failed++;
        }
      }

      // Update pending records
      await AsyncStorage.setItem(this.PENDING_RECORDS_KEY, JSON.stringify(records));

      // Update sync status
      await this.updateSyncStatus(token);

      console.log(`Sync complete: ${synced} synced, ${failed} failed`);
      return { success: failed === 0, synced, failed };
    } catch (error) {
      console.error('Error syncing all records:', error);
      return { success: false, synced: 0, failed: 0 };
    }
  }

  /**
   * Sync attendance record
   */
  private async syncAttendance(data: any, token: string): Promise<void> {
    const response = await fetch(`${this.BACKEND_URL}/api/attendance/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Attendance sync failed');
    }
  }

  /**
   * Sync verification record
   */
  private async syncVerification(data: any, token: string): Promise<void> {
    const response = await fetch(`${this.BACKEND_URL}/api/verification/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Verification sync failed');
    }
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(token: string): Promise<SyncStatus> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/sync/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get sync status');
      }

      const status = await response.json();
      
      // Add next sync time
      const nextSync = new Date(Date.now() + 60000).toISOString();
      status.nextSync = nextSync;

      // Save locally
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(status));

      return status;
    } catch (error) {
      console.error('Error updating sync status:', error);
      return this.getLocalSyncStatus();
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const status = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      if (status) {
        return JSON.parse(status);
      }
      
      return {
        totalRegistered: 0,
        synced: 0,
        pending: 0,
        verified: 0,
        pendingVerification: 0,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return this.getLocalSyncStatus();
    }
  }

  /**
   * Get local sync status
   */
  private getLocalSyncStatus(): SyncStatus {
    return {
      totalRegistered: 0,
      synced: 0,
      pending: 0,
      verified: 0,
      pendingVerification: 0,
      lastSync: new Date().toISOString(),
    };
  }

  /**
   * Get student data
   */
  async getStudentData(): Promise<StudentData[]> {
    try {
      const data = await AsyncStorage.getItem(this.STUDENT_DATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting student data:', error);
      return [];
    }
  }

  /**
   * Update student data
   */
  async updateStudentData(
    rollNo: string,
    name: string,
    present: boolean,
    verified: boolean
  ): Promise<void> {
    try {
      const students = await this.getStudentData();
      
      // Find or create student record
      let student = students.find((s) => s.rollNo === rollNo);
      if (!student) {
        student = {
          rollNo,
          name,
          present: false,
          verified: false,
          syncStatus: 'pending',
          lastUpdated: new Date().toISOString(),
        };
        students.push(student);
      }

      // Update
      student.present = present;
      student.verified = verified;
      student.syncStatus = 'pending';
      student.lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(this.STUDENT_DATA_KEY, JSON.stringify(students));
    } catch (error) {
      console.error('Error updating student data:', error);
    }
  }

  /**
   * Mark student as synced
   */
  async markStudentAsSynced(rollNo: string): Promise<void> {
    try {
      const students = await this.getStudentData();
      const student = students.find((s) => s.rollNo === rollNo);
      if (student) {
        student.syncStatus = 'synced';
        await AsyncStorage.setItem(this.STUDENT_DATA_KEY, JSON.stringify(students));
      }
    } catch (error) {
      console.error('Error marking student as synced:', error);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalRecords: number;
    syncedRecords: number;
    pendingRecords: number;
    syncPercentage: number;
  }> {
    try {
      const records = await this.getPendingRecords();
      const totalRecords = records.length;
      const syncedRecords = records.filter((r) => r.synced).length;
      const pendingRecords = totalRecords - syncedRecords;
      const syncPercentage = totalRecords > 0 ? (syncedRecords / totalRecords) * 100 : 0;

      return {
        totalRecords,
        syncedRecords,
        pendingRecords,
        syncPercentage,
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        totalRecords: 0,
        syncedRecords: 0,
        pendingRecords: 0,
        syncPercentage: 0,
      };
    }
  }

  /**
   * Cleanup - stop sync service
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('Sync service cleaned up');
  }

  /**
   * Set online/offline status
   */
  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    console.log(`Network status: ${isOnline ? 'online' : 'offline'}`);
  }
}

export const realtimeSyncService = new RealtimeSyncService();
