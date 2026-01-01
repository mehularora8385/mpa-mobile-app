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
    this.mockOperators.set('9730018733', {
      operatorId: 'OP001',
      operatorName: 'Mehul Arora',
      mobileNumber: '9730018733',
      aadhaarNumber: '659999999978',
      password: '659999999978',
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

  async register(data: OperatorRegistration): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (this.mockOperators.has(data.mobileNumber)) {
            reject(new Error('Operator with this mobile number already exists'));
            return;
          }

          const operatorId = `OP${String(this.mockOperators.size + 1).padStart(3, '0')}`;
          this.mockOperators.set(data.mobileNumber, {
            operatorId,
            operatorName: data.operatorName,
            mobileNumber: data.mobileNumber,
            aadhaarNumber: data.aadhaarNumber,
            password: data.aadhaarNumber,
            selfieUri: data.selfieUri,
            createdAt: new Date().toISOString(),
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      }, 1000);
    });
  }

  async login(credentials: any): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (credentials.operatorName && credentials.mobileNumber && credentials.aadhaarNumber) {
            const operatorId = this.mockOperators.has(credentials.mobileNumber) 
              ? this.mockOperators.get(credentials.mobileNumber).operatorId
              : `OP${String(this.mockOperators.size + 1).padStart(3, '0')}`;

            this.mockOperators.set(credentials.mobileNumber, {
              operatorId,
              operatorName: credentials.operatorName,
              mobileNumber: credentials.mobileNumber,
              aadhaarNumber: credentials.aadhaarNumber,
              password: credentials.aadhaarNumber,
              selfieUri: credentials.selfieUri,
              createdAt: new Date().toISOString(),
            });

            const session: OperatorSession = {
              operatorId,
              operatorName: credentials.operatorName,
              mobileNumber: credentials.mobileNumber,
              token: `mock-token-${Date.now()}`,
              refreshToken: `mock-refresh-${Date.now()}`,
              expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            };

            // Save session to secure store
            try {
              SecureStore.setItem(this.sessionKey, JSON.stringify(session));
            } catch (e) {
              console.log('SecureStore not available in web, skipping save');
            }

            resolve({ success: true, data: session });
            return;
          }

          const operator = this.mockOperators.get(credentials.operatorIdOrMobile);

          if (!operator) {
            reject(new Error('Operator not found'));
            return;
          }

          if (operator.password !== credentials.password) {
            reject(new Error('Invalid password'));
            return;
          }

          const session: OperatorSession = {
            operatorId: operator.operatorId,
            operatorName: operator.operatorName,
            mobileNumber: operator.mobileNumber,
            token: `mock-token-${Date.now()}`,
            refreshToken: `mock-refresh-${Date.now()}`,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };

          // Save session to secure store
          try {
            SecureStore.setItem(this.sessionKey, JSON.stringify(session));
          } catch (e) {
            console.log('SecureStore not available in web, skipping save');
          }

          resolve(session);
        } catch (error) {
          reject(error);
        }
      }, 1000);
    });
  }

  async getSession(): Promise<OperatorSession | null> {
    try {
      const sessionStr = SecureStore.getItem(this.sessionKey);
      if (!sessionStr) return null;
      return JSON.parse(sessionStr);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      SecureStore.setItem(this.sessionKey, '');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async refreshToken(): Promise<OperatorSession> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const session: OperatorSession = {
            operatorId: 'OP001',
            operatorName: 'Test Operator',
            mobileNumber: '9730018733',
            token: `mock-token-${Date.now()}`,
            refreshToken: `mock-refresh-${Date.now()}`,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };

          try {
            SecureStore.setItem(this.sessionKey, JSON.stringify(session));
          } catch (e) {
            console.log('SecureStore not available in web, skipping save');
          }

          resolve(session);
        } catch (error) {
          reject(error);
        }
      }, 500);
    });
  }
}

export const mockAuthService = MockAuthService.getInstance();
