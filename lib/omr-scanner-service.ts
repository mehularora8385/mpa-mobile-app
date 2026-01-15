import AWS from 'aws-sdk';

// AWS Configuration
const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || '';
const AWS_SECRET_KEY = process.env.EXPO_PUBLIC_AWS_SECRET_KEY || '';

export interface OMRScanResult {
  success: boolean;
  serialNumber: string;
  confidence: number;
  rawText: string;
  detectedFields: {
    [key: string]: string;
  };
  status: string;
  timestamp: string;
}

export interface OMRValidationResult {
  isValid: boolean;
  serialNumber: string;
  issues: string[];
}

class OMRScannerService {
  private textract: AWS.Textract;

  constructor() {
    AWS.config.update({
      region: AWS_REGION,
      credentials: new AWS.Credentials({
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
      }),
    });

    this.textract = new AWS.Textract();
  }

  /**
   * Scan OMR sheet and extract serial number
   */
  async scanOMRSheet(imageBase64: string): Promise<OMRScanResult> {
    try {
      const params = {
        Document: {
          Bytes: Buffer.from(imageBase64, 'base64'),
        },
      };

      const result = await this.textract.detectDocumentText(params).promise();

      if (!result.Blocks) {
        return {
          success: false,
          serialNumber: '',
          confidence: 0,
          rawText: '',
          detectedFields: {},
          status: 'No text detected in image',
          timestamp: new Date().toISOString(),
        };
      }

      // Extract text from blocks
      const extractedText = this.extractTextFromBlocks(result.Blocks);
      const serialNumber = this.parseSerialNumber(extractedText);
      const detectedFields = this.parseOMRFields(extractedText);

      return {
        success: serialNumber.length > 0,
        serialNumber,
        confidence: this.calculateConfidence(result.Blocks),
        rawText: extractedText,
        detectedFields,
        status: serialNumber.length > 0 ? 'success' : 'serial_number_not_found',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        serialNumber: '',
        confidence: 0,
        rawText: '',
        detectedFields: {},
        status: `Scan error: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Analyze OMR sheet structure
   */
  async analyzeOMRStructure(imageBase64: string): Promise<any> {
    try {
      const params = {
        Document: {
          Bytes: Buffer.from(imageBase64, 'base64'),
        },
      };

      const result = await this.textract.analyzeDocument({
        Document: params.Document,
        FeatureTypes: ['TABLES', 'FORMS'],
      }).promise();

      return {
        success: true,
        blocks: result.Blocks,
        documentMetadata: result.DocumentMetadata,
      };
    } catch (error) {
      return {
        success: false,
        error: `Analysis error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Extract serial number from OMR text
   */
  private parseSerialNumber(text: string): string {
    // Pattern for serial number (alphanumeric, usually 8-12 characters)
    const patterns = [
      /Serial\s*[#:]?\s*([A-Z0-9]{8,12})/gi,
      /OMR\s*[#:]?\s*([A-Z0-9]{8,12})/gi,
      /ID\s*[#:]?\s*([A-Z0-9]{8,12})/gi,
      /([A-Z0-9]{8,12})/g, // Fallback: any 8-12 character alphanumeric
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Extract the actual serial number from the match
        const serialMatch = match[0].match(/([A-Z0-9]{8,12})/);
        if (serialMatch) {
          return serialMatch[1];
        }
      }
    }

    return '';
  }

  /**
   * Parse OMR fields from extracted text
   */
  private parseOMRFields(text: string): { [key: string]: string } {
    const fields: { [key: string]: string } = {};

    // Extract common OMR fields
    const patterns = {
      serialNumber: /Serial\s*[#:]?\s*([A-Z0-9]+)/i,
      rollNumber: /Roll\s*[#:]?\s*(\d+)/i,
      name: /Name\s*[#:]?\s*([A-Za-z\s]+)/i,
      examCode: /Exam\s*[#:]?\s*([A-Z0-9]+)/i,
      centreCode: /Centre\s*[#:]?\s*([A-Z0-9]+)/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        fields[key] = match[1].trim();
      }
    }

    return fields;
  }

  /**
   * Calculate confidence score from Textract blocks
   */
  private calculateConfidence(blocks: AWS.Textract.BlockList): number {
    if (!blocks || blocks.length === 0) {
      return 0;
    }

    let totalConfidence = 0;
    let count = 0;

    for (const block of blocks) {
      if (block.Confidence) {
        totalConfidence += block.Confidence;
        count++;
      }
    }

    return count > 0 ? totalConfidence / count / 100 : 0;
  }

  /**
   * Extract text from Textract blocks
   */
  private extractTextFromBlocks(blocks: AWS.Textract.BlockList): string {
    const textLines: string[] = [];

    for (const block of blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        textLines.push(block.Text);
      }
    }

    return textLines.join('\n');
  }

  /**
   * Validate OMR scan result
   */
  async validateOMRScan(scanResult: OMRScanResult): Promise<OMRValidationResult> {
    const issues: string[] = [];

    if (!scanResult.success) {
      issues.push('OMR scan failed');
    }

    if (scanResult.serialNumber.length === 0) {
      issues.push('Serial number not found in OMR sheet');
    }

    if (scanResult.confidence < 0.7) {
      issues.push('OMR scan confidence too low. Please ensure good image quality.');
    }

    if (scanResult.serialNumber.length > 12) {
      issues.push('Serial number appears to be invalid (too long)');
    }

    const isValid = issues.length === 0 && scanResult.confidence >= 0.7;

    return {
      isValid,
      serialNumber: scanResult.serialNumber,
      issues,
    };
  }

  /**
   * Compare two OMR scans
   */
  async compareOMRScans(scan1: OMRScanResult, scan2: OMRScanResult): Promise<{
    match: boolean;
    similarity: number;
  }> {
    const similarity = this.calculateSimilarity(scan1.serialNumber, scan2.serialNumber);

    return {
      match: similarity >= 0.95, // 95% match required
      similarity,
    };
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);

    return 1 - distance / maxLength;
  }
}

export const omrScannerService = new OMRScannerService();
