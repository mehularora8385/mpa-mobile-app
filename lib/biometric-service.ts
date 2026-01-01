import * as LocalAuthentication from 'expo-local-authentication';
import { Camera } from 'expo-camera';
import { authService } from './auth-service';

// Types
export interface FaceMatchResult {
  matchPercentage: number;
  isMatch: boolean;
  photoUri: string;
  timestamp: number;
}

export interface FingerprintResult {
  success: boolean;
  templateId?: string;
  error?: string;
  timestamp: number;
}

export interface BiometricCapability {
  hasFaceRecognition: boolean;
  hasFingerprint: boolean;
  availableTypes: string[];
}

// Biometric Service
class BiometricService {
  private static instance: BiometricService;

  private constructor() {}

  static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  // Check available biometric capabilities
  async getAvailableBiometrics(): Promise<BiometricCapability> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        hasFaceRecognition: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
        hasFingerprint: types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
        availableTypes: types.map((t: number) => this.getAuthTypeName(t)),
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        hasFaceRecognition: false,
        hasFingerprint: false,
        availableTypes: [],
      };
    }
  }

  // Request biometric authentication
  async authenticate(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,

      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  // Capture face for registration
  async captureFaceForRegistration(): Promise<string> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission denied');
      }

      // In a real implementation, this would use a camera component
      // For now, we'll return a placeholder
      return 'file:///path/to/captured/face.jpg';
    } catch (error) {
      throw new Error(`Face capture error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Capture face during exam
  async captureFaceForExam(): Promise<string> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission denied');
      }

      // In a real implementation, this would use a camera component
      // For now, we'll return a placeholder
      return 'file:///path/to/captured/exam/face.jpg';
    } catch (error) {
      throw new Error(`Face capture error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Match face with candidate photo
  async matchFaceWithCandidate(
    capturedFaceUri: string,
    candidatePhotoUri: string,
    candidateId: string
  ): Promise<FaceMatchResult> {
    try {
      const authHeader = await authService.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      // Convert images to base64
      const capturedBase64 = await this.fileToBase64(capturedFaceUri);
      const candidateBase64 = await this.fileToBase64(candidatePhotoUri);

      // Call face matching API
      const response = await fetch(
        'https://api.examination-system.com/api/biometric/face-match',
        {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId,
            capturedFace: capturedBase64,
            candidatePhoto: candidateBase64,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Face matching failed');
      }

      const result = await response.json();

      return {
        matchPercentage: result.matchPercentage,
        isMatch: result.matchPercentage >= 90,
        photoUri: capturedFaceUri,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Face match error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Capture fingerprint (placeholder for Mantra MFS100/MFS110)
  async captureFingerprint(): Promise<FingerprintResult> {
    try {
      // In a real implementation, this would communicate with Mantra MFS100/MFS110
      // via USB OTG. For now, we'll return a mock result.

      // Check if device has fingerprint capability
      const biometrics = await this.getAvailableBiometrics();
      if (!biometrics.hasFingerprint) {
        throw new Error('Fingerprint scanner not available');
      }

      // Attempt fingerprint authentication
      const authenticated = await this.authenticate();

      if (authenticated) {
        return {
          success: true,
          templateId: `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
      } else {
        return {
          success: false,
          error: 'Fingerprint capture failed',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // Verify fingerprint with server
  async verifyFingerprint(
    fingerprintTemplate: string,
    candidateId: string
  ): Promise<FingerprintResult> {
    try {
      const authHeader = await authService.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      // Call fingerprint verification API
      const response = await fetch(
        'https://api.examination-system.com/api/biometric/fingerprint-verify',
        {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId,
            fingerprintTemplate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Fingerprint verification failed');
      }

      const result = await response.json();

      return {
        success: result.verified,
        templateId: fingerprintTemplate,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // Get biometric analytics
  async getBiometricAnalytics(examId: string) {
    try {
      const authHeader = await authService.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://api.examination-system.com/api/biometric/analytics?examId=${examId}`,
        {
          method: 'GET',
          headers: authHeader,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Analytics error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Helper: Get auth type name
  private getAuthTypeName(type: number): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face ID';
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Fingerprint';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris';
      default:
        return 'Unknown';
    }
  }
}

export const biometricService = BiometricService.getInstance();
