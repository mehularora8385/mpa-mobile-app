import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';

export const cameraService = {
  async requestCameraPermission() {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  },

  async checkCameraPermission() {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Camera check error:', error);
      return false;
    }
  },

  async takePicture(cameraRef: any) {
    try {
      if (!cameraRef) {
        throw new Error('Camera reference not available');
      }

      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      return {
        uri: photo.uri,
        base64: photo.base64,
        width: photo.width,
        height: photo.height,
      };
    } catch (error) {
      console.error('Take picture error:', error);
      throw error;
    }
  },

  async savePictureToFile(uri: string) {
    try {
      const filename = `selfie_${Date.now()}.jpg`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;
      
      // Copy the photo to app's document directory
      await FileSystem.copyAsync({
        from: uri,
        to: filepath,
      });

      return filepath;
    } catch (error) {
      console.error('Save picture error:', error);
      throw error;
    }
  },
};
