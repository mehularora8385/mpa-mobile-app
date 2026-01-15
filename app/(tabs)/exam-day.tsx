import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import OMRCameraScanner from '@/components/OMRCameraScanner';
import { ScreenContainer } from '@/components/screen-container';
import { mockCandidatesService } from '@/lib/mock-candidates';
import { useState } from 'react';

export default function VerificationScreen() {
  const [step, setStep] = useState<'search' | 'capture' | 'fingerprint' | 'omr'>('search');
  const [rollNo, setRollNo] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [fingerprintScanned, setFingerprintScanned] = useState(false);
  const [omrSerial, setOmrSerial] = useState('');
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSearch = async () => {
    if (!rollNo.trim()) {
      Alert.alert('Error', 'Please enter a roll number');
      return;
    }

    setLoading(true);
    try {
      const found = mockCandidatesService.getCandidateByRollNo(rollNo);
      if (found) {
        setCandidate(found);
        setStep('capture');
        setPhotoTaken(false);
        setFingerprintScanned(false);
        setOmrSerial('');
      } else {
        Alert.alert('Not Found', 'Candidate not found');
        setCandidate(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to search candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    setLoading(true);
    try {
      // Simulate camera capture
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPhotoTaken(true);
      setStep('fingerprint');
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setLoading(false);
    }
  };

  const handleScanFingerprint = async () => {
    setLoading(true);
    try {
      // Simulate fingerprint scan
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFingerprintScanned(true);
      setStep('omr');
    } catch (err) {
      Alert.alert('Error', 'Failed to scan fingerprint');
    } finally {
      setLoading(false);
    }
  };

    const handleOMRScanSuccess = (result) => {
    setOmrSerial(result.serialNumber);
    setScannerVisible(false);
    Alert.alert('Scan Successful', `OMR Serial Number: ${result.serialNumber}`);
  };

  const handleVerify = async () => {
    if (!omrSerial.trim()) {
      Alert.alert('Error', 'Please enter OMR serial number');
      return;
    }

    setVerifying(true);
    try {
      const updated = mockCandidatesService.markVerified(
        candidate.rollNo,
        'photo_uri',
        'fingerprint_data',
        omrSerial
      );
      if (updated) {
        Alert.alert('Success', `${candidate.name} verified successfully ✓`);
        // Reset
        setRollNo('');
        setCandidate(null);
        setStep('search');
        setPhotoTaken(false);
        setFingerprintScanned(false);
        setOmrSerial('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify candidate');
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setRollNo('');
    setCandidate(null);
    setStep('search');
    setPhotoTaken(false);
    setFingerprintScanned(false);
    setOmrSerial('');
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Verification</Text>
            <Text className="text-sm text-muted">Biometric verification process</Text>
          </View>

          {/* Step 1: Search */}
          {step === 'search' && (
            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Enter Roll Number</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholder="Roll number"
                    placeholderTextColor="#999"
                    value={rollNo}
                    onChangeText={setRollNo}
                    editable={!loading}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={handleSearch}
                    disabled={loading || !rollNo.trim()}
                    className="bg-primary rounded-lg px-4 items-center justify-center"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-semibold">Search</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Capture Photo */}
          {step === 'capture' && candidate && (
            <View className="gap-4">
              <View className="bg-surface border border-border rounded-lg p-4 gap-3">
                <Text className="text-sm font-semibold text-foreground">Candidate: {candidate.name}</Text>
                <Text className="text-xs text-muted">Roll: {candidate.rollNo}</Text>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Step 1: Take Photo</Text>
                <View className="bg-primary/10 border-2 border-dashed border-primary rounded-lg p-8 items-center justify-center gap-3">
                  {photoTaken ? (
                    <>
                      <Text className="text-4xl">📷</Text>
                      <Text className="text-sm font-semibold text-success">Photo Captured ✓</Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-4xl">📸</Text>
                      <Text className="text-xs text-muted text-center">Position face in frame and tap button</Text>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleTakePhoto}
                  disabled={loading || photoTaken}
                  className={`rounded-lg p-4 items-center ${photoTaken ? 'bg-success/20' : 'bg-primary'}`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : photoTaken ? (
                    <Text className="text-success font-semibold">✓ Photo Taken</Text>
                  ) : (
                    <Text className="text-white font-semibold">Take Photo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Scan Fingerprint */}
          {step === 'fingerprint' && candidate && (
            <View className="gap-4">
              <View className="bg-surface border border-border rounded-lg p-4 gap-3">
                <Text className="text-sm font-semibold text-foreground">Candidate: {candidate.name}</Text>
                <Text className="text-xs text-muted">Roll: {candidate.rollNo}</Text>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Step 2: Scan Fingerprint</Text>
                <Text className="text-xs text-muted">Using MFS100/MFS110 Scanner</Text>

                <View className="bg-primary/10 border-2 border-dashed border-primary rounded-lg p-8 items-center justify-center gap-3">
                  {fingerprintScanned ? (
                    <>
                      <Text className="text-4xl">👆</Text>
                      <Text className="text-sm font-semibold text-success">Fingerprint Scanned ✓</Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-4xl">🔍</Text>
                      <Text className="text-xs text-muted text-center">Place finger on scanner</Text>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleScanFingerprint}
                  disabled={loading || fingerprintScanned}
                  className={`rounded-lg p-4 items-center ${fingerprintScanned ? 'bg-success/20' : 'bg-primary'}`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : fingerprintScanned ? (
                    <Text className="text-success font-semibold">✓ Fingerprint Scanned</Text>
                  ) : (
                    <Text className="text-white font-semibold">Scan Fingerprint</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 4: Enter OMR Serial */}
          {step === 'omr' && candidate && (
            <View className="gap-4">
              <View className="bg-surface border border-border rounded-lg p-4 gap-3">
                <Text className="text-sm font-semibold text-foreground">Candidate: {candidate.name}</Text>
                <Text className="text-xs text-muted">Roll: {candidate.rollNo}</Text>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Step 3: OMR Serial Number</Text>
                <Text className="text-xs text-muted">Enter or scan OMR serial number</Text>
                  <TouchableOpacity onPress={() => setScannerVisible(true)} className="bg-secondary rounded-lg p-3 items-center justify-center mt-2">
                    <Text className="text-white font-semibold">Scan OMR with Camera</Text>
                  </TouchableOpacity>

                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholder="OMR-2026-001-15"
                    placeholderTextColor="#999"
                    value={omrSerial}
                    onChangeText={setOmrSerial}
                    editable={!verifying}
                  />
                  <TouchableOpacity
                    disabled={verifying}
                    className="bg-primary rounded-lg px-4 items-center justify-center"
                  >
                    <Text className="text-white font-semibold text-sm">Scan</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Verification Summary */}
              <View className="bg-success/10 border border-success rounded-lg p-4 gap-2">
                <Text className="text-xs font-semibold text-success">Verification Summary</Text>
                <View className="gap-1">
                  <Text className="text-xs text-foreground">✓ Photo Captured</Text>
                  <Text className="text-xs text-foreground">✓ Fingerprint Scanned</Text>
                  <Text className="text-xs text-foreground">✓ OMR Serial: {omrSerial || 'Pending'}</Text>
                </View>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={handleVerify}
                disabled={verifying || !omrSerial.trim()}
                className="bg-success rounded-lg p-4 items-center"
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">✓ Mark Verified</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Reset Button */}
          {candidate && (
            <TouchableOpacity
              onPress={handleReset}
              disabled={loading || verifying}
              className="bg-surface border border-border rounded-lg p-4 items-center"
            >
              <Text className="text-foreground font-semibold">Reset</Text>
            </TouchableOpacity>
          )}

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2 mt-4">
            <Text className="text-xs font-semibold text-primary">ℹ️ Verification Steps</Text>
            <Text className="text-xs text-foreground leading-relaxed">
              1. Enter candidate roll number{'\n'}
              2. Capture candidate photo{'\n'}
              3. Scan fingerprint (MFS100/MFS110){'\n'}
              4. Enter OMR serial number{'\n'}
              5. Mark verified
            </Text>
          </View>
        </View>
      </ScrollView>
        <Modal
          animationType="slide"
          transparent={false}
          visible={isScannerVisible}
          onRequestClose={() => setScannerVisible(false)}
        >
          <OMRCameraScanner 
            onScanSuccess={handleOMRScanSuccess} 
            onClose={() => setScannerVisible(false)} 
          />
        </Modal>
    </ScreenContainer>
  );
}
