import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Types
export interface ExamData {
  examId: string;
  examName: string;
  examDate: string;
  examTime: string;
  centreCode: string;
  centreName: string;
  totalCandidates: number;
  candidates: CandidateRecord[];
  lastSyncTime: number;
}

export interface CandidateRecord {
  candidateId: string;
  rollNumber: string;
  name: string;
  fatherName: string;
  dob: string;
  aadhaar: string; // masked
  photoUri: string;
  status: 'pending' | 'present' | 'absent' | 'registered';
  biometricData?: BiometricRecord;
}

export interface BiometricRecord {
  faceMatchPercentage?: number;
  facePhotoUri?: string;
  fingerprintTemplate?: string;
  fingerprintStatus?: 'success' | 'failed' | 'pending';
  omrData?: string;
  registrationTime?: number;
}

export interface SyncLog {
  syncId: string;
  examId: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  dataCount: number;
  error?: string;
}

// Offline Storage Service
class OfflineStorageService {
  private static instance: OfflineStorageService;
  private examDataKey = 'exam_data_';
  private biometricDataKey = 'biometric_data_';
  private syncLogsKey = 'sync_logs';
  private encryptionKey = 'exam_operator_encryption_key';

  private constructor() {}

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  // Save exam data locally
  async saveExamData(examData: ExamData): Promise<void> {
    try {
      const key = `${this.examDataKey}${examData.examId}`;
      const encrypted = await this.encryptData(JSON.stringify(examData));
      await AsyncStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error saving exam data:', error);
      throw error;
    }
  }

  // Get exam data from local storage
  async getExamData(examId: string): Promise<ExamData | null> {
    try {
      const key = `${this.examDataKey}${examId}`;
      const encrypted = await AsyncStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = await this.decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error getting exam data:', error);
      return null;
    }
  }

  // Get all exam data
  async getAllExamData(): Promise<ExamData[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const examKeys = keys.filter(key => key.startsWith(this.examDataKey));

      const examDataArray: ExamData[] = [];
      for (const key of examKeys) {
        const encrypted = await AsyncStorage.getItem(key);
        if (encrypted) {
          const decrypted = await this.decryptData(encrypted);
          examDataArray.push(JSON.parse(decrypted));
        }
      }

      return examDataArray;
    } catch (error) {
      console.error('Error getting all exam data:', error);
      return [];
    }
  }

  // Update candidate status
  async updateCandidateStatus(
    examId: string,
    candidateId: string,
    status: 'present' | 'absent' | 'registered'
  ): Promise<void> {
    try {
      const examData = await this.getExamData(examId);
      if (!examData) throw new Error('Exam data not found');

      const candidate = examData.candidates.find(c => c.candidateId === candidateId);
      if (!candidate) throw new Error('Candidate not found');

      candidate.status = status;
      await this.saveExamData(examData);
    } catch (error) {
      console.error('Error updating candidate status:', error);
      throw error;
    }
  }

  // Save biometric data for candidate
  async saveBiometricData(
    examId: string,
    candidateId: string,
    biometricData: BiometricRecord
  ): Promise<void> {
    try {
      const examData = await this.getExamData(examId);
      if (!examData) throw new Error('Exam data not found');

      const candidate = examData.candidates.find(c => c.candidateId === candidateId);
      if (!candidate) throw new Error('Candidate not found');

      candidate.biometricData = {
        ...candidate.biometricData,
        ...biometricData,
        registrationTime: Date.now(),
      };

      candidate.status = 'registered';
      await this.saveExamData(examData);
    } catch (error) {
      console.error('Error saving biometric data:', error);
      throw error;
    }
  }

  // Get candidate details
  async getCandidateDetails(examId: string, candidateId: string): Promise<CandidateRecord | null> {
    try {
      const examData = await this.getExamData(examId);
      if (!examData) return null;

      return examData.candidates.find(c => c.candidateId === candidateId) || null;
    } catch (error) {
      console.error('Error getting candidate details:', error);
      return null;
    }
  }

  // Get candidates by status
  async getCandidatesByStatus(
    examId: string,
    status: 'pending' | 'present' | 'absent' | 'registered'
  ): Promise<CandidateRecord[]> {
    try {
      const examData = await this.getExamData(examId);
      if (!examData) return [];

      return examData.candidates.filter(c => c.status === status);
    } catch (error) {
      console.error('Error getting candidates by status:', error);
      return [];
    }
  }

  // Search candidates
  async searchCandidates(
    examId: string,
    query: string
  ): Promise<CandidateRecord[]> {
    try {
      const examData = await this.getExamData(examId);
      if (!examData) return [];

      const lowerQuery = query.toLowerCase();
      return examData.candidates.filter(c =>
        c.rollNumber.toLowerCase().includes(lowerQuery) ||
        c.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching candidates:', error);
      return [];
    }
  }

  // Get dashboard statistics
  async getDashboardStats(examId: string): Promise<{
    totalCandidates: number;
    presentCount: number;
    absentCount: number;
    registeredCount: number;
    pendingCount: number;
    averageFaceMatch: number;
    omrMappedCount: number;
  }> {
    try {
      const examData = await this.getExamData(examId);
      if (!examData) {
        return {
          totalCandidates: 0,
          presentCount: 0,
          absentCount: 0,
          registeredCount: 0,
          pendingCount: 0,
          averageFaceMatch: 0,
          omrMappedCount: 0,
        };
      }

      const presentCount = examData.candidates.filter(c => c.status === 'present').length;
      const absentCount = examData.candidates.filter(c => c.status === 'absent').length;
      const registeredCount = examData.candidates.filter(c => c.status === 'registered').length;
      const pendingCount = examData.candidates.filter(c => c.status === 'pending').length;

      const faceMatches = examData.candidates
        .filter(c => c.biometricData?.faceMatchPercentage)
        .map(c => c.biometricData!.faceMatchPercentage!);
      const averageFaceMatch = faceMatches.length > 0
        ? faceMatches.reduce((a, b) => a + b, 0) / faceMatches.length
        : 0;

      const omrMappedCount = examData.candidates.filter(
        c => c.biometricData?.omrData
      ).length;

      return {
        totalCandidates: examData.candidates.length,
        presentCount,
        absentCount,
        registeredCount,
        pendingCount,
        averageFaceMatch: Math.round(averageFaceMatch),
        omrMappedCount,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalCandidates: 0,
        presentCount: 0,
        absentCount: 0,
        registeredCount: 0,
        pendingCount: 0,
        averageFaceMatch: 0,
        omrMappedCount: 0,
      };
    }
  }

  // Add sync log
  async addSyncLog(log: SyncLog): Promise<void> {
    try {
      const logsJson = await AsyncStorage.getItem(this.syncLogsKey);
      const logs: SyncLog[] = logsJson ? JSON.parse(logsJson) : [];
      logs.push(log);

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.shift();
      }

      await AsyncStorage.setItem(this.syncLogsKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Error adding sync log:', error);
    }
  }

  // Get sync logs
  async getSyncLogs(): Promise<SyncLog[]> {
    try {
      const logsJson = await AsyncStorage.getItem(this.syncLogsKey);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Error getting sync logs:', error);
      return [];
    }
  }

  // Get pending data for sync
  async getPendingDataForSync(examId: string): Promise<{
    candidates: CandidateRecord[];
    biometricData: Array<{ candidateId: string; data: BiometricRecord }>;
  }> {
    try {
      const examData = await this.getExamData(examId);
      if (!examData) {
        return { candidates: [], biometricData: [] };
      }

      const candidates = examData.candidates.filter(c => c.status !== 'pending');
      const biometricData = candidates
        .filter(c => c.biometricData)
        .map(c => ({
          candidateId: c.candidateId,
          data: c.biometricData!,
        }));

      return { candidates, biometricData };
    } catch (error) {
      console.error('Error getting pending data for sync:', error);
      return { candidates: [], biometricData: [] };
    }
  }

  // Clear exam data
  async clearExamData(examId: string): Promise<void> {
    try {
      const key = `${this.examDataKey}${examId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing exam data:', error);
      throw error;
    }
  }

  // Encryption helper
  private async encryptData(data: string): Promise<string> {
    try {
      // Simple encryption using base64 + hash
      // In production, use a proper encryption library
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + this.encryptionKey
      );
      const encoded = Buffer.from(data).toString('base64');
      return `${encoded}:${digest.substring(0, 16)}`;
    } catch (error) {
      console.error('Encryption error:', error);
      return Buffer.from(data).toString('base64');
    }
  }

  // Decryption helper
  private async decryptData(encrypted: string): Promise<string> {
    try {
      const [encoded] = encrypted.split(':');
      return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Decryption error:', error);
      return encrypted;
    }
  }
}

export const offlineStorage = OfflineStorageService.getInstance();
