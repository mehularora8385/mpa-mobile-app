import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { barcodeScannerService } from '@/lib/barcode-scanner-service';
import * as Haptics from 'expo-haptics';

export default function BarcodeScannerScreen() {
  const [rollNo, setRollNo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await barcodeScannerService.scanBarcode();

      if (result.success) {
        const parsedRollNo = barcodeScannerService.parseScannedData(result.rollNo);

        if (barcodeScannerService.validateRollNo(parsedRollNo)) {
          setRollNo(parsedRollNo);
          setScanHistory([...scanHistory, result]);

          // Show success message
          Alert.alert('Success', `Roll No: ${parsedRollNo} scanned successfully!`);
        } else {
          Alert.alert('Invalid', 'Invalid roll number format. Please try again.');
        }
      } else {
        Alert.alert('Scan Failed', result.error || 'Unable to scan. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Scanning failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualEntry = () => {
    if (!rollNo.trim()) {
      Alert.alert('Error', 'Please enter a roll number');
      return;
    }

    if (!barcodeScannerService.validateRollNo(rollNo)) {
      Alert.alert('Invalid', 'Roll number format should be like A001, B002, etc.');
      return;
    }

    Alert.alert('Success', `Roll No: ${rollNo.toUpperCase()} entered successfully!`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClear = () => {
    setRollNo('');
    setManualMode(false);
  };

  const stats = barcodeScannerService.getStatistics();

  return (
    <ScreenContainer className="bg-gray-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">📱 Roll No Scanner</Text>
          <Text className="text-gray-600 mt-2">Scan or manually enter roll number</Text>
        </View>

        {/* Camera Preview Placeholder */}
        <View className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-300">
          <View className="w-full aspect-square bg-gray-900 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-gray-600">
            <Text className="text-white text-center">
              {isScanning ? '📷 Scanning...' : '📷 Camera Preview'}
            </Text>
          </View>

          {/* Torch Toggle */}
          <Pressable
            onPress={() => setTorchOn(!torchOn)}
            className={`p-3 rounded-lg mb-4 ${torchOn ? 'bg-yellow-100' : 'bg-gray-100'}`}
          >
            <Text className={`text-center font-semibold ${torchOn ? 'text-yellow-800' : 'text-gray-700'}`}>
              {torchOn ? '💡 Torch ON' : '💡 Torch OFF'}
            </Text>
          </Pressable>

          {/* Scan Button */}
          <Pressable
            onPress={handleScan}
            disabled={isScanning}
            className={`p-4 rounded-lg mb-3 ${isScanning ? 'bg-gray-300' : 'bg-blue-600'}`}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isScanning ? '⏳ Scanning...' : '🔍 Scan Roll Number'}
            </Text>
          </Pressable>

          {/* Manual Entry Toggle */}
          <Pressable
            onPress={() => setManualMode(!manualMode)}
            className="p-3 rounded-lg bg-gray-200"
          >
            <Text className="text-gray-800 text-center font-semibold">
              {manualMode ? '✓ Manual Mode' : 'Manual Entry'}
            </Text>
          </Pressable>
        </View>

        {/* Manual Entry Section */}
        {manualMode && (
          <View className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-orange-500">
            <Text className="text-lg font-bold text-gray-900 mb-3">Manual Entry</Text>

            <TextInput
              value={rollNo}
              onChangeText={setRollNo}
              placeholder="Enter Roll No (e.g., A001)"
              placeholderTextColor="#999"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-900 font-semibold"
              maxLength={4}
            />

            <Text className="text-xs text-gray-600 mb-4">
              Format: Letter + 3 digits (A001, B002, etc.)
            </Text>

            <Pressable
              onPress={handleManualEntry}
              className="bg-green-600 p-4 rounded-lg mb-2"
            >
              <Text className="text-white text-center font-bold">✓ Confirm</Text>
            </Pressable>
          </View>
        )}

        {/* Current Roll No Display */}
        {rollNo && (
          <View className="bg-green-50 rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
            <Text className="text-gray-600 text-sm font-semibold">Current Roll No</Text>
            <Text className="text-3xl font-bold text-green-600 mt-2">{rollNo.toUpperCase()}</Text>

            <Pressable
              onPress={handleClear}
              className="bg-red-100 p-3 rounded-lg mt-4"
            >
              <Text className="text-red-700 text-center font-semibold">Clear</Text>
            </Pressable>
          </View>
        )}

        {/* Statistics */}
        <View className="bg-white rounded-lg shadow p-6 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Scan Statistics</Text>

          <View className="grid grid-cols-3 gap-3">
            <View className="bg-blue-50 p-3 rounded-lg">
              <Text className="text-gray-600 text-xs">Total Scans</Text>
              <Text className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</Text>
            </View>

            <View className="bg-green-50 p-3 rounded-lg">
              <Text className="text-gray-600 text-xs">Successful</Text>
              <Text className="text-2xl font-bold text-green-600 mt-1">{stats.successful}</Text>
            </View>

            <View className="bg-red-50 p-3 rounded-lg">
              <Text className="text-gray-600 text-xs">Failed</Text>
              <Text className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</Text>
            </View>
          </View>

          <View className="bg-purple-50 p-3 rounded-lg mt-3">
            <Text className="text-gray-600 text-xs">Success Rate</Text>
            <Text className="text-2xl font-bold text-purple-600 mt-1">{stats.successRate}%</Text>
          </View>
        </View>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <View className="bg-white rounded-lg shadow p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Recent Scans</Text>

            {scanHistory.slice(-5).reverse().map((scan, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                <View>
                  <Text className="font-semibold text-gray-900">{scan.rollNo}</Text>
                  <Text className="text-xs text-gray-600">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${scan.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className={`text-xs font-semibold ${scan.success ? 'text-green-800' : 'text-red-800'}`}>
                    {scan.success ? '✓' : '✗'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
