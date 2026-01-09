import AWS from 'aws-sdk';

// AWS Configuration
const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || '';
const AWS_SECRET_KEY = process.env.EXPO_PUBLIC_AWS_SECRET_KEY || '';

interface FaceMatchResult {
  match: boolean;
  similarity: number;
  confidence: number;
  faceDetails?: any;
}

interface FaceDetectionResult {
  detected: boolean;
  faceCount: number;
  confidence: number;
  boundingBox?: any;
  landmarks?: any;
}

class FaceRecognitionService {
  private rekognition: AWS.Rekognition;

  constructor() {
    AWS.config.update({
      region: AWS_REGION,
      credentials: new AWS.Credentials({
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
      }),
    });

    this.rekognition = new AWS.Rekognition();
  }

  /**
   * Compare two face images
   * @param sourceImageBase64 - Base64 encoded source image
   * @param targetImageBase64 - Base64 encoded target image
   * @returns Face match result with similarity percentage
   */
  async compareFaces(
    sourceImageBase64: string,
    targetImageBase64: string,
    similarityThreshold: number = 80
  ): Promise<FaceMatchResult> {
    try {
      const params = {
        SourceImage: {
          Bytes: Buffer.from(sourceImageBase64, 'base64'),
        },
        TargetImage: {
          Bytes: Buffer.from(targetImageBase64, 'base64'),
        },
        SimilarityThreshold: similarityThreshold,
      };

      const result = await this.rekognition.compareFaces(params).promise();

      if (result.FaceMatches && result.FaceMatches.length > 0) {
        const match = result.FaceMatches[0];
        return {
          match: true,
          similarity: match.Similarity || 0,
          confidence: (match.Face?.Confidence || 0) / 100,
          faceDetails: match.Face,
        };
      }

      return {
        match: false,
        similarity: 0,
        confidence: 0,
      };
    } catch (error) {
      console.error('Face comparison error:', error);
      throw new Error(`Face comparison failed: ${(error as Error).message}`);
    }
  }

  /**
   * Detect faces in an image
   * @param imageBase64 - Base64 encoded image
   * @returns Face detection result
   */
  async detectFaces(imageBase64: string): Promise<FaceDetectionResult> {
    try {
      const params = {
        Image: {
          Bytes: Buffer.from(imageBase64, 'base64'),
        },
        Attributes: ['ALL'],
      };

      const result = await this.rekognition.detectFaces(params).promise();

      if (result.FaceDetails && result.FaceDetails.length > 0) {
        const face = result.FaceDetails[0];
        return {
          detected: true,
          faceCount: result.FaceDetails.length,
          confidence: (face.Confidence || 0) / 100,
          boundingBox: face.BoundingBox,
          landmarks: face.Landmarks,
        };
      }

      return {
        detected: false,
        faceCount: 0,
        confidence: 0,
      };
    } catch (error) {
      console.error('Face detection error:', error);
      throw new Error(`Face detection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Search for a face in a collection
   * @param collectionId - Rekognition collection ID
   * @param imageBase64 - Base64 encoded image
   * @returns Matching faces from collection
   */
  async searchFacesByImage(
    collectionId: string,
    imageBase64: string,
    maxFaces: number = 1,
    faceMatchThreshold: number = 80
  ): Promise<any> {
    try {
      const params = {
        CollectionId: collectionId,
        Image: {
          Bytes: Buffer.from(imageBase64, 'base64'),
        },
        MaxFaces: maxFaces,
        FaceMatchThreshold: faceMatchThreshold,
      };

      const result = await this.rekognition.searchFacesByImage(params).promise();

      return {
        matches: result.FaceMatches || [],
        searchedFaceConfidence: (result.SearchedFaceBoundingBox?.Confidence || 0) / 100,
      };
    } catch (error) {
      console.error('Face search error:', error);
      throw new Error(`Face search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Index a face in a collection
   * @param collectionId - Rekognition collection ID
   * @param imageBase64 - Base64 encoded image
   * @param externalImageId - External ID for the face
   * @returns Face ID and metadata
   */
  async indexFace(
    collectionId: string,
    imageBase64: string,
    externalImageId: string
  ): Promise<any> {
    try {
      const params = {
        CollectionId: collectionId,
        Image: {
          Bytes: Buffer.from(imageBase64, 'base64'),
        },
        ExternalImageId: externalImageId,
        DetectionAttributes: ['ALL'],
      };

      const result = await this.rekognition.indexFaces(params).promise();

      if (result.FaceRecords && result.FaceRecords.length > 0) {
        const faceRecord = result.FaceRecords[0];
        return {
          faceId: faceRecord.Face?.FaceId,
          confidence: (faceRecord.Face?.Confidence || 0) / 100,
          externalImageId: faceRecord.FaceDetail?.ExternalImageId,
        };
      }

      return {
        faceId: null,
        confidence: 0,
        externalImageId: null,
      };
    } catch (error) {
      console.error('Face indexing error:', error);
      throw new Error(`Face indexing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze facial attributes
   * @param imageBase64 - Base64 encoded image
   * @returns Facial attributes (age, gender, emotions, etc.)
   */
  async analyzeFacialAttributes(imageBase64: string): Promise<any> {
    try {
      const params = {
        Image: {
          Bytes: Buffer.from(imageBase64, 'base64'),
        },
        Attributes: ['ALL'],
      };

      const result = await this.rekognition.detectFaces(params).promise();

      if (result.FaceDetails && result.FaceDetails.length > 0) {
        const face = result.FaceDetails[0];
        return {
          ageRange: face.AgeRange,
          gender: face.Gender,
          emotions: face.Emotions,
          eyesOpen: face.EyesOpen,
          mouthOpen: face.MouthOpen,
          smiling: face.Smile,
          confidence: (face.Confidence || 0) / 100,
        };
      }

      return null;
    } catch (error) {
      console.error('Facial attributes analysis error:', error);
      throw new Error(`Facial attributes analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate face quality for biometric verification
   * @param imageBase64 - Base64 encoded image
   * @returns Quality validation result
   */
  async validateFaceQuality(imageBase64: string): Promise<{
    isValid: boolean;
    confidence: number;
    issues: string[];
  }> {
    try {
      const detection = await this.detectFaces(imageBase64);
      const issues: string[] = [];

      if (!detection.detected) {
        issues.push('No face detected in image');
        return { isValid: false, confidence: 0, issues };
      }

      if (detection.faceCount > 1) {
        issues.push('Multiple faces detected. Only one face is allowed.');
      }

      if (detection.confidence < 0.8) {
        issues.push('Face confidence too low. Please ensure good lighting.');
      }

      const isValid = detection.confidence >= 0.8 && detection.faceCount === 1;

      return {
        isValid,
        confidence: detection.confidence,
        issues,
      };
    } catch (error) {
      console.error('Face quality validation error:', error);
      return {
        isValid: false,
        confidence: 0,
        issues: [`Validation error: ${(error as Error).message}`],
      };
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService();
export type { FaceMatchResult, FaceDetectionResult };
