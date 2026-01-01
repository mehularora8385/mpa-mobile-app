import * as Haptics from 'expo-haptics';

export interface ScanResult {
  rollNo: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

class BarcodeScanner {
  private scanHistory: ScanResult[] = [];
  private maxHistorySize = 100;

  /**
   * Simulate barcode/QR code scan
   * In production, integrate with expo-barcode-scanner or react-native-camera
   */
  async scanBarcode(): Promise<ScanResult> {
    try {
      // Simulate camera scan delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate successful scan with random roll number
      const rollNo = this.generateMockRollNo();

      const result: ScanResult = {
        rollNo,
        timestamp: Date.now(),
        success: true,
      };

      // Haptic feedback on success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Add to history
      this.addToHistory(result);

      return result;
    } catch (error) {
      const result: ScanResult = {
        rollNo: '',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Scan failed',
      };

      // Haptic feedback on error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      return result;
    }
  }

  /**
   * Validate roll number format
   */
  validateRollNo(rollNo: string): boolean {
    // Roll number format: A001, B002, etc.
    const rollNoRegex = /^[A-Z]\d{3}$/;
    return rollNoRegex.test(rollNo.toUpperCase());
  }

  /**
   * Parse barcode/QR code data
   */
  parseScannedData(data: string): string {
    // Extract roll number from various formats
    // Format 1: Direct roll number (A001)
    // Format 2: URL with roll number (https://exam.com/roll/A001)
    // Format 3: JSON with roll number ({"rollNo":"A001"})

    try {
      // Try JSON parsing
      const jsonData = JSON.parse(data);
      if (jsonData.rollNo) {
        return jsonData.rollNo.toUpperCase();
      }
    } catch (e) {
      // Not JSON, continue
    }

    // Try URL parsing
    const urlMatch = data.match(/roll[=/]([A-Z]\d{3})/i);
    if (urlMatch) {
      return urlMatch[1].toUpperCase();
    }

    // Return as-is (direct roll number)
    return data.toUpperCase();
  }

  /**
   * Add scan to history
   */
  private addToHistory(result: ScanResult): void {
    this.scanHistory.push(result);

    // Keep history size limited
    if (this.scanHistory.length > this.maxHistorySize) {
      this.scanHistory = this.scanHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get scan history
   */
  getScanHistory(): ScanResult[] {
    return [...this.scanHistory];
  }

  /**
   * Clear scan history
   */
  clearScanHistory(): void {
    this.scanHistory = [];
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const total = this.scanHistory.length;
    const successful = this.scanHistory.filter(s => s.success).length;
    const failed = total - successful;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Generate mock roll number for testing
   */
  private generateMockRollNo(): string {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const number = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${letter}${number}`;
  }
}

export const barcodeScannerService = new BarcodeScanner();
