import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export interface Candidate {
  id?: number;
  rollNo: string;
  name: string;
  fatherName: string;
  dob: string;
  examTime: string;
  present?: boolean;
  verified?: boolean;
  createdAt?: string;
}

export interface BiometricData {
  id?: number;
  candidateId: number;
  faceImage: string; // Base64
  fingerprintTemplate: string;
  omrSerialNumber: string;
  matchPercentage: number;
  uploadedAt?: string;
}

export interface PendingSync {
  id?: number;
  type: string; // 'attendance', 'biometric', 'verification'
  data: string; // JSON
  createdAt?: string;
  retryCount?: number;
}

export interface ActivityLog {
  id?: number;
  action: string;
  details: string; // JSON
  userId: string;
  timestamp?: string;
}

class OfflineDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private dbName = 'mpa_app.db';

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        location: 'default',
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create all required tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Candidates table
      `CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rollNo TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        fatherName TEXT,
        dob TEXT,
        examTime TEXT,
        present INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Biometric data table
      `CREATE TABLE IF NOT EXISTS biometric_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidateId INTEGER NOT NULL,
        faceImage BLOB,
        fingerprintTemplate TEXT,
        omrSerialNumber TEXT,
        matchPercentage REAL,
        uploadedAt TIMESTAMP,
        FOREIGN KEY(candidateId) REFERENCES candidates(id) ON DELETE CASCADE
      )`,

      // Pending sync table
      `CREATE TABLE IF NOT EXISTS pending_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retryCount INTEGER DEFAULT 0
      )`,

      // Activity logs table
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        userId TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Operator session table
      `CREATE TABLE IF NOT EXISTS operator_session (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operatorId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        mobile TEXT,
        aadhaar TEXT,
        selfiePhoto BLOB,
        loginTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastActivityTime TIMESTAMP,
        isActive INTEGER DEFAULT 1
      )`,
    ];

    for (const sql of tables) {
      try {
        await this.db.executeSql(sql);
      } catch (error) {
        console.error('Error creating table:', error);
      }
    }
  }

  // ============ CANDIDATE OPERATIONS ============

  /**
   * Save candidates to database
   */
  async saveCandidates(candidates: Candidate[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const candidate of candidates) {
        const sql = `
          INSERT OR REPLACE INTO candidates 
          (rollNo, name, fatherName, dob, examTime, present, verified, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.executeSql(sql, [
          candidate.rollNo,
          candidate.name,
          candidate.fatherName || '',
          candidate.dob || '',
          candidate.examTime || '',
          candidate.present ? 1 : 0,
          candidate.verified ? 1 : 0,
          new Date().toISOString(),
        ]);
      }
    } catch (error) {
      console.error('Error saving candidates:', error);
      throw error;
    }
  }

  /**
   * Get all candidates
   */
  async getCandidates(): Promise<Candidate[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.executeSql('SELECT * FROM candidates');
      const candidates: Candidate[] = [];

      for (let i = 0; i < result.rows.length; i++) {
        candidates.push(result.rows.item(i));
      }

      return candidates;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  }

  /**
   * Get candidate by roll number
   */
  async getCandidateByRollNo(rollNo: string): Promise<Candidate | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.executeSql(
        'SELECT * FROM candidates WHERE rollNo = ?',
        [rollNo]
      );

      if (result.rows.length > 0) {
        return result.rows.item(0);
      }

      return null;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }

  /**
   * Update candidate attendance status
   */
  async updateCandidateAttendance(rollNo: string, present: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        'UPDATE candidates SET present = ? WHERE rollNo = ?',
        [present ? 1 : 0, rollNo]
      );
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  /**
   * Update candidate verification status
   */
  async updateCandidateVerification(rollNo: string, verified: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        'UPDATE candidates SET verified = ? WHERE rollNo = ?',
        [verified ? 1 : 0, rollNo]
      );
    } catch (error) {
      console.error('Error updating verification:', error);
      throw error;
    }
  }

  // ============ BIOMETRIC OPERATIONS ============

  /**
   * Save biometric data
   */
  async saveBiometricData(biometric: BiometricData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const sql = `
        INSERT INTO biometric_data 
        (candidateId, faceImage, fingerprintTemplate, omrSerialNumber, matchPercentage)
        VALUES (?, ?, ?, ?, ?)
      `;

      await this.db.executeSql(sql, [
        biometric.candidateId,
        biometric.faceImage,
        biometric.fingerprintTemplate,
        biometric.omrSerialNumber,
        biometric.matchPercentage,
      ]);
    } catch (error) {
      console.error('Error saving biometric data:', error);
      throw error;
    }
  }

  /**
   * Get biometric data for candidate
   */
  async getBiometricData(candidateId: number): Promise<BiometricData | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.executeSql(
        'SELECT * FROM biometric_data WHERE candidateId = ?',
        [candidateId]
      );

      if (result.rows.length > 0) {
        return result.rows.item(0);
      }

      return null;
    } catch (error) {
      console.error('Error fetching biometric data:', error);
      return null;
    }
  }

  // ============ PENDING SYNC OPERATIONS ============

  /**
   * Add pending sync record
   */
  async addPendingSync(type: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const sql = `
        INSERT INTO pending_sync (type, data, retryCount)
        VALUES (?, ?, ?)
      `;

      await this.db.executeSql(sql, [type, JSON.stringify(data), 0]);
    } catch (error) {
      console.error('Error adding pending sync:', error);
      throw error;
    }
  }

  /**
   * Get pending sync records
   */
  async getPendingSyncRecords(): Promise<PendingSync[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.executeSql(
        'SELECT * FROM pending_sync WHERE retryCount < 5 ORDER BY createdAt ASC'
      );

      const records: PendingSync[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        records.push(result.rows.item(i));
      }

      return records;
    } catch (error) {
      console.error('Error fetching pending sync records:', error);
      return [];
    }
  }

  /**
   * Mark sync record as synced
   */
  async markSyncRecordAsSynced(recordId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql('DELETE FROM pending_sync WHERE id = ?', [recordId]);
    } catch (error) {
      console.error('Error marking sync record as synced:', error);
      throw error;
    }
  }

  /**
   * Increment retry count for sync record
   */
  async incrementSyncRetryCount(recordId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        'UPDATE pending_sync SET retryCount = retryCount + 1 WHERE id = ?',
        [recordId]
      );
    } catch (error) {
      console.error('Error incrementing retry count:', error);
      throw error;
    }
  }

  // ============ ACTIVITY LOG OPERATIONS ============

  /**
   * Log activity
   */
  async logActivity(action: string, details: any, userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const sql = `
        INSERT INTO activity_logs (action, details, userId)
        VALUES (?, ?, ?)
      `;

      await this.db.executeSql(sql, [action, JSON.stringify(details), userId]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.executeSql(
        'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );

      const logs: ActivityLog[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        logs.push(result.rows.item(i));
      }

      return logs;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  }

  // ============ CLEANUP OPERATIONS ============

  /**
   * Clear old data based on retention policy
   */
  async enforceDataRetention(daysToKeep: number = 365): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      await this.db.executeSql(
        'DELETE FROM activity_logs WHERE timestamp < ?',
        [cutoffDate.toISOString()]
      );

      await this.db.executeSql(
        'DELETE FROM pending_sync WHERE createdAt < ? AND retryCount >= 5',
        [cutoffDate.toISOString()]
      );
    } catch (error) {
      console.error('Error enforcing data retention:', error);
    }
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql('DELETE FROM candidates');
      await this.db.executeSql('DELETE FROM biometric_data');
      await this.db.executeSql('DELETE FROM pending_sync');
      await this.db.executeSql('DELETE FROM activity_logs');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }
}

export const offlineDatabase = new OfflineDatabase();
