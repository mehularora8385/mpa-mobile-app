
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { omrScannerService, OMRScanResult } from '../lib/omr-scanner-service';

interface OMRCameraScannerProps {
  onScanSuccess: (result: OMRScanResult) => void;
  onClose: () => void;
}

const OMRCameraScanner: React.FC<OMRCameraScannerProps> = ({ onScanSuccess, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleTakePicture = async () => {
    if (cameraRef.current && !isScanning) {
      setIsScanning(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true });
        if (photo.base64) {
          const result = await omrScannerService.scanOMRSheet(photo.base64);
          if (result.success) {
            onScanSuccess(result);
          } else {
            Alert.alert('Scan Failed', result.status || 'Could not read OMR sheet.');
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture or process OMR scan.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} type={Camera.Constants.Type.back}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTakePicture} disabled={isScanning}>
            <Text style={styles.text}>{isScanning ? 'Scanning...' : 'Scan OMR'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
            <Text style={styles.text}>Close</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  button: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(255,0,0,0.6)',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
});

export default OMRCameraScanner;
