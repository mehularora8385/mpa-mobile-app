import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { enhancedAuthService } from '@/lib/enhanced-auth-service';

export default function EnhancedLoginScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<'form' | 'camera' | 'review'>('form');
  const [loading, setLoading] = useState(false);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  // Form fields
  const [operatorName, setOperatorName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [examId, setExamId] = useState('');
  const [centreId, setCentreId] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!enhancedAuthService.validateName(operatorName)) {
      newErrors.operatorName = 'Name must be at least 3 characters';
    }

    if (!enhancedAuthService.validateMobileNo(mobileNo)) {
      newErrors.mobileNo = 'Mobile number must be 10 digits';
    }

    if (!enhancedAuthService.validateAadhaar(aadhaar)) {
      newErrors.aadhaar = 'Aadhaar must be 12 digits';
    }

    if (!examId) {
      newErrors.examId = 'Please select an exam';
    }

    if (!centreId) {
      newErrors.centreId = 'Please select a centre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Move to camera step
   */
  const handleCameraStep = async () => {
    if (!validateForm()) {
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission required', 'Please allow camera access to capture selfie');
        return;
      }
    }

    setStep('camera');
  };

  /**
   * Capture selfie
   */
  const handleCaptureSelfie = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });

        if (photo?.base64) {
          setSelfiePhoto(`data:image/jpg;base64,${photo.base64}`);
          setStep('review');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error('Camera error:', error);
    }
  };

  /**
   * Retake selfie
   */
  const handleRetakeSelfie = () => {
    setSelfiePhoto(null);
    setStep('camera');
  };

  /**
   * Submit login
   */
  const handleSubmitLogin = async () => {
    if (!selfiePhoto) {
      Alert.alert('Error', 'Please capture a selfie');
      return;
    }

    setLoading(true);
    try {
      const result = await enhancedAuthService.login(
        operatorName,
        mobileNo,
        aadhaar,
        examId,
        centreId,
        selfiePhoto
      );

      if (result.success) {
        Alert.alert('Success', 'Login successful');
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Login Failed', result.error || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Form
  if (step === 'form') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Operator Login</Text>
          <Text style={styles.subtitle}>MPA Biometric Verification System</Text>
        </View>

        {/* Operator Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Operator Name *</Text>
          <TextInput
            style={[styles.input, errors.operatorName && styles.inputError]}
            placeholder="Enter your name"
            value={operatorName}
            onChangeText={setOperatorName}
            placeholderTextColor="#999"
          />
          {errors.operatorName && <Text style={styles.errorText}>{errors.operatorName}</Text>}
        </View>

        {/* Mobile Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Mobile Number (10 digits) *</Text>
          <TextInput
            style={[styles.input, errors.mobileNo && styles.inputError]}
            placeholder="Enter 10-digit mobile number"
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="numeric"
            maxLength={10}
            placeholderTextColor="#999"
          />
          {errors.mobileNo && <Text style={styles.errorText}>{errors.mobileNo}</Text>}
        </View>

        {/* Aadhaar Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Aadhaar Number (12 digits) *</Text>
          <TextInput
            style={[styles.input, errors.aadhaar && styles.inputError]}
            placeholder="Enter 12-digit Aadhaar number"
            value={aadhaar}
            onChangeText={setAadhaar}
            keyboardType="numeric"
            maxLength={12}
            placeholderTextColor="#999"
            secureTextEntry
          />
          {errors.aadhaar && <Text style={styles.errorText}>{errors.aadhaar}</Text>}
          <Text style={styles.helperText}>Your Aadhaar will be masked for security</Text>
        </View>

        {/* Exam Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Exam *</Text>
          <TextInput
            style={[styles.input, errors.examId && styles.inputError]}
            placeholder="Enter exam ID (e.g., exam_a)"
            value={examId}
            onChangeText={setExamId}
            placeholderTextColor="#999"
          />
          {errors.examId && <Text style={styles.errorText}>{errors.examId}</Text>}
        </View>

        {/* Centre Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Centre *</Text>
          <TextInput
            style={[styles.input, errors.centreId && styles.inputError]}
            placeholder="Enter centre code (e.g., C0001)"
            value={centreId}
            onChangeText={setCentreId}
            placeholderTextColor="#999"
          />
          {errors.centreId && <Text style={styles.errorText}>{errors.centreId}</Text>}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleCameraStep}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Capture Selfie</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 2: Camera
  if (step === 'camera') {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Camera permission not granted</Text>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        />
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={[styles.button, styles.captureButton]}
            onPress={handleCaptureSelfie}
          >
            <Text style={styles.buttonText}>Capture Selfie</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 3: Review
  if (step === 'review') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Selfie</Text>
        </View>

        {selfiePhoto && (
          <Image
            source={{ uri: selfiePhoto }}
            style={styles.previewImage}
          />
        )}

        <View style={styles.reviewInfo}>
          <Text style={styles.infoLabel}>Name: {operatorName}</Text>
          <Text style={styles.infoLabel}>Mobile: {mobileNo}</Text>
          <Text style={styles.infoLabel}>Aadhaar: {enhancedAuthService.maskAadhaar(aadhaar)}</Text>
          <Text style={styles.infoLabel}>Exam: {examId}</Text>
          <Text style={styles.infoLabel}>Centre: {centreId}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmitLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRetakeSelfie}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Retake Selfie</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    padding: 16,
    backgroundColor: '#000',
  },
  captureButton: {
    backgroundColor: '#e74c3c',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  reviewInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
});
