import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ScreenContainer } from '@/components/screen-container';
import { syncService } from '@/lib/sync-service';
import { offlineStorage } from '@/lib/offline-storage';
import * as Haptics from 'expo-haptics';

interface Exam {
  id: string;
  name: string;
  date: string;
}

interface Centre {
  code: string;
  name: string;
}

export default function DownloadScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('');
  const [dataType, setDataType] = useState<'mock' | 'exam'>('mock');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // In a real app, fetch exams from API
    setExams([
      { id: '1', name: 'Mathematics', date: '2026-01-15' },
      { id: '2', name: 'English', date: '2026-01-16' },
      { id: '3', name: 'Science', date: '2026-01-17' },
    ]);

    setCentres([
      { code: 'C001', name: 'Centre 1 - Delhi' },
      { code: 'C002', name: 'Centre 2 - Mumbai' },
      { code: 'C003', name: 'Centre 3 - Bangalore' },
    ]);
  }, []);

  const handleDownload = async () => {
    try {
      setError('');
      setLoading(true);

      if (!selectedExam || !selectedCentre || !password.trim()) {
        setError('Please fill all required fields');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Download exam data
      await syncService.downloadExamData(
        selectedExam,
        selectedCentre,
        dataType,
        password,
        (progress) => setDownloadProgress(progress)
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `${dataType === 'mock' ? 'Mock' : 'Exam'} data downloaded successfully`);

      // Reset form
      setPassword('');
      setDownloadProgress(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-primary">Download Exam Data</Text>
            <Text className="text-sm text-muted">
              Download candidate data for {dataType === 'mock' ? 'mock' : 'actual'} exam
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-lg p-4">
              <Text className="text-error font-medium">{error}</Text>
            </View>
          ) : null}

          {/* Data Type Selection */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Data Type</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDataType('mock')}
                className={`flex-1 p-4 rounded-lg border-2 items-center ${
                  dataType === 'mock' ? 'border-primary bg-primary/10' : 'border-border bg-surface'
                }`}
              >
                <Text className={`font-semibold ${dataType === 'mock' ? 'text-primary' : 'text-foreground'}`}>
                  Mock Data
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDataType('exam')}
                className={`flex-1 p-4 rounded-lg border-2 items-center ${
                  dataType === 'exam' ? 'border-primary bg-primary/10' : 'border-border bg-surface'
                }`}
              >
                <Text className={`font-semibold ${dataType === 'exam' ? 'text-primary' : 'text-foreground'}`}>
                  Exam Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Exam Selection */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Select Exam</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedExam}
                onValueChange={setSelectedExam}
                style={{ color: '#1A1A1A' }}
              >
                <Picker.Item label="Choose an exam..." value="" />
                {exams.map(exam => (
                  <Picker.Item key={exam.id} label={exam.name} value={exam.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Date Selection */}
          {selectedExam && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Exam Date</Text>
              <View className="bg-surface border border-border rounded-lg p-4">
                <Text className="text-foreground">
                  {exams.find(e => e.id === selectedExam)?.date || 'Select an exam'}
                </Text>
              </View>
            </View>
          )}

          {/* Centre Selection */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Select Centre</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedCentre}
                onValueChange={setSelectedCentre}
                style={{ color: '#1A1A1A' }}
              >
                <Picker.Item label="Choose a centre..." value="" />
                {centres.map(centre => (
                  <Picker.Item key={centre.code} label={centre.name} value={centre.code} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Password Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              {dataType === 'mock' ? 'Mock Password' : 'Exam Password'}
            </Text>
            <Text className="text-xs text-muted">
              Enter the password provided by admin panel
            </Text>
            <View className="flex-row items-center bg-surface border border-border rounded-lg">
              <TextInput
                className="flex-1 p-4 text-foreground"
                placeholder="Enter password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4"
                disabled={loading}
              >
                <Text className="text-primary font-semibold text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Download Progress */}
          {loading && downloadProgress > 0 && (
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-foreground">Downloading...</Text>
                <Text className="text-sm text-muted">{downloadProgress}%</Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${downloadProgress}%` }}
                />
              </View>
            </View>
          )}

          {/* Download Button */}
          <Pressable
            onPress={handleDownload}
            disabled={loading || !selectedExam || !selectedCentre || !password}
            style={({ pressed }: any) => ([
              { backgroundColor: '#0066CC', borderRadius: 8, padding: 16, alignItems: 'center' },
              pressed && !loading && { opacity: 0.8 },
            ])}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Download Data</Text>
            )}
          </Pressable>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
            <Text className="font-semibold text-primary">Information</Text>
            <Text className="text-sm text-foreground">
              • Download requires internet connection{'\n'}
              • Data will be stored locally on device{'\n'}
              • You can work offline after download{'\n'}
              • Sync data when internet is available
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
