/**
 * Configuration Service for Mobile App
 * Manages environment variables, API URLs, and app settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableOfflineMode: boolean;
  syncIntervalMs: number;
  maxRetries: number;
  requestTimeoutMs: number;
}

class ConfigService {
  private config: AppConfig;
  private readonly CONFIG_KEY = 'APP_CONFIG';
  private readonly DEFAULT_CONFIG: AppConfig = {
    apiUrl: 'http://13.204.143.245:3000',
    wsUrl: 'http://13.204.143.245:3000',
    appName: 'MPA BIO VERIFICATION',
    appVersion: '1.0.0',
    environment: 'production',
    logLevel: 'info',
    enableOfflineMode: true,
    syncIntervalMs: 30000,
    maxRetries: 3,
    requestTimeoutMs: 15000,
  };

  constructor() {
    this.config = { ...this.DEFAULT_CONFIG };
  }

  /**
   * Initialize configuration from environment or storage
   */
  async initialize(): Promise<void> {
    try {
      console.log('⚙️ Initializing configuration...');

      // Try to load from storage
      const storedConfig = await AsyncStorage.getItem(this.CONFIG_KEY);
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        this.config = { ...this.DEFAULT_CONFIG, ...parsed };
        console.log('✅ Configuration loaded from storage');
      } else {
        // Use environment variables or defaults
        this.config = {
          ...this.DEFAULT_CONFIG,
          apiUrl: process.env.REACT_APP_API_URL || this.DEFAULT_CONFIG.apiUrl,
          wsUrl: process.env.REACT_APP_WS_URL || this.DEFAULT_CONFIG.wsUrl,
          environment: (process.env.REACT_APP_ENV as any) || 'production',
          logLevel: (process.env.REACT_APP_LOG_LEVEL as any) || 'info',
        };
        console.log('✅ Configuration initialized from environment');
      }

      // Log current configuration
      this.logConfig();
    } catch (error) {
      console.error('❌ Failed to initialize configuration:', error);
      this.config = { ...this.DEFAULT_CONFIG };
    }
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Set API URL
   */
  async setApiUrl(url: string): Promise<void> {
    try {
      this.config.apiUrl = url;
      await this.saveConfig();
      console.log(`✅ API URL updated to: ${url}`);
    } catch (error) {
      console.error('❌ Failed to set API URL:', error);
      throw error;
    }
  }

  /**
   * Get WebSocket URL
   */
  getWsUrl(): string {
    return this.config.wsUrl;
  }

  /**
   * Set WebSocket URL
   */
  async setWsUrl(url: string): Promise<void> {
    try {
      this.config.wsUrl = url;
      await this.saveConfig();
      console.log(`✅ WebSocket URL updated to: ${url}`);
    } catch (error) {
      console.error('❌ Failed to set WebSocket URL:', error);
      throw error;
    }
  }

  /**
   * Get app name
   */
  getAppName(): string {
    return this.config.appName;
  }

  /**
   * Get app version
   */
  getAppVersion(): string {
    return this.config.appVersion;
  }

  /**
   * Get environment
   */
  getEnvironment(): string {
    return this.config.environment;
  }

  /**
   * Get log level
   */
  getLogLevel(): string {
    return this.config.logLevel;
  }

  /**
   * Set log level
   */
  async setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): Promise<void> {
    try {
      this.config.logLevel = level;
      await this.saveConfig();
      console.log(`✅ Log level updated to: ${level}`);
    } catch (error) {
      console.error('❌ Failed to set log level:', error);
      throw error;
    }
  }

  /**
   * Check if offline mode is enabled
   */
  isOfflineModeEnabled(): boolean {
    return this.config.enableOfflineMode;
  }

  /**
   * Enable/disable offline mode
   */
  async setOfflineMode(enabled: boolean): Promise<void> {
    try {
      this.config.enableOfflineMode = enabled;
      await this.saveConfig();
      console.log(`✅ Offline mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Failed to set offline mode:', error);
      throw error;
    }
  }

  /**
   * Get sync interval
   */
  getSyncIntervalMs(): number {
    return this.config.syncIntervalMs;
  }

  /**
   * Set sync interval
   */
  async setSyncIntervalMs(ms: number): Promise<void> {
    try {
      this.config.syncIntervalMs = ms;
      await this.saveConfig();
      console.log(`✅ Sync interval updated to: ${ms}ms`);
    } catch (error) {
      console.error('❌ Failed to set sync interval:', error);
      throw error;
    }
  }

  /**
   * Get max retries
   */
  getMaxRetries(): number {
    return this.config.maxRetries;
  }

  /**
   * Set max retries
   */
  async setMaxRetries(retries: number): Promise<void> {
    try {
      this.config.maxRetries = retries;
      await this.saveConfig();
      console.log(`✅ Max retries updated to: ${retries}`);
    } catch (error) {
      console.error('❌ Failed to set max retries:', error);
      throw error;
    }
  }

  /**
   * Get request timeout
   */
  getRequestTimeoutMs(): number {
    return this.config.requestTimeoutMs;
  }

  /**
   * Set request timeout
   */
  async setRequestTimeoutMs(ms: number): Promise<void> {
    try {
      this.config.requestTimeoutMs = ms;
      await this.saveConfig();
      console.log(`✅ Request timeout updated to: ${ms}ms`);
    } catch (error) {
      console.error('❌ Failed to set request timeout:', error);
      throw error;
    }
  }

  /**
   * Get all configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      this.config = { ...this.DEFAULT_CONFIG };
      await this.saveConfig();
      console.log('✅ Configuration reset to defaults');
    } catch (error) {
      console.error('❌ Failed to reset configuration:', error);
      throw error;
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Log current configuration
   */
  private logConfig(): void {
    console.log('📋 Current Configuration:');
    console.log(`  API URL: ${this.config.apiUrl}`);
    console.log(`  WebSocket URL: ${this.config.wsUrl}`);
    console.log(`  App Name: ${this.config.appName}`);
    console.log(`  Environment: ${this.config.environment}`);
    console.log(`  Log Level: ${this.config.logLevel}`);
    console.log(`  Offline Mode: ${this.config.enableOfflineMode}`);
    console.log(`  Sync Interval: ${this.config.syncIntervalMs}ms`);
    console.log(`  Max Retries: ${this.config.maxRetries}`);
    console.log(`  Request Timeout: ${this.config.requestTimeoutMs}ms`);
  }
}

// Export singleton instance
export default new ConfigService();
