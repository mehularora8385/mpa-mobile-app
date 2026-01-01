# SEPL Biometric Exam System - Final Implementation Plan

## System Overview
This is a **Biometric Exam Verification System** for exam operators to:
1. Mark candidate attendance (present/absent)
2. Perform biometric verification (fingerprint + photo)
3. Track verification status
4. Sync data with server

---

## Phase 1: Fix Tab Visibility (Hide Before Login, Show After)

### 1.1 Modify `app/(tabs)/_layout.tsx`
- Add session check at component start
- If no session: show login screen
- If session exists: show 5 tabs

**Result:** Tab bar hidden before login, visible after login

---

## Phase 2: Configure Tab Screens

### 2.1 Tab 1: Home Screen (`app/(tabs)/home.tsx`)
**Purpose:** Operator dashboard

**Content:**
```
Header:
  - "Welcome, [Operator Name]"
  - Centre: [Centre Name]

Operator Info Card:
  - Name: mehul arora
  - Mobile: +91 9730018733
  - Aadhaar: 65****78 (masked)

Quick Stats:
  - Total Candidates: 45
  - Marked Present: 32
  - Verified: 28
  - Pending Verification: 4

Logout Button (with confirmation dialog)
```

**Data Source:** From session (mockAuthService)

---

### 2.2 Tab 2: Data Download (`app/(tabs)/download.tsx`)
**Purpose:** Download candidate data from admin panel

**Structure:**
```
Two Sub-Tabs:
  1. MOCK DATA (for testing)
  2. EXAM DATA (actual exam data)

For Each Tab:
  - Show exam date
  - Show candidate count
  - Download button
  - Status: Ready / Downloading / Downloaded

Mock Data Example:
  Exam Date: 2026-01-15 (Wednesday)
  Candidates: 45
  Status: Ready to Download
  [Download Button]

Exam Data Example:
  Exam Date: 2026-01-16 (Thursday)
  Candidates: 52
  Status: Downloaded ✓
```

**Functionality:**
- Tap download → status changes to "Downloading"
- After 2 seconds → status changes to "Downloaded"
- Show success alert

---

### 2.3 Tab 3: Mark Present (`app/(tabs)/candidates.tsx`)
**Purpose:** Mark candidate attendance (present/absent)

**Workflow:**
```
Step 1: Input Roll Number
  - Text input field: "Enter Roll Number"
  - Or: Barcode scanner button (optional)
  - Search button

Step 2: Display Candidate Details (after search)
  - Roll Number: 001
  - Name: Rahul Kumar
  - Photo: [Placeholder image]

Step 3: Mark Attendance
  - Button: "Mark Present" (green)
  - Button: "Mark Absent" (red)
  - Button: "Clear" (reset)

Step 4: Confirmation
  - Show: "Rahul Kumar marked as Present ✓"
  - Auto-clear form after 1 second
  - Ready for next candidate
```

**Mock Data (10 candidates):**
```
001 - Rahul Kumar
002 - Priya Singh
003 - Amit Patel
004 - Neha Sharma
005 - Vikram Reddy
006 - Anjali Gupta
007 - Rohan Verma
008 - Deepika Nair
009 - Arjun Singh
010 - Zara Khan
```

**Data Stored:**
```
{
  rollNo: "001",
  name: "Rahul Kumar",
  present: true,  // or false
  markedAt: "2026-01-15 10:30:45"
}
```

---

### 2.4 Tab 4: Verification (`app/(tabs)/exam-day.tsx`)
**Purpose:** Perform biometric verification (fingerprint + photo)

**Workflow:**
```
Step 1: Input Roll Number
  - Text input: "Enter Roll Number"
  - Or: Barcode scanner button
  - Search button

Step 2: Display Candidate Details
  - Roll Number: 001
  - Name: Rahul Kumar
  - Photo: [Placeholder]
  - Present Status: ✓ Yes

Step 3: Capture Photo
  - Button: "Take Photo"
  - Show camera preview
  - Capture button
  - Retake button

Step 4: Capture Fingerprint
  - Button: "Scan Fingerprint (MFS100/MFS110)"
  - Message: "Place finger on scanner"
  - Status: Scanning... / Captured ✓

Step 5: Enter OMR Serial Number
  - Text input: "Enter OMR Serial Number"
  - Example: "OMR-2026-001-15"

Step 6: Mark Verified
  - Button: "Mark Verified" (blue)
  - Confirmation: "Rahul Kumar verified ✓"
  - Auto-clear form

Verification Data Stored:
{
  rollNo: "001",
  name: "Rahul Kumar",
  photo: "uri...",
  fingerprint: "captured",
  omrSerial: "OMR-2026-001-15",
  verified: true,
  verifiedAt: "2026-01-15 10:35:20"
}
```

---

### 2.5 Tab 5: Candidates Details (`app/(tabs)/barcode-scanner.tsx`)
**Purpose:** View all candidates with their status

**Content:**
```
List of All Candidates:

Roll No. | Name | Present | Verified
---------|------|---------|----------
001 | Rahul Kumar | ✓ Yes | ✓ Yes
002 | Priya Singh | ✓ Yes | ✓ Yes
003 | Amit Patel | ✗ No | ✗ No
004 | Neha Sharma | ✓ Yes | ⊘ Pending
005 | Vikram Reddy | ✓ Yes | ✓ Yes
006 | Anjali Gupta | ✗ No | ✗ No
007 | Rohan Verma | ✓ Yes | ✓ Yes
008 | Deepika Nair | ✓ Yes | ⊘ Pending
009 | Arjun Singh | ✗ No | ✗ No
010 | Zara Khan | ✓ Yes | ✓ Yes

Features:
  - Tap candidate to view full details
  - Search by roll number or name
  - Filter buttons:
    * All (10)
    * Present (7)
    * Absent (3)
    * Verified (8)
    * Pending (2)
```

**Display Format:**
```
Each candidate card shows:
  - Roll Number (bold)
  - Name
  - Present: ✓ Yes / ✗ No / ⊘ Not Marked
  - Verified: ✓ Yes / ✗ No / ⊘ Pending
  - Tap to view details (photo, fingerprint, OMR)
```

---

### 2.6 Tab 6: Data Sync (`app/(tabs)/sync.tsx`)
**Purpose:** Sync candidate data with server

**Content:**
```
Sync Status Header:
  - Last Sync: 2026-01-15 10:45:30
  - Connection: Connected / Offline

Sync Statistics:
  - Unsync Candidates: 5
  - Synced Candidates: 5
  - Total Candidates: 10

Sync Progress:
  [████████░░░░░░░░░░] 50% (5/10)

Buttons:
  - [Sync Now] (blue button)
  - Auto Sync: [Toggle ON/OFF]
  - Clear Cache: [Button]

Sync Log (Last 5 operations):
  ✓ 2026-01-15 10:45:30 - 3 candidates synced
  ✓ 2026-01-15 10:30:15 - 2 candidates synced
  ✓ 2026-01-15 10:15:00 - 1 candidate synced
  ⟳ 2026-01-15 09:50:45 - Syncing...
  ✗ 2026-01-15 09:30:20 - Sync failed (retry)

After All Sync:
  - Unsync Candidates: 0
  - Synced Candidates: 10
  - Message: "All candidates synced ✓"
```

**Sync Workflow:**
1. User taps "Sync Now"
2. App shows "Syncing..." status
3. Progress bar updates
4. After completion: "All synced ✓"
5. Unsync count becomes 0

---

## Phase 3: Data Structure

### 3.1 Candidate Data Model
```javascript
{
  rollNo: "001",
  name: "Rahul Kumar",
  
  // Attendance
  present: true,  // true/false/null
  markedAt: "2026-01-15 10:30:45",
  
  // Verification
  photo: "file://path/to/photo.jpg",
  fingerprint: "captured",  // captured/pending/failed
  omrSerial: "OMR-2026-001-15",
  verified: true,  // true/false/null
  verifiedAt: "2026-01-15 10:35:20",
  
  // Sync Status
  synced: true,  // true/false
  syncedAt: "2026-01-15 10:40:00"
}
```

### 3.2 Mock Candidates (10 total)
```javascript
[
  { rollNo: "001", name: "Rahul Kumar", present: true, verified: true, synced: true },
  { rollNo: "002", name: "Priya Singh", present: true, verified: true, synced: true },
  { rollNo: "003", name: "Amit Patel", present: false, verified: false, synced: true },
  { rollNo: "004", name: "Neha Sharma", present: true, verified: false, synced: false },
  { rollNo: "005", name: "Vikram Reddy", present: true, verified: true, synced: true },
  { rollNo: "006", name: "Anjali Gupta", present: false, verified: false, synced: true },
  { rollNo: "007", name: "Rohan Verma", present: true, verified: true, synced: false },
  { rollNo: "008", name: "Deepika Nair", present: true, verified: false, synced: false },
  { rollNo: "009", name: "Arjun Singh", present: false, verified: false, synced: true },
  { rollNo: "010", name: "Zara Khan", present: true, verified: true, synced: true }
]
```

---

## Phase 4: Implementation Steps

### Step 1: Tab Visibility
- Modify `app/(tabs)/_layout.tsx`
- Add session check
- Conditionally render tabs or login

### Step 2: Update Each Tab (in order)
1. Home screen - operator dashboard
2. Data Download - mock & exam data tabs
3. Mark Present - attendance marking
4. Verification - biometric verification
5. Candidates Details - status list
6. Data Sync - sync management

### Step 3: Add Mock Data Service
- Create `lib/mock-candidates.ts`
- Store candidate data
- Provide functions to update status

### Step 4: Testing
- Test login flow
- Test each tab functionality
- Test data persistence
- Test sync workflow

---

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/(tabs)/_layout.tsx` | Modify | Add session check, show/hide tabs |
| `app/(tabs)/home.tsx` | Modify | Operator dashboard |
| `app/(tabs)/download.tsx` | Modify | Mock & exam data download |
| `app/(tabs)/candidates.tsx` | Modify | Mark present workflow |
| `app/(tabs)/exam-day.tsx` | Modify | Verification workflow |
| `app/(tabs)/barcode-scanner.tsx` | Modify | Candidates list with status |
| `app/(tabs)/sync.tsx` | Create | Data sync management |
| `lib/mock-candidates.ts` | Create | Mock data service |

---

## Key Differences from Original Plan

✅ **Corrected:**
- No "Register Candidate" tab (data uploaded by admin)
- No exam subjects (Math, Science) - only candidate data
- Mark Present tab for attendance marking
- Verification tab with fingerprint + photo + OMR
- Candidates Details shows present & verified status
- Sync tab shows unsync/synced count

✅ **Biometric System Focus:**
- Fingerprint scanning (MFS100/MFS110)
- Photo capture for each candidate
- OMR serial number tracking
- Verification workflow
- Data sync management

---

## Expected Outcome

### Operator Workflow:
```
1. Login with selfie capture
   ↓
2. Home screen - see stats
   ↓
3. Download exam data (mock/exam)
   ↓
4. Mark Present - scan/enter roll no. → mark present/absent
   ↓
5. Verification - scan/enter roll no. → take photo → scan fingerprint → enter OMR → mark verified
   ↓
6. View Candidates Details - see all candidates with status
   ↓
7. Sync Data - sync all changes with server
   ↓
8. Logout
```

---

## Approval Checklist

- [ ] Biometric workflow understood
- [ ] Tab structure approved
- [ ] Mock data structure approved
- [ ] Ready to proceed with implementation

