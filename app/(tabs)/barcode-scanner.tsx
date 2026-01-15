import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { mockCandidatesService } from '@/lib/mock-candidates';
import { useState, useEffect } from 'react';

type FilterType = 'all' | 'present' | 'absent' | 'verified' | 'pending';

export default function CandidatesDetailsScreen() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchQuery, activeFilter]);

  const loadCandidates = () => {
    const allCandidates = mockCandidatesService.getAllCandidates();
    setCandidates(allCandidates);
  };

  const filterCandidates = () => {
    let filtered = mockCandidatesService.getCandidatesByStatus(activeFilter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c => c.rollNo.includes(query) || c.name.toLowerCase().includes(query)
      );
    }

    setFilteredCandidates(filtered);
  };

  const getStatusBadge = (present: boolean | null) => {
    if (present === true) return { text: '✓ Yes', color: 'bg-success/20 border-success text-success' };
    if (present === false) return { text: '✗ No', color: 'bg-error/20 border-error text-error' };
    return { text: '⊘ Not Marked', color: 'bg-muted/20 border-muted text-muted' };
  };

  const getVerificationBadge = (verified: boolean | null) => {
    if (verified === true) return { text: '✓ Yes', color: 'bg-success/20 border-success text-success' };
    if (verified === false) return { text: '✗ No', color: 'bg-error/20 border-error text-error' };
    return { text: '⊘ Pending', color: 'bg-warning/20 border-warning text-warning' };
  };

  const renderCandidate = ({ item }: { item: any }) => {
    const presentBadge = getStatusBadge(item.present);
    const verifiedBadge = getVerificationBadge(item.verified);

    return (
      <View className="bg-surface border border-border rounded-lg p-4 mb-3 gap-3">
        {/* Header */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
            <Text className="text-xs text-muted mt-1">Roll: {item.rollNo}</Text>
          </View>
        </View>

        {/* Status Badges */}
        <View className="flex-row gap-2">
          <View className={`flex-1 border rounded-lg p-2 items-center ${presentBadge.color}`}>
            <Text className="text-xs font-semibold">Present</Text>
            <Text className="text-xs font-bold mt-1">{presentBadge.text}</Text>
          </View>

          <View className={`flex-1 border rounded-lg p-2 items-center ${verifiedBadge.color}`}>
            <Text className="text-xs font-semibold">Verified</Text>
            <Text className="text-xs font-bold mt-1">{verifiedBadge.text}</Text>
          </View>
        </View>

        {/* Sync Status */}
        <View className="flex-row items-center gap-2 pt-2 border-t border-border">
          <Text className="text-xs text-muted">Sync:</Text>
          <Text className={`text-xs font-semibold ${item.synced ? 'text-success' : 'text-warning'}`}>
            {item.synced ? '✓ Synced' : '⟳ Pending'}
          </Text>
        </View>
      </View>
    );
  };

  const getFilterStats = (filter: FilterType) => {
    return mockCandidatesService.getCandidatesByStatus(filter).length;
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Candidates Details</Text>
            <Text className="text-sm text-muted">View all candidates and their status</Text>
          </View>

          {/* Search Bar */}
          <View className="bg-surface border border-border rounded-lg flex-row items-center px-3 gap-2">
            <Text className="text-muted">🔍</Text>
            <TextInput
              className="flex-1 py-3 text-foreground"
              placeholder="Search by roll no or name..."
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

          {/* Filter Buttons */}
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted">FILTER BY STATUS</Text>
            <View className="flex-row gap-2 flex-wrap">
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
                className={`px-3 py-2 rounded-full border ${
                  activeFilter === 'all' ? 'border-primary bg-primary/10' : 'border-border bg-surface'
                }`}
              >
                <Text className={`text-xs font-semibold ${activeFilter === 'all' ? 'text-primary' : 'text-foreground'}`}>
                  All ({candidates.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('present')}
                className={`px-3 py-2 rounded-full border ${
                  activeFilter === 'present' ? 'border-success bg-success/10' : 'border-border bg-surface'
                }`}
              >
                <Text className={`text-xs font-semibold ${activeFilter === 'present' ? 'text-success' : 'text-foreground'}`}>
                  Present ({getFilterStats('present')})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('absent')}
                className={`px-3 py-2 rounded-full border ${
                  activeFilter === 'absent' ? 'border-error bg-error/10' : 'border-border bg-surface'
                }`}
              >
                <Text className={`text-xs font-semibold ${activeFilter === 'absent' ? 'text-error' : 'text-foreground'}`}>
                  Absent ({getFilterStats('absent')})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('verified')}
                className={`px-3 py-2 rounded-full border ${
                  activeFilter === 'verified' ? 'border-success bg-success/10' : 'border-border bg-surface'
                }`}
              >
                <Text className={`text-xs font-semibold ${activeFilter === 'verified' ? 'text-success' : 'text-foreground'}`}>
                  Verified ({getFilterStats('verified')})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('pending')}
                className={`px-3 py-2 rounded-full border ${
                  activeFilter === 'pending' ? 'border-warning bg-warning/10' : 'border-border bg-surface'
                }`}
              >
                <Text className={`text-xs font-semibold ${activeFilter === 'pending' ? 'text-warning' : 'text-foreground'}`}>
                  Pending ({getFilterStats('pending')})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Candidates List */}
          {filteredCandidates.length > 0 ? (
            <FlatList
              data={filteredCandidates}
              renderItem={renderCandidate}
              keyExtractor={item => item.rollNo}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 0 }}
            />
          ) : (
            <View className="items-center justify-center py-8 gap-3">
              <Text className="text-4xl">📋</Text>
              <Text className="text-foreground font-semibold">No candidates found</Text>
              <Text className="text-sm text-muted text-center">
                Try adjusting your search or filter criteria
              </Text>
            </View>
          )}

          {/* Summary */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2 mt-4">
            <Text className="text-xs font-semibold text-primary">Summary</Text>
            <View className="gap-1">
              <Text className="text-xs text-foreground">Total Candidates: {candidates.length}</Text>
              <Text className="text-xs text-foreground">Present: {getFilterStats('present')}</Text>
              <Text className="text-xs text-foreground">Verified: {getFilterStats('verified')}</Text>
              <Text className="text-xs text-foreground">Pending: {getFilterStats('pending')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
