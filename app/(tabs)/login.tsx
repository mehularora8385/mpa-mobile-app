import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { authService } from '@/lib/auth-service';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      if (!operatorId.trim() || !password.trim()) {
        setError('Please enter operator ID and password');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const session = await authService.login({
        operatorIdOrMobile: operatorId,
        password,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 justify-center gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-primary">Exam Operator</Text>
            <Text className="text-base text-muted text-center">
              Biometric Verification System
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-lg p-4">
              <Text className="text-error font-medium">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="gap-4">
            {/* Operator ID Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Operator ID or Mobile
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-4 text-foreground"
                placeholder="Enter operator ID or mobile"
                placeholderTextColor="#999"
                value={operatorId}
                onChangeText={setOperatorId}
                editable={!loading}
                keyboardType="default"
              />
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Password
              </Text>
              <View className="flex-row items-center bg-surface border border-border rounded-lg">
                <TextInput
                  className="flex-1 p-4 text-foreground"
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-4"
                  disabled={loading}
                >
                  <Text className="text-primary font-semibold">
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Device */}
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 border-2 border-primary rounded bg-primary" />
              <Text className="text-sm text-muted">Remember this device</Text>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }: any) => ([
              { backgroundColor: '#0066CC', borderRadius: 8, padding: 16, alignItems: 'center' },
              pressed && !loading && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ])}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Login</Text>
            )}
          </Pressable>

          {/* Register Link */}
          <View className="flex-row justify-center gap-2">
            <Text className="text-muted">New operator?</Text>
            <TouchableOpacity onPress={() => null}>
              <Text className="text-primary font-semibold">Register here</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className="items-center">
            <Text className="text-primary text-sm">Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
