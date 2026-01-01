import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { mockCandidatesService } from '@/lib/mock-candidates';
import { useState, useEffect } from 'react';

interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failed';
  candidateCount: number;
  message: string;
}

export default function DataSyncScreen() {
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = () => {
    const candidates = mockCandidatesService.getAllCandidates();
    const synced = candidates.filter(c => c.synced).length;
    const unsynced = candidates.filter(c => !c.synced).length;
    setSyncedCount(synced);
    setUnsyncedCount(unsynced);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const candidates = mockCandidatesService.getAllCandidates();
      const unsyncedCandidates = candidates.filter(c => !c.synced);

      // Mark all as synced
      unsyncedCandidates.forEach(c => {
        mockCandidatesService.markSynced(c.rollNo);
      });

      const newLog: SyncLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
        candidateCount: unsyncedCandidates.length,
        message: `Synced ${unsyncedCandidates.length} candidates`,
      };

      setSyncLogs([newLog, ...syncLogs]);
      setLastSyncTime(new Date().toLocaleTimeString());
      loadSyncStatus();

      Alert.alert('Success', `${unsyncedCandidates.length} candidates synced successfully!`);
    } catch (err) {
      const newLog: SyncLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        status: 'failed',
        candidateCount: 0,
        message: 'Sync failed',
      };

      setSyncLogs([newLog, ...syncLogs]);
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  const getSyncPercentage = () => {
    const total = syncedCount + unsyncedCount;
    if (total === 0) return 0;
    return Math.round((syncedCount / total) * 100);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Data Sync</Text>
            <Text className="text-sm text-muted">Synchronize candidate data with server</Text>
          </View>

          {/* Sync Status Card */}
          <View className="bg-surface border border-border rounded-lg p-6 gap-4">
            <Text className="text-sm font-semibold text-foreground">Sync Status</Text>

            {/* Progress Bar */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted">Progress</Text>
                <Text className="text-sm font-semibold text-foreground">{getSyncPercentage()}%</Text>
              </View>
              <View className="h-3 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-success"
                  style={{ width: `${getSyncPercentage()}%` }}
                />
              </View>
            </View>

            {/* Stats */}
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <View className="gap-1">
                  <Text className="text-xs text-muted">Synced</Text>
                  <Text className="text-2xl font-bold text-success">{syncedCount}</Text>
                </View>
                <View className="w-px h-12 bg-border" />
                <View className="gap-1 flex-1">
                  <Text className="text-xs text-muted">Pending</Text>
                  <Text className="text-2xl font-bold text-warning">{unsyncedCount}</Text>
                </View>
              </View>
            </View>

            {/* Last Sync Time */}
            {lastSyncTime && (
              <View className="pt-3 border-t border-border">
                <Text className="text-xs text-muted">Last Sync: {lastSyncTime}</Text>
              </View>
            )}
          </View>

          {/* Sync Button */}
          <TouchableOpacity
            onPress={handleSync}
            disabled={syncing || unsyncedCount === 0}
            className={`rounded-lg p-4 items-center flex-row justify-center gap-2 ${
              unsyncedCount === 0 ? 'bg-success/20' : syncing ? 'bg-warning/20' : 'bg-primary'
            }`}
          >
            {syncing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-semibold">Syncing...</Text>
              </>
            ) : unsyncedCount === 0 ? (
              <>
                <Text className="text-success font-semibold">✓ All Synced</Text>
              </>
            ) : (
              <>
                <Text className="text-white font-semibold">↑ Sync Now ({unsyncedCount})</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sync Summary */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
            <Text className="text-xs font-semibold text-primary">Sync Summary</Text>
            <View className="gap-1">
              <Text className="text-xs text-foreground">Total Candidates: {syncedCount + unsyncedCount}</Text>
              <Text className="text-xs text-foreground">Synced: {syncedCount}</Text>
              <Text className="text-xs text-foreground">Pending: {unsyncedCount}</Text>
              {unsyncedCount === 0 && (
                <Text className="text-xs text-success font-semibold mt-2">✓ 0 candidates pending</Text>
              )}
            </View>
          </View>

          {/* Sync Logs */}
          {syncLogs.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Sync Logs</Text>
              <View className="gap-2">
                {syncLogs.map(log => (
                  <View
                    key={log.id}
                    className={`rounded-lg p-3 border ${
                      log.status === 'success'
                        ? 'bg-success/10 border-success'
                        : 'bg-error/10 border-error'
                    }`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className={`text-xs font-semibold ${log.status === 'success' ? 'text-success' : 'text-error'}`}>
                          {log.status === 'success' ? '✓' : '✗'} {log.message}
                        </Text>
                        <Text className="text-xs text-muted mt-1">{log.timestamp}</Text>
                      </View>
                      {log.candidateCount > 0 && (
                        <View className="bg-primary/20 rounded-full px-2 py-1">
                          <Text className="text-xs font-semibold text-primary">{log.candidateCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2 mt-4">
            <Text className="text-xs font-semibold text-primary">ℹ️ Information</Text>
            <Text className="text-xs text-foreground leading-relaxed">
              • Sync uploads candidate data to server{'\n'}
              • Requires internet connection{'\n'}
              • You can work offline before sync{'\n'}
              • Tap "Sync Now" to upload pending data
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
