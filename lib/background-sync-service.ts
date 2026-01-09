import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import { offlineDatabase } from './offline-database';
import { apiClient } from './api-client';

const SYNC_TASK_NAME = 'mpa-background-sync';
const SYNC_INTERVAL = 15 * 60; // 15 minutes

export interface SyncStatus {
  isOnline: boolean;
  pendingRecords: number;
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  syncInProgress: boolean;
}

class BackgroundSyncService {
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;
  private syncStatusCallback: ((status: SyncStatus) => void) | null = null;

  /**
   * Initialize background sync
   */
  async initialize(): Promise<void> {
    try {
      // Check if background fetch is available
      const status = await BackgroundFetch.getStatusAsync();
      console.log('Background fetch status:', status);

      // Register background sync task
      await this.registerSyncTask();

      // Check network status
      const netInfo = await NetInfo.fetch();
      console.log('Network status:', netInfo.isConnected);

      if (netInfo.isConnected) {
        // Perform initial sync
        await this.syncPendingRecords();
      }
    } catch (error) {
      console.error('Background sync initialization error:', error);
    }
  }

  /**
   * Register background sync task
   */
  private async registerSyncTask(): Promise<void> {
    try {
      await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
        minimumInterval: SYNC_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background sync task registered');
    } catch (error) {
      console.error('Failed to register background sync task:', error);
    }
  }

  /**
   * Define background sync task
   */
  static defineTask(): void {
    TaskManager.defineTask(SYNC_TASK_NAME, async () => {
      try {
        const netInfo = await NetInfo.fetch();

        if (!netInfo.isConnected) {
          console.log('No internet connection, skipping sync');
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const syncService = new BackgroundSyncService();
        await syncService.syncPendingRecords();

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background sync task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  /**
   * Sync pending records with retry logic
   */
  async syncPendingRecords(maxRetries: number = 3): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;

    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No internet connection');
        this.updateSyncStatus();
        return;
      }

      // Get pending records
      const pendingRecords = await offlineDatabase.getPendingSyncRecords();
      console.log(`Found ${pendingRecords.length} pending records`);

      for (const record of pendingRecords) {
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            await this.uploadRecord(record);
            await offlineDatabase.markSyncRecordAsSynced(record.id!);
            success = true;

            console.log(`Successfully synced record ${record.id}`);
          } catch (error) {
            retryCount++;
            console.error(`Sync attempt ${retryCount} failed:`, error);

            if (retryCount < maxRetries) {
              // Exponential backoff
              const backoffTime = Math.pow(2, retryCount) * 1000;
              await this.sleep(backoffTime);
            }
          }
        }

        if (!success) {
          // Increment retry count in database
          await offlineDatabase.incrementSyncRetryCount(record.id!);
          console.log(`Failed to sync record ${record.id} after ${maxRetries} attempts`);
        }
      }

      this.lastSyncTime = new Date();
      this.updateSyncStatus();
    } catch (error) {
      console.error('Sync pending records error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Upload individual record
   */
  private async uploadRecord(record: any): Promise<void> {
    const data = JSON.parse(record.data);

    switch (record.type) {
      case 'attendance':
        await apiClient.markAttendance(data.rollNo, data.present);
        break;

      case 'biometric':
        await apiClient.uploadBiometric(data);
        break;

      case 'verification':
        await apiClient.verifyCandidate(data.rollNo);
        break;

      default:
        throw new Error(`Unknown sync type: ${record.type}`);
    }
  }

  /**
   * Manual sync trigger
   */
  async manualSync(): Promise<SyncStatus> {
    await this.syncPendingRecords();
    return this.getSyncStatus();
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const netInfo = await NetInfo.fetch();
      const pendingRecords = await offlineDatabase.getPendingSyncRecords();

      return {
        isOnline: netInfo.isConnected || false,
        pendingRecords: pendingRecords.length,
        lastSyncTime: this.lastSyncTime?.toISOString() || null,
        nextSyncTime: this.calculateNextSyncTime(),
        syncInProgress: this.syncInProgress,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: false,
        pendingRecords: 0,
        lastSyncTime: null,
        nextSyncTime: null,
        syncInProgress: false,
      };
    }
  }

  /**
   * Set sync status callback
   */
  setSyncStatusCallback(callback: (status: SyncStatus) => void): void {
    this.syncStatusCallback = callback;
  }

  /**
   * Update sync status and notify listeners
   */
  private async updateSyncStatus(): Promise<void> {
    if (this.syncStatusCallback) {
      const status = await this.getSyncStatus();
      this.syncStatusCallback(status);
    }
  }

  /**
   * Calculate next sync time
   */
  private calculateNextSyncTime(): string {
    const nextSync = new Date();
    nextSync.setSeconds(nextSync.getSeconds() + SYNC_INTERVAL);
    return nextSync.toISOString();
  }

  /**
   * Add record to pending sync
   */
  async addToPendingSync(type: string, data: any): Promise<void> {
    try {
      await offlineDatabase.addPendingSync(type, data);
      this.updateSyncStatus();

      // Attempt immediate sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await this.syncPendingRecords();
      }
    } catch (error) {
      console.error('Error adding to pending sync:', error);
    }
  }

  /**
   * Get pending records count
   */
  async getPendingRecordsCount(): Promise<number> {
    try {
      const records = await offlineDatabase.getPendingSyncRecords();
      return records.length;
    } catch (error) {
      console.error('Error getting pending records count:', error);
      return 0;
    }
  }

  /**
   * Clear all pending records
   */
  async clearPendingRecords(): Promise<void> {
    try {
      const records = await offlineDatabase.getPendingSyncRecords();
      for (const record of records) {
        await offlineDatabase.markSyncRecordAsSynced(record.id!);
      }
      this.updateSyncStatus();
    } catch (error) {
      console.error('Error clearing pending records:', error);
    }
  }

  /**
   * Unregister background sync task
   */
  async unregisterSyncTask(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(SYNC_TASK_NAME);
      console.log('Background sync task unregistered');
    } catch (error) {
      console.error('Failed to unregister background sync task:', error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const backgroundSyncService = new BackgroundSyncService();
export type { SyncStatus };
