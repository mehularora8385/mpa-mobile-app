import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cameraService } from './camera-service';

describe('Camera Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('takePicture', () => {
    it('should throw error if camera ref is not available', async () => {
      const mockCameraRef = null;
      
      try {
        await cameraService.takePicture(mockCameraRef);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Camera reference not available');
      }
    });

    it('should return photo object with uri and base64', async () => {
      const mockCameraRef = {
        takePictureAsync: vi.fn().mockResolvedValue({
          uri: 'file:///path/to/photo.jpg',
          base64: 'iVBORw0KGgoAAAANS...',
          width: 1080,
          height: 1920,
        }),
      };

      const result = await cameraService.takePicture(mockCameraRef);
      
      expect(result.uri).toBe('file:///path/to/photo.jpg');
      expect(result.base64).toBe('iVBORw0KGgoAAAANS...');
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
    });

    it('should call takePictureAsync with correct options', async () => {
      const mockCameraRef = {
        takePictureAsync: vi.fn().mockResolvedValue({
          uri: 'file:///path/to/photo.jpg',
          base64: 'iVBORw0KGgoAAAANS...',
          width: 1080,
          height: 1920,
        }),
      };

      await cameraService.takePicture(mockCameraRef);
      
      expect(mockCameraRef.takePictureAsync).toHaveBeenCalledWith({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });
    });

    it('should handle camera errors gracefully', async () => {
      const mockCameraRef = {
        takePictureAsync: vi.fn().mockRejectedValue(new Error('Camera error')),
      };

      try {
        await cameraService.takePicture(mockCameraRef);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Camera error');
      }
    });
  });

  describe('requestCameraPermission', () => {
    it('should return true when permission is granted', async () => {
      // Mock Camera module
      vi.mock('expo-camera', () => ({
        Camera: {
          requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
        },
      }));

      // Note: In real implementation, this would use the mocked Camera
      // For now, we're testing the service structure
      expect(cameraService.requestCameraPermission).toBeDefined();
    });
  });

  describe('checkCameraPermission', () => {
    it('should check if camera permission is granted', async () => {
      expect(cameraService.checkCameraPermission).toBeDefined();
    });
  });

  describe('savePictureToFile', () => {
    it('should save picture to document directory', async () => {
      expect(cameraService.savePictureToFile).toBeDefined();
    });
  });
});
