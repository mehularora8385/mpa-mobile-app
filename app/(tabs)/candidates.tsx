import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { mockCandidatesService } from '@/lib/mock-candidates';
import { useState } from 'react';

export default function MarkPresentScreen() {
  const [rollNo, setRollNo] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  const handleSearch = async () => {
    if (!rollNo.trim()) {
      Alert.alert('Error', 'Please enter a roll number');
      return;
    }

    setLoading(true);
    try {
      const found = mockCandidatesService.getCandidateByRollNo(rollNo);
      if (found) {
        setCandidate(found);
      } else {
        Alert.alert('Not Found', 'Candidate not found');
        setCandidate(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to search candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresent = async (present: boolean) => {
    if (!candidate) return;

    setMarking(true);
    try {
      const updated = mockCandidatesService.markPresent(candidate.rollNo, present);
      if (updated) {
        Alert.alert(
          'Success',
          `${candidate.name} marked as ${present ? 'Present' : 'Absent'} ✓`
        );
        // Clear form
        setRollNo('');
        setCandidate(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  const handleClear = () => {
    setRollNo('');
    setCandidate(null);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Mark Present</Text>
            <Text className="text-sm text-muted">Mark candidate attendance</Text>
          </View>

          {/* Roll Number Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Enter Roll Number</Text>
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 bg-surface border border-border rounded-lg p-3 text-foreground"
                placeholder="Roll number"
                placeholderTextColor="#999"
                value={rollNo}
                onChangeText={setRollNo}
                editable={!loading && !marking}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={handleSearch}
                disabled={loading || marking || !rollNo.trim()}
                className="bg-primary rounded-lg px-4 items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Candidate Details */}
          {candidate && (
            <View className="bg-surface border border-border rounded-lg p-4 gap-3">
              <Text className="text-sm font-semibold text-foreground mb-2">Candidate Details</Text>
              
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">Roll Number</Text>
                  <Text className="text-sm font-semibold text-foreground">{candidate.rollNo}</Text>
                </View>
                <View className="h-px bg-border" />
                
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">Name</Text>
                  <Text className="text-sm font-semibold text-foreground">{candidate.name}</Text>
                </View>
                <View className="h-px bg-border" />
                
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">Current Status</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {candidate.present === true ? '✓ Present' : candidate.present === false ? '✗ Absent' : '⊘ Not Marked'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {candidate && (
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => handleMarkPresent(true)}
                disabled={marking}
                className="bg-success rounded-lg p-4 items-center"
              >
                {marking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">✓ Mark Present</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleMarkPresent(false)}
                disabled={marking}
                className="bg-error rounded-lg p-4 items-center"
              >
                {marking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">✗ Mark Absent</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClear}
                disabled={marking}
                className="bg-surface border border-border rounded-lg p-4 items-center"
              >
                <Text className="text-foreground font-semibold text-base">Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2 mt-4">
            <Text className="text-xs font-semibold text-primary">ℹ️ Instructions</Text>
            <Text className="text-xs text-foreground leading-relaxed">
              1. Enter or scan candidate roll number{'\n'}
              2. Candidate details will appear{'\n'}
              3. Click Mark Present or Mark Absent{'\n'}
              4. Form will clear for next candidate
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
