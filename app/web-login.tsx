import { useRouter } from 'expo-router';
import { View, Text, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

export default function WebLoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [operatorName, setOperatorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = () => {
    setError('');
    
    if (!operatorName.trim()) {
      setError('Please enter operator name');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    
    setStep('review');
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check if same phone number already logged in
      const existingOperator = await AsyncStorage.getItem('currentOperator');
      if (existingOperator) {
        const existing = JSON.parse(existingOperator);
        if (existing.phoneNumber === phoneNumber.trim()) {
          setError('This phone number is already logged in. Please logout first or use a different device.');
          setLoading(false);
          return;
        }
      }

      // Save operator session
      const operatorSession = {
        operatorId: `OP_${Date.now()}`,
        operatorName: operatorName.trim(),
        phoneNumber: phoneNumber.trim(),
        aadhaarNumber: aadhaarNumber.trim(),
        selfie: 'web-mock-selfie',
        loginTime: new Date().toISOString(),
      };

      await AsyncStorage.setItem('currentOperator', JSON.stringify(operatorSession));
      
      // Navigate to home
      router.replace('/(tabs)/home');
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('form');
    setError('');
  };

  // Review screen
  if (step === 'review') {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="gap-6">
            {/* Header */}
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-primary">MPA BIO</Text>
              <Text className="text-lg font-semibold text-foreground">Review Details</Text>
            </View>

            {/* Details */}
            <View className="bg-surface rounded-lg p-4 border border-border gap-4">
              <View className="gap-2">
                <Text className="text-xs font-semibold text-muted">Operator Name</Text>
                <Text className="text-base font-semibold text-foreground">{operatorName}</Text>
              </View>
              
              <View className="h-px bg-border" />
              
              <View className="gap-2">
                <Text className="text-xs font-semibold text-muted">Phone Number</Text>
                <Text className="text-base font-semibold text-foreground">+91 {phoneNumber}</Text>
              </View>
              
              <View className="h-px bg-border" />
              
              <View className="gap-2">
                <Text className="text-xs font-semibold text-muted">Aadhaar Number</Text>
                <Text className="text-base font-semibold text-foreground">****{aadhaarNumber.slice(-4)}</Text>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-sm text-error">{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: '#0a7ea4',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Logging in...' : 'Confirm & Login'}
            </button>

            {/* Back Button */}
            <button
              onClick={handleBack}
              disabled={loading}
              style={{
                backgroundColor: '#E5E7EB',
                color: '#11181C',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Back
            </button>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Form screen
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-primary">MPA BIO</Text>
            <Text className="text-lg font-semibold text-foreground">Operator Login</Text>
            <Text className="text-sm text-muted">Web Version</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-3">
              <Text className="text-sm text-error">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-4">
            {/* Operator Name */}
            <View className="gap-2">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#11181C' }}>
                Operator Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                disabled={loading}
                style={{
                  borderWidth: '1px',
                  borderColor: '#E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#11181C',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  opacity: loading ? 0.6 : 1,
                }}
              />
            </View>

            {/* Phone Number */}
            <View className="gap-2">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#11181C' }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                disabled={loading}
                style={{
                  borderWidth: '1px',
                  borderColor: '#E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#11181C',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  opacity: loading ? 0.6 : 1,
                }}
              />
            </View>

            {/* Aadhaar Number */}
            <View className="gap-2">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#11181C' }}>
                Aadhaar Number
              </label>
              <input
                type="password"
                placeholder="Enter 12-digit Aadhaar number"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                maxLength={12}
                disabled={loading}
                style={{
                  borderWidth: '1px',
                  borderColor: '#E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#11181C',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  opacity: loading ? 0.6 : 1,
                }}
              />
            </View>
          </View>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={loading}
            style={{
              backgroundColor: '#0a7ea4',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Continue
          </button>

          {/* Test Credentials */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-2">
            <Text className="text-xs font-semibold text-foreground">TEST CREDENTIALS:</Text>
            <Text className="text-xs text-muted">Mobile: 9730018733</Text>
            <Text className="text-xs text-muted">Aadhaar: 659999999978</Text>
            <Text className="text-xs text-muted">Name: Mehul Arora</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
