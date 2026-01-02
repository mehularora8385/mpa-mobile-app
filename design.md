# MPA BIO VERIFICATION - Mobile App Design

## App Overview

**App Name:** MPA BIO VERIFICATION
**Brand:** CROIRE - Smart Biometric Solution with AI
**Purpose:** Biometric enrollment and verification for examination candidates
**Platform:** iOS & Android (React Native/Expo)
**Integration:** Connected to SEPL Admin Panel

The app captures biometric data (fingerprint, iris, face) during exam enrollment and verification stages with 99.1% accuracy and real-time sync to admin panel.

---

## 1. OPERATOR ANDROID APP

### 1.1 Authentication & Registration

**Login Screen**
- Operator ID or Mobile Number input
- Password input
- Live selfie capture for identity verification
- OTP/PIN verification option
- Remember device option

**Registration Screen**
- Live selfie capture
- Operator name
- Mobile number with OTP verification
- Aadhaar number (masked display)
- Auto-generated Operator ID
- Password creation
- Terms and conditions acceptance

### 1.2 Data Download Module

**Pre-Exam Setup Screen**
- Select Exam (dropdown)
- Select Exam Date (calendar picker)
- Select Centre Code (dropdown)
- Select Data Type (Mock/Exam toggle)
- Enter Admin-generated Password
- Download button with progress indicator

**Data Management**
- Download exam data with internet
- Store encrypted locally on device
- Show download status and sync status
- Offline mode indicator
- Data refresh option

### 1.3 Candidate Management

**Candidate List Screen**
- Full candidate list (downloaded data)
- Search by Roll Number
- Search by Candidate Name
- Filter by status (Present/Absent/Registered/Pending)
- Candidate card with:
  - Roll number
  - Name
  - Photo
  - Current status
  - Biometric status

**Candidate Detail Screen**
- Full candidate information
- Registration photo
- Aadhaar details (masked)
- DOB and other details
- Current status
- Biometric data collected
- Action buttons for registration

### 1.4 Exam Day Workflow

**Round 1 - Gate Attendance**
- Face capture using device camera
- Real-time face matching with candidate photo
- Show match percentage (90-100%)
- Mark Present/Absent button
- Store locally with timestamp
- Sync status indicator

**Round 2 - Classroom Registration**
- Fingerprint capture (Mantra MFS100/MFS110)
- Live photo capture
- OMR scan (if applicable)
- OMR mapping during registration
- Confirmation screen
- Store all data locally

### 1.5 Operator Dashboard

**Dashboard Screen**
- Total candidates count
- Present count
- Absent count
- Registered count
- Pending registration count
- OMR mapped count
- Average face match percentage
- Sync status indicator
- Last sync timestamp
- Manual sync button
- Offline mode indicator

### 1.6 Offline & Sync

**Offline Capabilities**
- Complete exam execution without internet
- All data stored encrypted locally
- Biometric capture works offline
- Status tracking offline

**Sync Module**
- Auto-sync when internet available
- Manual sync button
- Show sync progress
- Conflict resolution
- Sync history log
- Retry failed syncs

---

## 2. ADMIN PANEL (WEB)

### 2.1 Authentication

**Login Screen**
- Email/Username input
- Password input
- Role-based access (Admin/Super Admin)
- Session management
- Activity logging

### 2.2 Exam Management

**Exam Creation**
- Exam name
- Exam date and time
- Exam duration
- Total candidates
- Passing criteria
- Exam status (Draft/Active/Completed)
- Create separate dashboard per exam

**Centre Management**
- Create centre codes
- Centre name
- Centre location
- Assign centres to exams
- Centre capacity
- Centre contact information

**Exam Assignment**
- Assign centres to exams
- Set exam schedule per centre
- Enable/disable exam access
- Lock/unlock exams
- View exam status

### 2.3 Data Management

**Excel Template Download**
- Predefined template with columns:
  - Centre Code
  - Centre Name
  - Student Name
  - Father Name
  - Date of Birth
  - Exam Time
  - Registration Photo (path/Base64)
  - Aadhaar Number (masked)
  - Roll Number
  - Mobile Number

**Bulk Data Upload**
- Upload filled Excel file
- Auto validation
- Show validation errors
- Auto segregation centre-wise
- Preview before upload
- Confirm and push to server
- Upload status tracking
- Rollback option for failed uploads

**Data Verification**
- View uploaded data
- Search and filter candidates
- Edit candidate information
- Delete/archive candidates
- Export data

### 2.4 Operator Management

**Operator Registration**
- Add new operators
- Operator name
- Mobile number
- Aadhaar number
- Assign to centre
- Assign to exam
- Set operator role

**Operator Control**
- View all operators
- Edit operator details
- Block/unblock operators
- Assign/remove devices
- View operator activity
- Force logout operator
- Reset operator password

**Device Management**
- Bind operators to devices
- View device list
- Device online/offline status
- Block/unblock devices
- Remote logout all devices (one click)
- Device activity logs

### 2.5 Security & Control

**Password Management**
- Generate passwords for Mock Data
- Generate passwords for Exam Data
- Set password expiry
- Regenerate passwords
- Share passwords securely

**Access Control**
- Enable/disable downloads
- Lock/unlock exams
- Force re-login before data download
- Set download limits
- Manage operator permissions

**Device Control**
- Auto logout all devices (one click)
- Force logout specific device
- Remote device lock
- Device session management

### 2.6 Admin Dashboard

**Dashboard Overview**
- Total exams count
- Active exams
- Total operators
- Total devices
- System status
- Recent activities
- Alerts and notifications

**Analytics**
- Exam-wise statistics
- Centre-wise statistics
- Operator performance
- Device status report
- Data sync status
- System health metrics

---

## 3. CENTRAL DASHBOARD (WEB)

### 3.1 Dashboard Features

**Exam-wise View**
- Select exam from dropdown
- Exam details (date, time, duration)
- Total candidates
- Total centres

**Centre-wise View**
- Select centre from dropdown
- Centre details
- Assigned operators
- Device status

**Real-time Analytics**
- Live attendance count
- Live registration count
- Face match percentage analytics
- Fingerprint success/failure count
- OMR usage statistics
- Device online/offline status
- Data sync status

### 3.2 Live Monitoring

**Attendance Monitor**
- Real-time attendance count
- Present/Absent breakdown
- Centre-wise attendance
- Operator-wise attendance
- Time-based attendance graph

**Registration Monitor**
- Real-time registration count
- Registered/Pending breakdown
- Centre-wise registration
- Operator-wise registration
- Registration progress bar

**Biometric Monitor**
- Face match percentage analytics
- Average match percentage
- Match percentage distribution
- Fingerprint success rate
- Fingerprint failure reasons
- OMR mapping status

**Device Monitor**
- Device online/offline status
- Last sync time
- Sync status per device
- Device activity
- Connection quality

### 3.3 Control Buttons (Admin Only)

**Sync Control**
- Sync all devices button
- Sync specific device
- Show sync progress
- Sync history

**Device Control**
- Force logout all devices
- Force logout specific device
- Lock exam
- Unlock exam

**Reporting**
- Export attendance report
- Export registration report
- Export biometric report
- Export device report
- Export full audit log

---

## 4. BACKEND SERVER

### 4.1 API Endpoints

**Authentication**
- POST /api/auth/operator/login
- POST /api/auth/operator/register
- POST /api/auth/operator/logout
- POST /api/auth/admin/login
- POST /api/auth/admin/logout
- POST /api/auth/verify-otp
- POST /api/auth/refresh-token

**Exam Management**
- POST /api/exams/create
- GET /api/exams/list
- GET /api/exams/:id
- PUT /api/exams/:id
- DELETE /api/exams/:id
- POST /api/exams/:id/lock
- POST /api/exams/:id/unlock

**Centre Management**
- POST /api/centres/create
- GET /api/centres/list
- GET /api/centres/:id
- PUT /api/centres/:id
- DELETE /api/centres/:id

**Candidate Management**
- POST /api/candidates/bulk-upload
- GET /api/candidates/list
- GET /api/candidates/:id
- PUT /api/candidates/:id
- DELETE /api/candidates/:id

**Operator Management**
- POST /api/operators/create
- GET /api/operators/list
- GET /api/operators/:id
- PUT /api/operators/:id
- DELETE /api/operators/:id
- POST /api/operators/:id/block
- POST /api/operators/:id/unblock

**Device Management**
- POST /api/devices/register
- GET /api/devices/list
- GET /api/devices/:id
- PUT /api/devices/:id
- POST /api/devices/:id/logout
- POST /api/devices/logout-all

**Data Sync**
- POST /api/sync/upload
- GET /api/sync/download
- POST /api/sync/status
- GET /api/sync/history

**Biometric Data**
- POST /api/biometric/face-match
- POST /api/biometric/fingerprint-verify
- GET /api/biometric/analytics

**Reporting**
- GET /api/reports/attendance
- GET /api/reports/registration
- GET /api/reports/biometric
- GET /api/reports/device
- GET /api/reports/audit-log
- POST /api/reports/export

### 4.2 Database Schema

**Users Table**
- user_id (PK)
- user_type (operator/admin)
- email/mobile
- password_hash
- name
- aadhaar (masked)
- status
- created_at
- updated_at

**Exams Table**
- exam_id (PK)
- exam_name
- exam_date
- exam_time
- duration
- total_candidates
- status
- created_by
- created_at

**Centres Table**
- centre_id (PK)
- centre_code
- centre_name
- location
- capacity
- contact_info
- created_at

**Candidates Table**
- candidate_id (PK)
- roll_number
- name
- father_name
- dob
- aadhaar (masked)
- photo_path
- exam_id (FK)
- centre_id (FK)
- status
- created_at

**Operators Table**
- operator_id (PK)
- user_id (FK)
- centre_id (FK)
- exam_id (FK)
- status
- assigned_device
- created_at

**Devices Table**
- device_id (PK)
- device_name
- device_type
- operator_id (FK)
- status
- last_sync
- created_at

**Biometric Data Table**
- biometric_id (PK)
- candidate_id (FK)
- biometric_type (face/fingerprint)
- data (encrypted)
- match_percentage
- timestamp
- created_at

**Sync Logs Table**
- sync_id (PK)
- device_id (FK)
- sync_type (upload/download)
- status
- data_count
- timestamp
- created_at

**Audit Logs Table**
- log_id (PK)
- user_id (FK)
- action
- resource
- details
- timestamp
- created_at

---

## 5. SECURITY SPECIFICATIONS

### 5.1 Encryption
- AES-256 for data at rest
- TLS 1.3 for data in transit
- End-to-end encryption for biometric data
- Encrypted local storage on mobile

### 5.2 Authentication
- JWT tokens with 24-hour expiry
- Refresh token mechanism
- OTP for sensitive operations
- Device fingerprinting
- Session management

### 5.3 Authorization
- Role-based access control (RBAC)
- Operator can only access assigned exam/centre
- Admin has full system access
- Dashboard access restricted to authorized users

### 5.4 Audit & Compliance
- All actions logged with timestamp
- User activity tracking
- Data access logs
- Failed login attempts logged
- Compliance with data protection regulations

---

## 6. TECHNOLOGY STACK

### Mobile App
- React Native with Expo
- TypeScript
- AsyncStorage for local data
- SQLite for offline database
- Camera API for biometric capture
- USB OTG for fingerprint scanner

### Admin Panel & Dashboard
- React 19
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Recharts for analytics

### Backend Server
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- JWT authentication
- AWS SDK

### Deployment
- AWS EC2 for server
- AWS RDS for PostgreSQL
- AWS S3 for file storage
- AWS CloudFront for CDN
- Docker for containerization

---

## 7. DEPLOYMENT ARCHITECTURE

### AWS Infrastructure
- **EC2 Instance**: Backend API server
- **RDS PostgreSQL**: Main database
- **S3 Bucket**: Photo and document storage
- **CloudFront**: CDN for static assets
- **Route 53**: DNS management
- **CloudWatch**: Monitoring and logging
- **IAM**: Access management

### Separate URLs
- Operator App: Android APK (installed on devices)
- Admin Panel: https://admin.examination-system.com
- Central Dashboard: https://dashboard.examination-system.com
- Backend API: https://api.examination-system.com

---

## 8. DEVELOPMENT PHASES

### Phase 1: Operator Android App
- Authentication and registration
- Data download module
- Candidate management
- Exam day workflow (face capture, fingerprint)
- Offline storage and sync
- Dashboard and analytics

### Phase 2: Admin Panel
- Exam management
- Centre management
- Bulk data upload
- Operator management
- Device control
- Security settings

### Phase 3: Central Dashboard
- Real-time monitoring
- Analytics and reporting
- Device management
- Control buttons

### Phase 4: Backend Server
- API development
- Database setup
- Authentication system
- Data sync engine
- Biometric processing
- Reporting engine

### Phase 5: Integration & Testing
- End-to-end testing
- Security testing
- Performance optimization
- Load testing

### Phase 6: AWS Deployment
- Infrastructure setup
- Database migration
- SSL/TLS configuration
- Monitoring setup
- Backup strategy

