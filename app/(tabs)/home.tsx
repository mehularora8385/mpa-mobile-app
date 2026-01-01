import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { mockAuthService } from '@/lib/auth-mock';
import { mockCandidatesService } from '@/lib/mock-candidates';
import { useState, useEffect } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, marked: 0, verified: 0, pending: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentSession = await mockAuthService.getSession();
      setSession(currentSession);

      // Calculate stats
      const candidates = mockCandidatesService.getAllCandidates();
      const marked = candidates.filter(c => c.present !== null).length;
      const verified = candidates.filter(c => c.verified === true).length;
      const pending = candidates.filter(c => c.verified !== true).length;

      setStats({
        total: candidates.length,
        marked,
        verified,
        pending,
      });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await mockAuthService.logout();
            router.replace('/(tabs)');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-primary">Welcome</Text>
            <Text className="text-lg font-semibold text-foreground">
              {session?.operatorName || 'Operator'}
            </Text>
            <Text className="text-sm text-muted">Centre: Centre 1 - Delhi</Text>
          </View>

          {/* Operator Info Card */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-foreground mb-2">Operator Information</Text>
            
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Name</Text>
                <Text className="text-sm font-semibold text-foreground">{session?.operatorName || 'N/A'}</Text>
              </View>
              <View className="h-px bg-border" />
              
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Mobile</Text>
                <Text className="text-sm font-semibold text-foreground">
                  +91 {session?.mobileNumber || 'N/A'}
                </Text>
              </View>
              <View className="h-px bg-border" />
              
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Aadhaar</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {session?.aadhaarNumber ? `${session.aadhaarNumber.substring(0, 2)}****${session.aadhaarNumber.substring(10)}` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Quick Stats</Text>
            
            <View className="flex-row gap-3">
              <View className="flex-1 bg-primary/10 rounded-lg p-4 border border-primary gap-2">
                <Text className="text-2xl font-bold text-primary">{stats.total}</Text>
                <Text className="text-xs text-muted">Total Candidates</Text>
              </View>
              
              <View className="flex-1 bg-success/10 rounded-lg p-4 border border-success gap-2">
                <Text className="text-2xl font-bold text-success">{stats.marked}</Text>
                <Text className="text-xs text-muted">Marked Present</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-warning/10 rounded-lg p-4 border border-warning gap-2">
                <Text className="text-2xl font-bold text-warning">{stats.verified}</Text>
                <Text className="text-xs text-muted">Verified</Text>
              </View>
              
              <View className="flex-1 bg-error/10 rounded-lg p-4 border border-error gap-2">
                <Text className="text-2xl font-bold text-error">{stats.pending}</Text>
                <Text className="text-xs text-muted">Pending</Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
            <Text className="text-xs font-semibold text-primary">Today's Tasks</Text>
            <Text className="text-xs text-foreground leading-relaxed">
              1. Download exam data{'\n'}
              2. Mark candidate attendance{'\n'}
              3. Perform biometric verification{'\n'}
              4. Sync data with server
            </Text>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error rounded-lg p-4 items-center"
          >
            <Text className="text-white font-semibold text-base">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
