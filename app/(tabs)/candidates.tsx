import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { offlineStorage, CandidateRecord, ExamData } from '@/lib/offline-storage';
import * as Haptics from 'expo-haptics';

type CandidateStatus = 'all' | 'present' | 'absent' | 'registered' | 'pending';

export default function CandidatesScreen() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchQuery, selectedStatus]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const exams = await offlineStorage.getAllExamData();
      const allCandidates = exams.flatMap(exam => exam.candidates);
      setCandidates(allCandidates);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  };

  const filterCandidates = () => {
    let filtered = candidates;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.rollNumber.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.aadhaar.toLowerCase().includes(query)
      );
    }

    setFilteredCandidates(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#00D084';
      case 'absent':
        return '#EF4444';
      case 'registered':
        return '#0066CC';
      case 'pending':
        return '#F59E0B';
      default:
        return '#687076';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderCandidate = ({ item }: { item: CandidateRecord }) => (
    <TouchableOpacity
      className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-center gap-4"
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      {/* Avatar */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: getStatusColor(item.status) }}
      >
        <Text className="text-white font-bold text-lg">
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Candidate Info */}
      <View className="flex-1 gap-1">
        <Text className="font-semibold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-muted">Roll: {item.rollNumber}</Text>
        <View className="flex-row items-center gap-2">
          <View
            className="px-2 py-1 rounded"
            style={{ backgroundColor: getStatusColor(item.status) + '20' }}
          >
            <Text className="text-xs font-semibold" style={{ color: getStatusColor(item.status) }}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          {item.biometricData?.faceMatchPercentage && (
            <Text className="text-xs text-muted">
              Face: {item.biometricData.faceMatchPercentage}%
            </Text>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Text className="text-primary text-lg">→</Text>
    </TouchableOpacity>
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
      <View className="flex-1 p-6 gap-4">
        {/* Header */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Candidates</Text>
          <Text className="text-sm text-muted">
            Total: {filteredCandidates.length} / {candidates.length}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="bg-surface border border-border rounded-lg flex-row items-center px-4 gap-2">
          <Text className="text-muted">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-foreground"
            placeholder="Search by roll no, name..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-muted text-lg">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Filter by Status</Text>
          <View className="flex-row gap-2 flex-wrap">
            {(['all', 'present', 'absent', 'registered', 'pending'] as CandidateStatus[]).map(status => (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedStatus(status)}
                className={`px-3 py-2 rounded-full border ${
                  selectedStatus === status
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedStatus === status ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {status === 'all' ? 'All' : getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Candidates List */}
        {filteredCandidates.length > 0 ? (
          <FlatList
            data={filteredCandidates}
            renderItem={renderCandidate}
            keyExtractor={item => item.candidateId}
            scrollEnabled={true}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-4xl">📋</Text>
            <Text className="text-foreground font-semibold">No candidates found</Text>
            <Text className="text-sm text-muted text-center">
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
