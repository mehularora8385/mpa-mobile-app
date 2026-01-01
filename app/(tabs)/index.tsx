import { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { mockAuthService } from '@/lib/auth-mock';
import * as Haptics from 'expo-haptics';

type LoginStep = 'form' | 'camera' | 'review';

export default function LoginScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Form state
  const [operatorName, setOperatorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [maskedAadhaar, setMaskedAadhaar] = useState('');

  // UI state
  const [currentStep, setCurrentStep] = useState<LoginStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const isLoggedIn = await mockAuthService.isLoggedIn();
      if (isLoggedIn) {
        router.replace('/home');
      }
    } catch (err) {
      console.error('Error checking login status:', err);
    }
  };

  const maskAadhaar = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    return cleaned.slice(0, 2) + '*'.repeat(cleaned.length - 4) + cleaned.slice(-2);
  };

  const handleAadhaarChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(cleaned);
    setMaskedAadhaar(maskAadhaar(cleaned));
  };

  const validateForm = () => {
    if (!operatorName.trim()) {
      setError('Please enter operator name');
      return false;
    }
    if (!mobileNumber.trim() || mobileNumber.length !== 10) {
      setError('Please enter valid 10-digit mobile number');
      return false;
    }
    if (!aadhaarNumber.trim() || aadhaarNumber.length !== 12) {
      setError('Please enter valid 12-digit Aadhaar number');
      return false;
    }
    if (!selfieUri) {
      setError('Please capture selfie');
      return false;
    }
    return true;
  };

  const handleCaptureSelfie = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);
      setError('');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setSelfieUri(photo.uri);
      setCurrentStep('review');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Camera error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to capture selfie';
      setError(errorMsg);
      Alert.alert('Camera Error', errorMsg);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeSelfie = () => {
    setSelfieUri(null);
    setCurrentStep('camera');
    setError('');
  };

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      if (!validateForm()) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      console.log('Starting login process...');

      // First try to register the operator
      try {
        console.log('Registering operator...');
        await mockAuthService.register({
          operatorName,
          mobileNumber,
          aadhaarNumber,
          selfieUri: selfieUri!,
        });
        console.log('Registration successful');
      } catch (regErr) {
        console.log('Registration error (may already exist):', regErr);
        // Operator might already exist, continue to login
      }

      // Then login
      console.log('Attempting login...');
      const session = await mockAuthService.login({
        operatorIdOrMobile: mobileNumber,
        password: aadhaarNumber,
      });

      console.log('Login successful:', session);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert('Success', `Welcome ${operatorName}!`, [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/home');
          },
        },
      ]);
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    setCurrentStep('form');
    setError('');
  };

  // Step 1: Form Input
  if (currentStep === 'form') {
    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
          <View className="flex-1 justify-center gap-8">
            {/* Header */}
            <View className="items-center gap-2">
              <Text className="text-4xl font-bold text-primary">SEPL</Text>
              <Text className="text-lg text-foreground font-semibold">Biometric Verification</Text>
              <Text className="text-sm text-muted text-center">
                Operator Login
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-4">
                <Text className="text-error font-medium">{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View className="gap-4">
              {/* Operator Name */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Operator Name</Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={operatorName}
                  onChangeText={setOperatorName}
                  className="border border-border rounded-lg p-3 text-foreground bg-surface"
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>

              {/* Mobile Number */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Mobile Number</Text>
                <TextInput
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChangeText={(text) => setMobileNumber(text.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="numeric"
                  maxLength={10}
                  className="border border-border rounded-lg p-3 text-foreground bg-surface"
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>

              {/* Aadhaar Number */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Aadhaar Number</Text>
                <TextInput
                  placeholder="12-digit Aadhaar number"
                  value={maskedAadhaar}
                  onChangeText={handleAadhaarChange}
                  keyboardType="numeric"
                  maxLength={12}
                  className="border border-border rounded-lg p-3 text-foreground bg-surface"
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                onPress={() => {
                  setError('');
                  if (!operatorName.trim()) {
                    setError('Please enter operator name');
                    return;
                  }
                  if (!mobileNumber.trim() || mobileNumber.length !== 10) {
                    setError('Please enter valid 10-digit mobile number');
                    return;
                  }
                  if (!aadhaarNumber.trim() || aadhaarNumber.length !== 12) {
                    setError('Please enter valid 12-digit Aadhaar number');
                    return;
                  }
                  setCurrentStep('camera');
                }}
                disabled={loading}
                className="bg-primary rounded-lg p-4 items-center mt-4"
              >
                <Text className="text-background font-bold text-lg">
                  {loading ? 'Loading...' : 'Continue'}
                </Text>
              </TouchableOpacity>

              {/* Test Credentials */}
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <Text className="text-xs font-semibold text-blue-900 mb-2">📱 TEST CREDENTIALS:</Text>
                <Text className="text-xs text-blue-800">Mobile: 9730018733</Text>
                <Text className="text-xs text-blue-800">Aadhaar: 659999999978</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Step 2: Camera - Capture Selfie
  if (currentStep === 'camera') {
    return (
      <ScreenContainer className="bg-black">
        <View className="flex-1 justify-center">
          {permission?.granted ? (
            <>
              <CameraView ref={cameraRef} className="flex-1" facing="front" />
              <View className="bg-black p-6 gap-4">
                <TouchableOpacity
                  onPress={handleCaptureSelfie}
                  disabled={loading}
                  className="bg-primary rounded-lg p-4 items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-background font-bold text-lg">📸 Capture Selfie</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCurrentStep('form')}
                  disabled={loading}
                  className="bg-surface rounded-lg p-4 items-center"
                >
                  <Text className="text-foreground font-semibold">← Back</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="flex-1 justify-center items-center p-6 gap-4">
              <Text className="text-white text-lg font-semibold text-center">
                Camera permission required
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                className="bg-primary rounded-lg p-4 px-8"
              >
                <Text className="text-background font-bold">Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // Step 3: Review Details
  if (currentStep === 'review') {
    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
          <View className="flex-1 justify-center gap-6">
            {/* Header */}
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">Review Details</Text>
              <Text className="text-sm text-muted">Verify your information</Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-4">
                <Text className="text-error font-medium">{error}</Text>
              </View>
            ) : null}

            {/* Selfie */}
            {selfieUri && (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Your Selfie</Text>
                <Image
                  source={{ uri: selfieUri }}
                  className="w-full h-48 rounded-lg bg-surface"
                />
              </View>
            )}

            {/* Details */}
            <View className="bg-surface rounded-lg p-4 gap-4">
              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Operator Name</Text>
                <Text className="text-foreground font-medium">{operatorName}</Text>
              </View>
              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Mobile Number</Text>
                <Text className="text-foreground font-medium">+91 {mobileNumber}</Text>
              </View>
              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Aadhaar Number</Text>
                <Text className="text-foreground font-medium">{maskedAadhaar}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="bg-primary rounded-lg p-4 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-background font-bold text-lg">✓ Confirm & Login</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRetakeSelfie}
                disabled={loading}
                className="bg-surface border border-border rounded-lg p-4 items-center"
              >
                <Text className="text-foreground font-semibold">📸 Retake Selfie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditDetails}
                disabled={loading}
                className="bg-surface border border-border rounded-lg p-4 items-center"
              >
                <Text className="text-foreground font-semibold">✎ Edit Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
