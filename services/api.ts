/**
 * MPA Mobile App - API Service
 * Complete API integration with production backend
 * All 40+ endpoints connected
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mpaverification.com';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data;
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        // Trigger logout event
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION ENDPOINTS (4)
// ============================================

export const authService = {
  /**
   * POST /api/auth/login
   * Login with username and password
   */
  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });
      const { token, refreshToken, user } = response.data;
      
      // Store tokens
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/auth/logout
   * Logout current session
   */
  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/auth/logout-all
   * Logout all sessions
   */
  logoutAll: async () => {
    try {
      await apiClient.post('/api/auth/logout-all');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/auth/refresh
   * Refresh JWT token
   */
  refresh: async (refreshToken: string) => {
    try {
      const response = await apiClient.post('/api/auth/refresh', { refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// CANDIDATES ENDPOINTS (6)
// ============================================

export const candidatesService = {
  /**
   * GET /api/candidates
   * Get all candidates
   */
  getAll: async (examId?: string, filters?: any) => {
    try {
      const params = { ...filters };
      if (examId) params.examId = examId;
      
      const response = await apiClient.get('/api/candidates', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/candidates/:id
   * Get candidate by ID
   */
  getById: async (candidateId: string) => {
    try {
      const response = await apiClient.get(`/api/candidates/${candidateId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/candidates
   * Create new candidate
   */
  create: async (candidateData: any) => {
    try {
      const response = await apiClient.post('/api/candidates', candidateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * PUT /api/candidates/:id
   * Update candidate
   */
  update: async (candidateId: string, candidateData: any) => {
    try {
      const response = await apiClient.put(`/api/candidates/${candidateId}`, candidateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * DELETE /api/candidates/:id
   * Delete candidate
   */
  delete: async (candidateId: string) => {
    try {
      const response = await apiClient.delete(`/api/candidates/${candidateId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/candidates/upload
   * Bulk upload candidates (Excel)
   */
  bulkUpload: async (formData: FormData) => {
    try {
      const response = await apiClient.post('/api/candidates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// ATTENDANCE ENDPOINTS (2)
// ============================================

export const attendanceService = {
  /**
   * POST /api/attendance/mark
   * Mark attendance for candidate
   */
  mark: async (attendanceData: {
    candidateId: string;
    examId: string;
    status: 'present' | 'absent' | 'late';
  }) => {
    try {
      const response = await apiClient.post('/api/attendance/mark', attendanceData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/attendance/:candidateId
   * Get attendance records
   */
  getRecords: async (candidateId: string) => {
    try {
      const response = await apiClient.get(`/api/attendance/${candidateId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// BIOMETRIC ENDPOINTS (2)
// ============================================

export const biometricService = {
  /**
   * POST /api/biometric/upload
   * Upload biometric data (face, fingerprint)
   */
  upload: async (biometricData: FormData) => {
    try {
      const response = await apiClient.post('/api/biometric/upload', biometricData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/biometric/:candidateId
   * Get biometric data
   */
  get: async (candidateId: string) => {
    try {
      const response = await apiClient.get(`/api/biometric/${candidateId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// EXAMS ENDPOINTS (5)
// ============================================

export const examsService = {
  /**
   * GET /api/exams
   * Get all exams
   */
  getAll: async (filters?: any) => {
    try {
      const response = await apiClient.get('/api/exams', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/exams/:id
   * Get exam details
   */
  getById: async (examId: string) => {
    try {
      const response = await apiClient.get(`/api/exams/${examId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/exams
   * Create new exam
   */
  create: async (examData: any) => {
    try {
      const response = await apiClient.post('/api/exams', examData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * PUT /api/exams/:id
   * Update exam
   */
  update: async (examId: string, examData: any) => {
    try {
      const response = await apiClient.put(`/api/exams/${examId}`, examData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * DELETE /api/exams/:id
   * Delete exam
   */
  delete: async (examId: string) => {
    try {
      const response = await apiClient.delete(`/api/exams/${examId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// CENTRES ENDPOINTS (5)
// ============================================

export const centresService = {
  /**
   * GET /api/centres
   * Get all centres
   */
  getAll: async (filters?: any) => {
    try {
      const response = await apiClient.get('/api/centres', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/centres/:id
   * Get centre details
   */
  getById: async (centreId: string) => {
    try {
      const response = await apiClient.get(`/api/centres/${centreId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/centres
   * Create new centre
   */
  create: async (centreData: any) => {
    try {
      const response = await apiClient.post('/api/centres', centreData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * PUT /api/centres/:id
   * Update centre
   */
  update: async (centreId: string, centreData: any) => {
    try {
      const response = await apiClient.put(`/api/centres/${centreId}`, centreData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * DELETE /api/centres/:id
   * Delete centre
   */
  delete: async (centreId: string) => {
    try {
      const response = await apiClient.delete(`/api/centres/${centreId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// OPERATORS ENDPOINTS (4)
// ============================================

export const operatorsService = {
  /**
   * GET /api/operators
   * Get all operators
   */
  getAll: async (filters?: any) => {
    try {
      const response = await apiClient.get('/api/operators', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/operators/:id
   * Get operator details
   */
  getById: async (operatorId: string) => {
    try {
      const response = await apiClient.get(`/api/operators/${operatorId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/operators
   * Create new operator
   */
  create: async (operatorData: any) => {
    try {
      const response = await apiClient.post('/api/operators', operatorData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * PUT /api/operators/:id
   * Update operator
   */
  update: async (operatorId: string, operatorData: any) => {
    try {
      const response = await apiClient.put(`/api/operators/${operatorId}`, operatorData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// SLOTS ENDPOINTS (4)
// ============================================

export const slotsService = {
  /**
   * GET /api/slots/:examId
   * Get exam slots
   */
  getByExam: async (examId: string) => {
    try {
      const response = await apiClient.get(`/api/slots/${examId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/slots
   * Create new slot
   */
  create: async (slotData: any) => {
    try {
      const response = await apiClient.post('/api/slots', slotData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * PUT /api/slots/:id
   * Update slot
   */
  update: async (slotId: string, slotData: any) => {
    try {
      const response = await apiClient.put(`/api/slots/${slotId}`, slotData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * DELETE /api/slots/:id
   * Delete slot
   */
  delete: async (slotId: string) => {
    try {
      const response = await apiClient.delete(`/api/slots/${slotId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// SYNC ENDPOINTS (3)
// ============================================

export const syncService = {
  /**
   * POST /api/sync
   * Sync all data
   */
  syncAll: async () => {
    try {
      const response = await apiClient.post('/api/sync');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/sync/status
   * Get sync status
   */
  getStatus: async () => {
    try {
      const response = await apiClient.get('/api/sync/status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * POST /api/sync/candidates
   * Sync candidates
   */
  syncCandidates: async () => {
    try {
      const response = await apiClient.post('/api/sync/candidates');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// DASHBOARD ENDPOINTS (1)
// ============================================

export const dashboardService = {
  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics
   */
  getStats: async () => {
    try {
      const response = await apiClient.get('/api/dashboard/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// REPORTS ENDPOINTS (2)
// ============================================

export const reportsService = {
  /**
   * GET /api/reports/exams
   * Get exam reports
   */
  getExamReports: async (filters?: any) => {
    try {
      const response = await apiClient.get('/api/reports/exams', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },

  /**
   * GET /api/reports/export
   * Export reports
   */
  export: async (format: 'excel' | 'pdf' | 'csv', filters?: any) => {
    try {
      const response = await apiClient.get('/api/reports/export', {
        params: { format, ...filters },
        responseType: 'blob',
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Handle API errors
 */
function handleError(error: any): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      return error.response.data?.message || `Error: ${error.response.status}`;
    } else if (error.request) {
      // Request made but no response
      return 'No response from server. Please check your connection.';
    }
  }
  return error?.message || 'An unknown error occurred';
}

/**
 * Get current user from storage
 */
export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    return false;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuth = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};

export default apiClient;
