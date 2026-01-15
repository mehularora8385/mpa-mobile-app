import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API endpoint - update this when you change servers
const BACKEND_API = 'http://13.204.65.158/api/v1';
const ADMIN_PANEL_API = 'http://mpa-admin-portal.s3-website.ap-south-1.amazonaws.com';

interface OperatorSession {
  operatorId: string;
  operatorName: string;
  email: string;
  centre: string;
  exam: string;
  token: string;
  adminPanelUrl: string;
  loginTime: string;
}

interface CandidateData {
  id: string;
  rollNo: string;
  name: string;
  centre: string;
  exam: string;
  slotTime: string;
  photo?: string;
  biometricStatus?: string;
  verificationStatus?: string;
}

interface BiometricRecord {
  candidateId: string;
  biometricType: 'fingerprint' | 'iris' | 'face';
  imageData: string; // base64
  matchPercentage?: number;
  timestamp: string;
  operatorId: string;
}

class AdminPanelAPI {
  private baseUrl = ADMIN_PANEL_API;

  /**
   * Get current operator session
   */
  async getOperatorSession(): Promise<OperatorSession | null> {
    try {
      const session = await AsyncStorage.getItem('operatorSession');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting operator session:', error);
      return null;
    }
  }

  /**
   * Download candidate data for current exam
   */
  async downloadCandidateData(exam: string, centre: string): Promise<CandidateData[]> {
    try {
      const session = await this.getOperatorSession();
      if (!session) throw new Error('No active session');

      // Call backend API instead of admin panel
      const response = await fetch(
        `${BACKEND_API}/api/candidates?examId=${exam}&centreId=${centre}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to download candidate data');

      const data = await response.json();
      
      // Cache locally
      await AsyncStorage.setItem(
        `candidates_${exam}_${centre}`,
        JSON.stringify(data)
      );

      return data;
    } catch (error) {
      console.error('Error downloading candidate data:', error);
      
      // Try to return cached data
      try {
        const cached = await AsyncStorage.getItem(`candidates_${exam}_${centre}`);
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
  }

  /**
   * Upload biometric verification data
   */
  async uploadBiometricData(records: BiometricRecord[]): Promise<boolean> {
    try {
      const session = await this.getOperatorSession();
      if (!session) throw new Error('No active session');

      // Call backend API instead of admin panel
      const response = await fetch(`${BACKEND_API}/api/biometric/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          operatorId: session.operatorId,
          exam: session.exam,
          centre: session.centre,
          records,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to upload biometric data');

      // Clear pending uploads
      await AsyncStorage.removeItem('pendingBiometricUploads');
      return true;
    } catch (error) {
      console.error('Error uploading biometric data:', error);
      
      // Queue for later upload
      await this.queueBiometricUpload(records);
      return false;
    }
  }

  /**
   * Queue biometric data for later upload (offline mode)
   */
  async queueBiometricUpload(records: BiometricRecord[]): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('pendingBiometricUploads');
      const queue = existing ? JSON.parse(existing) : [];
      
      await AsyncStorage.setItem(
        'pendingBiometricUploads',
        JSON.stringify([...queue, ...records])
      );
    } catch (error) {
      console.error('Error queuing biometric upload:', error);
    }
  }

  /**
   * Sync pending uploads when connection is restored
   */
  async syncPendingUploads(): Promise<boolean> {
    try {
      const pending = await AsyncStorage.getItem('pendingBiometricUploads');
      if (!pending) return true;

      const records = JSON.parse(pending);
      if (records.length === 0) return true;

      return await this.uploadBiometricData(records);
    } catch (error) {
      console.error('Error syncing pending uploads:', error);
      return false;
    }
  }

  /**
   * Get verification result for a candidate
   */
  async verifyCandidate(
    candidateId: string,
    biometricData: string
  ): Promise<{ match: boolean; percentage: number }> {
    try {
      const session = await this.getOperatorSession();
      if (!session) throw new Error('No active session');

      // Call backend API instead of admin panel
      const response = await fetch(`${BACKEND_API}/api/biometric/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          candidateId,
          biometricData,
          operatorId: session.operatorId,
        }),
      });

      if (!response.ok) throw new Error('Verification failed');

      return await response.json();
    } catch (error) {
      console.error('Error verifying candidate:', error);
      return { match: false, percentage: 0 };
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    lastSync: string;
    pendingRecords: number;
    syncInProgress: boolean;
  }> {
    try {
      const session = await this.getOperatorSession();
      if (!session) {
        return {
          lastSync: 'Never',
          pendingRecords: 0,
          syncInProgress: false,
        };
      }

      const pending = await AsyncStorage.getItem('pendingBiometricUploads');
      const lastSync = await AsyncStorage.getItem('lastSyncTime');

      return {
        lastSync: lastSync || 'Never',
        pendingRecords: pending ? JSON.parse(pending).length : 0,
        syncInProgress: false,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSync: 'Error',
        pendingRecords: 0,
        syncInProgress: false,
      };
    }
  }

  /**
   * Logout operator
   */
  async logout(): Promise<void> {
    try {
      const session = await this.getOperatorSession();
      if (session) {
        // Call backend API instead of admin panel
        await fetch(`${BACKEND_API}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        }).catch(() => {}); // Ignore errors
      }

      await AsyncStorage.removeItem('operatorSession');
      await AsyncStorage.removeItem('rememberMe');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

export const adminAPI = new AdminPanelAPI();
