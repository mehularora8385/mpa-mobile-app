import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { enhancedAuthService } from '@/lib/enhanced-auth-service';
import { realtimeSyncService } from '@/lib/realtime-sync-service';

interface SyncStatus {
  totalRegistered: number;
  synced: number;
  pending: number;
  verified: number;
  pendingVerification: number;
  lastSync: string;
  nextSync?: string;
}

interface StudentData {
  rollNo: string;
  name: string;
  present: boolean;
  verified: boolean;
  syncStatus: 'synced' | 'pending';
  lastUpdated: string;
}

export default function EnhancedSyncScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
    
    // Initialize sync service
    const initializeSync = async () => {
      const currentSession = await enhancedAuthService.getSession();
      if (currentSession) {
        await realtimeSyncService.initialize(currentSession.token);
      }
    };

    initializeSync();

    // Cleanup on unmount
    return () => {
      realtimeSyncService.cleanup();
    };
  }, []);

  /**
   * Load sync data
   */
  const loadData = async () => {
    try {
      const currentSession = await enhancedAuthService.getSession();
      if (!currentSession) {
        router.replace('/(tabs)/login-enhanced');
        return;
      }

      setSession(currentSession);

      // Get sync status
      const status = await realtimeSyncService.getSyncStatus();
      setSyncStatus(status);

      // Get student data
      const students = await realtimeSyncService.getStudentData();
      setStudentData(students);
    } catch (error) {
      console.error('Error loading sync data:', error);
      Alert.alert('Error', 'Failed to load sync data');
    }
  };

  /**
   * Manual sync
   */
  const handleManualSync = async () => {
    if (!session) {
      Alert.alert('Error', 'No active session');
      return;
    }

    setSyncing(true);
    try {
      const result = await realtimeSyncService.syncAll(session.token);
      
      if (result.success) {
        Alert.alert('Success', `Synced ${result.synced} records`);
      } else {
        Alert.alert('Sync Failed', `${result.failed} records failed to sync`);
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Refresh data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Get sync percentage
   */
  const getSyncPercentage = (): number => {
    if (!syncStatus || syncStatus.totalRegistered === 0) {
      return 0;
    }
    return (syncStatus.synced / syncStatus.totalRegistered) * 100;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Sync Status</Text>
        <Text style={styles.subtitle}>Real-time data synchronization</Text>
      </View>

      {/* Sync Statistics */}
      {syncStatus && (
        <View style={styles.statsContainer}>
          {/* Overall Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Overall Sync Progress</Text>
              <Text style={styles.progressPercentage}>{Math.round(getSyncPercentage())}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getSyncPercentage()}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {syncStatus.synced} of {syncStatus.totalRegistered} records synced
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Registered"
              value={syncStatus.totalRegistered}
              color="#0a7ea4"
            />
            <StatCard
              label="Synced"
              value={syncStatus.synced}
              color="#27ae60"
            />
            <StatCard
              label="Pending"
              value={syncStatus.pending}
              color="#e74c3c"
            />
            <StatCard
              label="Verified"
              value={syncStatus.verified}
              color="#9b59b6"
            />
            <StatCard
              label="Pending Verification"
              value={syncStatus.pendingVerification}
              color="#f39c12"
            />
          </View>

          {/* Sync Times */}
          <View style={styles.timesContainer}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Last Sync:</Text>
              <Text style={styles.timeValue}>
                {new Date(syncStatus.lastSync).toLocaleTimeString()}
              </Text>
            </View>
            {syncStatus.nextSync && (
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Next Sync:</Text>
                <Text style={styles.timeValue}>
                  {new Date(syncStatus.nextSync).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Manual Sync Button */}
      <TouchableOpacity
        style={[styles.button, syncing && styles.disabledButton]}
        onPress={handleManualSync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sync Now</Text>
        )}
      </TouchableOpacity>

      {/* Student Data Table */}
      <View style={styles.tableSection}>
        <Text style={styles.tableTitle}>Student Data</Text>
        {studentData.length > 0 ? (
          <FlatList
            data={studentData}
            keyExtractor={(item) => item.rollNo}
            renderItem={({ item }) => <StudentDataRow student={item} />}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No student data available</Text>
        )}
      </View>
    </ScrollView>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * Student Data Row Component
 */
function StudentDataRow({ student }: { student: StudentData }) {
  return (
    <View style={styles.dataRow}>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Roll No</Text>
        <Text style={styles.dataValue}>{student.rollNo}</Text>
      </View>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Name</Text>
        <Text style={styles.dataValue}>{student.name}</Text>
      </View>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Present</Text>
        <Text style={[styles.dataValue, student.present ? styles.yes : styles.no]}>
          {student.present ? 'Yes' : 'No'}
        </Text>
      </View>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Verified</Text>
        <Text style={[styles.dataValue, student.verified ? styles.yes : styles.no]}>
          {student.verified ? 'Yes' : 'No'}
        </Text>
      </View>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Status</Text>
        <Text
          style={[
            styles.dataValue,
            student.syncStatus === 'synced' ? styles.synced : styles.pending,
          ]}
        >
          {student.syncStatus === 'synced' ? 'Synced' : 'Pending'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
  },
  statsGrid: {
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  timesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tableSection: {
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dataRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  dataCell: {
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  yes: {
    color: '#27ae60',
  },
  no: {
    color: '#e74c3c',
  },
  synced: {
    color: '#27ae60',
  },
  pending: {
    color: '#e74c3c',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
