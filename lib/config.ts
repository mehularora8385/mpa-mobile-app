/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints and URLs
 */

export const API_CONFIG = {
  BASE_URL: 'http://13.204.65.158/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/operators/login',
    LOGOUT: '/operators/logout',
    REFRESH: '/operators/refresh-token',
    CHECK_DUPLICATE: '/operators/check-duplicate',
  },
  // Exams
  EXAMS: {
    LIST: '/exams',
    GET: (id: string) => `/exams/${id}`,
    CREATE: '/exams',
    UPDATE: (id: string) => `/exams/${id}`,
    DELETE: (id: string) => `/exams/${id}`,
  },
  // Candidates
  CANDIDATES: {
    LIST: '/candidates',
    GET: (id: string) => `/candidates/${id}`,
    CREATE: '/candidates',
    UPDATE: (id: string) => `/candidates/${id}`,
  },
  // Attendance
  ATTENDANCE: {
    LIST: '/attendance',
    CREATE: '/attendance',
    UPDATE: (id: string) => `/attendance/${id}`,
  },
  // Biometric
  BIOMETRIC: {
    VERIFY: '/biometric/verify',
    REVERIFY: '/biometric/reverify',
  },
  // Sync
  SYNC: {
    TRIGGER: '/sync/trigger',
    STATUS: '/sync/status',
  },
  // Logs
  LOGS: {
    GET: '/logs',
  },
  // Backup
  BACKUP: {
    TRIGGER: '/backup/trigger',
  },
};

/**
 * Build full API URL
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

/**
 * Get authorization header
 */
export function getAuthHeader(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
