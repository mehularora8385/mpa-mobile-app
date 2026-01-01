export interface Candidate {
  rollNo: string;
  name: string;
  present: boolean | null;
  verified: boolean | null;
  synced: boolean;
  photo?: string;
  fingerprint?: string;
  omrSerial?: string;
  markedAt?: string;
  verifiedAt?: string;
}

// Mock candidates data
const mockCandidates: Candidate[] = [
  { rollNo: '001', name: 'Rahul Kumar', present: true, verified: true, synced: true },
  { rollNo: '002', name: 'Priya Singh', present: true, verified: true, synced: true },
  { rollNo: '003', name: 'Amit Patel', present: false, verified: false, synced: true },
  { rollNo: '004', name: 'Neha Sharma', present: true, verified: null, synced: false },
  { rollNo: '005', name: 'Vikram Reddy', present: true, verified: true, synced: true },
  { rollNo: '006', name: 'Anjali Gupta', present: false, verified: false, synced: true },
  { rollNo: '007', name: 'Rohan Verma', present: true, verified: true, synced: false },
  { rollNo: '008', name: 'Deepika Nair', present: true, verified: null, synced: false },
  { rollNo: '009', name: 'Arjun Singh', present: false, verified: false, synced: true },
  { rollNo: '010', name: 'Zara Khan', present: true, verified: true, synced: true },
];

export const mockCandidatesService = {
  // Get all candidates
  getAllCandidates: (): Candidate[] => {
    return [...mockCandidates];
  },

  // Get candidate by roll number
  getCandidateByRollNo: (rollNo: string): Candidate | undefined => {
    return mockCandidates.find(c => c.rollNo === rollNo);
  },

  // Mark candidate as present/absent
  markPresent: (rollNo: string, present: boolean): Candidate | null => {
    const candidate = mockCandidates.find(c => c.rollNo === rollNo);
    if (candidate) {
      candidate.present = present;
      candidate.markedAt = new Date().toISOString();
      candidate.synced = false;
      return candidate;
    }
    return null;
  },

  // Mark candidate as verified
  markVerified: (rollNo: string, photo: string, fingerprint: string, omrSerial: string): Candidate | null => {
    const candidate = mockCandidates.find(c => c.rollNo === rollNo);
    if (candidate) {
      candidate.verified = true;
      candidate.photo = photo;
      candidate.fingerprint = fingerprint;
      candidate.omrSerial = omrSerial;
      candidate.verifiedAt = new Date().toISOString();
      candidate.synced = false;
      return candidate;
    }
    return null;
  },

  // Get sync statistics
  getSyncStats: () => {
    const unsynced = mockCandidates.filter(c => !c.synced).length;
    const synced = mockCandidates.filter(c => c.synced).length;
    return {
      total: mockCandidates.length,
      synced,
      unsynced,
      percentage: Math.round((synced / mockCandidates.length) * 100),
    };
  },

  // Sync all candidates
  syncAll: (): { success: boolean; synced: number } => {
    mockCandidates.forEach(c => {
      c.synced = true;
    });
    return { success: true, synced: mockCandidates.length };
  },

  // Get candidates by status
  getCandidatesByStatus: (filter: 'all' | 'present' | 'absent' | 'verified' | 'pending'): Candidate[] => {
    switch (filter) {
      case 'present':
        return mockCandidates.filter(c => c.present === true);
      case 'absent':
        return mockCandidates.filter(c => c.present === false);
      case 'verified':
        return mockCandidates.filter(c => c.verified === true);
      case 'pending':
        return mockCandidates.filter(c => c.verified !== true);
      default:
        return [...mockCandidates];
    }
  },

  // Mark candidate as synced
  markSynced: (rollNo: string): Candidate | null => {
    const candidate = mockCandidates.find(c => c.rollNo === rollNo);
    if (candidate) {
      candidate.synced = true;
      return candidate;
    }
    return null;
  },

  // Search candidates
  searchCandidates: (query: string): Candidate[] => {
    const lowerQuery = query.toLowerCase();
    return mockCandidates.filter(
      c => c.rollNo.includes(query) || c.name.toLowerCase().includes(lowerQuery)
    );
  },
};
