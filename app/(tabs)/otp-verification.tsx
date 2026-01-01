import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import * as Haptics from 'expo-haptics';

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    try {
      setError('');
      setLoading(true);

      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
        setError('Please enter complete OTP');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Call verification API
      const response = await fetch(
        'https://api.examination-system.com/api/auth/verify-operator-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp: otpCode }),
        }
      );

      if (!response.ok) {
        throw new Error('Invalid OTP');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'OTP verified successfully');
      
      // Navigate to exam day workflow
      // router.push('/(tabs)/exam-day');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      // Call resend OTP API
      const response = await fetch(
        'https://api.examination-system.com/api/auth/resend-operator-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      setTimer(300);
      setOtp(['', '', '', '', '', '']);
      setError('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'OTP resent to your registered mobile');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Resend failed';
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 justify-center gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-primary">Verify OTP</Text>
            <Text className="text-sm text-muted text-center">
              Enter the 6-digit OTP sent to your registered mobile number
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-lg p-4">
              <Text className="text-error font-medium">{error}</Text>
            </View>
          ) : null}

          {/* OTP Input Fields */}
          <View className="gap-6">
            <View className="flex-row justify-between gap-2">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  className="flex-1 h-16 bg-surface border-2 border-border rounded-lg text-center text-2xl font-bold text-foreground"
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={value => handleOtpChange(value, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  editable={!loading && timer > 0}
                  placeholder="-"
                  placeholderTextColor="#ccc"
                />
              ))}
            </View>

            {/* Timer */}
            <View className="items-center">
              <Text className={`text-sm font-semibold ${timer < 60 ? 'text-error' : 'text-muted'}`}>
                Time remaining: {formatTime(timer)}
              </Text>
            </View>
          </View>

          {/* Verify Button */}
          <Pressable
            onPress={handleVerify}
            disabled={loading || timer === 0}
            style={({ pressed }: any) => ([
              { backgroundColor: '#0066CC', borderRadius: 8, padding: 16, alignItems: 'center' },
              pressed && !loading && { opacity: 0.8 },
            ])}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Verify OTP</Text>
            )}
          </Pressable>

          {/* Resend OTP */}
          <View className="flex-row justify-center gap-2">
            <Text className="text-muted text-sm">Didn't receive OTP?</Text>
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={loading || timer > 0}
            >
              <Text className={`font-semibold text-sm ${timer > 0 ? 'text-muted' : 'text-primary'}`}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
            <Text className="font-semibold text-primary">Important</Text>
            <Text className="text-sm text-foreground">
              • OTP is valid for 5 minutes{'\n'}
              • OTP is generated by admin panel{'\n'}
              • Use this OTP for on-site verification{'\n'}
              • Each OTP can be used only once
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
