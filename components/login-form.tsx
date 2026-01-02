import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from './screen-container';
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify session was saved
        const savedSession = await mockAuthService.getSession();
        console.log('Verified saved session:', savedSession);
        
        if (savedSession) {
          // Force a hard refresh by replacing the route
          router.replace('/(tabs)/home');
        } else {
          Alert.alert('Error', 'Session not saved properly');
        }
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
            <View style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#0a7ea4' }}>MPA</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#11181C' }}>Biometric Verification</Text>
              <Text style={{ fontSize: 14, color: '#687076' }}>Operator Login</Text>
            </View>

            {/* Form */}
            <View style={{ gap: 16 }}>
              {/* Operator Name */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C' }}>Operator Name</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    color: '#11181C',
                    fontSize: 16,
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#687076"
                  value={operatorName}
                  onChangeText={setOperatorName}
                  editable={!loading}
                />
              </View>

              {/* Mobile Number */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C' }}>Mobile Number</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    color: '#11181C',
                    fontSize: 16,
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#687076"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading}
                />
              </View>

              {/* Aadhaar Number */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C' }}>Aadhaar Number</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    color: '#11181C',
                    fontSize: 16,
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="12-digit Aadhaar number"
                  placeholderTextColor="#687076"
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
              style={{
                backgroundColor: '#0a7ea4',
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Text style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: 16,
              }}>Continue</Text>
            </Pressable>

            {/* Test Credentials */}
            <View style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 16,
              paddingHorizontal: 16,
              gap: 4,
            }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#11181C' }}>TEST CREDENTIALS:</Text>
              <Text style={{ fontSize: 12, color: '#687076' }}>Mobile: 9730018733</Text>
              <Text style={{ fontSize: 12, color: '#687076' }}>Aadhaar: 659999999978</Text>
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
            <View style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0a7ea4' }}>MPA</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#11181C' }}>Capture Selfie</Text>
            </View>

            {/* Camera View */}
            <View style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              overflow: 'hidden',
              height: 300,
              marginBottom: 16,
            }}>
              <Text style={{
                flex: 1,
                textAlign: 'center',
                textAlignVertical: 'center',
                color: '#687076',
              }}>📷 Camera Preview (Web)</Text>
            </View>

            {/* Capture Button */}
            <Pressable
              onPress={handleMockCapture}
              disabled={loading}
              style={{
                backgroundColor: '#0a7ea4',
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: 16,
              }}>Capture Selfie</Text>
            </Pressable>

            {/* Back Button */}
            <Pressable
              onPress={handleEditDetails}
              disabled={loading}
              style={{
                backgroundColor: '#E5E7EB',
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#11181C',
                fontWeight: 'bold',
                fontSize: 16,
              }}>Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // STEP 3: Review
  if (step === 'review') {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            <View style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0a7ea4' }}>MPA</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#11181C' }}>Review Details</Text>
            </View>

            {/* Selfie Preview */}
            <View style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              overflow: 'hidden',
              height: 250,
              marginBottom: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {selfieUri ? (
                <Image
                  source={{ uri: selfieUri }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text style={{ color: '#687076' }}>📷 Selfie Preview</Text>
              )}
            </View>

            {/* Details */}
            <View style={{ gap: 12 }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#687076' }}>Name</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#11181C' }}>{operatorName}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#687076' }}>Mobile</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#11181C' }}>{mobileNumber}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#687076' }}>Aadhaar</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#11181C' }}>****{aadhaarNumber.slice(-4)}</Text>
              </View>
            </View>

            {/* Confirm Button */}
            <Pressable
              onPress={handleConfirmLogin}
              disabled={loading}
              style={{
                backgroundColor: '#0a7ea4',
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Text style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: 16,
              }}>{loading ? 'Logging in...' : 'Confirm & Login'}</Text>
            </Pressable>

            {/* Retake Button */}
            <Pressable
              onPress={handleRetakeSelfie}
              disabled={loading}
              style={{
                backgroundColor: '#E5E7EB',
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#11181C',
                fontWeight: 'bold',
                fontSize: 16,
              }}>Retake Selfie</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
