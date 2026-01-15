import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';

interface ExamData {
  id: string;
  date: string;
  day: string;
  candidates: number;
  status: 'ready' | 'downloading' | 'downloaded';
}

export default function DataDownloadScreen() {
  const [activeTab, setActiveTab] = useState<'mock' | 'exam'>('mock');
  const [downloading, setDownloading] = useState<string | null>(null);

  const mockExams: ExamData[] = [
    { id: 'mock-1', date: '2026-01-15', day: 'Wednesday', candidates: 45, status: 'ready' },
    { id: 'mock-2', date: '2026-01-16', day: 'Thursday', candidates: 52, status: 'downloaded' },
    { id: 'mock-3', date: '2026-01-17', day: 'Friday', candidates: 48, status: 'ready' },
  ];

  const examData: ExamData[] = [
    { id: 'exam-1', date: '2026-01-20', day: 'Monday', candidates: 50, status: 'ready' },
    { id: 'exam-2', date: '2026-01-21', day: 'Tuesday', candidates: 55, status: 'ready' },
    { id: 'exam-3', date: '2026-01-22', day: 'Wednesday', candidates: 49, status: 'downloaded' },
  ];

  const handleDownload = async (examId: string) => {
    setDownloading(examId);
    
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDownloading(null);
    Alert.alert('Success', 'Exam data downloaded successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-primary/10 border-primary';
      case 'downloading':
        return 'bg-warning/10 border-warning';
      case 'downloaded':
        return 'bg-success/10 border-success';
      default:
        return 'bg-surface border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready to Download';
      case 'downloading':
        return 'Downloading...';
      case 'downloaded':
        return 'Downloaded ✓';
      default:
        return 'Unknown';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-primary';
      case 'downloading':
        return 'text-warning';
      case 'downloaded':
        return 'text-success';
      default:
        return 'text-foreground';
    }
  };

  const exams = activeTab === 'mock' ? mockExams : examData;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Data Download</Text>
            <Text className="text-sm text-muted">Download exam candidate data</Text>
          </View>

          {/* Tabs */}
          <View className="flex-row gap-3 bg-surface rounded-lg p-1 border border-border">
            <TouchableOpacity
              onPress={() => setActiveTab('mock')}
              className={`flex-1 py-3 rounded-md items-center ${
                activeTab === 'mock' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text className={`font-semibold ${activeTab === 'mock' ? 'text-white' : 'text-foreground'}`}>
                MOCK DATA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('exam')}
              className={`flex-1 py-3 rounded-md items-center ${
                activeTab === 'exam' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text className={`font-semibold ${activeTab === 'exam' ? 'text-white' : 'text-foreground'}`}>
                EXAM DATA
              </Text>
            </TouchableOpacity>
          </View>

          {/* Exams List */}
          <View className="gap-3">
            {exams.map((exam) => (
              <View
                key={exam.id}
                className={`rounded-lg p-4 border gap-3 ${getStatusColor(exam.status)}`}
              >
                {/* Exam Info */}
                <View className="gap-2">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {exam.date} ({exam.day})
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {exam.candidates} candidates
                      </Text>
                    </View>
                    <Text className={`text-xs font-semibold ${getStatusTextColor(exam.status)}`}>
                      {getStatusText(exam.status)}
                    </Text>
                  </View>
                </View>

                {/* Download Button */}
                <TouchableOpacity
                  onPress={() => handleDownload(exam.id)}
                  disabled={downloading === exam.id || exam.status === 'downloaded'}
                  className={`py-3 rounded-lg items-center flex-row justify-center gap-2 ${
                    exam.status === 'downloaded'
                      ? 'bg-success/20'
                      : downloading === exam.id
                      ? 'bg-warning/20'
                      : 'bg-primary'
                  }`}
                >
                  {downloading === exam.id ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white font-semibold text-sm">Downloading...</Text>
                    </>
                  ) : exam.status === 'downloaded' ? (
                    <>
                      <Text className="text-success font-semibold text-sm">✓ Downloaded</Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-white font-semibold text-sm">↓ Download</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2 mt-4">
            <Text className="text-xs font-semibold text-primary">ℹ️ Information</Text>
            <Text className="text-xs text-foreground leading-relaxed">
              Download {activeTab === 'mock' ? 'mock' : 'exam'} data to get candidate details for biometric verification.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
