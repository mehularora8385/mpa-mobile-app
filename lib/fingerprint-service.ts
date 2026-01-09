import { NativeModules, Platform } from 'react-native';

const { FingerprintModule } = NativeModules;

export enum FingerprintDeviceType {
  MFS100 = 'MFS100',
  MFS110 = 'MFS110',
}

export interface FingerprintCaptureResult {
  success: boolean;
  template: string; // Base64 encoded fingerprint template
  quality: number; // 0-100
  nfiq: number; // NFIQ score (1-5)
  status: string;
  timestamp: string;
}

export interface FingerprintMatchResult {
  match: boolean;
  score: number; // 0-100
  confidence: number; // 0-1
  status: string;
}

export interface FingerprintQualityResult {
  isValid: boolean;
  quality: number;
  nfiq: number;
  issues: string[];
}

class FingerprintService {
  private deviceType: FingerprintDeviceType = FingerprintDeviceType.MFS100;
  private isInitialized: boolean = false;

  /**
   * Initialize fingerprint scanner
   */
  async initialize(deviceType: FingerprintDeviceType = FingerprintDeviceType.MFS100): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        console.warn('Fingerprint service is only available on Android');
        return false;
      }

      this.deviceType = deviceType;
      const result = await FingerprintModule.initialize({
        deviceType,
      });

      this.isInitialized = result.success;
      return result.success;
    } catch (error) {
      console.error('Fingerprint initialization error:', error);
      return false;
    }
  }

  /**
   * Capture fingerprint from scanner
   */
  async captureFingerprint(
    timeout: number = 30000,
    retryCount: number = 3
  ): Promise<FingerprintCaptureResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let lastError: Error | null = null;

      for (let i = 0; i < retryCount; i++) {
        try {
          const result = await FingerprintModule.captureFingerprint({
            deviceType: this.deviceType,
            timeout,
            retryAttempt: i + 1,
          });

          if (result.success) {
            return {
              success: true,
              template: result.template,
              quality: result.quality || 0,
              nfiq: result.nfiq || 0,
              status: 'success',
              timestamp: new Date().toISOString(),
            };
          }
        } catch (error) {
          lastError = error as Error;
          if (i < retryCount - 1) {
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      return {
        success: false,
        template: '',
        quality: 0,
        nfiq: 0,
        status: `Capture failed after ${retryCount} attempts: ${lastError?.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        template: '',
        quality: 0,
        nfiq: 0,
        status: `Capture error: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Match two fingerprint templates
   */
  async matchFingerprints(
    template1: string,
    template2: string,
    threshold: number = 50
  ): Promise<FingerprintMatchResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const result = await FingerprintModule.matchFingerprints({
        template1,
        template2,
        threshold,
      });

      return {
        match: result.score >= threshold,
        score: result.score || 0,
        confidence: (result.score || 0) / 100,
        status: result.status || 'match_complete',
      };
    } catch (error) {
      return {
        match: false,
        score: 0,
        confidence: 0,
        status: `Match error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate fingerprint quality
   */
  async validateFingerprintQuality(template: string): Promise<FingerprintQualityResult> {
    try {
      const result = await FingerprintModule.validateQuality({
        template,
      });

      const issues: string[] = [];

      if (result.quality < 40) {
        issues.push('Fingerprint quality is too low. Please try again.');
      }

      if (result.nfiq > 3) {
        issues.push('NFIQ score indicates poor quality. Please ensure clean fingers.');
      }

      const isValid = result.quality >= 40 && result.nfiq <= 3;

      return {
        isValid,
        quality: result.quality || 0,
        nfiq: result.nfiq || 0,
        issues,
      };
    } catch (error) {
      return {
        isValid: false,
        quality: 0,
        nfiq: 0,
        issues: [`Quality validation error: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<any> {
    try {
      return await FingerprintModule.getDeviceInfo({
        deviceType: this.deviceType,
      });
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }

  /**
   * Test device connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await FingerprintModule.testConnection({
        deviceType: this.deviceType,
      });
      return result.connected === true;
    } catch (error) {
      console.error('Device connection test failed:', error);
      return false;
    }
  }

  /**
   * Close fingerprint scanner connection
   */
  async close(): Promise<void> {
    try {
      await FingerprintModule.close();
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to close fingerprint scanner:', error);
    }
  }

  /**
   * Get supported devices
   */
  static getSupportedDevices(): FingerprintDeviceType[] {
    return [FingerprintDeviceType.MFS100, FingerprintDeviceType.MFS110];
  }
}

export const fingerprintService = new FingerprintService();
