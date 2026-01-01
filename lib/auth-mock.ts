/**
 * Mock Authentication Service
 * Used for local development and testing
 * Replace with real API calls when backend is ready
 */

import * as SecureStore from 'expo-secure-store';

export interface OperatorSession {
  operatorId: string;
  operatorName: string;
  mobileNumber: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

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

class MockAuthService {
  private static instance: MockAuthService;
  private sessionKey = 'operator_session_mock';
  private operatorsKey = 'operators_mock';

  // Mock data storage
  private mockOperators: Map<string, any> = new Map();

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService();
    }
    return MockAuthService.instance;
  }

  private initializeMockData() {
    // Add some test operators
    this.mockOperators.set('9730018733', {
      operatorId: 'OP001',
      operatorName: 'Mehul Arora',
      mobileNumber: '9730018733',
      aadhaarNumber: '659999999978',
      password: '659999999978', // Using aadhaar as password
      selfieUri: 'mock-selfie-uri',
      createdAt: new Date().toISOString(),
    });

    this.mockOperators.set('9876543210', {
      operatorId: 'OP002',
      operatorName: 'Test Operator',
      mobileNumber: '9876543210',
      aadhaarNumber: '123456789012',
      password: '123456789012',
      selfieUri: 'mock-selfie-uri',
      createdAt: new Date().toISOString(),
    });
  }

  // Register a new operator
  async register(data: OperatorRegistration): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Check if operator already exists
          if (this.mockOperators.has(data.mobileNumber)) {
            reject(new Error('Operator with this mobile number already exists'));
            return;
          }

          // Create new operator
          const operatorId = `OP${String(this.mockOperators.size + 1).padStart(3, '0')}`;
          this.mockOperators.set(data.mobileNumber, {
            operatorId,
            operatorName: data.operatorName,
            mobileNumber: data.mobileNumber,
            aadhaarNumber: data.aadhaarNumber,
            password: data.aadhaarNumber, // Using aadhaar as password
            selfieUri: data.selfieUri,
            createdAt: new Date().toISOString(),
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      }, 1000); // Simulate network delay
    });
  }

  // Login with credentials
  async login(credentials: OperatorCredentials): Promise<OperatorSession> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const operator = this.mockOperators.get(credentials.operatorIdOrMobile);

          if (!operator) {
            reject(new Error('Operator not found'));
            return;
          }

          if (operator.password !== credentials.password) {
            reject(new Error('Invalid password'));
            return;
          }

          // Create session
          const session: OperatorSession = {
            operatorId: operator.operatorId,
            operatorName: operator.operatorName,
            mobileNumber: operator.mobileNumber,
            token: `mock-token-${Date.now()}`,
            refreshToken: `mock-refresh-token-${Date.now()}`,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          };

          // Store session
          SecureStore.setItemAsync(this.sessionKey, JSON.stringify(session)).catch(console.error);

          resolve(session);
        } catch (error) {
          reject(error);
        }
      }, 1500); // Simulate network delay
    });
  }

  // Get current session
  async getSession(): Promise<OperatorSession | null> {
    try {
      const sessionData = await SecureStore.getItemAsync(this.sessionKey);
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.sessionKey);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  // Check if operator is logged in
  async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    if (!session) return false;

    // Check if token is expired
    if (session.expiresAt < Date.now()) {
      await this.logout();
      return false;
    }

    return true;
  }

  // Get all mock operators (for debugging)
  getAllOperators() {
    return Array.from(this.mockOperators.values());
  }
}

export const mockAuthService = MockAuthService.getInstance();
