import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { authService, OperatorSession } from '@/lib/auth-service';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [dataAutoSync, setDataAutoSync] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const currentSession = await authService.getSession();
      setSession(currentSession);
      
      // Load saved settings
      // const savedOfflineMode = await AsyncStorage.getItem('offlineMode');
      // setOfflineMode(savedOfflineMode === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => null },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await authService.logout();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#0066CC" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Settings</Text>
            <Text className="text-sm text-muted">Manage your preferences</Text>
          </View>

          {/* Profile Section */}
          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <Text className="text-lg font-bold text-foreground">Profile Information</Text>
            
            <View className="gap-2">
              <Text className="text-xs font-semibold text-muted">Operator Name</Text>
              <Text className="text-foreground font-semibold">{session?.operatorName}</Text>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold text-muted">Operator ID</Text>
              <Text className="text-foreground font-semibold">{session?.operatorId}</Text>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold text-muted">Mobile Number</Text>
              <Text className="text-foreground font-semibold">{session?.mobileNumber}</Text>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold text-muted">Status</Text>
              <Text className="text-foreground font-semibold">Active</Text>
            </View>
          </View>

          {/* App Settings Section */}
          <View className="bg-surface border border-border rounded-lg p-4 gap-4">
            <Text className="text-lg font-bold text-foreground">App Settings</Text>

            {/* Offline Mode */}
            <View className="flex-row items-center justify-between">
              <View className="gap-1 flex-1">
                <Text className="font-semibold text-foreground">Offline Mode</Text>
                <Text className="text-xs text-muted">Work without internet</Text>
              </View>
              <Switch
                value={offlineMode}
                onValueChange={(value) => {
                  setOfflineMode(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </View>

            {/* Biometric Authentication */}
            <View className="flex-row items-center justify-between">
              <View className="gap-1 flex-1">
                <Text className="font-semibold text-foreground">Biometric Auth</Text>
                <Text className="text-xs text-muted">Face/Fingerprint login</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={(value) => {
                  setBiometricEnabled(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </View>

            {/* Auto Sync */}
            <View className="flex-row items-center justify-between">
              <View className="gap-1 flex-1">
                <Text className="font-semibold text-foreground">Auto Sync Data</Text>
                <Text className="text-xs text-muted">Sync when connected</Text>
              </View>
              <Switch
                value={dataAutoSync}
                onValueChange={(value) => {
                  setDataAutoSync(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </View>

            {/* Notifications */}
            <View className="flex-row items-center justify-between">
              <View className="gap-1 flex-1">
                <Text className="font-semibold text-foreground">Notifications</Text>
                <Text className="text-xs text-muted">Exam alerts & updates</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </View>
          </View>

          {/* About Section */}
          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <Text className="text-lg font-bold text-foreground">About</Text>

            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-foreground">App Name</Text>
                <Text className="text-muted">MPA BIO VERIFICATION</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-foreground">Version</Text>
                <Text className="text-muted">1.0.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-foreground">Build</Text>
                <Text className="text-muted">001</Text>
              </View>
            </View>

            <TouchableOpacity className="mt-2">
              <Text className="text-primary text-sm font-semibold">Privacy Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text className="text-primary text-sm font-semibold">Terms of Service</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View className="bg-error/10 border border-error rounded-lg p-4 gap-3">
            <Text className="text-lg font-bold text-error">Danger Zone</Text>

            <TouchableOpacity
              onPress={handleLogout}
              className="bg-error rounded-lg p-4 items-center"
            >
              <Text className="text-white font-semibold">Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-error/20 rounded-lg p-4 items-center">
              <Text className="text-error font-semibold">Clear Local Data</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="items-center gap-2 py-4">
            <Text className="text-xs text-muted">MPA BIO VERIFICATION System</Text>
            <Text className="text-xs text-muted">© 2026 All rights reserved</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
