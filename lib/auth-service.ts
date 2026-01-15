import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

// Types
export interface OperatorCredentials {
  operatorIdOrMobile: string;
  password: string;
}

export interface OperatorRegistration {
  operatorName: string;
  mobileNumber: string;
  aadhaarNumber: string;
  selfieUri: string;
}

export interface OperatorSession {
  operatorId: string;
  operatorName: string;
  mobileNumber: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BiometricSettings {
  enabled: boolean;
  type: 'faceId' | 'fingerprint' | null;
  templateId?: string;
}

// Validation schemas
const credentialsSchema = z.object({
  operatorIdOrMobile: z.string().min(1, 'Operator ID or Mobile is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registrationSchema = z.object({
  operatorName: z.string().min(2, 'Name must be at least 2 characters'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  selfieUri: z.string().url('Invalid selfie URI'),
});

// Auth Service
class AuthService {
  private static instance: AuthService;
  private sessionKey = 'operator_session';
  private biometricSettingsKey = 'biometric_settings';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login with credentials
  async login(credentials: OperatorCredentials): Promise<OperatorSession> {
    try {
      // Validate input
      const validated = credentialsSchema.parse(credentials);

      // Call backend API
      const response = await fetch('https://api.examination-system.com/api/auth/operator/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const session: OperatorSession = {
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        mobileNumber: data.mobileNumber,
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      // Store session securely
      await this.saveSession(session);

      return session;
    } catch (error) {
      throw new Error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Register new operator
  async register(registration: OperatorRegistration): Promise<OperatorSession> {
    try {
      // Validate input
      const validated = registrationSchema.parse(registration);

      // Convert selfie to base64
      const selfieBase64 = await this.fileToBase64(validated.selfieUri);

      // Call backend API
      const response = await fetch('https://api.examination-system.com/api/auth/operator/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...validated,
          selfie: selfieBase64,
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      const session: OperatorSession = {
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        mobileNumber: data.mobileNumber,
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      // Store session securely
      await this.saveSession(session);

      return session;
    } catch (error) {
      throw new Error(`Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify OTP
  async verifyOTP(mobileNumber: string, otp: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.examination-system.com/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      return response.ok;
    } catch (error) {
      throw new Error(`OTP verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get current session
  async getSession(): Promise<OperatorSession | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(this.sessionKey);
      if (!sessionJson) return null;

      const session: OperatorSession = JSON.parse(sessionJson);

      // Check if token is expired
      if (session.expiresAt < Date.now()) {
        // Try to refresh token
        const refreshed = await this.refreshToken(session.refreshToken);
        if (refreshed) {
          return refreshed;
        }
        // If refresh fails, clear session
        await this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Refresh token
  private async refreshToken(refreshToken: string): Promise<OperatorSession | null> {
    try {
      const response = await fetch('https://api.examination-system.com/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const session: OperatorSession = {
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        mobileNumber: data.mobileNumber,
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      await this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  // Save session securely
  private async saveSession(session: OperatorSession): Promise<void> {
    try {
      // Store token in secure storage
      await SecureStore.setItemAsync('operator_token', session.token);
      await SecureStore.setItemAsync('operator_refresh_token', session.refreshToken);

      // Store session info in regular storage
      await AsyncStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const session = await this.getSession();
      if (session) {
        // Call logout API
        await fetch('https://api.examination-system.com/api/auth/operator/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Clear stored data
      await AsyncStorage.removeItem(this.sessionKey);
      await SecureStore.deleteItemAsync('operator_token');
      await SecureStore.deleteItemAsync('operator_refresh_token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Biometric settings
  async getBiometricSettings(): Promise<BiometricSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.biometricSettingsKey);
      if (!settingsJson) {
        return { enabled: false, type: null };
      }
      return JSON.parse(settingsJson);
    } catch (error) {
      console.error('Error getting biometric settings:', error);
      return { enabled: false, type: null };
    }
  }

  async saveBiometricSettings(settings: BiometricSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.biometricSettingsKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving biometric settings:', error);
      throw error;
    }
  }

  // Helper: Convert file to base64
  private async fileToBase64(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Error converting file to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get authorization header
  async getAuthHeader(): Promise<{ Authorization: string } | null> {
    try {
      const token = await SecureStore.getItemAsync('operator_token');
      if (!token) return null;
      return { Authorization: `Bearer ${token}` };
    } catch (error) {
      console.error('Error getting auth header:', error);
      return null;
    }
  }
}

export const authService = AuthService.getInstance();
