# Audit Logging System

## Overview
The audit logging system provides comprehensive tracking of all changes made to agency settings with user attribution and timestamps. This ensures accountability, compliance, and traceability of all system modifications.

## ✅ **Acceptance Criteria Met**

### **📝 Changes Audit-Logged**
- All agency profile updates are automatically logged
- File uploads (logo, banner) are tracked
- Settings changes are recorded
- Contact information updates are logged
- System-wide audit log accessible to administrators

### **👤 User Attribution**
- Every change includes user ID and name
- User information is captured from current session
- IP address and session tracking
- Browser/user agent information

### **⏰ Timestamp Tracking**
- Precise timestamp for every change
- Formatted timestamps for display
- Timezone-aware logging
- Relative time display (e.g., "2 hours ago")

## 🏗️ **System Architecture**

### **Services**
```
src/services/
├── auditService.js     # Core audit logging functionality
├── agencyService.js    # Enhanced with audit integration
└── index.js           # Service exports
```

### **Components**
```
src/components/
├── AgencySettings.jsx  # Enhanced with audit logging
└── AuditLog.jsx       # Audit trail viewer
```

### **Pages**
```
src/pages/
└── AuditLog.jsx       # System-wide audit log page (admin only)
```

## 📊 **Audit Data Structure**

### **Audit Log Entry**
```javascript
{
  id: "audit_1234567890_abc123",
  timestamp: "2025-01-15T10:30:00.000Z",
  user_id: "user_001",
  user_name: "John Doe",
  action: "UPDATE",
  resource_type: "AGENCY_PROFILE",
  resource_id: "agency_001",
  changes: {
    "name": { from: "Old Name", to: "New Name" },
    "email": { from: "old@email.com", to: "new@email.com" }
  },
  old_values: { name: "Old Name", email: "old@email.com" },
  new_values: { name: "New Name", email: "new@email.com" },
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0...",
  session_id: "session_abc123",
  metadata: {
    section: "basic",
    change_count: 2,
    browser: "Chrome 120.0",
    timestamp_formatted: "January 15, 2025 at 10:30 AM"
  }
}
```

## 🎯 **Tracked Actions**

### **Profile Updates**
- **Basic Information**: Name, description, established year, license
- **Contact Details**: Phone, mobile, email, website
- **Location**: Address changes
- **Social Media**: All social platform links
- **Settings**: Currency, timezone, language, notifications
- **Services**: Services offered, specializations, target countries

### **File Operations**
- **Logo Upload**: File name, size, old/new URLs
- **Banner Upload**: File details and URL changes
- **File Validation**: Type and size validation results

### **System Events**
- **Login/Logout**: User session tracking
- **Settings Changes**: Configuration modifications
- **Profile Views**: Access logging (optional)
- **System-wide Changes**: All user actions across the application

## 🔍 **Audit Log Features**

### **Comprehensive Tracking**
```javascript
// Every update includes full audit trail
await agencyService.updateBasicInfo(data, {
  user: currentUser,
  section: 'basic'
})
```

### **Change Detection**
- Automatic before/after value comparison
- Field-level change tracking
- Nested object change detection
- Array modification tracking

### **Rich Metadata**
- Section identification
- Change count statistics
- Browser and device information
- Session correlation

## 📱 **Audit Log Viewer**

### **Summary Dashboard**
- Total changes count
- Unique users involved
- First and last change dates
- Action type breakdown

### **Detailed Log View**
- Chronological change history
- Expandable change details
- Before/after value comparison
- User and timestamp information

### **Filtering & Search**
- Filter by user, action, date range
- Search by field names or values
- Resource-specific filtering
- Pagination support

### **Admin-Only Access**
- System-wide audit log page accessible only to administrators
- Comprehensive view of all system changes
- Advanced filtering capabilities
- Detailed user activity tracking

## 🛡️ **Security & Compliance**

### **Data Integrity**
- Immutable audit logs
- Cryptographic timestamps
- Change validation
- Rollback capability preparation

### **Privacy Protection**
- Sensitive data masking
- User consent tracking
- Data retention policies
- GDPR compliance ready

### **Access Control**
- Role-based audit access
- Admin-only sensitive logs
- User-specific filtering
- Export restrictions

## 🔧 **Implementation Details**

### **Service Integration**
```javascript
// Enhanced agency service methods
async updateBasicInfo(data, auditInfo = {}) {
  const oldData = await this.getAgencyProfile()
  const newData = await this.updateAgencyProfile(data, auditInfo)
  
  // Audit logging happens automatically
  return newData
}
```

### **Component Usage**
```javascript
// Audit logging in components
const saveChanges = async (section) => {
  const auditInfo = { user: currentUser }
  await agencyService.updateBasicInfo(formData, auditInfo)
}
```

### **Audit Log Display**
```javascript
// View audit logs
<AuditLog 
  resourceType="AGENCY_PROFILE"
  resourceId="agency_001"
/>
```

### **System-wide Audit Page**
```javascript
// Admin-only audit log page
// Accessible at /auditlog route
// Protected by VIEW_AUDIT_LOGS permission
```

## 📈 **Audit Analytics**

### **Change Patterns**
- Most frequently changed fields
- User activity patterns
- Peak change times
- Section-wise statistics

### **Compliance Reporting**
- Change frequency reports
- User activity summaries
- Compliance audit trails
- Export capabilities