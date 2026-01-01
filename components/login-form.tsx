import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from './screen-container';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import { mockAuthService } from '@/lib/auth-mock';

import { CameraView } from 'expo-camera';

type LoginStep = 'form' | 'camera' | 'review';

export function LoginForm() {
  const router = useRouter();
  const colors = useColors();
  const [step, setStep] = useState<LoginStep>('form');
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [operatorName, setOperatorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  // Camera ref
  const cameraRef = React.useRef<CameraView>(null);

  const validateForm = () => {
    if (!operatorName.trim()) {
      Alert.alert('Error', 'Please enter operator name');
      return false;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep('camera');
    }
  };

  const handleCaptureSelfie = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setSelfieUri(photo.uri);
          setStep('review');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleMockCapture = () => {
    // Mock selfie for web testing
    setSelfieUri('mock-selfie-uri');
    setStep('review');
  };

  const handleConfirmLogin = async () => {
    setLoading(true);
    try {
      const result = await mockAuthService.login({
        operatorName,
        mobileNumber,
        aadhaarNumber,
        selfieUri,
      });

      if (result.success) {
        // Wait for session to be saved
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Refresh the parent layout
        router.push('/(tabs)/home');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeSelfie = () => {
    setSelfieUri(null);
    setStep('camera');
  };

  const handleEditDetails = () => {
    setStep('form');
  };

  // STEP 1: Login Form
  if (step === 'form') {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View className="items-center gap-2 mb-4">
              <Text className="text-3xl font-bold text-primary">SEPL</Text>
              <Text className="text-lg font-semibold text-foreground">Biometric Verification</Text>
              <Text className="text-sm text-muted">Operator Login</Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              {/* Operator Name */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Operator Name</Text>
                <TextInput
                  className={cn(
                    'border border-border rounded-lg p-3 text-foreground bg-background',
                    'text-base'
                  )}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.muted}
                  value={operatorName}
                  onChangeText={setOperatorName}
                  editable={!loading}
                />
              </View>

              {/* Mobile Number */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Mobile Number</Text>
                <TextInput
                  className={cn(
                    'border border-border rounded-lg p-3 text-foreground bg-background',
                    'text-base'
                  )}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.muted}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading}
                />
              </View>

              {/* Aadhaar Number */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Aadhaar Number</Text>
                <TextInput
                  className={cn(
                    'border border-border rounded-lg p-3 text-foreground bg-background',
                    'text-base'
                  )}
                  placeholder="12-digit Aadhaar number"
                  placeholderTextColor={colors.muted}
                  value={aadhaarNumber}
                  onChangeText={setAadhaarNumber}
                  keyboardType="numeric"
                  maxLength={12}
                  editable={!loading}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Continue Button */}
            <Pressable
              onPress={handleContinue}
              disabled={loading}
              className={cn(
                'bg-primary rounded-lg p-4 items-center',
                loading && 'opacity-50'
              )}
            >
              <Text className="text-white font-bold text-base">Continue</Text>
            </Pressable>

            {/* Test Credentials */}
            <View className="bg-surface rounded-lg p-4 gap-1">
              <Text className="text-xs font-bold text-foreground">TEST CREDENTIALS:</Text>
              <Text className="text-xs text-muted">Mobile: 9730018733</Text>
              <Text className="text-xs text-muted">Aadhaar: 659999999978</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // STEP 2: Camera
  if (step === 'camera') {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-4">
            <View className="items-center gap-2 mb-4">
              <Text className="text-2xl font-bold text-primary">SEPL</Text>
              <Text className="text-lg font-semibold text-foreground">Capture Selfie</Text>
            </View>

            {/* Camera View */}
            <View className="bg-surface rounded-lg overflow-hidden h-64 mb-4">
              <CameraView
                ref={cameraRef}
                facing="front"
                className="flex-1"
                onMountError={(error) => {
                  console.log('Camera error:', error);
                }}
              />
            </View>

            {/* Buttons */}
            <Pressable
              onPress={handleCaptureSelfie}
              disabled={loading}
              className={cn(
                'bg-primary rounded-lg p-4 items-center',
                loading && 'opacity-50'
              )}
            >
              <Text className="text-white font-bold text-base">Capture Selfie</Text>
            </Pressable>

            <Pressable
              onPress={handleMockCapture}
              disabled={loading}
              className={cn(
                'bg-secondary rounded-lg p-4 items-center',
                loading && 'opacity-50'
              )}
            >
              <Text className="text-white font-bold text-base">Capture Selfie (Mock)</Text>
            </Pressable>

            <Pressable
              onPress={() => setStep('form')}
              disabled={loading}
              className="bg-surface border border-border rounded-lg p-4 items-center"
            >
              <Text className="text-foreground font-semibold text-base">Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // STEP 3: Review
  if (step === 'review') {
    const maskedAadhaar = aadhaarNumber.slice(0, 2) + '*'.repeat(8) + aadhaarNumber.slice(-2);

    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-4">
            <View className="items-center gap-2 mb-4">
              <Text className="text-2xl font-bold text-primary">SEPL</Text>
              <Text className="text-lg font-semibold text-foreground">Biometric Verification</Text>
              <Text className="text-sm text-muted">Review Details</Text>
            </View>

            {/* Selfie */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Your Selfie</Text>
              <View className="bg-surface rounded-lg h-48 items-center justify-center border border-border">
                {selfieUri && selfieUri !== 'mock-selfie-uri' ? (
                  <Text className="text-muted">Selfie captured</Text>
                ) : (
                  <Text className="text-muted">Mock selfie</Text>
                )}
              </View>
            </View>

            {/* Details */}
            <View className="bg-surface rounded-lg p-4 gap-3">
              <View>
                <Text className="text-xs text-muted mb-1">Operator Name</Text>
                <Text className="text-base font-semibold text-foreground">{operatorName}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Mobile Number</Text>
                <Text className="text-base font-semibold text-foreground">+91 {mobileNumber}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Aadhaar Number</Text>
                <Text className="text-base font-semibold text-foreground">{maskedAadhaar}</Text>
              </View>
            </View>

            {/* Confirm Button */}
            <Pressable
              onPress={handleConfirmLogin}
              disabled={loading}
              className={cn(
                'bg-primary rounded-lg p-4 items-center',
                loading && 'opacity-50'
              )}
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Logging in...' : 'Confirm and Login'}
              </Text>
            </Pressable>

            {/* Retake Button */}
            <Pressable
              onPress={handleRetakeSelfie}
              disabled={loading}
              className="bg-surface border border-border rounded-lg p-4 items-center"
            >
              <Text className="text-foreground font-semibold text-base">Retake Selfie</Text>
            </Pressable>

            {/* Edit Details Button */}
            <Pressable
              onPress={handleEditDetails}
              disabled={loading}
              className="bg-surface border border-border rounded-lg p-4 items-center"
            >
              <Text className="text-foreground font-semibold text-base">Edit Details</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
