import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

const ADMIN_PANEL_API = 'http://sepl-admin-portal.s3-website.ap-south-1.amazonaws.com';

export default function OperatorLoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<'form' | 'selfie' | 'loading'>('form');
  const [operatorName, setOperatorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCaptureSelfie = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result?.granted) {
        Alert.alert('Error', 'Camera permission required');
        return;
      }
    }
    setStep('selfie');
  };

  const handleTakeSelfie = async () => {
    try {
      if (!cameraRef.current) return;

      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        setSelfieImage(photo.uri);
        setStep('form');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture selfie');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!operatorName.trim()) {
      Alert.alert('Error', 'Please enter operator name');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter valid phone number');
      return;
    }
    if (!aadhaarNumber.trim() || aadhaarNumber.length !== 12) {
      Alert.alert('Error', 'Please enter valid 12-digit Aadhaar number');
      return;
    }
    if (!selfieImage) {
      Alert.alert('Error', 'Please capture selfie');
      return;
    }

    setLoading(true);
    try {
      // Check if same phone + exam already logged in
      const existingSessions = await AsyncStorage.getItem('operatorSessions');
      const sessions = existingSessions ? JSON.parse(existingSessions) : [];

      // Get current exam from admin panel
      const examResponse = await fetch(`${ADMIN_PANEL_API}/api/exams/current`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!examResponse.ok) {
        throw new Error('Failed to get current exam');
      }

      const examData = await examResponse.json();
      const currentExam = examData.exam;

      // Check for duplicate login
      const duplicateSession = sessions.find(
        (s: any) => s.phoneNumber === phoneNumber && s.exam === currentExam
      );

      if (duplicateSession) {
        Alert.alert(
          'Error',
          `This phone number is already logged in for ${currentExam}. Please logout from other device first.`
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setLoading(false);
        return;
      }

      // Validate with admin panel
      const loginResponse = await fetch(`${ADMIN_PANEL_API}/api/operator/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: operatorName.trim(),
          phoneNumber: phoneNumber.trim(),
          aadhaarNumber: aadhaarNumber.trim(),
          selfie: selfieImage,
          exam: currentExam,
        }),
      });

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        throw new Error(error.message || 'Login failed');
      }

      const loginData = await loginResponse.json();

      // Save operator session
      const operatorSession = {
        operatorId: loginData.operatorId,
        operatorName,
        phoneNumber,
        aadhaarNumber,
        exam: currentExam,
        centre: loginData.centre,
        token: loginData.token,
        loginTime: new Date().toISOString(),
        selfie: selfieImage,
      };

      // Add to sessions list
      sessions.push(operatorSession);
      await AsyncStorage.setItem('operatorSessions', JSON.stringify(sessions));
      await AsyncStorage.setItem('currentOperator', JSON.stringify(operatorSession));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to home
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Login Failed', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Selfie capture screen
  if (step === 'selfie') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {permission?.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="front"
            />

            {/* Overlay */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Guide Circle */}
              <View
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  borderWidth: 3,
                  borderColor: colors.primary,
                  opacity: 0.5,
                }}
              />

              {/* Instructions */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 100,
                  left: 20,
                  right: 20,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: 16,
                  borderRadius: 12,
                }}
              >
                <Text className="text-white text-center font-semibold">
                  Position your face in the circle and tap capture
                </Text>
              </View>
            </View>

            {/* Capture Button */}
            <View
              style={{
                position: 'absolute',
                bottom: 20,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={handleTakeSelfie}
                disabled={loading}
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="text-2xl">📷</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <ScreenContainer className="justify-center items-center">
            <Text className="text-foreground mb-4">Camera permission required</Text>
            <TouchableOpacity
              onPress={requestPermission}
              className="py-3 px-6 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">Grant Permission</Text>
            </TouchableOpacity>
          </ScreenContainer>
        )}
      </View>
    );
  }

  // Login form screen
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScreenContainer className="justify-center p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          {/* Header */}
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-full mb-4 items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-4xl">📱</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">MPA BIO</Text>
            <Text className="text-lg text-muted text-center">Operator Login</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Operator Name */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Operator Name</Text>
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor={colors.muted}
                value={operatorName}
                onChangeText={setOperatorName}
                editable={!loading}
                className="border rounded-lg px-4 py-3 text-foreground"
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Phone Number */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Phone Number</Text>
              <TextInput
                placeholder="Enter 10-digit phone number"
                placeholderTextColor={colors.muted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!loading}
                keyboardType="phone-pad"
                maxLength={10}
                className="border rounded-lg px-4 py-3 text-foreground"
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Aadhaar Number */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Aadhaar Number</Text>
              <TextInput
                placeholder="Enter 12-digit Aadhaar number"
                placeholderTextColor={colors.muted}
                value={aadhaarNumber}
                onChangeText={setAadhaarNumber}
                editable={!loading}
                keyboardType="number-pad"
                maxLength={12}
                className="border rounded-lg px-4 py-3 text-foreground"
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Selfie Section */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Selfie Photo</Text>
              {selfieImage ? (
                <View>
                  <Image
                    source={{ uri: selfieImage }}
                    style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 8 }}
                  />
                  <TouchableOpacity
                    onPress={handleCaptureSelfie}
                    disabled={loading}
                    className="py-2 rounded-lg items-center"
                    style={{ backgroundColor: colors.border }}
                  >
                    <Text className="text-foreground font-semibold">🔄 Retake Selfie</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleCaptureSelfie}
                  disabled={loading}
                  className="py-4 rounded-lg items-center border-2"
                  style={{
                    borderColor: colors.primary,
                    borderStyle: 'dashed',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <Text className="text-2xl mb-2">📷</Text>
                  <Text className="text-sm text-muted">Tap to capture selfie</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="py-3 rounded-lg items-center justify-center mt-4"
              style={{ backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-white font-semibold text-base">Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="mt-8 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
            <Text className="text-xs font-semibold text-muted mb-2">ℹ️ Important:</Text>
            <Text className="text-xs text-muted">
              • Use same phone for same exam to prevent duplicate logins
            </Text>
            <Text className="text-xs text-muted">
              • Selfie will be verified with Aadhaar
            </Text>
            <Text className="text-xs text-muted">
              • Admin can logout all devices anytime
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
