import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenContainer } from '@/components/screen-container';
import { biometricService } from '@/lib/biometric-service';
import * as Haptics from 'expo-haptics';

interface CandidateForExam {
  candidateId: string;
  name: string;
  rollNumber: string;
  photoUri?: string;
}

export default function ExamDayScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [currentCandidate, setCurrentCandidate] = useState<CandidateForExam | null>(null);
  const [cameraMode, setCameraMode] = useState<'face' | 'fingerprint'>('face');
  const [faceMatchPercentage, setFaceMatchPercentage] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<'success' | 'failed' | null>(null);
  const [fingerprintStatus, setFingerprintStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleFaceCapture = async () => {
    if (!cameraRef.current || !currentCandidate) return;

    try {
      setIsCapturing(true);
      setIsMatching(true);

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      // Perform face matching
      const matchResult = await biometricService.matchFaceWithCandidate(
        photo.uri,
        currentCandidate.photoUri || '',
        currentCandidate.candidateId
      );
      const matchPercentage = matchResult.matchPercentage;

      setFaceMatchPercentage(matchPercentage);

      if (matchPercentage >= 90) {
        setMatchResult('success');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Face match: ${matchPercentage}%\nProceeding to fingerprint verification`);
        setCameraMode('fingerprint');
      } else {
        setMatchResult('failed');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Low Match', `Face match: ${matchPercentage}%\nPlease try again`);
      }
    } catch (error) {
      console.error('Face capture error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to capture face');
    } finally {
      setIsCapturing(false);
      setIsMatching(false);
    }
  };

  const handleFingerprintCapture = async () => {
    try {
      setIsCapturing(true);

      // Authenticate with fingerprint
      const isAuthenticated = await biometricService.authenticate();

      if (isAuthenticated) {
        setFingerprintStatus('success');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Fingerprint verified successfully');
        
        // Mark candidate as present
        // await offlineStorage.updateCandidateStatus(currentCandidate.candidateId, 'present');
        
        // Move to next candidate
        setCurrentCandidate(null);
        setCameraMode('face');
        setFaceMatchPercentage(0);
        setMatchResult(null);
        setFingerprintStatus('pending');
      } else {
        setFingerprintStatus('failed');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Failed', 'Fingerprint verification failed. Please try again');
      }
    } catch (error) {
      console.error('Fingerprint capture error:', error);
      setFingerprintStatus('failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Fingerprint verification failed');
    } finally {
      setIsCapturing(false);
    }
  };

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

  if (!currentCandidate) {
    return (
      <ScreenContainer className="bg-background items-center justify-center gap-4">
        <Text className="text-foreground font-semibold">Select a candidate to proceed</Text>
        <TouchableOpacity
          onPress={() => setCurrentCandidate({
            candidateId: '1',
            name: 'John Doe',
            rollNumber: 'A001',
          })}
          className="bg-primary rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Start Exam Day</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1">
        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
        />

        {/* Overlay */}
        <View className="absolute inset-0 bg-black/30 flex items-center justify-center">
          {/* Face Oval Guide */}
          {cameraMode === 'face' && (
            <View className="w-48 h-64 border-4 border-primary rounded-3xl" />
          )}

          {/* Fingerprint Guide */}
          {cameraMode === 'fingerprint' && (
            <View className="w-32 h-32 border-4 border-primary rounded-full" />
          )}
        </View>

        {/* Candidate Info */}
        <View className="absolute top-0 left-0 right-0 bg-black/50 p-4">
          <Text className="text-white font-semibold text-lg">{currentCandidate.name}</Text>
          <Text className="text-white/80 text-sm">Roll: {currentCandidate.rollNumber}</Text>
        </View>

        {/* Status Info */}
        <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 gap-3">
          {/* Mode Indicator */}
          <View className="flex-row gap-2">
            <View
              className={`flex-1 py-2 rounded-lg items-center ${
                cameraMode === 'face' ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <Text className="text-white font-semibold text-sm">Face Capture</Text>
            </View>
            <View
              className={`flex-1 py-2 rounded-lg items-center ${
                cameraMode === 'fingerprint' ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <Text className="text-white font-semibold text-sm">Fingerprint</Text>
            </View>
          </View>

          {/* Face Match Percentage */}
          {cameraMode === 'face' && faceMatchPercentage > 0 && (
            <View className="bg-white/10 rounded-lg p-3 gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold">Face Match</Text>
                <Text className={`text-lg font-bold ${faceMatchPercentage >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {faceMatchPercentage}%
                </Text>
              </View>
              <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                <View
                  className={`h-full ${faceMatchPercentage >= 90 ? 'bg-green-400' : 'bg-yellow-400'}`}
                  style={{ width: `${faceMatchPercentage}%` }}
                />
              </View>
            </View>
          )}

          {/* Capture Button */}
          <TouchableOpacity
            onPress={cameraMode === 'face' ? handleFaceCapture : handleFingerprintCapture}
            disabled={isCapturing || isMatching}
            className={`py-3 rounded-lg items-center ${
              isCapturing || isMatching ? 'bg-gray-600' : 'bg-primary'
            }`}
          >
            {isCapturing || isMatching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {cameraMode === 'face' ? 'Capture Face' : 'Verify Fingerprint'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            onPress={() => {
              setCurrentCandidate(null);
              setCameraMode('face');
            }}
            className="py-2 rounded-lg items-center bg-white/10"
          >
            <Text className="text-white font-semibold">Skip Candidate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
