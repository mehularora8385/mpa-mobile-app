import { offlineStorage, ExamData, SyncLog } from './offline-storage';
import { authService } from './auth-service';

// Types
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  syncProgress: number; // 0-100
  error: string | null;
}

// Sync Service
class SyncService {
  private static instance: SyncService;
  private syncStatusMap = new Map<string, SyncStatus>();
  private syncInProgress = new Map<string, boolean>();

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Download exam data from server
  async downloadExamData(
    examId: string,
    centreCode: string,
    dataType: 'mock' | 'exam',
    adminPassword: string,
    onProgress?: (progress: number) => void
  ): Promise<ExamData> {
    try {
      const authHeader = await authService.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      // Call download API
      const response = await fetch(
        'https://api.examination-system.com/api/sync/download',
        {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            examId,
            centreCode,
            dataType,
            adminPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const examData: ExamData = await response.json();

      // Save to local storage
      await offlineStorage.saveExamData(examData);

      // Log sync
      await offlineStorage.addSyncLog({
        syncId: `sync_${Date.now()}`,
        examId,
        timestamp: Date.now(),
        status: 'success',
        dataCount: examData.candidates.length,
      });

      return examData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed sync
      await offlineStorage.addSyncLog({
        syncId: `sync_${Date.now()}`,
        examId,
        timestamp: Date.now(),
        status: 'failed',
        dataCount: 0,
        error: errorMessage,
      });

      throw error;
    }
  }

  // Upload exam data to server
  async uploadExamData(examId: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
      // Check if already syncing
      if (this.syncInProgress.get(examId)) {
        throw new Error('Sync already in progress');
      }

      this.syncInProgress.set(examId, true);
      this.updateSyncStatus(examId, { isSyncing: true, syncProgress: 0 });

      const authHeader = await authService.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      // Get pending data
      const { candidates, biometricData } = await offlineStorage.getPendingDataForSync(examId);

      if (candidates.length === 0) {
        this.updateSyncStatus(examId, { isSyncing: false, syncProgress: 100 });
        return;
      }

      // Upload in batches
      const batchSize = 50;
      const totalBatches = Math.ceil(candidates.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, candidates.length);
        const batch = candidates.slice(start, end);

        const response = await fetch(
          'https://api.examination-system.com/api/sync/upload',
          {
            method: 'POST',
            headers: {
              ...authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              examId,
              candidates: batch,
              biometricData: biometricData.filter(bd =>
                batch.some(c => c.candidateId === bd.candidateId)
              ),
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Upload batch ${i + 1} failed`);
        }

        const progress = Math.round(((i + 1) / totalBatches) * 100);
        this.updateSyncStatus(examId, { syncProgress: progress });
        onProgress?.(progress);
      }

      // Log successful sync
      await offlineStorage.addSyncLog({
        syncId: `sync_${Date.now()}`,
        examId,
        timestamp: Date.now(),
        status: 'success',
        dataCount: candidates.length,
      });

      this.updateSyncStatus(examId, {
        isSyncing: false,
        syncProgress: 100,
        lastSyncTime: Date.now(),
        pendingChanges: 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed sync
      await offlineStorage.addSyncLog({
        syncId: `sync_${Date.now()}`,
        examId,
        timestamp: Date.now(),
        status: 'failed',
        dataCount: 0,
        error: errorMessage,
      });

      this.updateSyncStatus(examId, {
        isSyncing: false,
        error: errorMessage,
      });

      throw error;
    } finally {
      this.syncInProgress.delete(examId);
    }
  }

  // Auto-sync when internet is available
  async autoSync(examId: string): Promise<void> {
    try {
      // Check internet connectivity
      const isOnline = await this.checkInternetConnectivity();
      if (!isOnline) {
        console.log('No internet connection, skipping auto-sync');
        return;
      }

      await this.uploadExamData(examId);
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  }

  // Manual sync
  async manualSync(examId: string): Promise<void> {
    return this.uploadExamData(examId);
  }

  // Get sync status
  getSyncStatus(examId: string): SyncStatus {
    return (
      this.syncStatusMap.get(examId) || {
        isSyncing: false,
        lastSyncTime: null,
        pendingChanges: 0,
        syncProgress: 0,
        error: null,
      }
    );
  }

  // Update sync status
  private updateSyncStatus(examId: string, updates: Partial<SyncStatus>): void {
    const current = this.getSyncStatus(examId);
    this.syncStatusMap.set(examId, { ...current, ...updates });
  }

  // Check internet connectivity
  private async checkInternetConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://api.examination-system.com/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get sync history
  async getSyncHistory(): Promise<SyncLog[]> {
    return offlineStorage.getSyncLogs();
  }

  // Retry failed sync
  async retrySyncForExam(examId: string): Promise<void> {
    try {
      await this.uploadExamData(examId);
    } catch (error) {
      console.error('Retry sync error:', error);
      throw error;
    }
  }

  // Clear sync error
  clearSyncError(examId: string): void {
    const current = this.getSyncStatus(examId);
    this.syncStatusMap.set(examId, { ...current, error: null });
  }
}

export const syncService = SyncService.getInstance();
