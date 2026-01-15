import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface DownloadedData {
  centreCode: string;
  examId: string;
  examName: string;
  downloadedAt: string;
  candidates: CandidateData[];
  password: string; // encrypted
  synced: boolean;
  lastSyncTime?: string;
}

interface CandidateData {
  rollNo: string;
  name: string;
  fatherName: string;
  dob: string;
  photo?: string; // base64
  centreCode: string;
  examId: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface Centre {
  centreCode: string;
  centreName: string;
  location: string;
  incharge: string;
}

interface Exam {
  examId: string;
  examName: string;
  examDate: string;
  totalCandidates: number;
}

class DownloadService {
  private readonly DOWNLOAD_KEY_PREFIX = 'downloaded_data_';
  private readonly CENTRES_KEY = 'centres_list';
  private readonly EXAMS_KEY = 'exams_list';
  private readonly BACKEND_URL = 'http://13.204.65.158/api/v1';

  /**
   * Get all centres from backend
   */
  async getCentres(token: string): Promise<Centre[]> {
    try {
      // Try to get from cache first
      const cached = await AsyncStorage.getItem(this.CENTRES_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from backend
      const response = await fetch(`${this.BACKEND_URL}/api/centres`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch centres');
      }

      const centres = await response.json();
      
      // Cache locally
      await AsyncStorage.setItem(this.CENTRES_KEY, JSON.stringify(centres));
      
      return centres;
    } catch (error) {
      console.error('Error getting centres:', error);
      
      // Return cached data if available
      try {
        const cached = await AsyncStorage.getItem(this.CENTRES_KEY);
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
  }

  /**
   * Get all exams from backend
   */
  async getExams(token: string): Promise<Exam[]> {
    try {
      // Try to get from cache first
      const cached = await AsyncStorage.getItem(this.EXAMS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from backend
      const response = await fetch(`${this.BACKEND_URL}/api/exams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const exams = await response.json();
      
      // Cache locally
      await AsyncStorage.setItem(this.EXAMS_KEY, JSON.stringify(exams));
      
      return exams;
    } catch (error) {
      console.error('Error getting exams:', error);
      
      // Return cached data if available
      try {
        const cached = await AsyncStorage.getItem(this.EXAMS_KEY);
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
  }

  /**
   * Verify password before download
   */
  async verifyPassword(
    centreCode: string,
    examId: string,
    password: string,
    token: string
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/download/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          centreCode,
          examId,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { valid: false, message: error.message || 'Invalid password' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error verifying password:', error);
      return { valid: false, message: 'Password verification failed' };
    }
  }

  /**
   * Download candidates for centre and exam
   */
  async downloadCandidates(
    centreCode: string,
    examId: string,
    password: string,
    token: string
  ): Promise<{ success: boolean; data?: DownloadedData; error?: string }> {
    try {
      // Verify password first
      const passwordCheck = await this.verifyPassword(centreCode, examId, password, token);
      if (!passwordCheck.valid) {
        return { success: false, error: passwordCheck.message };
      }

      // Fetch candidates
      const response = await fetch(
        `${this.BACKEND_URL}/api/candidates?centreCode=${centreCode}&examId=${examId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download candidates');
      }

      const candidates = await response.json();

      // Encrypt password
      const encryptedPassword = await this.encryptPassword(password);

      // Get exam name
      const exams = await this.getExams(token);
      const exam = exams.find((e) => e.examId === examId);
      const examName = exam?.examName || examId;

      // Create download record
      const downloadedData: DownloadedData = {
        centreCode,
        examId,
        examName,
        downloadedAt: new Date().toISOString(),
        candidates,
        password: encryptedPassword,
        synced: false,
      };

      // Save locally
      const key = `${this.DOWNLOAD_KEY_PREFIX}${centreCode}_${examId}`;
      await AsyncStorage.setItem(key, JSON.stringify(downloadedData));

      return { success: true, data: downloadedData };
    } catch (error) {
      console.error('Error downloading candidates:', error);
      return { success: false, error: 'Download failed. Please try again.' };
    }
  }

  /**
   * Get downloaded data for centre and exam
   */
  async getDownloadedData(centreCode: string, examId: string): Promise<DownloadedData | null> {
    try {
      const key = `${this.DOWNLOAD_KEY_PREFIX}${centreCode}_${examId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting downloaded data:', error);
      return null;
    }
  }

  /**
   * Get all downloaded data
   */
  async getAllDownloadedData(): Promise<DownloadedData[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const downloadKeys = keys.filter((k) => k.startsWith(this.DOWNLOAD_KEY_PREFIX));
      
      const data: DownloadedData[] = [];
      for (const key of downloadKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          data.push(JSON.parse(item));
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error getting all downloaded data:', error);
      return [];
    }
  }

  /**
   * Get candidate by roll number from downloaded data
   */
  async getCandidateByRoll(
    centreCode: string,
    examId: string,
    rollNo: string
  ): Promise<CandidateData | null> {
    try {
      const data = await this.getDownloadedData(centreCode, examId);
      if (!data) {
        return null;
      }

      return data.candidates.find((c) => c.rollNo === rollNo) || null;
    } catch (error) {
      console.error('Error getting candidate:', error);
      return null;
    }
  }

  /**
   * Encrypt password for storage
   */
  private async encryptPassword(password: string): Promise<string> {
    try {
      // Simple encryption - in production use proper encryption
      const encrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      return encrypted;
    } catch (error) {
      console.error('Error encrypting password:', error);
      return password; // Fallback to plain text
    }
  }

  /**
   * Verify stored password
   */
  async verifyStoredPassword(storedHash: string, password: string): Promise<boolean> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      return hash === storedHash;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Mark data as synced
   */
  async markAsSynced(centreCode: string, examId: string): Promise<void> {
    try {
      const key = `${this.DOWNLOAD_KEY_PREFIX}${centreCode}_${examId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.synced = true;
        parsed.lastSyncTime = new Date().toISOString();
        await AsyncStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  }

  /**
   * Delete downloaded data
   */
  async deleteDownloadedData(centreCode: string, examId: string): Promise<void> {
    try {
      const key = `${this.DOWNLOAD_KEY_PREFIX}${centreCode}_${examId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting downloaded data:', error);
    }
  }

  /**
   * Get download statistics
   */
  async getDownloadStats(): Promise<{
    totalDownloads: number;
    totalCandidates: number;
    synced: number;
    pending: number;
  }> {
    try {
      const allData = await this.getAllDownloadedData();
      
      let totalCandidates = 0;
      let synced = 0;
      let pending = 0;

      allData.forEach((d) => {
        totalCandidates += d.candidates.length;
        if (d.synced) {
          synced += d.candidates.length;
        } else {
          pending += d.candidates.length;
        }
      });

      return {
        totalDownloads: allData.length,
        totalCandidates,
        synced,
        pending,
      };
    } catch (error) {
      console.error('Error getting download stats:', error);
      return { totalDownloads: 0, totalCandidates: 0, synced: 0, pending: 0 };
    }
  }
}

export const downloadService = new DownloadService();
