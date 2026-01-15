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
        <View style={{ gap: 16 }}>
          {/* Header */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#11181C' }}>Mark Present</Text>
            <Text style={{ fontSize: 14, color: '#687076' }}>Mark candidate attendance</Text>
          </View>

          {/* Roll Number Input */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C' }}>Enter Roll Number</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: '#f5f5f5',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  color: '#11181C',
                  fontSize: 16,
                }}
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
                style={{
                  backgroundColor: '#0a7ea4',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (loading || marking || !rollNo.trim()) ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Candidate Details */}
          {candidate && (
            <View style={{
              backgroundColor: '#f5f5f5',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 8,
              paddingVertical: 16,
              paddingHorizontal: 16,
              gap: 12,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C', marginBottom: 8 }}>Candidate Details</Text>
              
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#687076' }}>Roll Number</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C' }}>{candidate.rollNo}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#687076' }}>Name</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C' }}>{candidate.name}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#687076' }}>Current Status</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#11181C' }}>
                    {candidate.present === true ? '✓ Present' : candidate.present === false ? '✗ Absent' : '⊘ Not Marked'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {candidate && (
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleMarkPresent(true)}
                disabled={marking}
                style={{
                  backgroundColor: '#22C55E',
                  borderRadius: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: marking ? 0.5 : 1,
                }}
              >
                {marking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>✓ Mark Present</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleMarkPresent(false)}
                disabled={marking}
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: marking ? 0.5 : 1,
                }}
              >
                {marking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>✗ Mark Absent</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClear}
                disabled={marking}
                style={{
                  backgroundColor: '#f5f5f5',
                  borderColor: '#E5E7EB',
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: marking ? 0.5 : 1,
                }}
              >
                <Text style={{ color: '#11181C', fontWeight: '600', fontSize: 16 }}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Box */}
          <View style={{
            backgroundColor: '#E6F4FE',
            borderWidth: 1,
            borderColor: '#0a7ea4',
            borderRadius: 8,
            paddingVertical: 16,
            paddingHorizontal: 16,
            gap: 8,
            marginTop: 16,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#0a7ea4' }}>ℹ️ Instructions</Text>
            <Text style={{ fontSize: 12, color: '#11181C', lineHeight: 18 }}>
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
