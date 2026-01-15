import * as Sentry from 'sentry-expo';
import { offlineDatabase } from './offline-database';
import { encryptionService } from './encryption-service';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  details: any;
  userId?: string;
  deviceInfo?: any;
  stackTrace?: string;
}

class LoggingService {
  private userId: string | null = null;

  /**
   * Initialize logging service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
        enableInExpoDevelopment: true,
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development',
      });

      console.log('Logging service initialized');
    } catch (error) {
      console.error('Logging service initialization error:', error);
    }
  }

  /**
   * Set current user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    Sentry.setUser({ id: userId });
  }

  /**
   * Log activity
   */
  async logActivity(
    action: string,
    details: any,
    level: LogLevel = LogLevel.INFO
  ): Promise<void> {
    try {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        action,
        details: encryptionService.sanitizeSensitiveData(details),
        userId: this.userId || 'unknown',
        deviceInfo: await this.getDeviceInfo(),
      };

      // Save to local database
      await offlineDatabase.logActivity(action, details, this.userId || 'unknown');

      // Log to console in development
      console.log(`[${level}] ${action}:`, logEntry.details);

      // Send to Sentry for errors and critical issues
      if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
        Sentry.captureMessage(action, level.toLowerCase() as any);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Log error with context
   */
  logError(error: Error, context: string, additionalData?: any): void {
    try {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        context,
        additionalData: encryptionService.sanitizeSensitiveData(additionalData),
        timestamp: new Date().toISOString(),
      };

      // Log to Sentry
      Sentry.captureException(error, {
        tags: {
          context,
        },
        extra: errorDetails,
      });

      // Log to console
      console.error(`[ERROR] ${context}:`, errorDetails);

      // Save to database
      this.logActivity(`Error: ${context}`, errorDetails, LogLevel.ERROR).catch(
        (err) => console.error('Failed to log error:', err)
      );
    } catch (err) {
      console.error('Error logging exception:', err);
    }
  }

  /**
   * Log warning
   */
  async logWarning(message: string, details?: any): Promise<void> {
    await this.logActivity(message, details, LogLevel.WARNING);
  }

  /**
   * Log debug information
   */
  async logDebug(message: string, details?: any): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      await this.logActivity(message, details, LogLevel.DEBUG);
    }
  }

  /**
   * Log critical issue
   */
  async logCritical(message: string, details?: any): Promise<void> {
    await this.logActivity(message, details, LogLevel.CRITICAL);
    Sentry.captureMessage(message, 'fatal');
  }

  /**
   * Log API request
   */
  async logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    error?: Error
  ): Promise<void> {
    const details = {
      method,
      endpoint,
      statusCode,
      duration: `${duration}ms`,
      error: error?.message,
    };

    const level = statusCode >= 400 ? LogLevel.WARNING : LogLevel.DEBUG;
    await this.logActivity(`API Request: ${method} ${endpoint}`, details, level);
  }

  /**
   * Log biometric operation
   */
  async logBiometricOperation(
    operation: string,
    result: any,
    error?: Error
  ): Promise<void> {
    const details = {
      operation,
      result: encryptionService.sanitizeSensitiveData(result),
      error: error?.message,
      timestamp: new Date().toISOString(),
    };

    const level = error ? LogLevel.WARNING : LogLevel.INFO;
    await this.logActivity(`Biometric: ${operation}`, details, level);
  }

  /**
   * Log sync operation
   */
  async logSyncOperation(
    recordType: string,
    recordCount: number,
    success: boolean,
    error?: Error
  ): Promise<void> {
    const details = {
      recordType,
      recordCount,
      success,
      error: error?.message,
      timestamp: new Date().toISOString(),
    };

    const level = success ? LogLevel.INFO : LogLevel.WARNING;
    await this.logActivity(`Sync: ${recordType}`, details, level);
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: string,
    details: any,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    const securityDetails = {
      eventType,
      severity,
      details: encryptionService.sanitizeSensitiveData(details),
      timestamp: new Date().toISOString(),
    };

    const level = severity === 'high' ? LogLevel.CRITICAL : LogLevel.WARNING;
    await this.logActivity(`Security: ${eventType}`, securityDetails, level);

    // Always send security events to Sentry
    Sentry.captureMessage(`Security Event: ${eventType}`, 'warning');
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      // This would require expo-device package
      return {
        platform: 'mobile',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Create performance monitoring
   */
  startPerformanceMonitoring(operationName: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.logActivity(`Performance: ${operationName}`, { duration: `${duration}ms` }, LogLevel.DEBUG).catch(
        (err) => console.error('Failed to log performance:', err)
      );
    };
  }

  /**
   * Export logs for debugging
   */
  async exportLogs(): Promise<string> {
    try {
      const logs = await offlineDatabase.getActivityLogs(1000);
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Error exporting logs:', error);
      return '';
    }
  }

  /**
   * Clear old logs
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      await offlineDatabase.enforceDataRetention(daysToKeep);
      await this.logActivity('Logs cleared', { daysToKeep }, LogLevel.INFO);
    } catch (error) {
      console.error('Error clearing old logs:', error);
    }
  }
}

export const loggingService = new LoggingService();
