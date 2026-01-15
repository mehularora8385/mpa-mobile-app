import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

interface Operator {
  operatorId: string;
  operatorName: string;
  phoneNumber: string;
  aadhaarNumber: string;
  selfie: string;
  loginTime: string;
}

interface Candidate {
  id: string;
  rollNo: string;
  name: string;
  fatherName: string;
  centre: string;
  dob: string;
  examTime: string;
  photo: string;
  registrationStatus: 'pending' | 'done';
  verificationStatus: 'pending' | 'done';
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'download' | 'register' | 'verify' | 'sync'>('download');
  const [operatorName, setOperatorNameState] = useState('');
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('');
  const [centres, setCentres] = useState<string[]>([]);
  const [mockPassword, setMockPassword] = useState('');
  const [examPassword, setExamPassword] = useState('');
  const [dataType, setDataType] = useState<'mock' | 'exam'>('mock');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Mock candidate data
  const mockCandidates: Candidate[] = [
    {
      id: '1',
      rollNo: '11000001',
      name: 'Candidate 1',
      fatherName: 'Father 1',
      centre: 'C0001',
      dob: '2000-01-15',
      examTime: '09:00 AM',
      photo: 'https://via.placeholder.com/150',
      registrationStatus: 'pending',
      verificationStatus: 'pending',
    },
    {
      id: '2',
      rollNo: '11000002',
      name: 'Candidate 2',
      fatherName: 'Father 2',
      centre: 'C0002',
      dob: '2000-02-20',
      examTime: '01:00 PM',
      photo: 'https://via.placeholder.com/150',
      registrationStatus: 'done',
      verificationStatus: 'pending',
    },
    {
      id: '3',
      rollNo: '11000003',
      name: 'Candidate 3',
      fatherName: 'Father 3',
      centre: 'C0001',
      dob: '2000-03-10',
      examTime: '09:00 AM',
      photo: 'https://via.placeholder.com/150',
      registrationStatus: 'done',
      verificationStatus: 'done',
    },
  ];

  useEffect(() => {
    loadOperatorData();
  }, []);

  const loadOperatorData = async () => {
    try {
      const operatorData = await AsyncStorage.getItem('currentOperator');
      if (operatorData) {
        const op = JSON.parse(operatorData);
        setOperator(op);
        
        // Load candidates
        setCandidates(mockCandidates);
        setFilteredCandidates(mockCandidates);
        
        // Extract unique centres
        const uniqueCentres = [...new Set(mockCandidates.map(c => c.centre))];
        setCentres(uniqueCentres);
      } else {
        router.replace('/operator-login');
      }
    } catch (error) {
      console.error('Error loading operator data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('currentOperator');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/operator-login');
        },
      },
    ]);
  };

  const handleDownloadData = async () => {
    if (dataType === 'mock' && !mockPassword) {
      Alert.alert('Error', 'Please enter mock data password');
      return;
    }
    if (dataType === 'exam' && !examPassword) {
      Alert.alert('Error', 'Please enter exam data password');
      return;
    }

    setLoading(true);
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', `${dataType === 'mock' ? 'Mock' : 'Exam'} data downloaded successfully`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPasswordInput(false);
      setMockPassword('');
      setExamPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to download data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    const filtered = candidates.filter(c =>
      (c.name.toLowerCase().includes(text.toLowerCase()) ||
        c.rollNo.includes(text)) &&
      (!selectedCentre || c.centre === selectedCentre)
    );
    setFilteredCandidates(filtered);
  };

  const handleCentreFilter = (centre: string) => {
    setSelectedCentre(centre === selectedCentre ? '' : centre);
    const filtered = candidates.filter(c =>
      (c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.rollNo.includes(searchText)) &&
      (!centre || c.centre === centre)
    );
    setFilteredCandidates(filtered);
  };

  // TAB NAVIGATION HEADER
  const renderTabNavigation = () => (
    <View className="flex-row bg-surface border-b" style={{ borderBottomColor: colors.border }}>
      <TouchableOpacity
        onPress={() => setActiveTab('download')}
        className="flex-1 py-3 items-center border-b-2"
        style={{
          borderBottomColor: activeTab === 'download' ? colors.primary : 'transparent',
        }}
      >
        <Text
          style={{
            color: activeTab === 'download' ? colors.primary : colors.muted,
            fontWeight: activeTab === 'download' ? '600' : '400',
          }}
        >
          📥 Download
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setActiveTab('register')}
        className="flex-1 py-3 items-center border-b-2"
        style={{
          borderBottomColor: activeTab === 'register' ? colors.primary : 'transparent',
        }}
      >
        <Text
          style={{
            color: activeTab === 'register' ? colors.primary : colors.muted,
            fontWeight: activeTab === 'register' ? '600' : '400',
          }}
        >
          📝 Register
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setActiveTab('verify')}
        className="flex-1 py-3 items-center border-b-2"
        style={{
          borderBottomColor: activeTab === 'verify' ? colors.primary : 'transparent',
        }}
      >
        <Text
          style={{
            color: activeTab === 'verify' ? colors.primary : colors.muted,
            fontWeight: activeTab === 'verify' ? '600' : '400',
          }}
        >
          ✓ Verify
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setActiveTab('sync')}
        className="flex-1 py-3 items-center border-b-2"
        style={{
          borderBottomColor: activeTab === 'sync' ? colors.primary : 'transparent',
        }}
      >
        <Text
          style={{
            color: activeTab === 'sync' ? colors.primary : colors.muted,
            fontWeight: activeTab === 'sync' ? '600' : '400',
          }}
        >
          🔄 Sync
        </Text>
      </TouchableOpacity>
    </View>
  );

  // TAB 1: DATA DOWNLOAD
  if (activeTab === 'download') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderTabNavigation()}
        <ScreenContainer className="p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">📥 Data Download</Text>
          <Text className="text-sm text-muted">Select centre and download candidate data</Text>
        </View>

        {!showPasswordInput ? (
          <View className="gap-4">
            {/* Centre Selection */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Select Centre</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                {centres.map(centre => (
                  <TouchableOpacity
                    key={centre}
                    onPress={() => handleCentreFilter(centre)}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: selectedCentre === centre ? colors.primary : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedCentre === centre ? colors.background : colors.foreground,
                        fontWeight: '600',
                      }}
                    >
                      {centre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Data Type Selection */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Data Type</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setDataType('mock')}
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{
                    backgroundColor: dataType === 'mock' ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: dataType === 'mock' ? colors.background : colors.foreground,
                      fontWeight: '600',
                    }}
                  >
                    Mock Data
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDataType('exam')}
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{
                    backgroundColor: dataType === 'exam' ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: dataType === 'exam' ? colors.background : colors.foreground,
                      fontWeight: '600',
                    }}
                  >
                    Exam Data
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Download Button */}
            <TouchableOpacity
              onPress={() => setShowPasswordInput(true)}
              disabled={loading}
              className="py-3 rounded-lg items-center"
              style={{ backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-white font-semibold">📥 Download Data</Text>
              )}
            </TouchableOpacity>

            {/* Candidate List */}
            <View className="mt-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Candidates ({filteredCandidates.length})</Text>
              <FlatList
                data={filteredCandidates}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{item.name}</Text>
                        <Text className="text-xs text-muted">Roll: {item.rollNo}</Text>
                        <Text className="text-xs text-muted">Time: {item.examTime}</Text>
                      </View>
                      <View className="flex-row gap-1">
                        <View
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor:
                              item.registrationStatus === 'done' ? '#4CAF50' : '#FFC107',
                          }}
                        >
                          <Text className="text-xs font-semibold text-white">
                            {item.registrationStatus === 'done' ? '✓ Reg' : '⊘ Reg'}
                          </Text>
                        </View>
                        <View
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor:
                              item.verificationStatus === 'done' ? '#4CAF50' : '#FFC107',
                          }}
                        >
                          <Text className="text-xs font-semibold text-white">
                            {item.verificationStatus === 'done' ? '✓ Ver' : '⊘ Ver'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        ) : (
          <View className="gap-4">
            <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-sm font-semibold text-foreground mb-3">Enter Password</Text>
              <TextInput
                placeholder={`Enter ${dataType} data password`}
                placeholderTextColor={colors.muted}
                value={dataType === 'mock' ? mockPassword : examPassword}
                onChangeText={dataType === 'mock' ? setMockPassword : setExamPassword}
                secureTextEntry
                className="border rounded-lg px-4 py-3 text-foreground mb-4"
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  color: colors.foreground,
                }}
              />

              <TouchableOpacity
                onPress={handleDownloadData}
                disabled={loading || (!mockPassword && dataType === 'mock') || (!examPassword && dataType === 'exam')}
                className="py-3 rounded-lg items-center mb-2"
                style={{
                  backgroundColor: colors.primary,
                  opacity: loading || (!mockPassword && dataType === 'mock') || (!examPassword && dataType === 'exam') ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="text-white font-semibold">📥 Download Data</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowPasswordInput(false);
                  setMockPassword('');
                  setExamPassword('');
                }}
                className="py-3 rounded-lg items-center"
                style={{ backgroundColor: colors.border }}
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-6 py-3 rounded-lg items-center"
            style={{ backgroundColor: '#FF6B6B' }}
          >
            <Text className="text-white font-semibold">🚪 Logout</Text>
          </TouchableOpacity>
        </ScreenContainer>
      </View>
    );
  }

  // TAB 2: REGISTER CANDIDATE
  if (activeTab === 'register') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderTabNavigation()}
        <ScreenContainer className="p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">📝 Register Candidate</Text>
          <Text className="text-sm text-muted">Scan roll number and mark attendance</Text>
        </View>

        <View className="gap-4">
          {/* Search */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Scan/Enter Roll No</Text>
            <TextInput
              placeholder="Enter roll number"
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={handleSearch}
              className="border rounded-lg px-4 py-3 text-foreground"
              style={{
                borderColor: colors.border,
                borderWidth: 1,
                color: colors.foreground,
              }}
            />
          </View>

          {/* Candidate Details */}
          {filteredCandidates.length > 0 && (
            <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <View className="flex-row gap-4">
                <Image
                  source={{ uri: filteredCandidates[0].photo }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{filteredCandidates[0].name}</Text>
                  <Text className="text-xs text-muted">Father: {filteredCandidates[0].fatherName}</Text>
                  <Text className="text-xs text-muted">Roll: {filteredCandidates[0].rollNo}</Text>
                  <Text className="text-xs text-muted">DOB: {filteredCandidates[0].dob}</Text>
                  <Text className="text-xs text-muted">Time: {filteredCandidates[0].examTime}</Text>
                </View>
              </View>

              {/* Attendance */}
              <View className="mt-4 flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  <Text className="text-white font-semibold">✓ Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: '#FF6B6B' }}
                >
                  <Text className="text-white font-semibold">✗ Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {filteredCandidates.length === 0 && searchText && (
            <View className="items-center py-8">
              <Text className="text-muted">No candidate found</Text>
            </View>
          )}
        </View>
        </ScreenContainer>
      </View>
    );
  }

  // TAB 3: VERIFY CANDIDATE
  if (activeTab === 'verify') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderTabNavigation()}
        <ScreenContainer className="p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">✓ Verify Candidate</Text>
          <Text className="text-sm text-muted">Scan roll number and verify biometrics</Text>
        </View>

        <View className="gap-4">
          {/* Search */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Scan/Enter Roll No</Text>
            <TextInput
              placeholder="Enter roll number"
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={handleSearch}
              className="border rounded-lg px-4 py-3 text-foreground"
              style={{
                borderColor: colors.border,
                borderWidth: 1,
                color: colors.foreground,
              }}
            />
          </View>

          {/* Candidate Details */}
          {filteredCandidates.length > 0 && (
            <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="font-semibold text-foreground mb-2">Uploaded Photo</Text>
              <Image
                source={{ uri: filteredCandidates[0].photo }}
                style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 12 }}
              />

              <View className="mb-4">
                <Text className="font-semibold text-foreground mb-2">Candidate Info</Text>
                <Text className="text-sm text-muted">Name: {filteredCandidates[0].name}</Text>
                <Text className="text-sm text-muted">Father: {filteredCandidates[0].fatherName}</Text>
                <Text className="text-sm text-muted">Roll: {filteredCandidates[0].rollNo}</Text>
                <Text className="text-sm text-muted">DOB: {filteredCandidates[0].dob}</Text>
              </View>

              {/* Capture Real-time Photo */}
              <TouchableOpacity
                className="py-3 rounded-lg items-center mb-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold">📷 Capture Real-time Photo</Text>
              </TouchableOpacity>

              {/* Fingerprint Capture */}
              <TouchableOpacity
                className="py-3 rounded-lg items-center mb-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold">👆 Capture Fingerprint (MFS100/110)</Text>
              </TouchableOpacity>

              {/* Scan OMR */}
              <TouchableOpacity
                className="py-3 rounded-lg items-center mb-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold">📊 Scan OMR Barcode</Text>
              </TouchableOpacity>

              {/* Verify Button */}
              <TouchableOpacity
                className="py-3 rounded-lg items-center"
                style={{ backgroundColor: '#4CAF50' }}
              >
                <Text className="text-white font-semibold">✓ Verify Candidate</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredCandidates.length === 0 && searchText && (
            <View className="items-center py-8">
              <Text className="text-muted">No candidate found</Text>
            </View>
          )}
        </View>
        </ScreenContainer>
      </View>
    );
  }

  // TAB 4: SYNC STATUS
  if (activeTab === 'sync') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderTabNavigation()}
        <ScreenContainer className="p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">🔄 Sync Status</Text>
          <Text className="text-sm text-muted">View sync status and pending data</Text>
        </View>

        <View className="gap-4">
          {/* Stats */}
          <View className="grid grid-cols-2 gap-3">
            <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-2xl font-bold text-foreground">12</Text>
              <Text className="text-xs text-muted mt-1">Present</Text>
            </View>
            <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-2xl font-bold text-foreground">2</Text>
              <Text className="text-xs text-muted mt-1">Absent</Text>
            </View>
            <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-2xl font-bold text-foreground">10</Text>
              <Text className="text-xs text-muted mt-1">Sync Done</Text>
            </View>
            <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-2xl font-bold text-foreground">4</Text>
              <Text className="text-xs text-muted mt-1">Sync Pending</Text>
            </View>
          </View>

          {/* Sync Button */}
          <TouchableOpacity
            className="py-3 rounded-lg items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">🔄 Sync Now</Text>
          </TouchableOpacity>

          {/* Last Sync */}
          <View className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
            <Text className="text-sm font-semibold text-foreground mb-2">Last Sync</Text>
            <Text className="text-xs text-muted">2024-01-02 10:30:45</Text>
          </View>
        </View>
        </ScreenContainer>
      </View>
    );
  }

  return null;
}
