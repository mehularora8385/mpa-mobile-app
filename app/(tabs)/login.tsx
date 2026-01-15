import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

const ADMIN_PANEL_API = 'http://mpa-admin-portal.s3-website.ap-south-1.amazonaws.com';

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email if remember me was checked
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const saved = await AsyncStorage.getItem('rememberMe');
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        if (saved === 'true' && savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved email:', error);
      }
    };
    loadSavedEmail();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      // Authenticate with admin panel
      const response = await fetch(`${ADMIN_PANEL_API}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();

      // Verify operator data
      if (!data.operator) {
        throw new Error('No operator data received from admin panel');
      }

      // Save operator session
      const sessionData = {
        operatorId: data.operator.id,
        operatorName: data.operator.name,
        email: data.operator.email,
        centre: data.operator.centre,
        exam: data.operator.exam,
        token: data.token,
        adminPanelUrl: ADMIN_PANEL_API,
        loginTime: new Date().toISOString(),
      };

      await AsyncStorage.setItem('operatorSession', JSON.stringify(sessionData));

      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('savedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberMe');
        await AsyncStorage.removeItem('savedEmail');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to home
      router.replace('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScreenContainer className="justify-center p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          {/* Logo Area */}
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-full mb-4 items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-4xl">📱</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">MPA BIO</Text>
            <Text className="text-lg text-muted text-center">Biometric Verification System</Text>
            <Text className="text-xs text-muted mt-2">Connected to Admin Panel</Text>
          </View>

          {/* Login Form */}
          <View className="gap-4">
            {/* Email Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Email or Operator ID</Text>
              <TextInput
                placeholder="Enter your email or operator ID"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                className="border rounded-lg px-4 py-3 text-foreground"
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
              <View
                className="flex-row items-center border rounded-lg px-4 py-3"
                style={{ borderColor: colors.border, borderWidth: 1 }}
              >
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  className="flex-1 text-foreground"
                  style={{ color: colors.foreground }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                  <Text className="text-xl ml-2">{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => setRememberMe(!rememberMe)}
              disabled={loading}
            >
              <View
                className="w-5 h-5 rounded border-2"
                style={{
                  borderColor: rememberMe ? colors.primary : colors.border,
                  backgroundColor: rememberMe ? colors.primary : 'transparent',
                }}
              />
              <Text className="text-sm text-muted">Remember me</Text>
            </TouchableOpacity>

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

            {/* Forgot Password */}
            <TouchableOpacity disabled={loading}>
              <Text className="text-center text-sm" style={{ color: colors.primary }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Credentials */}
          <View className="mt-8 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
            <Text className="text-xs font-semibold text-muted mb-2">📌 Demo Credentials:</Text>
            <Text className="text-xs text-muted">Email: admin@mpa.com</Text>
            <Text className="text-xs text-muted">Password: Admin@2026</Text>
            <Text className="text-xs text-muted mt-2">🔗 Synced with Admin Panel</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
