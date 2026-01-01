import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { ScreenContainer } from '@/components/screen-container';
import { mockAuthService } from '@/lib/auth-mock';

export default function LoginScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [operatorName, setOperatorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieUri, setSelfieUri] = useState('');
  const [reviewMode, setReviewMode] = useState(false);

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

  const handleContinue = async () => {
    if (!validateForm()) return;
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setCameraActive(true);
  };

  const handleCaptureSelfie = async () => {
    setSelfieUri('https://via.placeholder.com/200');
    setCameraActive(false);
    setReviewMode(true);
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

  if (cameraActive && !reviewMode) {
    return (
      <ScreenContainer className="bg-black">
        <View className="flex-1 gap-4 justify-center items-center">
          <Text className="text-white text-lg font-semibold">📷 Capture Selfie</Text>
          <View className="w-48 h-48 bg-gray-700 rounded-lg border-2 border-white items-center justify-center">
            <Text className="text-white">Camera Preview</Text>
          </View>
          <TouchableOpacity onPress={handleCaptureSelfie} className="bg-primary px-8 py-3 rounded-lg">
            <Text className="text-white font-bold">Capture Selfie</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCameraActive(false)} className="bg-error px-8 py-3 rounded-lg">
            <Text className="text-white font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (reviewMode && selfieUri) {
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
              <View className="w-full h-48 bg-surface border border-border rounded-lg overflow-hidden items-center justify-center">
                <Text className="text-muted">📷 Selfie Preview</Text>
              </View>
            </View>
            <View className="gap-3 bg-surface border border-border rounded-lg p-4">
              <View>
                <Text className="text-xs text-muted font-semibold mb-1">Operator Name</Text>
                <Text className="text-foreground font-medium">{operatorName}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted font-semibold mb-1">Mobile Number</Text>
                <Text className="text-foreground font-medium">+91 {mobileNumber}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted font-semibold mb-1">Aadhaar Number</Text>
                <Text className="text-foreground font-medium">{aadhaarNumber.slice(0, 2)}****{aadhaarNumber.slice(-2)}</Text>
              </View>
            </View>
            {error && (
              <View className="bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}
            <TouchableOpacity onPress={handleConfirmLogin} disabled={loading} className="bg-primary px-6 py-4 rounded-lg items-center">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Confirm & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelfieUri(''); setReviewMode(false); setCameraActive(true); }} className="bg-surface border border-border px-6 py-3 rounded-lg items-center">
              <Text className="text-foreground font-semibold">Retake Selfie</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReviewMode(false)} className="bg-surface border border-border px-6 py-3 rounded-lg items-center">
              <Text className="text-foreground font-semibold">Edit Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

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
            <TextInput placeholder="Enter your full name" value={operatorName} onChangeText={setOperatorName} className="border border-border rounded-lg p-3 text-foreground bg-surface" placeholderTextColor="#999" editable={!loading} />
          </View>
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Mobile Number</Text>
            <TextInput placeholder="10-digit mobile number" value={mobileNumber} onChangeText={(text) => setMobileNumber(text.replace(/\D/g, '').slice(0, 10))} keyboardType="numeric" maxLength={10} className="border border-border rounded-lg p-3 text-foreground bg-surface" placeholderTextColor="#999" editable={!loading} />
          </View>
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Aadhaar Number</Text>
            <TextInput placeholder="12-digit Aadhaar number" value={aadhaarNumber} onChangeText={(text) => setAadhaarNumber(text.replace(/\D/g, '').slice(0, 12))} keyboardType="numeric" maxLength={12} className="border border-border rounded-lg p-3 text-foreground bg-surface" placeholderTextColor="#999" editable={!loading} />
          </View>
          <TouchableOpacity onPress={handleContinue} disabled={loading} className="bg-primary px-6 py-4 rounded-lg items-center mt-4">
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
