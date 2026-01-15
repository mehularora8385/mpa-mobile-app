import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { appLockService } from '@/lib/app-lock-service';
import * as Haptics from 'expo-haptics';

export default function AppLockScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isTemporarilyLocked, setIsTemporarilyLocked] = useState(false);
  const [lockTimeoutRemaining, setLockTimeoutRemaining] = useState(0);

  useEffect(() => {
    checkLockStatus();
    const interval = setInterval(updateLockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkLockStatus = async () => {
    try {
      const isLocked = await appLockService.isTemporarilyLocked();
      setIsTemporarilyLocked(isLocked);

      if (isLocked) {
        const remaining = await appLockService.getLockTimeoutRemaining();
        setLockTimeoutRemaining(remaining);
      }

      const attempts = await appLockService.getRemainingAttempts();
      setRemainingAttempts(attempts);
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  };

  const updateLockStatus = async () => {
    if (isTemporarilyLocked) {
      const remaining = await appLockService.getLockTimeoutRemaining();
      setLockTimeoutRemaining(remaining);

      if (remaining <= 0) {
        setIsTemporarilyLocked(false);
        setError('');
        await checkLockStatus();
      }
    }
  };

  const handleUnlock = async () => {
    try {
      setError('');
      setLoading(true);
      Keyboard.dismiss();

      if (!password.trim()) {
        setError('Please enter password');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      await appLockService.unlockApp(password);
      setPassword('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unlock failed';
      setError(errorMessage);
      setPassword('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Update attempts
      const attempts = await appLockService.getRemainingAttempts();
      setRemainingAttempts(attempts);

      // Check if temporarily locked
      const locked = await appLockService.isTemporarilyLocked();
      if (locked) {
        setIsTemporarilyLocked(true);
        const remaining = await appLockService.getLockTimeoutRemaining();
        setLockTimeoutRemaining(remaining);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 items-center justify-center p-6 gap-8">
        {/* Header */}
        <View className="items-center gap-2">
          <Text className="text-5xl font-bold text-primary">🔒</Text>
          <Text className="text-3xl font-bold text-foreground">App Locked</Text>
          <Text className="text-sm text-muted text-center">
            Enter password to unlock
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View className="w-full bg-error/10 border border-error rounded-lg p-4">
            <Text className="text-error font-medium text-center">{error}</Text>
          </View>
        ) : null}

        {/* Temporarily Locked Warning */}
        {isTemporarilyLocked ? (
          <View className="w-full bg-warning/10 border border-warning rounded-lg p-4 gap-2">
            <Text className="text-warning font-semibold text-center">
              Too many failed attempts
            </Text>
            <Text className="text-warning text-sm text-center">
              Try again in {lockTimeoutRemaining} seconds
            </Text>
          </View>
        ) : null}

        {/* Attempts Indicator */}
        {!isTemporarilyLocked && remainingAttempts < 5 && (
          <View className="w-full bg-primary/10 border border-primary rounded-lg p-3">
            <Text className="text-primary text-sm text-center font-semibold">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </Text>
          </View>
        )}

        {/* Password Input */}
        <View className="w-full gap-2">
          <Text className="text-sm font-semibold text-foreground">Password</Text>
          <TextInput
            className="w-full bg-surface border border-border rounded-lg p-4 text-foreground text-lg tracking-widest"
            placeholder="Enter password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isTemporarilyLocked && !loading}
            onSubmitEditing={handleUnlock}
          />
        </View>

        {/* Unlock Button */}
        <TouchableOpacity
          onPress={handleUnlock}
          disabled={loading || isTemporarilyLocked || !password.trim()}
          className={`w-full py-4 rounded-lg items-center ${
            isTemporarilyLocked || !password.trim() ? 'bg-gray-400' : 'bg-primary'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">Unlock</Text>
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View className="w-full bg-primary/10 border border-primary rounded-lg p-4 gap-2">
          <Text className="font-semibold text-primary text-sm">Security Note</Text>
          <Text className="text-foreground text-xs leading-relaxed">
            • App locks when closed{'\n'}
            • Password required on reopening{'\n'}
            • 5 attempts allowed{'\n'}
            • 5 minute lockout after failed attempts
          </Text>
        </View>

        {/* Footer */}
        <Text className="text-xs text-muted text-center">
          MPA Biometric Verification
        </Text>
      </View>
    </ScreenContainer>
  );
}
