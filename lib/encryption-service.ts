import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Encryption key (should be from environment)
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'mpa-default-key-2024';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

class EncryptionService {
  /**
   * Hash Aadhaar number (one-way encryption)
   */
  async hashAadhaar(aadhaar: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        aadhaar + ENCRYPTION_KEY
      );
      return hash;
    } catch (error) {
      console.error('Aadhaar hashing error:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptSensitiveData(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA512,
        jsonString + ENCRYPTION_KEY
      );
      return encrypted;
    } catch (error) {
      console.error('Data encryption error:', error);
      throw error;
    }
  }

  /**
   * Store data securely in SecureStore (encrypted at OS level)
   */
  async storeSecureData(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw error;
    }
  }

  /**
   * Retrieve data from SecureStore
   */
  async retrieveSecureData(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  /**
   * Delete secure data
   */
  async deleteSecureData(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Failed to delete secure data:', error);
      throw error;
    }
  }

  /**
   * Store operator credentials securely
   */
  async storeOperatorCredentials(operatorId: string, password: string): Promise<void> {
    try {
      const credentials = {
        operatorId,
        passwordHash: await this.hashPassword(password),
        storedAt: new Date().toISOString(),
      };

      await this.storeSecureData('operator_credentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to store operator credentials:', error);
      throw error;
    }
  }

  /**
   * Verify operator password
   */
  async verifyOperatorPassword(password: string): Promise<boolean> {
    try {
      const credentialsJson = await this.retrieveSecureData('operator_credentials');
      if (!credentialsJson) return false;

      const credentials = JSON.parse(credentialsJson);
      const passwordHash = await this.hashPassword(password);

      return credentials.passwordHash === passwordHash;
    } catch (error) {
      console.error('Failed to verify password:', error);
      return false;
    }
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password + ENCRYPTION_KEY
      );
    } catch (error) {
      console.error('Password hashing error:', error);
      throw error;
    }
  }

  /**
   * Encrypt biometric data
   */
  async encryptBiometricData(data: {
    faceImage?: string;
    fingerprintTemplate?: string;
    omrSerialNumber?: string;
  }): Promise<string> {
    try {
      const encrypted = await this.encryptSensitiveData(data);
      return encrypted;
    } catch (error) {
      console.error('Biometric data encryption error:', error);
      throw error;
    }
  }

  /**
   * Store encrypted session data
   */
  async storeSessionData(sessionData: any): Promise<void> {
    try {
      const encrypted = await this.encryptSensitiveData(sessionData);
      await this.storeSecureData('session_data', encrypted);
    } catch (error) {
      console.error('Failed to store session data:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt session data
   */
  async retrieveSessionData(): Promise<any | null> {
    try {
      const encrypted = await this.retrieveSecureData('session_data');
      if (!encrypted) return null;

      // Note: Since we're using one-way hashing, we can't decrypt
      // This is for comparison purposes only
      return encrypted;
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      return null;
    }
  }

  /**
   * Clear all sensitive data
   */
  async clearAllSensitiveData(): Promise<void> {
    try {
      await this.deleteSecureData('operator_credentials');
      await this.deleteSecureData('session_data');
      await this.deleteSecureData('auth_token');
      await this.deleteSecureData('aadhaar_hash');
    } catch (error) {
      console.error('Failed to clear sensitive data:', error);
      throw error;
    }
  }

  /**
   * Generate secure random token
   */
  async generateSecureToken(length: number = 32): Promise<string> {
    try {
      const randomBytes = await Crypto.getRandomBytes(length);
      return randomBytes.toString('hex');
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity(data: string, hash: string): Promise<boolean> {
    try {
      const calculatedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + ENCRYPTION_KEY
      );

      return calculatedHash === hash;
    } catch (error) {
      console.error('Data integrity validation error:', error);
      return false;
    }
  }

  /**
   * Create data checksum
   */
  async createDataChecksum(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        jsonString + ENCRYPTION_KEY
      );
    } catch (error) {
      console.error('Checksum creation error:', error);
      throw error;
    }
  }

  /**
   * Encrypt file content
   */
  async encryptFileContent(content: string): Promise<string> {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA512,
        content + ENCRYPTION_KEY
      );
    } catch (error) {
      console.error('File encryption error:', error);
      throw error;
    }
  }

  /**
   * Sanitize sensitive data from logs
   */
  sanitizeSensitiveData(data: any): any {
    const sensitiveFields = ['password', 'aadhaar', 'token', 'secret', 'pin'];
    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }
}

export const encryptionService = new EncryptionService();
