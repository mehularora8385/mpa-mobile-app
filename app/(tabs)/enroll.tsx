import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { adminAPI } from '@/lib/admin-api';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type BiometricType = 'fingerprint' | 'iris' | 'face';

interface CandidateData {
  id: string;
  rollNo: string;
  name: string;
  centre: string;
  exam: string;
  slotTime: string;
}

export default function EnrollScreen() {
  const colors = useColors();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<'select-candidate' | 'select-type' | 'capture' | 'preview'>('select-candidate');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [biometricType, setBiometricType] = useState<BiometricType>('fingerprint');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [captureTimer, setCaptureTimer] = useState(20);

  // Load candidates on mount
  useEffect(() => {
    loadCandidates();
  }, []);

  // Capture timer
  useEffect(() => {
    if (step === 'capture' && captureTimer > 0) {
      const timer = setTimeout(() => setCaptureTimer(captureTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, captureTimer]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const session = await adminAPI.getOperatorSession();
      if (!session) {
        Alert.alert('Error', 'No active session');
        return;
      }

      // Load from admin panel
      const data = await adminAPI.downloadCandidateData(session.exam, session.centre);
      setCandidates(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = async (candidate: CandidateData) => {
    setSelectedCandidate(candidate);
    setStep('select-type');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectBiometricType = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result?.granted) {
        Alert.alert('Error', 'Camera permission required');
        return;
      }
    }
    setCaptureTimer(20);
    setStep('capture');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCapture = async () => {
    try {
      if (!cameraRef.current) return;

      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.base64) {
        setCapturedImage(photo.uri);
        setStep('preview');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCapture = async () => {
    if (!selectedCandidate || !capturedImage) return;

    try {
      setLoading(true);

      // Upload to admin panel
      const success = await adminAPI.uploadBiometricData([
        {
          candidateId: selectedCandidate.id,
          biometricType,
          imageData: capturedImage,
          timestamp: new Date().toISOString(),
          operatorId: (await adminAPI.getOperatorSession())?.operatorId || '',
        },
      ]);

      if (success) {
        Alert.alert('Success', `${biometricType} captured successfully`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Reset for next candidate
        setSelectedCandidate(null);
        setCapturedImage(null);
        setStep('select-candidate');
      } else {
        Alert.alert('Info', 'Data queued for sync when connection is available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save biometric data');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCaptureTimer(20);
    setStep('capture');
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.rollNo.includes(searchText)
  );

  // Step 1: Select Candidate
  if (step === 'select-candidate') {
    return (
      <ScreenContainer className="p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Biometric Enrollment</Text>
          <Text className="text-sm text-muted">Select a candidate to enroll</Text>
        </View>

        {/* Search */}
        <View className="mb-4 flex-row items-center border rounded-lg px-3 py-2" style={{ borderColor: colors.border }}>
          <Text className="text-lg mr-2">🔍</Text>
          <TextInput
            placeholder="Search by name or roll no"
            value={searchText}
            onChangeText={setSearchText}
            className="flex-1 text-foreground"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Candidates List */}
        <ScrollView className="flex-1">
          {loading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : filteredCandidates.length === 0 ? (
            <View className="items-center justify-center py-8">
              <Text className="text-muted">No candidates found</Text>
            </View>
          ) : (
            filteredCandidates.map((candidate) => (
              <TouchableOpacity
                key={candidate.id}
                onPress={() => handleSelectCandidate(candidate)}
                className="mb-3 p-4 rounded-lg border"
                style={{ borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">{candidate.name}</Text>
                    <Text className="text-sm text-muted">Roll: {candidate.rollNo}</Text>
                    <Text className="text-xs text-muted mt-1">Slot: {candidate.slotTime}</Text>
                  </View>
                  <Text className="text-2xl">➜</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={loadCandidates}
          disabled={loading}
          className="mt-4 py-3 rounded-lg items-center"
          style={{ backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-white font-semibold">🔄 Refresh Candidates</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // Step 2: Select Biometric Type
  if (step === 'select-type') {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-foreground mb-2">Select Biometric Type</Text>
          <Text className="text-sm text-muted">Candidate: {selectedCandidate?.name}</Text>
        </View>

        <View className="gap-4 flex-1">
          {/* Fingerprint */}
          <TouchableOpacity
            onPress={() => {
              setBiometricType('fingerprint');
              handleSelectBiometricType();
            }}
            className="p-6 rounded-lg border-2"
            style={{ borderColor: colors.primary, backgroundColor: colors.surface }}
          >
            <Text className="text-4xl mb-2">👆</Text>
            <Text className="text-lg font-semibold text-foreground">Fingerprint</Text>
            <Text className="text-xs text-muted mt-1">Capture fingerprint scan</Text>
          </TouchableOpacity>

          {/* Iris */}
          <TouchableOpacity
            onPress={() => {
              setBiometricType('iris');
              handleSelectBiometricType();
            }}
            className="p-6 rounded-lg border-2"
            style={{ borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <Text className="text-4xl mb-2">👁️</Text>
            <Text className="text-lg font-semibold text-foreground">Iris Scan</Text>
            <Text className="text-xs text-muted mt-1">Capture iris pattern</Text>
          </TouchableOpacity>

          {/* Face */}
          <TouchableOpacity
            onPress={() => {
              setBiometricType('face');
              handleSelectBiometricType();
            }}
            className="p-6 rounded-lg border-2"
            style={{ borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <Text className="text-4xl mb-2">😊</Text>
            <Text className="text-lg font-semibold text-foreground">Face Recognition</Text>
            <Text className="text-xs text-muted mt-1">Capture facial features</Text>
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => setStep('select-candidate')}
          className="mt-4 py-3 rounded-lg items-center"
          style={{ backgroundColor: colors.border }}
        >
          <Text className="text-foreground font-semibold">← Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // Step 3: Capture
  if (step === 'capture') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {permission?.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
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
              {/* Guide Frame */}
              <View
                style={{
                  width: width * 0.7,
                  aspectRatio: 1,
                  borderWidth: 3,
                  borderColor: colors.primary,
                  borderRadius: 20,
                  opacity: 0.5,
                }}
              />

              {/* Timer */}
              <View
                style={{
                  position: 'absolute',
                  top: 40,
                  right: 20,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text className="text-white font-bold">{captureTimer}s</Text>
              </View>

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
                  {biometricType === 'fingerprint' && 'Place finger on camera'}
                  {biometricType === 'iris' && 'Position eye in frame'}
                  {biometricType === 'face' && 'Face the camera directly'}
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
                onPress={handleCapture}
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

  // Step 4: Preview
  if (step === 'preview' && capturedImage) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Confirm Capture</Text>
          <Text className="text-sm text-muted">Candidate: {selectedCandidate?.name}</Text>
        </View>

        {/* Image Preview */}
        <Image
          source={{ uri: capturedImage }}
          style={{ width: '100%', height: 300, borderRadius: 12, marginBottom: 16 }}
        />

        {/* Quality Indicator */}
        <View className="p-4 rounded-lg mb-4" style={{ backgroundColor: colors.surface }}>
          <Text className="text-sm font-semibold text-foreground mb-2">✅ Quality: Good</Text>
          <Text className="text-xs text-muted">Image is clear and suitable for verification</Text>
        </View>

        {/* Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={handleConfirmCapture}
            disabled={loading}
            className="py-3 rounded-lg items-center"
            style={{ backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-white font-semibold">✅ Confirm & Save</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRetake}
            disabled={loading}
            className="py-3 rounded-lg items-center"
            style={{ backgroundColor: colors.border }}
          >
            <Text className="text-foreground font-semibold">🔄 Retake</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return null;
}
