import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { mockAuthService } from '@/lib/auth-mock';
import type { OperatorSession } from '@/lib/auth-mock';

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const currentSession = await mockAuthService.getSession();
      if (!currentSession) {
        router.replace('/');
        return;
      }
      setSession(currentSession);
    } catch (err) {
      console.error('Error loading session:', err);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await mockAuthService.logout();
            router.replace('/');
          } catch (err) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0066CC" />
      </ScreenContainer>
    );
  }

  if (!session) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">No session found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 gap-8">
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-primary">SEPL</Text>
            <Text className="text-lg text-foreground font-semibold">Biometric Verification</Text>
            <Text className="text-sm text-muted">Operator Dashboard</Text>
          </View>

          <View className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
            <Text className="text-sm text-muted mb-1">Welcome back,</Text>
            <Text className="text-2xl font-bold text-foreground">{session.operatorName}</Text>
            <Text className="text-xs text-muted mt-2">Operator ID: {session.operatorId}</Text>
          </View>

          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Quick Stats</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-xs text-muted mt-1">Exams Today</Text>
              </View>
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-2xl font-bold text-success">0</Text>
                <Text className="text-xs text-muted mt-1">Verified</Text>
              </View>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Menu</Text>

            <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-foreground font-semibold">📥 Download Exam Data</Text>
                <Text className="text-xs text-muted mt-1">Download mock or exam data</Text>
              </View>
              <Text className="text-xl">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-foreground font-semibold">👤 Candidates</Text>
                <Text className="text-xs text-muted mt-1">View candidate list</Text>
              </View>
              <Text className="text-xl">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-foreground font-semibold">📊 Exam Day</Text>
                <Text className="text-xs text-muted mt-1">Start exam workflow</Text>
              </View>
              <Text className="text-xl">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-foreground font-semibold">🔄 Sync Data</Text>
                <Text className="text-xs text-muted mt-1">Sync with server</Text>
              </View>
              <Text className="text-xl">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-foreground font-semibold">⚙️ Settings</Text>
                <Text className="text-xs text-muted mt-1">App settings</Text>
              </View>
              <Text className="text-xl">→</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error/10 border border-error rounded-lg p-4 items-center mt-auto"
          >
            <Text className="text-error font-bold">🚪 Logout</Text>
          </TouchableOpacity>

          <View className="bg-muted/10 rounded-lg p-3 mt-4">
            <Text className="text-xs text-muted font-mono">
              Token: {session.token.slice(0, 20)}...
            </Text>
            <Text className="text-xs text-muted font-mono mt-1">
              Expires: {new Date(session.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
