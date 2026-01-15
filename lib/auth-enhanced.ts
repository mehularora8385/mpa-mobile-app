import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

// Enhanced types for new login flow
export interface EnhancedOperatorSession {
  operatorId: string;
  operatorName: string;
  mobileNumber: string;
  aadhaarNumber: string; // masked
  selfieUri: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
  loginTime: number;
  examId?: string;
  dataType?: 'mock' | 'exam';
}

export interface LoginValidation {
  isAllowed: boolean;
  reason?: string;
  existingSession?: EnhancedOperatorSession;
}

// Enhanced Auth Service
class EnhancedAuthService {
  private static instance: EnhancedAuthService;
  private sessionKey = 'enhanced_operator_session';
  private loginHistoryKey = 'login_history';

  private constructor() {}

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  /**
   * Validate if operator can login
   * Rules:
   * 1. One operator per mobile per exam
   * 2. Can login for both mock and exam of same exam
   * 3. Cannot login twice with same mobile for different exams
   */
  async validateLogin(
    mobileNumber: string,
    examId: string,
    dataType: 'mock' | 'exam'
  ): Promise<LoginValidation> {
    try {
      // Get login history
      const history = await this.getLoginHistory();

      // Find existing login for this mobile + exam
      const existingLogin = history.find(
        log => log.mobileNumber === mobileNumber && log.examId === examId
      );

      if (existingLogin) {
        // Check if already logged in for exam (not mock)
        if (existingLogin.dataType === 'exam' && dataType === 'exam') {
          return {
            isAllowed: false,
            reason: 'Already logged in for exam with this mobile number',
            existingSession: existingLogin,
          };
        }

        // Allow mock + exam for same exam
        return {
          isAllowed: true,
        };
      }

      // Check if mobile is used for different exam
      const differentExamLogin = history.find(
        log => log.mobileNumber === mobileNumber && log.examId !== examId
      );

      if (differentExamLogin) {
        return {
          isAllowed: false,
          reason: 'Mobile number already used for different exam',
          existingSession: differentExamLogin,
        };
      }

      return {
        isAllowed: true,
      };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isAllowed: true, // Allow on error
      };
    }
  }

  /**
   * Create enhanced session with selfie and aadhaar
   */
  async createSession(
    operatorId: string,
    operatorName: string,
    mobileNumber: string,
    aadhaarNumber: string,
    selfieUri: string,
    examId: string,
    dataType: 'mock' | 'exam',
    token: string,
    refreshToken: string
  ): Promise<EnhancedOperatorSession> {
    const session: EnhancedOperatorSession = {
      operatorId,
      operatorName,
      mobileNumber,
      aadhaarNumber: this.maskAadhaar(aadhaarNumber),
      selfieUri,
      token,
      refreshToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      loginTime: Date.now(),
      examId,
      dataType,
    };

    // Save session
    await SecureStore.setItemAsync(this.sessionKey, JSON.stringify(session));

    // Add to login history
    await this.addLoginHistory(session);

    return session;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<EnhancedOperatorSession | null> {
    try {
      const sessionStr = await SecureStore.getItemAsync(this.sessionKey);
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr) as EnhancedOperatorSession;

      // Check if expired
      if (session.expiresAt < Date.now()) {
        await this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Clear session on logout
   */
  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.sessionKey);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Get login history
   */
  private async getLoginHistory(): Promise<EnhancedOperatorSession[]> {
    try {
      const historyStr = await SecureStore.getItemAsync(this.loginHistoryKey);
      if (!historyStr) return [];

      return JSON.parse(historyStr) as EnhancedOperatorSession[];
    } catch (error) {
      console.error('Error getting login history:', error);
      return [];
    }
  }

  /**
   * Add to login history
   */
  private async addLoginHistory(session: EnhancedOperatorSession): Promise<void> {
    try {
      const history = await this.getLoginHistory();
      history.push(session);

      // Keep only last 100 logins
      if (history.length > 100) {
        history.shift();
      }

      await SecureStore.setItemAsync(this.loginHistoryKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding login history:', error);
    }
  }

  /**
   * Mask aadhaar number
   */
  private maskAadhaar(aadhaar: string): string {
    if (aadhaar.length <= 4) return aadhaar;
    return aadhaar.slice(0, 2) + '*'.repeat(aadhaar.length - 4) + aadhaar.slice(-2);
  }

  /**
   * Check if operator is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Get operator's active exams
   */
  async getActiveExams(): Promise<string[]> {
    try {
      const history = await this.getLoginHistory();
      const currentSession = await this.getSession();

      if (!currentSession) return [];

      // Get all exams for this mobile
      const exams = history
        .filter(log => log.mobileNumber === currentSession.mobileNumber)
        .map(log => log.examId)
        .filter((id): id is string => id !== undefined);

      return [...new Set(exams)];
    } catch (error) {
      console.error('Error getting active exams:', error);
      return [];
    }
  }
}

export const enhancedAuthService = EnhancedAuthService.getInstance();
