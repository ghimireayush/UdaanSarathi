# Information Architecture

## Navigation Structure

The Udaan Sarathi Portal follows a logical navigation structure designed for recruitment agencies. The top navigation menu is organized as follows:

### Desktop Navigation (Left Sidebar)
1. **Dashboard** (Analytics) - `/dashboard`
   - Overview of key metrics and analytics
   - Quick access to important system functions

2. **Jobs** - `/jobs`
   - Job listing and management
   - Create, edit, and publish job postings

3. **Drafts** - `/drafts`
   - Manage job drafts
   - Convert drafts to published jobs

4. **Applications** - `/applications`
   - Track all job applications
   - Review and manage candidates

5. **Interviews** - `/interviews`
   - Schedule and manage interviews
   - View upcoming and past interviews

6. **Workflow** - `/workflow`
   - Post-interview candidate workflow
   - Track candidates through hiring stages

7. **Audit Log** - `/auditlog` *(Admin Only)*
   - System-wide audit trail
   - Track all user activities and changes

8. **Agency Settings** - `/settings`
   - Agency profile management
   - User management and permissions
   - System configuration

### Mobile Navigation
The mobile navigation follows the same order as the desktop navigation, accessible through a hamburger menu in the top-left corner.

### Role-Based Visibility
- **Admin Users**: Have access to all navigation items including Audit Log
- **Recruiters**: Have access to all items except Audit Log
- **Coordinators**: Have limited access based on their permissions

### Access Control
Each navigation item is protected by permission-based access control:
- Dashboard: Publicly accessible to all authenticated users
- Jobs: Requires `VIEW_JOBS` permission
- Drafts: Requires `CREATE_JOB` or `EDIT_JOB` permission
- Applications: Requires `VIEW_APPLICATIONS` permission
- Interviews: Requires `VIEW_INTERVIEWS` or `SCHEDULE_INTERVIEW` permission
- Workflow: Requires `VIEW_WORKFLOW` permission
- Audit Log: Requires `VIEW_AUDIT_LOGS` permission (Admin only)
- Agency Settings: Requires `MANAGE_SETTINGS` permission