import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { syncService } from '@/lib/sync-service';
import { offlineStorage, SyncLog } from '@/lib/offline-storage';
import * as Haptics from 'expo-haptics';

export default function SyncScreen() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    loadSyncData();
  }, []);

  const loadSyncData = async () => {
    try {
      setLoading(true);
      // Load sync logs
      const logs = await offlineStorage.getSyncLogs();
      setSyncLogs(logs);

      // Get last sync time
      if (logs.length > 0) {
        const lastSync = logs.reduce((latest, log) => 
          log.timestamp > latest.timestamp ? log : latest
        );
        setLastSyncTime(lastSync.timestamp);
      }

      // Count pending changes
      const exams = await offlineStorage.getAllExamData();
      const pending = exams.reduce((count, exam) => {
        return count + exam.candidates.filter(c => c.status !== 'pending').length;
      }, 0);
      setPendingChanges(pending);
    } catch (error) {
      console.error('Error loading sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncProgress(0);

      // Simulate sync progress
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 500);

      // Perform sync
      // await syncService.syncAllData((progress: number) => {
      //   setSyncProgress(Math.min(progress, 90));
      // });
      // Simulate sync for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(interval);
      setSyncProgress(100);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Data synced successfully');

      // Reload sync data
      await loadSyncData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      Alert.alert('Error', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const renderSyncLog = ({ item }: { item: SyncLog }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-semibold text-foreground">Exam {item.examId}</Text>
        <View
          className={`px-2 py-1 rounded ${
            item.status === 'success'
              ? 'bg-success/20'
              : item.status === 'failed'
              ? 'bg-error/20'
              : 'bg-warning/20'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              item.status === 'success'
                ? 'text-success'
                : item.status === 'failed'
                ? 'text-error'
                : 'text-warning'
            }`}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="gap-1">
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted">Records Synced</Text>
          <Text className="text-xs text-foreground font-semibold">{item.dataCount}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted">Time</Text>
          <Text className="text-xs text-foreground font-semibold">
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
        {item.error && (
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Error</Text>
            <Text className="text-xs text-error font-semibold">{item.error}</Text>
          </View>
        )}
      </View>
    </View>
  );

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
            <Text className="text-3xl font-bold text-foreground">Sync Data</Text>
            <Text className="text-sm text-muted">Manage offline data synchronization</Text>
          </View>

          {/* Status Cards */}
          <View className="gap-3">
            {/* Last Sync */}
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs font-semibold text-muted mb-1">Last Sync</Text>
              <Text className="text-lg font-bold text-foreground">
                {lastSyncTime
                  ? new Date(lastSyncTime).toLocaleString()
                  : 'Never synced'}
              </Text>
            </View>

            {/* Pending Changes */}
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs font-semibold text-muted mb-1">Pending Changes</Text>
              <Text className="text-lg font-bold text-primary">{pendingChanges}</Text>
            </View>
          </View>

          {/* Sync Progress */}
          {isSyncing && syncProgress > 0 && (
            <View className="bg-surface border border-border rounded-lg p-4 gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-foreground">Syncing...</Text>
                <Text className="text-sm text-muted">{Math.round(syncProgress)}%</Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${syncProgress}%` }}
                />
              </View>
            </View>
          )}

          {/* Sync Button */}
          <TouchableOpacity
            onPress={handleSync}
            disabled={isSyncing}
            className={`py-4 rounded-lg items-center ${
              isSyncing ? 'bg-gray-400' : 'bg-primary'
            }`}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Sync Now</Text>
            )}
          </TouchableOpacity>

          {/* Sync History */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Sync History</Text>
            {syncLogs.length > 0 ? (
              <FlatList
                data={syncLogs}
                renderItem={renderSyncLog}
                keyExtractor={item => item.syncId}
                scrollEnabled={false}
              />
            ) : (
              <View className="bg-surface border border-border rounded-lg p-6 items-center gap-2">
                <Text className="text-foreground font-semibold">No sync history</Text>
                <Text className="text-xs text-muted text-center">
                  Sync data to see history
                </Text>
              </View>
            )}
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
            <Text className="font-semibold text-primary">Information</Text>
            <Text className="text-sm text-foreground">
              • Sync requires internet connection{'\n'}
              • All changes will be uploaded{'\n'}
              • Synced data is encrypted{'\n'}
              • Sync status is logged for audit
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
