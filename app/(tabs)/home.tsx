import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { offlineStorage, ExamData } from '@/lib/offline-storage';
import { authService, OperatorSession } from '@/lib/auth-service';
import * as Haptics from 'expo-haptics';

interface DashboardStats {
  totalCandidates: number;
  presentCount: number;
  absentCount: number;
  registeredCount: number;
  pendingCount: number;
  averageFaceMatch: number;
  omrMappedCount: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [selectedExamStats, setSelectedExamStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get session
      const currentSession = await authService.getSession();
      setSession(currentSession);

      // Get all exam data
      const examsData = await offlineStorage.getAllExamData();
      setExams(examsData);

      // Get stats for first exam
      if (examsData.length > 0) {
        const stats = await offlineStorage.getDashboardStats(examsData[0].examId);
        setSelectedExamStats(stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExamSelect = async (examId: string) => {
    const stats = await offlineStorage.getDashboardStats(examId);
    setSelectedExamStats(stats);
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-6">
          {/* Welcome Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Welcome, {session?.operatorName}
            </Text>
            <Text className="text-sm text-muted">
              Operator ID: {session?.operatorId}
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Pressable
              onPress={() => null}
              style={({ pressed }: any) => ([
                { backgroundColor: '#0066CC', borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                pressed && { opacity: 0.8 },
              ])}
            >
              <View className="gap-1">
                <Text className="text-white font-semibold">Download Exam Data</Text>
                <Text className="text-white/80 text-xs">Get candidate list</Text>
              </View>
              <Text className="text-white text-xl">→</Text>
            </Pressable>

            <Pressable
              onPress={() => null}
              style={({ pressed }: any) => ([
                { backgroundColor: '#00D084', borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                pressed && { opacity: 0.8 },
              ])}
            >
              <View className="gap-1">
                <Text className="text-white font-semibold">Verify OTP</Text>
                <Text className="text-white/80 text-xs">On-site verification</Text>
              </View>
              <Text className="text-white text-xl">→</Text>
            </Pressable>
          </View>

          {/* Exam Selection */}
          {exams.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Select Exam</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                {exams.map(exam => (
                  <TouchableOpacity
                    key={exam.examId}
                    onPress={() => handleExamSelect(exam.examId)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      selectedExamStats && exam.examId === exams[0].examId
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <Text className="font-semibold text-foreground text-sm">
                      {exam.examName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Dashboard Stats */}
          {selectedExamStats ? (
            <View className="gap-4">
              <Text className="text-lg font-bold text-foreground">Today's Statistics</Text>

              {/* Stats Grid */}
              <View className="gap-3">
                {/* Row 1 */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-xs text-muted font-semibold mb-1">Total Candidates</Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {selectedExamStats.totalCandidates}
                    </Text>
                  </View>
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-xs text-muted font-semibold mb-1">Present</Text>
                    <Text className="text-2xl font-bold text-success">
                      {selectedExamStats.presentCount}
                    </Text>
                  </View>
                </View>

                {/* Row 2 */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-xs text-muted font-semibold mb-1">Absent</Text>
                    <Text className="text-2xl font-bold text-error">
                      {selectedExamStats.absentCount}
                    </Text>
                  </View>
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-xs text-muted font-semibold mb-1">Registered</Text>
                    <Text className="text-2xl font-bold text-primary">
                      {selectedExamStats.registeredCount}
                    </Text>
                  </View>
                </View>

                {/* Row 3 */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-xs text-muted font-semibold mb-1">Pending</Text>
                    <Text className="text-2xl font-bold text-warning">
                      {selectedExamStats.pendingCount}
                    </Text>
                  </View>
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-xs text-muted font-semibold mb-1">OMR Mapped</Text>
                    <Text className="text-2xl font-bold text-primary">
                      {selectedExamStats.omrMappedCount}
                    </Text>
                  </View>
                </View>

                {/* Face Match */}
                <View className="bg-surface border border-border rounded-lg p-4">
                  <Text className="text-xs text-muted font-semibold mb-1">Avg Face Match %</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-3xl font-bold text-primary">
                      {selectedExamStats.averageFaceMatch}%
                    </Text>
                    <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary"
                        style={{ width: `${selectedExamStats.averageFaceMatch}%` }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-surface border border-border rounded-lg p-6 items-center gap-3">
              <Text className="text-foreground font-semibold">No exam data available</Text>
              <Text className="text-sm text-muted text-center">
                Download exam data to see statistics
              </Text>
            </View>
          )}

          {/* Navigation Cards */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => null}
              className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
            >
              <View className="gap-1">
                <Text className="font-semibold text-foreground">View Candidates</Text>
                <Text className="text-xs text-muted">Search and manage</Text>
              </View>
              <Text className="text-primary text-xl">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => null}
              className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
            >
              <View className="gap-1">
                <Text className="font-semibold text-foreground">Sync Data</Text>
                <Text className="text-xs text-muted">Upload changes</Text>
              </View>
              <Text className="text-primary text-xl">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => null}
              className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
            >
              <View className="gap-1">
                <Text className="font-semibold text-foreground">Settings</Text>
                <Text className="text-xs text-muted">Preferences & info</Text>
              </View>
              <Text className="text-primary text-xl">→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
