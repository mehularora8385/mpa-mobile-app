import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Picker,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { enhancedAuthService } from '@/lib/enhanced-auth-service';
import { downloadService } from '@/lib/download-service';

interface Centre {
  centreCode: string;
  centreName: string;
  location: string;
}

interface Exam {
  examId: string;
  examName: string;
  examDate: string;
  totalCandidates: number;
}

export default function EnhancedDownloadScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [selectedCentre, setSelectedCentre] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [password, setPassword] = useState('');
  const [candidateCount, setCandidateCount] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'ready' | 'downloading' | 'downloaded'>('ready');

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Load centres and exams
   */
  const loadData = async () => {
    try {
      const currentSession = await enhancedAuthService.getSession();
      if (!currentSession) {
        router.replace('/(tabs)/login-enhanced');
        return;
      }

      setSession(currentSession);

      // Load centres and exams
      const centresData = await downloadService.getCentres(currentSession.token);
      const examsData = await downloadService.getExams(currentSession.token);

      setCentres(centresData);
      setExams(examsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load centres and exams');
    }
  };

  /**
   * Update candidate count when centre/exam changes
   */
  useEffect(() => {
    if (selectedCentre && selectedExam) {
      const exam = exams.find((e) => e.examId === selectedExam);
      if (exam) {
        setCandidateCount(exam.totalCandidates);
      }
    }
  }, [selectedCentre, selectedExam]);

  /**
   * Download candidates
   */
  const handleDownload = async () => {
    if (!selectedCentre) {
      Alert.alert('Error', 'Please select a centre');
      return;
    }

    if (!selectedExam) {
      Alert.alert('Error', 'Please select an exam');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter password');
      return;
    }

    setLoading(true);
    setDownloadStatus('downloading');
    setDownloadProgress(0);

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 30;
        });
      }, 500);

      const result = await downloadService.downloadCandidates(
        selectedCentre,
        selectedExam,
        password,
        session.token
      );

      clearInterval(progressInterval);

      if (result.success) {
        setDownloadProgress(100);
        setDownloadStatus('downloaded');
        Alert.alert('Success', `Downloaded ${result.data?.candidates.length} candidates`);
        
        // Reset after 2 seconds
        setTimeout(() => {
          setDownloadStatus('ready');
          setDownloadProgress(0);
          setPassword('');
        }, 2000);
      } else {
        setDownloadStatus('ready');
        Alert.alert('Download Failed', result.error || 'Please try again');
      }
    } catch (error) {
      setDownloadStatus('ready');
      console.error('Download error:', error);
      Alert.alert('Error', 'Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Download</Text>
        <Text style={styles.subtitle}>Download candidate data for your centre and exam</Text>
      </View>

      {/* Centre Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Centre</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCentre}
            onValueChange={setSelectedCentre}
            style={styles.picker}
          >
            <Picker.Item label="Choose a centre..." value="" />
            {centres.map((centre) => (
              <Picker.Item
                key={centre.centreCode}
                label={`${centre.centreCode} - ${centre.centreName}`}
                value={centre.centreCode}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Exam Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Exam</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedExam}
            onValueChange={setSelectedExam}
            style={styles.picker}
          >
            <Picker.Item label="Choose an exam..." value="" />
            {exams.map((exam) => (
              <Picker.Item
                key={exam.examId}
                label={`${exam.examName} (${exam.totalCandidates} candidates)`}
                value={exam.examId}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Candidate Count */}
      {candidateCount > 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Total Candidates: </Text>
          <Text style={styles.infoValue}>{candidateCount}</Text>
        </View>
      )}

      {/* Password Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enter Password</Text>
        <Text style={styles.helperText}>Password generated by admin</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter download password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />
      </View>

      {/* Download Progress */}
      {downloadStatus !== 'ready' && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {downloadStatus === 'downloading' ? 'Downloading...' : 'Downloaded!'}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${downloadProgress}%`,
                  backgroundColor: downloadStatus === 'downloaded' ? '#27ae60' : '#0a7ea4',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
        </View>
      )}

      {/* Download Button */}
      <TouchableOpacity
        style={[
          styles.button,
          downloadStatus === 'downloaded' && styles.successButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleDownload}
        disabled={loading || !selectedCentre || !selectedExam || !password}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {downloadStatus === 'ready' ? 'Download Data' : 'Downloaded'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Downloaded Data List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Previously Downloaded</Text>
        <DownloadedDataList token={session?.token} />
      </View>
    </ScrollView>
  );
}

/**
 * Component to display previously downloaded data
 */
function DownloadedDataList({ token }: { token: string }) {
  const [downloadedData, setDownloadedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloadedData();
  }, []);

  const loadDownloadedData = async () => {
    try {
      const data = await downloadService.getAllDownloadedData();
      setDownloadedData(data);
    } catch (error) {
      console.error('Error loading downloaded data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  if (downloadedData.length === 0) {
    return <Text style={styles.emptyText}>No data downloaded yet</Text>;
  }

  return (
    <View>
      {downloadedData.map((data, index) => (
        <View key={index} style={styles.downloadedItem}>
          <View style={styles.downloadedHeader}>
            <Text style={styles.downloadedTitle}>
              {data.centreCode} - {data.examName}
            </Text>
            <Text style={[styles.downloadedStatus, data.synced && styles.syncedStatus]}>
              {data.synced ? 'Synced' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.downloadedInfo}>
            Candidates: {data.candidates.length}
          </Text>
          <Text style={styles.downloadedInfo}>
            Downloaded: {new Date(data.downloadedAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 18,
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#27ae60',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadedItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  downloadedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  downloadedStatus: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  syncedStatus: {
    color: '#27ae60',
  },
  downloadedInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
