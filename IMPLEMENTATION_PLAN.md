# SEPL Biometric Verification App - Implementation Plan

## Current State
- ✅ Login screen working with form validation and camera capture
- ✅ Session management with mock auth service
- ❌ Tab bar visible before login (should be hidden)
- ❌ Home screen shows generic menu (needs operator info)
- ❌ Other screens not properly configured

---

## Phase 1: Fix Tab Visibility (Hide Before Login, Show After)

### Changes Required:

#### 1.1 Modify `app/(tabs)/_layout.tsx`
**Current Issue:** Tab bar always visible
**Solution:** Add session check at top of component

```
- Import mockAuthService
- Add useState for session and loading
- Add useEffect to check session on mount
- If no session: return <LoginScreen /> (from index.tsx)
- If session exists: render Tabs with all screens
```

**Result:** 
- Before login: Only login form visible
- After login: Tab bar appears with 6 tabs

---

#### 1.2 Move Login Screen Logic
**Current:** Login is in `app/(tabs)/index.tsx` (inside tabs)
**New:** Create `app/auth/login.tsx` (outside tabs)

```
- Create new file: app/auth/login.tsx
- Copy login logic from app/(tabs)/index.tsx
- Update routing to show auth screens before tabs
```

**Result:** Cleaner separation of auth flow from app screens

---

## Phase 2: Configure Tab Screens

### 2.1 Tab 1: Home Screen (`app/(tabs)/home.tsx`)
**Current:** Shows generic menu buttons
**New:** Show operator dashboard

**Content:**
```
- Header: "Welcome, [Operator Name]"
- Operator Info Card:
  - Name: mehul arora
  - Mobile: +91 9730018733
  - Aadhaar: 65****78 (masked)
  - Centre: [Centre Name]
  
- Quick Stats:
  - Total Candidates: 45
  - Present Today: 32
  - Verified: 28
  
- Logout Button (with confirmation)
```

**Data Source:** From session (mockAuthService)

---

### 2.2 Tab 2: Data Download (`app/(tabs)/download.tsx`)
**Current:** Has complex form with pickers
**New:** Simplified exam list with dates

**Content:**
```
List of exams with:
  - Exam Name (e.g., Mathematics)
  - Date (e.g., 2026-01-15)
  - Day (e.g., Wednesday)
  - Candidate Count (e.g., 45)
  - Status: Ready / Downloading / Downloaded
  - Download Button

Mock Data:
  1. Mathematics - Wed, 2026-01-15 - 45 candidates
  2. Science - Thu, 2026-01-16 - 52 candidates
  3. English - Fri, 2026-01-17 - 48 candidates
  4. Social Studies - Mon, 2026-01-20 - 50 candidates
```

**Functionality:**
- Tap download button → status changes to "Downloading"
- After 2 seconds → status changes to "Downloaded"
- Show success alert

---

### 2.3 Tab 3: Register Candidate (`app/(tabs)/candidates.tsx`)
**Current:** Barcode scanner screen
**New:** Candidate registration form

**Content:**
```
Form Fields:
  - Roll Number (numeric input)
  - Candidate Name (text input)
  - Father's Name (text input)
  - Date of Birth (date picker)
  - Gender (dropdown: Male/Female/Other)
  - Phone Number (numeric input)
  - Email (email input)

Buttons:
  - Register Button (submit form)
  - Clear Button (reset form)

Validation:
  - All fields required
  - Roll number: numeric only
  - Phone: 10 digits
  - Email: valid format
```

---

### 2.4 Tab 4: Verification (`app/(tabs)/exam-day.tsx`)
**Current:** OTP verification screen
**New:** Biometric verification screen

**Content:**
```
Verification Steps:

1. Roll Number Input
   - Enter roll number
   - Search button

2. Candidate Details Display (after search)
   - Name
   - Roll Number
   - Photo (placeholder)

3. Verification Options
   - Fingerprint Button
   - Face Recognition Button
   - OTP Button

4. Verification Status
   - Pending / In Progress / Verified
   - Show checkmark when verified
```

---

### 2.5 Tab 5: Candidates Details (`app/(tabs)/barcode-scanner.tsx`)
**Current:** Barcode scanner
**New:** Candidates list with status

**Content:**
```
List of candidates with:
  - Roll Number
  - Candidate Name
  - Present Status: ✓ Present / ✗ Absent / ⊘ Not Marked
  - Verification Status: ✓ Verified / ✗ Not Verified / ⊘ Pending

Mock Data (10 candidates):
  1. Roll 001 - Rahul Kumar - Present - Verified
  2. Roll 002 - Priya Singh - Present - Verified
  3. Roll 003 - Amit Patel - Absent - Not Verified
  4. Roll 004 - Neha Sharma - Present - Pending
  ... (more candidates)

Features:
  - Tap candidate to view details
  - Search by roll number or name
  - Filter by status (Present/Absent/All)
```

---

### 2.6 Tab 6: Data Sync (`app/(tabs)/sync.tsx`)
**Current:** Doesn't exist
**New:** Data sync screen

**Content:**
```
Sync Status:
  - Last Sync: [timestamp]
  - Sync Status: Connected / Syncing / Offline
  
Sync Items:
  - Candidates Data: [count] records
  - Attendance Data: [count] records
  - Verification Data: [count] records
  
Buttons:
  - Sync Now (manual sync)
  - Auto Sync Toggle (on/off)
  - Clear Cache Button
  
Sync Log:
  - Show last 5 sync operations
  - Timestamp and status for each
```

---

## Phase 3: Data Management

### 3.1 Mock Data Structure
```javascript
// Operator Session
{
  operatorId: "OP001",
  name: "mehul arora",
  mobile: "9730018733",
  aadhaar: "659999999978",
  centre: "Centre 1 - Delhi",
  selfieUri: "..."
}

// Exams
[
  { id: 1, name: "Mathematics", date: "2026-01-15", day: "Wednesday", candidates: 45 },
  { id: 2, name: "Science", date: "2026-01-16", day: "Thursday", candidates: 52 },
  ...
]

// Candidates
[
  { rollNo: "001", name: "Rahul Kumar", present: true, verified: true },
  { rollNo: "002", name: "Priya Singh", present: true, verified: true },
  ...
]
```

---

## Phase 4: Implementation Steps

### Step 1: Create Auth Folder Structure
```
app/
  auth/
    _layout.tsx (auth stack)
    login.tsx (move from tabs/index.tsx)
  (tabs)/
    _layout.tsx (check session, conditionally show tabs)
    home.tsx (update with operator info)
    download.tsx (simplify with exam list)
    candidates.tsx (update with registration form)
    exam-day.tsx (update with verification)
    barcode-scanner.tsx (update with candidates list)
    sync.tsx (create new)
```

### Step 2: Update Routing Logic
```
app/_layout.tsx
  - Keep existing structure
  - Auth screens show if no session
  - Tab screens show if session exists
```

### Step 3: Update Each Screen
```
For each tab screen:
  1. Update UI layout
  2. Add mock data
  3. Add button handlers
  4. Add navigation between screens
  5. Test functionality
```

### Step 4: Testing
```
- Test login flow (form → camera → review → home)
- Test tab visibility (hidden before login, visible after)
- Test each tab screen
- Test logout (return to login)
- Test data persistence
```

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `app/(tabs)/_layout.tsx` | Add session check, conditionally render | HIGH |
| `app/(tabs)/home.tsx` | Update with operator dashboard | HIGH |
| `app/(tabs)/download.tsx` | Simplify to exam list | HIGH |
| `app/(tabs)/candidates.tsx` | Change to registration form | MEDIUM |
| `app/(tabs)/exam-day.tsx` | Change to verification screen | MEDIUM |
| `app/(tabs)/barcode-scanner.tsx` | Change to candidates list | MEDIUM |
| `app/(tabs)/sync.tsx` | Create new sync screen | MEDIUM |
| `app/auth/_layout.tsx` | Create auth stack (NEW) | HIGH |
| `app/auth/login.tsx` | Move login logic (NEW) | HIGH |

---

## Expected Outcome

### Before Login
```
┌─────────────────────┐
│   SEPL Login Form   │
│                     │
│ [Operator Name]     │
│ [Mobile Number]     │
│ [Aadhaar Number]    │
│                     │
│  [Continue Button]  │
│                     │
│ → Camera Screen     │
│ → Review Details    │
│ → Login Success     │
└─────────────────────┘
```

### After Login
```
┌─────────────────────┐
│  Welcome, mehul!    │
│                     │
│  [Home] [Download]  │
│  [Register] [Verify]│
│  [Candidates] [Sync]│
│                     │
│  Operator Info      │
│  Quick Stats        │
│  Logout Button      │
└─────────────────────┘
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing login flow | Keep login logic intact, just move file location |
| Tab visibility issues | Test thoroughly before and after each change |
| Session not persisting | Use mockAuthService consistently across screens |
| Complex file edits | Make one change at a time, test after each |

---

## Estimated Timeline

- Phase 1 (Tab visibility): 30 minutes
- Phase 2 (Screen updates): 60 minutes
- Phase 3 (Testing): 30 minutes
- **Total: ~2 hours**

---

## Approval Checklist

- [ ] Plan reviewed and understood
- [ ] All screen layouts approved
- [ ] Mock data structure approved
- [ ] Ready to proceed with implementation

