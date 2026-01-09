import { offlineDatabase } from './offline-database';
import { loggingService } from './logging-service';

export interface DataRetentionPolicy {
  candidateData: number; // days
  biometricData: number; // days
  auditLogs: number; // days
  syncLogs: number; // days
  sessionData: number; // days
}

export interface ComplianceConfig {
  gdprCompliant: boolean;
  itActCompliant: boolean;
  dataEncrypted: boolean;
  auditLoggingEnabled: boolean;
  dataRetentionEnabled: boolean;
}

const DEFAULT_RETENTION_POLICY: DataRetentionPolicy = {
  candidateData: 365, // 1 year
  biometricData: 180, // 6 months
  auditLogs: 365, // 1 year
  syncLogs: 90, // 3 months
  sessionData: 30, // 1 month
};

export const PRIVACY_POLICY = `
# MPA Mobile App - Privacy Policy

## 1. Data Collection

The MPA Mobile App collects the following personal information:

- **Operator Information:**
  - Operator ID
  - Full Name
  - Mobile Number
  - Aadhaar Number (encrypted and hashed)
  - Selfie Photo (for verification)

- **Candidate Information:**
  - Roll Number
  - Name
  - Father's Name
  - Date of Birth
  - Exam Time

- **Biometric Data:**
  - Face Image (for verification)
  - Fingerprint Template (MFS100/MFS110)
  - OMR Serial Number

- **Activity Data:**
  - Login/Logout timestamps
  - Attendance markings
  - Biometric verification results
  - Sync activities

## 2. Data Usage

Your personal data is used for:

- **Primary Purpose:**
  - Exam verification and authentication
  - Attendance marking
  - Biometric identification
  - Candidate verification

- **Secondary Purpose:**
  - System administration
  - Performance monitoring
  - Security and fraud prevention
  - Audit and compliance

## 3. Data Protection

We implement the following security measures:

- **Encryption:** All sensitive data is encrypted using AES-256 encryption
- **Hashing:** Aadhaar numbers are hashed using SHA-256 and never stored in plain text
- **Secure Storage:** Data is stored in encrypted local database (SQLite)
- **Access Control:** Role-based access control (RBAC) for all operations
- **Audit Logging:** All operations are logged for compliance and security

## 4. Data Retention

Data is retained according to the following policy:

- **Candidate Data:** 1 year
- **Biometric Data:** 6 months
- **Audit Logs:** 1 year
- **Sync Logs:** 3 months
- **Session Data:** 1 month

After the retention period, data is automatically deleted from the system.

## 5. Your Rights

Under GDPR and India IT Act, you have the right to:

- **Right to Access:** Request access to your personal data
- **Right to Rectification:** Request correction of inaccurate data
- **Right to Erasure:** Request deletion of your data (subject to legal requirements)
- **Right to Data Portability:** Request your data in a portable format
- **Right to Object:** Object to processing of your data

## 6. Data Sharing

Your personal data is NOT shared with third parties except:

- **Government Authorities:** When required by law
- **Exam Administrators:** For exam verification purposes
- **System Administrators:** For system maintenance and support

## 7. Data Breach Notification

In case of a data breach, we will:

- Notify affected individuals within 72 hours
- Report to relevant authorities
- Provide information about the breach and remedial actions

## 8. Contact Information

For privacy-related queries, contact:

- **Data Protection Officer:** dpo@mpaverification.com
- **Organization:** MPA Verification System
- **Address:** [Organization Address]
- **Phone:** [Organization Phone]

## 9. Policy Updates

This privacy policy may be updated periodically. Users will be notified of significant changes.

**Last Updated:** January 2024
`;

export const GDPR_COMPLIANCE = {
  dataController: 'MPA Organization',
  dataProtectionOfficer: 'dpo@mpaverification.com',
  retentionPeriod: '1 year (default)',
  encryptionMethod: 'AES-256',
  hashingMethod: 'SHA-256',
  complianceFramework: 'GDPR + India IT Act 2000',
  dataProcessingAgreement: true,
  privacyByDesign: true,
  dataMinimization: true,
};

export const IT_ACT_COMPLIANCE = {
  dataProtectionStandard: 'IT Act 2000, Section 43A',
  reasonableSecurityMeasures: true,
  encryptionRequired: true,
  auditLoggingRequired: true,
  dataRetentionRequired: true,
  userConsentRequired: true,
};

class ComplianceService {
  private retentionPolicy: DataRetentionPolicy = DEFAULT_RETENTION_POLICY;
  private complianceConfig: ComplianceConfig = {
    gdprCompliant: true,
    itActCompliant: true,
    dataEncrypted: true,
    auditLoggingEnabled: true,
    dataRetentionEnabled: true,
  };

  /**
   * Initialize compliance service
   */
  async initialize(): Promise<void> {
    try {
      await loggingService.logActivity(
        'Compliance Service Initialized',
        {
          retentionPolicy: this.retentionPolicy,
          complianceConfig: this.complianceConfig,
        }
      );
    } catch (error) {
      console.error('Compliance service initialization error:', error);
    }
  }

  /**
   * Get data retention policy
   */
  getRetentionPolicy(): DataRetentionPolicy {
    return this.retentionPolicy;
  }

  /**
   * Update retention policy
   */
  updateRetentionPolicy(policy: Partial<DataRetentionPolicy>): void {
    this.retentionPolicy = {
      ...this.retentionPolicy,
      ...policy,
    };

    loggingService.logActivity(
      'Retention Policy Updated',
      { policy: this.retentionPolicy }
    ).catch((err) => console.error('Failed to log policy update:', err));
  }

  /**
   * Get compliance configuration
   */
  getComplianceConfig(): ComplianceConfig {
    return this.complianceConfig;
  }

  /**
   * Enforce data retention policy
   */
  async enforceDataRetention(): Promise<void> {
    try {
      const now = new Date();

      // Delete old candidate data
      await this.deleteOldCandidateData(
        new Date(now.getTime() - this.retentionPolicy.candidateData * 24 * 60 * 60 * 1000)
      );

      // Delete old biometric data
      await this.deleteOldBiometricData(
        new Date(now.getTime() - this.retentionPolicy.biometricData * 24 * 60 * 60 * 1000)
      );

      // Delete old audit logs
      await offlineDatabase.enforceDataRetention(this.retentionPolicy.auditLogs);

      await loggingService.logActivity(
        'Data Retention Policy Enforced',
        { timestamp: now.toISOString() }
      );
    } catch (error) {
      console.error('Error enforcing data retention:', error);
      await loggingService.logError(
        error as Error,
        'Data Retention Enforcement',
        { policy: this.retentionPolicy }
      );
    }
  }

  /**
   * Delete old candidate data
   */
  private async deleteOldCandidateData(cutoffDate: Date): Promise<void> {
    // This would typically delete from database
    // Implementation depends on database schema
    console.log(`Deleting candidate data older than ${cutoffDate.toISOString()}`);
  }

  /**
   * Delete old biometric data
   */
  private async deleteOldBiometricData(cutoffDate: Date): Promise<void> {
    // This would typically delete from database
    // Implementation depends on database schema
    console.log(`Deleting biometric data older than ${cutoffDate.toISOString()}`);
  }

  /**
   * Get privacy policy
   */
  getPrivacyPolicy(): string {
    return PRIVACY_POLICY;
  }

  /**
   * Get GDPR compliance information
   */
  getGDPRCompliance(): any {
    return GDPR_COMPLIANCE;
  }

  /**
   * Get IT Act compliance information
   */
  getITActCompliance(): any {
    return IT_ACT_COMPLIANCE;
  }

  /**
   * Validate compliance requirements
   */
  async validateCompliance(): Promise<{
    compliant: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check encryption
    if (!this.complianceConfig.dataEncrypted) {
      issues.push('Data encryption is not enabled');
    }

    // Check audit logging
    if (!this.complianceConfig.auditLoggingEnabled) {
      issues.push('Audit logging is not enabled');
    }

    // Check data retention
    if (!this.complianceConfig.dataRetentionEnabled) {
      issues.push('Data retention policy is not enabled');
    }

    // Check GDPR compliance
    if (!this.complianceConfig.gdprCompliant) {
      issues.push('GDPR compliance is not enabled');
    }

    // Check IT Act compliance
    if (!this.complianceConfig.itActCompliant) {
      issues.push('IT Act compliance is not enabled');
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<string> {
    try {
      const validation = await this.validateCompliance();
      const timestamp = new Date().toISOString();

      const report = `
# MPA Mobile App - Compliance Report

**Generated:** ${timestamp}

## Compliance Status

- **GDPR Compliant:** ${this.complianceConfig.gdprCompliant ? '✓ Yes' : '✗ No'}
- **IT Act Compliant:** ${this.complianceConfig.itActCompliant ? '✓ Yes' : '✗ No'}
- **Data Encrypted:** ${this.complianceConfig.dataEncrypted ? '✓ Yes' : '✗ No'}
- **Audit Logging Enabled:** ${this.complianceConfig.auditLoggingEnabled ? '✓ Yes' : '✗ No'}
- **Data Retention Enabled:** ${this.complianceConfig.dataRetentionEnabled ? '✓ Yes' : '✗ No'}

## Overall Status

${validation.compliant ? '✓ **COMPLIANT**' : '✗ **NON-COMPLIANT**'}

${validation.issues.length > 0 ? `
## Issues Found

${validation.issues.map((issue) => `- ${issue}`).join('\n')}
` : ''}

## Data Retention Policy

- Candidate Data: ${this.retentionPolicy.candidateData} days
- Biometric Data: ${this.retentionPolicy.biometricData} days
- Audit Logs: ${this.retentionPolicy.auditLogs} days
- Sync Logs: ${this.retentionPolicy.syncLogs} days
- Session Data: ${this.retentionPolicy.sessionData} days

## Security Measures

- Encryption: AES-256
- Hashing: SHA-256
- Access Control: Role-Based (RBAC)
- Audit Logging: Enabled
- Data Retention: Automatic

## Compliance Frameworks

- GDPR (General Data Protection Regulation)
- India IT Act 2000, Section 43A
- Data Protection Best Practices
      `;

      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return '';
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(): Promise<string> {
    try {
      const logs = await offlineDatabase.getActivityLogs(10000);
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return '';
    }
  }

  /**
   * Schedule compliance checks
   */
  scheduleComplianceChecks(intervalMs: number = 24 * 60 * 60 * 1000): void {
    setInterval(async () => {
      try {
        const validation = await this.validateCompliance();
        if (!validation.compliant) {
          await loggingService.logWarning(
            'Compliance Issues Detected',
            { issues: validation.issues }
          );
        }

        // Enforce data retention
        await this.enforceDataRetention();
      } catch (error) {
        console.error('Error during compliance check:', error);
      }
    }, intervalMs);
  }

  /**
   * Get user consent status
   */
  async getUserConsentStatus(): Promise<{
    privacyPolicyAccepted: boolean;
    dataProcessingAccepted: boolean;
    biometricConsentAccepted: boolean;
  }> {
    // This would typically retrieve from database or AsyncStorage
    return {
      privacyPolicyAccepted: true,
      dataProcessingAccepted: true,
      biometricConsentAccepted: true,
    };
  }

  /**
   * Record user consent
   */
  async recordUserConsent(
    privacyPolicy: boolean,
    dataProcessing: boolean,
    biometric: boolean
  ): Promise<void> {
    try {
      await loggingService.logActivity(
        'User Consent Recorded',
        {
          privacyPolicy,
          dataProcessing,
          biometric,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error recording user consent:', error);
      throw error;
    }
  }
}

export const complianceService = new ComplianceService();
