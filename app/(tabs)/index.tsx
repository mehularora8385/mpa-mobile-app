import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { mockAuthService } from '@/lib/auth-mock';

type LoginStep = 'form' | 'camera' | 'review';

export default function LoginScreen() {
  const router = useRouter();
  
  // Form state
  const [operatorName, setOperatorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Navigation state
  const [currentStep, setCurrentStep] = useState<LoginStep>('form');
  const [selfieUri, setSelfieUri] = useState('');

  const validateForm = () => {
    setError('');
    if (!operatorName.trim()) {
      setError('Please enter operator name');
      return false;
    }
    if (mobileNumber.length !== 10) {
      setError('Please enter valid 10-digit mobile number');
      return false;
    }
    if (aadhaarNumber.length !== 12) {
      setError('Please enter valid 12-digit Aadhaar number');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;
    setCurrentStep('camera');
    setError('');
  };

  const handleCaptureSelfie = () => {
    setSelfieUri('https://via.placeholder.com/200');
    setCurrentStep('review');
    setError('');
  };

  const handleRetakeSelfie = () => {
    setSelfieUri('');
    setCurrentStep('camera');
    setError('');
  };

  const handleEditDetails = () => {
    setSelfieUri('');
    setCurrentStep('form');
    setError('');
  };

  const handleConfirmLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await mockAuthService.login({
        operatorName,
        mobileNumber,
        aadhaarNumber,
        selfieUri,
      });
      
      if (result && (result.success || result.operatorId)) {
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 500);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Login Form Screen
  if (currentStep === 'form') {
    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
          <View className="flex-1 gap-6 justify-center">
            <View className="items-center gap-2">
              <Text className="text-4xl font-bold text-primary">SEPL</Text>
              <Text className="text-lg font-semibold text-foreground">Biometric Verification</Text>
              <Text className="text-sm text-muted">Operator Login</Text>
            </View>

            {error && (
              <View className="bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}

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

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Aadhaar Number</Text>
              <TextInput 
                placeholder="12-digit Aadhaar number" 
                value={aadhaarNumber} 
                onChangeText={(text) => setAadhaarNumber(text.replace(/\D/g, '').slice(0, 12))} 
                keyboardType="numeric" 
                maxLength={12} 
                className="border border-border rounded-lg p-3 text-foreground bg-surface" 
                placeholderTextColor="#999" 
                editable={!loading} 
              />
            </View>

            <TouchableOpacity 
              onPress={handleContinue} 
              disabled={loading} 
              className="bg-primary px-6 py-4 rounded-lg items-center mt-4"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Continue</Text>
            </TouchableOpacity>

            <View className="border border-border rounded-lg p-4 bg-surface mt-4">
              <Text className="text-xs font-bold text-foreground mb-2">📋 TEST CREDENTIALS:</Text>
              <Text className="text-xs text-muted">Mobile: 9730018733</Text>
              <Text className="text-xs text-muted">Aadhaar: 659999999978</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // STEP 2: Camera Screen
  if (currentStep === 'camera') {
    return (
      <ScreenContainer className="bg-black flex-1">
        <View className="flex-1 gap-4 justify-center items-center px-6">
          <Text className="text-white text-2xl font-bold">📷 Capture Selfie</Text>
          <Text className="text-white/70 text-center text-sm mb-4">Point camera at your face and take a selfie</Text>
          
          <View className="w-64 h-72 bg-gray-800 rounded-2xl border-4 border-white items-center justify-center my-8 shadow-lg">
            <Text className="text-white text-center text-lg font-semibold">Camera Preview</Text>
            <Text className="text-white/50 text-xs mt-2">Position your face in frame</Text>
          </View>

          <TouchableOpacity 
            onPress={handleCaptureSelfie}
            className="w-full bg-primary py-4 rounded-lg items-center mb-3 shadow-md"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold text-base">✓ Capture Selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setCurrentStep('form')}
            className="w-full bg-error py-4 rounded-lg items-center shadow-md"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold text-base">✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // STEP 3: Review Details Screen
  if (currentStep === 'review' && selfieUri) {
    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
          <View className="gap-6">
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-primary">SEPL</Text>
              <Text className="text-lg font-semibold text-foreground">Biometric Verification</Text>
              <Text className="text-sm text-muted">Review Details</Text>
            </View>

            <Text className="text-center text-foreground font-semibold">Verify your information</Text>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Your Selfie</Text>
              <View className="w-full h-48 bg-surface border-2 border-primary rounded-lg overflow-hidden items-center justify-center shadow-md">
                <Text className="text-muted text-lg">📷 Selfie Preview</Text>
              </View>
            </View>

            <View className="gap-3 bg-surface border border-border rounded-lg p-4 shadow-sm">
              <View className="pb-3 border-b border-border">
                <Text className="text-xs text-muted font-semibold mb-1">Operator Name</Text>
                <Text className="text-foreground font-medium text-base">{operatorName}</Text>
              </View>
              <View className="pb-3 border-b border-border">
                <Text className="text-xs text-muted font-semibold mb-1">Mobile Number</Text>
                <Text className="text-foreground font-medium text-base">+91 {mobileNumber}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted font-semibold mb-1">Aadhaar Number</Text>
                <Text className="text-foreground font-medium text-base">{aadhaarNumber.slice(0, 2)}****{aadhaarNumber.slice(-2)}</Text>
              </View>
            </View>

            {error && (
              <View className="bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}

            <TouchableOpacity 
              onPress={handleConfirmLogin} 
              disabled={loading} 
              className="bg-primary px-6 py-4 rounded-lg items-center shadow-md"
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Confirm & Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleRetakeSelfie}
              disabled={loading}
              className="bg-surface border border-border px-6 py-3 rounded-lg items-center shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-foreground font-semibold">Retake Selfie</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleEditDetails}
              disabled={loading}
              className="bg-surface border border-border px-6 py-3 rounded-lg items-center shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-foreground font-semibold">Edit Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
