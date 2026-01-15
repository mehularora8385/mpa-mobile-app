import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface OperatorSession {
  operatorId: string;
  operatorName: string;
  mobileNo: string;
  aadhaar: string;
  email?: string;
  centre: string;
  exam: string;
  token: string;
  deviceId: string;
  loginTime: string;
  selfiePhoto: string; // base64
  lastSyncTime?: string;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDevice?: string;
  existingExam?: string;
  message?: string;
}

class EnhancedAuthService {
  private readonly SESSION_KEY = 'operatorSession';
  private readonly DEVICE_ID_KEY = 'deviceId';
  private readonly ACTIVE_OPERATORS_KEY = 'activeOperators';

  /**
   * Generate unique device ID
   */
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(this.DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `device_${Date.now()}`;
    }
  }

  /**
   * Check for duplicate logins
   * - Same operator on different device for same exam = DUPLICATE
   * - Same operator on same device for same exam = ALLOWED (refresh)
   * - Same operator on different exam = ALLOWED
   */
  async checkDuplicate(
    operatorId: string,
    examId: string,
    mobileNo: string
  ): Promise<DuplicateCheckResult> {
    try {
      const deviceId = await this.getDeviceId();
      
      // Check backend for active sessions
      const response = await fetch('http://13.204.65.158/api/v1/api/operators/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId,
          examId,
          mobileNo,
          deviceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check duplicate');
      }

      const data = await response.json();
      
      if (data.isDuplicate) {
        return {
          isDuplicate: true,
          existingDevice: data.existingDevice,
          existingExam: data.existingExam,
          message: `Operator already logged in on device: ${data.existingDevice} for exam: ${data.existingExam}`,
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicate:', error);
      // If backend is unreachable, check locally
      return await this.checkLocalDuplicate(operatorId, examId);
    }
  }

  /**
   * Check local duplicate (offline mode)
   */
  private async checkLocalDuplicate(
    operatorId: string,
    examId: string
  ): Promise<DuplicateCheckResult> {
    try {
      const activeOps = await AsyncStorage.getItem(this.ACTIVE_OPERATORS_KEY);
      if (!activeOps) {
        return { isDuplicate: false };
      }

      const operators = JSON.parse(activeOps);
      const duplicate = operators.find(
        (op: any) => op.operatorId === operatorId && op.exam === examId
      );

      if (duplicate) {
        return {
          isDuplicate: true,
          existingDevice: duplicate.deviceId,
          existingExam: duplicate.exam,
          message: `Operator already logged in for this exam`,
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking local duplicate:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Validate Aadhaar number (12 digits)
   */
  validateAadhaar(aadhaar: string): boolean {
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  }

  /**
   * Validate mobile number (10 digits)
   */
  validateMobileNo(mobileNo: string): boolean {
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobileNo.replace(/\s/g, ''));
  }

  /**
   * Validate operator name (at least 3 characters)
   */
  validateName(name: string): boolean {
    return name.trim().length >= 3;
  }

  /**
   * Mask Aadhaar number (show first 2 and last 2 digits)
   */
  maskAadhaar(aadhaar: string): string {
    if (!this.validateAadhaar(aadhaar)) return aadhaar;
    const clean = aadhaar.replace(/\s/g, '');
    return `${clean.substring(0, 2)}****${clean.substring(10)}`;
  }

  /**
   * Login operator with selfie
   */
  async login(
    operatorName: string,
    mobileNo: string,
    aadhaar: string,
    examId: string,
    centreId: string,
    selfiePhoto: string // base64
  ): Promise<{ success: boolean; session?: OperatorSession; error?: string }> {
    try {
      // Validate inputs
      if (!this.validateName(operatorName)) {
        return { success: false, error: 'Name must be at least 3 characters' };
      }

      if (!this.validateMobileNo(mobileNo)) {
        return { success: false, error: 'Mobile number must be 10 digits' };
      }

      if (!this.validateAadhaar(aadhaar)) {
        return { success: false, error: 'Aadhaar must be 12 digits' };
      }

      // Check for duplicates
      const duplicateCheck = await this.checkDuplicate(mobileNo, examId, mobileNo);
      if (duplicateCheck.isDuplicate) {
        return { success: false, error: duplicateCheck.message };
      }

      // Call backend login API
      const deviceId = await this.getDeviceId();
      const response = await fetch('http://13.204.65.158/api/v1/api/operators/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorName,
          mobileNo,
          aadhaar,
          examId,
          centreId,
          deviceId,
          selfiePhoto,
          loginTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Login failed' };
      }

      const data = await response.json();
      const session: OperatorSession = {
        operatorId: data.operatorId || mobileNo,
        operatorName,
        mobileNo,
        aadhaar,
        email: data.email,
        centre: centreId,
        exam: examId,
        token: data.token,
        deviceId,
        loginTime: new Date().toISOString(),
        selfiePhoto,
        lastSyncTime: new Date().toISOString(),
      };

      // Save session locally
      await this.saveSession(session);

      // Add to active operators list
      await this.addActiveOperator(session);

      return { success: true, session };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Save session to local storage
   */
  private async saveSession(session: OperatorSession): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      // Also save to secure storage if available
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.setItemAsync(this.SESSION_KEY, JSON.stringify(session));
        } catch (e) {
          console.warn('SecureStore not available, using AsyncStorage only');
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  /**
   * Add operator to active operators list
   */
  private async addActiveOperator(session: OperatorSession): Promise<void> {
    try {
      const activeOps = await AsyncStorage.getItem(this.ACTIVE_OPERATORS_KEY);
      let operators = activeOps ? JSON.parse(activeOps) : [];
      
      // Remove if already exists
      operators = operators.filter(
        (op: any) => !(op.operatorId === session.operatorId && op.exam === session.exam)
      );
      
      // Add new operator
      operators.push({
        operatorId: session.operatorId,
        exam: session.exam,
        deviceId: session.deviceId,
        loginTime: session.loginTime,
      });

      await AsyncStorage.setItem(this.ACTIVE_OPERATORS_KEY, JSON.stringify(operators));
    } catch (error) {
      console.error('Error adding active operator:', error);
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<OperatorSession | null> {
    try {
      const session = await AsyncStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Logout operator
   */
  async logout(examId?: string): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) {
        return true;
      }

      // Call backend logout API
      try {
        await fetch('http://13.204.65.158/api/v1/api/operators/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            operatorId: session.operatorId,
            examId: examId || session.exam,
            deviceId: session.deviceId,
            logoutTime: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.warn('Backend logout failed, clearing local session:', error);
      }

      // Clear local session
      await AsyncStorage.removeItem(this.SESSION_KEY);
      
      // Remove from active operators
      const activeOps = await AsyncStorage.getItem(this.ACTIVE_OPERATORS_KEY);
      if (activeOps) {
        let operators = JSON.parse(activeOps);
        operators = operators.filter(
          (op: any) => !(op.operatorId === session.operatorId && op.exam === (examId || session.exam))
        );
        await AsyncStorage.setItem(this.ACTIVE_OPERATORS_KEY, JSON.stringify(operators));
      }

      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  /**
   * Get all active operators (for admin panel)
   */
  async getActiveOperators(): Promise<any[]> {
    try {
      const activeOps = await AsyncStorage.getItem(this.ACTIVE_OPERATORS_KEY);
      return activeOps ? JSON.parse(activeOps) : [];
    } catch (error) {
      console.error('Error getting active operators:', error);
      return [];
    }
  }

  /**
   * Check if operator is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }

  /**
   * Refresh session token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) {
        return false;
      }

      const response = await fetch('http://13.204.65.158/api/v1/api/operators/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      session.token = data.token;
      await this.saveSession(session);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
}

export const enhancedAuthService = new EnhancedAuthService();
