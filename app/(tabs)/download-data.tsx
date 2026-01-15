import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, FlatList, Modal, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface Exam {
  id: string;
  exam_name: string;
  exam_type: string;
  exam_date: string;
}

interface Centre {
  centre_code: string;
  centre_name: string;
}

interface Candidate {
  id: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  dob: string;
  photoUrl: string;
}

interface Slot {
  slotNumber: number;
  startTime: string;
  endTime: string;
  candidates: Candidate[];
}

const API_BASE = 'http://13.204.65.158/api/v1';

export default function DownloadDataScreen() {
  const colors = useColors();
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedCentre, setSelectedCentre] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any>(null);
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [showCentrePicker, setShowCentrePicker] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);

  useEffect(() => {
    loadExams();
    loadDownloadHistory();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadCentres(selectedExam);
    }
  }, [selectedExam]);

  const loadExams = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/exams/available`);
      const data = await response.json();
      if (data.success) {
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      Alert.alert('Error', 'Failed to load exams');
    }
  };

  const loadCentres = async (examId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/exams/centres/list?examId=${examId}`);
      const data = await response.json();
      if (data.success) {
        setCentres(data.centres || []);
      }
    } catch (error) {
      console.error('Error loading centres:', error);
    }
  };

  const loadDownloadHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('downloadHistory');
      if (history) {
        setDownloadHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const downloadData = async () => {
    if (!selectedExam || !selectedCentre || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await fetch(`${API_BASE}/api/exams/download-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          centreCode: selectedCentre,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        setCandidates(data);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('downloadedCandidates', JSON.stringify(data));
        
        // Add to history
        const newHistory = [{
          examId: selectedExam,
          examName: data.exam.examName,
          centreCode: selectedCentre,
          totalCandidates: data.exam.totalCandidates,
          downloadedAt: new Date().toISOString()
        }, ...downloadHistory].slice(0, 10);
        
        await AsyncStorage.setItem('downloadHistory', JSON.stringify(newHistory));
        setDownloadHistory(newHistory);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Downloaded ${data.exam.totalCandidates} candidates`);
        
        setPassword('');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', data.error || 'Invalid password or exam');
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Download failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const selectedExamName = exams.find(e => e.id === selectedExam)?.exam_name || 'Select Exam';
  const selectedCentreName = centres.find(c => c.centre_code === selectedCentre)?.centre_code || 'Select Centre';

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">📥 Download Data</Text>
          <Text className="text-sm text-muted">Download candidate data for your centre</Text>
        </View>

        {/* Exam Selection */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">📋 Select Exam</Text>
          <Pressable
            onPress={() => setShowExamPicker(true)}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? colors.surface : colors.background,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            className="border border-border rounded-lg p-4"
          >
            <Text className="text-foreground font-medium">{selectedExamName}</Text>
          </Pressable>
        </View>

        {/* Centre Selection */}
        {selectedExam && centres.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">🏢 Select Centre</Text>
            <Pressable
              onPress={() => setShowCentrePicker(true)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.surface : colors.background,
                  opacity: pressed ? 0.8 : 1
                }
              ]}
              className="border border-border rounded-lg p-4"
            >
              <Text className="text-foreground font-medium">{selectedCentreName}</Text>
            </Pressable>
          </View>
        )}

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">🔐 Password</Text>
          <TextInput
            placeholder="Enter exam password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="border border-border rounded-lg p-4 bg-surface text-foreground"
            placeholderTextColor={colors.muted}
          />
          <Text className="text-xs text-muted mt-1">Password provided by exam administrator</Text>
        </View>

        {/* Download Button */}
        <Pressable
          onPress={downloadData}
          disabled={loading || !selectedExam || !selectedCentre}
          style={({ pressed }) => [
            {
              opacity: pressed && !loading ? 0.9 : 1,
              transform: [{ scale: pressed && !loading ? 0.98 : 1 }]
            }
          ]}
          className="bg-primary p-4 rounded-lg items-center mb-6"
        >
          {loading ? (
            <ActivityIndicator color={colors.background} size="large" />
          ) : (
            <Text className="text-background font-bold text-lg">📥 Download Candidates</Text>
          )}
        </Pressable>

        {/* Downloaded Data Display */}
        {candidates && (
          <View className="bg-surface p-4 rounded-lg mb-6 border border-border">
            <View className="mb-4 pb-4 border-b border-border">
              <Text className="text-lg font-bold text-foreground">{candidates.exam.examName}</Text>
              <Text className="text-sm text-muted mt-1">
                Centre: {candidates.exam.centreCode}
              </Text>
              <Text className="text-sm text-muted">
                Total Candidates: {candidates.exam.totalCandidates}
              </Text>
            </View>

            {candidates.slots.map((slot: Slot, index: number) => (
              <View key={index} className="mb-4 border border-border p-3 rounded bg-background">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-bold text-foreground">
                    ⏰ Slot {slot.slotNumber}
                  </Text>
                  <Text className="text-xs bg-primary text-background px-2 py-1 rounded">
                    {slot.candidates.length} students
                  </Text>
                </View>
                <Text className="text-xs text-muted mb-3">
                  {slot.startTime} - {slot.endTime}
                </Text>

                {slot.candidates.map((cand: Candidate, candIndex: number) => (
                  <View
                    key={cand.id}
                    className="mb-2 p-2 bg-surface rounded border border-border"
                  >
                    <Text className="text-foreground font-semibold text-sm">
                      {candIndex + 1}. {cand.studentName}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Roll: {cand.rollNumber}
                    </Text>
                    <Text className="text-xs text-muted">
                      Father: {cand.fatherName}
                    </Text>
                    <Text className="text-xs text-muted">
                      DOB: {cand.dob}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Download History */}
        {downloadHistory.length > 0 && !candidates && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">📜 Recent Downloads</Text>
            {downloadHistory.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  setSelectedExam(item.examId);
                  setSelectedCentre(item.centreCode);
                }}
                className="bg-surface p-3 rounded mb-2 border border-border flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{item.examName}</Text>
                  <Text className="text-xs text-muted">
                    Centre {item.centreCode} • {item.totalCandidates} students
                  </Text>
                </View>
                <Text className="text-xs text-muted">
                  {new Date(item.downloadedAt).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Exam Picker Modal */}
      <Modal
        visible={showExamPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExamPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-4 max-h-96">
            <Text className="text-lg font-bold text-foreground mb-4">Select Exam</Text>
            <FlatList
              data={exams}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedExam(item.id);
                    setShowExamPicker(false);
                    setCentres([]);
                    setSelectedCentre('');
                  }}
                  className="p-4 border-b border-border"
                >
                  <Text className="text-foreground font-medium">{item.exam_name}</Text>
                  <Text className="text-xs text-muted mt-1">
                    {item.exam_type.toUpperCase()} • {item.exam_date}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Centre Picker Modal */}
      <Modal
        visible={showCentrePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCentrePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-4 max-h-96">
            <Text className="text-lg font-bold text-foreground mb-4">Select Centre</Text>
            <FlatList
              data={centres}
              keyExtractor={item => item.centre_code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedCentre(item.centre_code);
                    setShowCentrePicker(false);
                  }}
                  className="p-4 border-b border-border"
                >
                  <Text className="text-foreground font-medium">{item.centre_code}</Text>
                  <Text className="text-xs text-muted mt-1">{item.centre_name}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
