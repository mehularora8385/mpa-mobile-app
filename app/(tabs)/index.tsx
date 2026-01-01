import { useState, useRef, useEffect } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenContainer } from '@/components/screen-container';
import { mockAuthService } from '@/lib/auth-mock';

type LoginStep = 'form' | 'camera' | 'review';

export default function LoginScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  
  const [operatorName, setOperatorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoginStep>('form');
  const [selfieUri, setSelfieUri] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    if (permission?.granted) {
      return;
    } else if (permission?.canAskAgain) {
      await requestPermission();
    }
  };

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
    
    // Try to request camera permission, but don't block if it fails (for web testing)
    if (!permission?.granted && permission?.canAskAgain) {
      try {
        const result = await requestPermission();
        if (!result?.granted) {
          // On web, camera permission might not be available - allow proceeding with mock
          if (Platform.OS === 'web') {
            console.log('Camera permission not available on web, using mock image');
          } else {
            setError('Camera permission is required to capture selfie');
            return;
          }
        }
      } catch (err) {
        console.log('Camera permission error:', err);
        // Continue anyway for web testing
      }
    }
    
    setCurrentStep('camera');
    setError('');
  };

  const handleCaptureSelfie = async () => {
    if (!cameraRef.current || !cameraReady) {
      setError('Camera is not ready. Please try again.');
      return;
    }

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setSelfieUri(photo.uri);
        setCurrentStep('review');
        setError('');
      } else {
        setError('Failed to capture selfie. Please try again.');
      }
    } catch (err: any) {
      setError('Failed to capture selfie. Please try again.');
      console.error('Capture error:', err);
    } finally {
      setLoading(false);
    }
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
      
      if (result && (result.success || result.data || result.operatorId)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.replace('/(tabs)/home');
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during login');
      console.error('Login error:', err);
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

            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            ) : null}

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
              <Text className="text-xs font-bold text-foreground mb-2">TEST CREDENTIALS:</Text>
              <Text className="text-xs text-muted">Mobile: 9730018733</Text>
              <Text className="text-xs text-muted">Aadhaar: 659999999978</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // STEP 2: Camera Screen with Real Camera or Mock for Web
  if (currentStep === 'camera') {
    // Mock camera for web testing
    if (Platform.OS === 'web' || !permission?.granted) {
      const handleMockCapture = () => {
        // Create a mock image URI for testing
        setSelfieUri('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzMzMzMyIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNjAiIGZpbGw9IiM2NjY2NjYiLz48ZWxsaXBzZSBjeD0iMjAwIiBjeT0iMjUwIiByeD0iOTAiIHJ5PSIxMjAiIGZpbGw9IiM2NjY2NjYiLz48dGV4dCB4PSIyMDAiIHk9IjM2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxOCIgZm9udC1mYW1pbHk9IkFyaWFsIj5Nb2NrIFNlbGZpZTwvdGV4dD48L3N2Zz4=');
        setCurrentStep('review');
      };

      return (
        <ScreenContainer className="bg-background flex-1 justify-center items-center px-6">
          <View className="gap-4 items-center">
            <Text className="text-2xl font-bold text-foreground">Camera Preview</Text>
            <Text className="text-center text-muted text-sm">Web Browser - Using Mock Image for Testing</Text>
            <View className="w-full h-64 bg-gray-700 rounded-lg items-center justify-center mt-4 mb-4">
              <Text className="text-gray-400 text-center">📷 Mock Camera Preview</Text>
            </View>
            <TouchableOpacity 
              onPress={handleMockCapture}
              disabled={loading}
              className="w-full bg-primary py-4 rounded-lg items-center shadow-md"
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Capture Selfie (Mock)</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setCurrentStep('form')}
              disabled={loading}
              className="w-full bg-error py-4 rounded-lg items-center shadow-md"
              activeOpacity={0.7}
            >
              <Text className="text-white font-bold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScreenContainer>
      );
    }

    return (
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
          onCameraReady={() => setCameraReady(true)}
        />
        
        <View className="absolute bottom-0 left-0 right-0 bg-black/80 px-6 py-6 gap-3">
          <TouchableOpacity 
            onPress={handleCaptureSelfie}
            disabled={loading || !cameraReady}
            className="w-full bg-primary py-4 rounded-lg items-center shadow-md"
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Capture Selfie</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setCurrentStep('form')}
            disabled={loading}
            className="w-full bg-error py-4 rounded-lg items-center shadow-md"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold text-base">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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
              <Image
                source={{ uri: selfieUri }}
                style={{ width: '100%', height: 200, borderRadius: 12, borderWidth: 2 }}
              />
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

            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              onPress={handleConfirmLogin} 
              disabled={loading} 
              className="bg-primary px-6 py-4 rounded-lg items-center shadow-md"
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Confirm and Login</Text>
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
