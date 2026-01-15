import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://13.204.65.158/api/v1';
const API_TIMEOUT = 30000; // 30 seconds

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiError {
  code: string;
  message: string;
  status: number;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear and redirect to login
          await this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async login(operatorId: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/auth/login', {
        operatorId,
        password,
      });
      
      if (response.data.token) {
        await this.setToken(response.data.token);
        this.token = response.data.token;
      }
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.client.post('/api/auth/logout');
      await this.clearToken();
      this.token = null;
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Candidate Methods
  async fetchCandidates(examId: string, centreCode: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/api/candidates', {
        params: { examId, centreCode },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async downloadCandidates(examId: string, centreCode: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/exams/download-candidates', {
        examId,
        centreCode,
        password,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCandidateByRollNo(rollNo: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/api/candidates/${rollNo}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Attendance Methods
  async markAttendance(rollNo: string, present: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/attendance/mark', {
        rollNo,
        present,
        timestamp: new Date().toISOString(),
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Biometric Methods
  async uploadBiometric(data: {
    rollNo: string;
    faceImage: string; // Base64
    fingerprintTemplate: string;
    omrSerialNumber: string;
    matchPercentage: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/biometric/upload', data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyCandidate(rollNo: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/candidates/verify', { rollNo });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Sync Methods
  async getSyncStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/api/sync/status');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async uploadPendingRecords(records: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/sync/upload', { records });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Exam Methods
  async getAvailableExams(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/api/exams/available');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCentres(examId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/api/centres', {
        params: { examId },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Token Management
  private async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  private async getToken(): Promise<string | null> {
    try {
      if (this.token) return this.token;
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  private async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  // Error Handling
  private handleError(error: any): ApiResponse<any> {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      return {
        success: false,
        error: axiosError.response.statusText,
        message: (axiosError.response.data as any)?.message || 'An error occurred',
      };
    } else if (axiosError.request) {
      return {
        success: false,
        error: 'Network Error',
        message: 'No response from server. Please check your connection.',
      };
    } else {
      return {
        success: false,
        error: 'Error',
        message: axiosError.message || 'An unexpected error occurred',
      };
    }
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export type { ApiResponse, ApiError };
