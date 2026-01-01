import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { authService } from '@/lib/auth-service';
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
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setSelfieUri(photo.uri);
      setCurrentStep('review');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Error', 'Failed to capture selfie');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeSelfie = () => {
    setSelfieUri(null);
    setCurrentStep('camera');
  };

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      if (!validateForm()) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Call login API with all details
      // First register the operator
      await authService.register({
        operatorName,
        mobileNumber,
        aadhaarNumber,
        selfieUri: selfieUri!,
      });

      // Then login
      const session = await authService.login({
        operatorIdOrMobile: mobileNumber,
        password: aadhaarNumber, // Using aadhaar as password for now
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Welcome ${operatorName}!`);
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
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
                <Text className="text-sm font-semibold text-foreground">
                  Operator Name *
                </Text>
                <TextInput
                  className="bg-surface border border-border rounded-lg p-4 text-foreground"
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={operatorName}
                  onChangeText={setOperatorName}
                  editable={!loading}
                />
              </View>

              {/* Mobile Number */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Mobile Number *
                </Text>
                <View className="flex-row items-center bg-surface border border-border rounded-lg">
                  <Text className="px-4 text-foreground font-semibold">+91</Text>
                  <TextInput
                    className="flex-1 p-4 text-foreground"
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#999"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Aadhaar Number */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Aadhaar Number *
                </Text>
                <View className="gap-1">
                  <TextInput
                    className="bg-surface border border-border rounded-lg p-4 text-foreground"
                    placeholder="12-digit Aadhaar number"
                    placeholderTextColor="#999"
                    value={aadhaarNumber}
                    onChangeText={handleAadhaarChange}
                    keyboardType="number-pad"
                    maxLength={12}
                    editable={!loading}
                  />
                  <Text className="text-xs text-muted px-1">
                    Masked: {maskedAadhaar || 'XXXX XXXX XXXX'}
                  </Text>
                </View>
              </View>

              {/* Selfie Status */}
              <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg">{selfieUri ? '✓' : '📷'}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {selfieUri ? 'Selfie Captured' : 'Selfie Required'}
                    </Text>
                    <Text className="text-xs text-muted">
                      {selfieUri ? 'Ready for verification' : 'Tap below to capture'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Capture Selfie Button */}
            <Pressable
              onPress={async () => {
                if (!permission?.granted) {
                  await requestPermission();
                } else {
                  setCurrentStep('camera');
                }
              }}
              disabled={loading}
              style={({ pressed }: any) => ([
                { backgroundColor: '#00D084', borderRadius: 8, padding: 16, alignItems: 'center' },
                pressed && !loading && { opacity: 0.8 },
              ])}
            >
              <Text className="text-white font-semibold text-lg">
                {selfieUri ? 'Retake Selfie' : 'Capture Selfie'}
              </Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading || !selfieUri}
              style={({ pressed }: any) => ([
                { backgroundColor: !selfieUri ? '#999' : '#0066CC', borderRadius: 8, padding: 16, alignItems: 'center' },
                pressed && !loading && { opacity: 0.8 },
              ])}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">Login</Text>
              )}
            </Pressable>

            {/* Info Box */}
            <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
              <Text className="font-semibold text-primary">Important</Text>
              <Text className="text-sm text-foreground">
                • One operator per mobile per exam{'\n'}
                • Can login for both mock and exam{'\n'}
                • Cannot login twice with same mobile{'\n'}
                • Selfie is required for verification
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Step 2: Camera
  if (currentStep === 'camera') {
    if (!permission?.granted) {
      return (
        <ScreenContainer className="bg-background items-center justify-center gap-4">
          <Text className="text-foreground font-semibold">Camera permission required</Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-primary rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold">Grant Permission</Text>
          </TouchableOpacity>
        </ScreenContainer>
      );
    }

    return (
      <ScreenContainer className="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View className="flex-1">
          {/* Camera */}
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

          {/* Overlay with Face Guide */}
          <View className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <View className="w-48 h-64 border-4 border-primary rounded-3xl" />
          </View>

          {/* Instructions */}
          <View className="absolute top-0 left-0 right-0 bg-black/50 p-4">
            <Text className="text-white font-semibold text-lg">Capture Selfie</Text>
            <Text className="text-white/80 text-sm">Position your face in the frame</Text>
          </View>

          {/* Buttons */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 gap-3 flex-row">
            <TouchableOpacity
              onPress={() => setCurrentStep('form')}
              className="flex-1 bg-white/20 rounded-lg p-4 items-center"
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCaptureSelfie}
              disabled={loading}
              className="flex-1 bg-primary rounded-lg p-4 items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Capture</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Step 3: Review
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

            {/* Selfie Preview */}
            {selfieUri && (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Your Selfie</Text>
                <Image
                  source={{ uri: selfieUri }}
                  className="w-full h-64 rounded-lg bg-surface border border-border"
                />
              </View>
            )}

            {/* Details Review */}
            <View className="bg-surface border border-border rounded-lg p-4 gap-3">
              <View className="gap-1">
                <Text className="text-xs font-semibold text-muted">Operator Name</Text>
                <Text className="text-foreground font-semibold">{operatorName}</Text>
              </View>

              <View className="h-px bg-border" />

              <View className="gap-1">
                <Text className="text-xs font-semibold text-muted">Mobile Number</Text>
                <Text className="text-foreground font-semibold">+91 {mobileNumber}</Text>
              </View>

              <View className="h-px bg-border" />

              <View className="gap-1">
                <Text className="text-xs font-semibold text-muted">Aadhaar Number</Text>
                <Text className="text-foreground font-semibold">{maskedAadhaar}</Text>
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
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Confirm & Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRetakeSelfie}
                disabled={loading}
                className="bg-surface border border-border rounded-lg p-4 items-center"
              >
                <Text className="text-foreground font-semibold">Retake Selfie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentStep('form')}
                disabled={loading}
                className="bg-surface border border-border rounded-lg p-4 items-center"
              >
                <Text className="text-foreground font-semibold">Edit Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
