/**
 * Mobile App Centre-Wise Download Service
 * Handles: Centre selection, exam filtering, centre-specific data download
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CentreData {
    code: string;
    name: string;
    city: string;
    address: string;
    contact: string;
}

interface ExamData {
    id: string;
    code: string;
    name: string;
    exam_date: string;
    status: string;
    student_count: number;
}

interface StudentData {
    id: string;
    exam_id: string;
    centre_code: string;
    roll_no: string;
    name: string;
    father_name: string;
    dob: string;
    slot_assign: string;
    slot_time: string;
    photo_path: string;
    status: string;
}

class CentreWiseDownloadService {
    private api: AxiosInstance;
    private apiUrl: string;
    private operatorId: string | null = null;
    private centreCode: string | null = null;
    private token: string | null = null;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;

        this.api = axios.create({
            baseURL: apiUrl,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor for auth token
        this.api.interceptors.request.use(
            async (config) => {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    /**
     * Get operator's centre
     */
    async getOperatorCentre(): Promise<CentreData> {
        try {
            console.log('📍 Fetching operator centre...');

            const response = await this.api.get<{ success: boolean; data: CentreData }>(
                '/api/mobile/operator/centres'
            );

            if (!response.data.success) {
                throw new Error('Failed to fetch operator centre');
            }

            this.centreCode = response.data.data.code;

            // Store centre code locally
            await AsyncStorage.setItem('operatorCentre', this.centreCode);

            console.log(`✅ Operator centre: ${this.centreCode}`);
            return response.data.data;
        } catch (error) {
            console.error('❌ Failed to get operator centre:', error);
            throw error;
        }
    }

    /**
     * Get exams available for operator's centre
     */
    async getExamsForCentre(centreCode?: string): Promise<ExamData[]> {
        try {
            const centre = centreCode || this.centreCode;
            if (!centre) {
                throw new Error('Centre code not set');
            }

            console.log(`📚 Fetching exams for centre ${centre}...`);

            const response = await this.api.get<{ success: boolean; data: ExamData[] }>(
                `/api/mobile/exams-by-centre/${centre}`
            );

            if (!response.data.success) {
                throw new Error('Failed to fetch exams');
            }

            console.log(`✅ Found ${response.data.data.length} exams for centre ${centre}`);
            return response.data.data;
        } catch (error) {
            console.error('❌ Failed to get exams for centre:', error);
            throw error;
        }
    }

    /**
     * Download student data for centre with password verification
     */
    async downloadStudentsForCentre(
        examId: string,
        centreCode: string,
        password: string
    ): Promise<StudentData[]> {
        try {
            console.log(`📥 Downloading students for exam ${examId}, centre ${centreCode}...`);

            const response = await this.api.post<{ success: boolean; data: StudentData[] }>(
                '/api/mobile/download/students-by-centre',
                {
                    examId,
                    centreCode,
                    password,
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to download students');
            }

            // Store students locally with centre code
            const storageKey = `students_${examId}_${centreCode}`;
            await AsyncStorage.setItem(storageKey, JSON.stringify(response.data.data));

            // Store metadata
            const metadata = {
                examId,
                centreCode,
                studentCount: response.data.data.length,
                downloadedAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(
                `${storageKey}_metadata`,
                JSON.stringify(metadata)
            );

            console.log(`✅ Downloaded ${response.data.data.length} students for centre ${centreCode}`);
            return response.data.data;
        } catch (error) {
            console.error('❌ Failed to download students:', error);
            throw error;
        }
    }

    /**
     * Get locally stored students for centre
     */
    async getLocalStudents(examId: string, centreCode: string): Promise<StudentData[]> {
        try {
            const storageKey = `students_${examId}_${centreCode}`;
            const data = await AsyncStorage.getItem(storageKey);

            if (!data) {
                console.log(`⚠️ No local students found for ${storageKey}`);
                return [];
            }

            const students = JSON.parse(data);
            console.log(`✅ Retrieved ${students.length} local students`);
            return students;
        } catch (error) {
            console.error('❌ Failed to get local students:', error);
            return [];
        }
    }

    /**
     * Get student by roll number (centre-specific)
     */
    async getStudentByRollNo(
        examId: string,
        centreCode: string,
        rollNo: string
    ): Promise<StudentData | null> {
        try {
            const students = await this.getLocalStudents(examId, centreCode);
            const student = students.find(s => s.roll_no === rollNo);

            if (!student) {
                console.log(`⚠️ Student ${rollNo} not found in centre ${centreCode}`);
                return null;
            }

            return student;
        } catch (error) {
            console.error('❌ Failed to get student:', error);
            return null;
        }
    }

    /**
     * Get students by slot (centre-specific)
     */
    async getStudentsBySlot(
        examId: string,
        centreCode: string,
        slotTime: string
    ): Promise<StudentData[]> {
        try {
            const students = await this.getLocalStudents(examId, centreCode);
            const slotStudents = students.filter(s => s.slot_time === slotTime);

            console.log(`✅ Found ${slotStudents.length} students for slot ${slotTime}`);
            return slotStudents;
        } catch (error) {
            console.error('❌ Failed to get students by slot:', error);
            return [];
        }
    }

    /**
     * Get all unique slots for centre
     */
    async getSlotsForCentre(examId: string, centreCode: string): Promise<string[]> {
        try {
            const students = await this.getLocalStudents(examId, centreCode);
            const slots = [...new Set(students.map(s => s.slot_time))];

            console.log(`✅ Found ${slots.length} unique slots`);
            return slots.sort();
        } catch (error) {
            console.error('❌ Failed to get slots:', error);
            return [];
        }
    }

    /**
     * Get student count for centre
     */
    async getStudentCountForCentre(examId: string, centreCode: string): Promise<number> {
        try {
            const students = await this.getLocalStudents(examId, centreCode);
            return students.length;
        } catch (error) {
            console.error('❌ Failed to get student count:', error);
            return 0;
        }
    }

    /**
     * Search students in centre (by name or roll no)
     */
    async searchStudentsInCentre(
        examId: string,
        centreCode: string,
        query: string
    ): Promise<StudentData[]> {
        try {
            const students = await this.getLocalStudents(examId, centreCode);
            const searchQuery = query.toLowerCase();

            const results = students.filter(
                s =>
                    s.roll_no.toLowerCase().includes(searchQuery) ||
                    s.name.toLowerCase().includes(searchQuery) ||
                    s.father_name.toLowerCase().includes(searchQuery)
            );

            console.log(`✅ Found ${results.length} students matching "${query}"`);
            return results;
        } catch (error) {
            console.error('❌ Failed to search students:', error);
            return [];
        }
    }

    /**
     * Get students by verification status (centre-specific)
     */
    async getStudentsByStatus(
        examId: string,
        centreCode: string,
        status: string
    ): Promise<StudentData[]> {
        try {
            const students = await this.getLocalStudents(examId, centreCode);
            const filtered = students.filter(s => s.status === status);

            console.log(`✅ Found ${filtered.length} students with status ${status}`);
            return filtered;
        } catch (error) {
            console.error('❌ Failed to get students by status:', error);
            return [];
        }
    }

    /**
     * Verify centre-wise data integrity
     */
    async verifyCentreDataIntegrity(examId: string, centreCode: string): Promise<boolean> {
        try {
            console.log(`🔍 Verifying data integrity for centre ${centreCode}...`);

            const students = await this.getLocalStudents(examId, centreCode);

            if (students.length === 0) {
                console.log('⚠️ No students found');
                return false;
            }

            // Verify all students belong to the centre
            const allBelongToCentre = students.every(s => s.centre_code === centreCode);

            if (!allBelongToCentre) {
                console.error('❌ Some students do not belong to this centre');
                return false;
            }

            // Verify required fields
            const allValid = students.every(
                s =>
                    s.roll_no &&
                    s.name &&
                    s.centre_code &&
                    s.slot_time
            );

            if (!allValid) {
                console.error('❌ Some students have missing required fields');
                return false;
            }

            console.log(`✅ Data integrity verified for ${students.length} students`);
            return true;
        } catch (error) {
            console.error('❌ Failed to verify data integrity:', error);
            return false;
        }
    }

    /**
     * Clear centre-specific data
     */
    async clearCentreData(examId: string, centreCode: string): Promise<void> {
        try {
            const storageKey = `students_${examId}_${centreCode}`;
            await AsyncStorage.removeItem(storageKey);
            await AsyncStorage.removeItem(`${storageKey}_metadata`);

            console.log(`✅ Cleared data for centre ${centreCode}`);
        } catch (error) {
            console.error('❌ Failed to clear centre data:', error);
            throw error;
        }
    }

    /**
     * Get download statistics for centre
     */
    async getCentreDownloadStats(examId: string, centreCode: string): Promise<any> {
        try {
            const storageKey = `students_${examId}_${centreCode}`;
            const metadata = await AsyncStorage.getItem(`${storageKey}_metadata`);

            if (!metadata) {
                return null;
            }

            return JSON.parse(metadata);
        } catch (error) {
            console.error('❌ Failed to get download stats:', error);
            return null;
        }
    }

    /**
     * Sync centre data with backend (for offline mode)
     */
    async syncCentreData(examId: string, centreCode: string): Promise<boolean> {
        try {
            console.log(`🔄 Syncing centre data for ${centreCode}...`);

            // Get locally stored students
            const students = await this.getLocalStudents(examId, centreCode);

            if (students.length === 0) {
                console.log('No data to sync');
                return true;
            }

            // Send to backend for verification
            const response = await this.api.post(
                '/api/mobile/sync-centre-data',
                {
                    examId,
                    centreCode,
                    studentCount: students.length,
                    lastSync: new Date(),
                }
            );

            if (response.data.success) {
                console.log(`✅ Centre data synced successfully`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Failed to sync centre data:', error);
            return false;
        }
    }
}

export default CentreWiseDownloadService;
