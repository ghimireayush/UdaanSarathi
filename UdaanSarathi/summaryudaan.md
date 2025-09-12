# Udaan Sarathi - Recruitment Management Portal

## Project Overview

Udaan Sarathi is a comprehensive recruitment management portal designed for recruitment agencies to streamline their hiring processes. The application provides a complete solution for managing job postings, candidate applications, interview scheduling, and post-interview workflow management.

### Key Features
- **User Authentication**: Secure login with role-based access control (Admin, Recruiter, Coordinator)
- **Analytics Dashboard**: Real-time recruitment metrics and insights
- **Job Management**: Create, edit, publish, and manage job postings
- **Application Tracking**: Centralized candidate application management
- **Interview Scheduling**: Advanced scheduling with calendar integration
- **Workflow Management**: Post-interview candidate pipeline management
- **Draft Management**: Save and manage job drafts
- **Agency Settings**: Configure agency profile and preferences
- **Audit Log**: Track all system activities (Admin only)
- **Responsive Design**: Mobile-first approach with accessibility compliance
- **Nepali Calendar**: Full BS calendar integration for local date handling

## Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Date Handling**: date-fns + date-fns-tz
- **Nepali Calendar**: nepali-date-converter
- **Calendar Component**: FullCalendar (daygrid, interaction, timegrid)

### Development Tools
- **Build Tool**: Vite
- **Package Manager**: npm
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint

## Project Architecture

### System Architecture Pattern
- **Type**: Frontend-only Single Page Application (SPA)
- **Design Patterns**:
  - Component-based architecture (React)
  - Service layer pattern (for API calls)
  - Custom hooks pattern (for state and logic reuse)
  - Module pattern (for organizing utilities and constants)

### Component Interaction
- Pages consume services to fetch data
- Components are reused across pages
- State management via React Query
- Layout component wraps all pages for consistent UI

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Generic UI components
│   ├── InteractiveUI/   # Interactive components
│   └── ...              # Feature-specific components
├── pages/               # Main application pages
├── services/            # API layer for data fetching
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── data/                # Mock data files
├── utils/               # Utility functions
├── styles/              # CSS files
├── assets/              # Static assets (images, logos)
└── docs/                # Documentation files
```

## Navigation Structure

The application follows a logical navigation structure:

1. **Dashboard** - Overview of key metrics
2. **Jobs** - Job listing and management
3. **Drafts** - Manage job drafts
4. **Applications** - Track all job applications
5. **Interviews** - Schedule and manage interviews
6. **Workflow** - Post-interview candidate workflow
7. **Audit Log** - System-wide audit trail (Admin only)
8. **Agency Settings** - Configure agency profile

## Core Modules

### 1. Dashboard
- Analytics and metrics visualization
- Key performance indicators
- Quick access to important features

### 2. Jobs Management
- Create and manage job postings
- Job status management (Draft, Published, Closed, Paused)
- Job filtering and search capabilities
- Job detail views with application tracking

### 3. Applications Tracking
- Candidate application management
- Application stage tracking (Applied, Shortlisted, Scheduled, etc.)
- Candidate profile management
- Application search and filtering

### 4. Interview Scheduling
- Calendar-based interview scheduling
- Batch scheduling functionality
- Interview status management (Scheduled, Completed, Cancelled, No Show)
- Conflict detection and prevention

### 5. Workflow Management
- Post-interview candidate pipeline
- Workflow stage tracking
- Progress monitoring
- Assignment management

### 6. Drafts Management
- Save and manage job drafts
- Draft editing and publishing
- Draft filtering and organization

### 7. Agency Settings
- Agency profile configuration
- Contact information management
- System preferences

### 8. Audit Log
- System activity tracking
- User action logging
- Security monitoring (Admin only)

## Data Models

### Job Schema
- ID, title, company, location
- Status, creation/publish dates
- Salary information
- Requirements and description
- Tags for categorization
- Application and interview statistics

### Candidate Schema
- Personal information
- Contact details
- Education and experience
- Application history
- Interview records
- Workflow status

### Interview Schema
- Scheduled date and time
- Interviewer information
- Type (In-person, Online, Phone)
- Status tracking
- Feedback and scoring

### Workflow Schema
- Current stage in pipeline
- Progress tracking
- Timeline of activities
- Assignment information
- Priority levels

## Authentication & Authorization

### User Roles
1. **Admin** - Full access to all features including Audit Log
2. **Recruiter** - Access to job postings, applications, and interview scheduling
3. **Coordinator** - Limited access to workflow management functions

### Permissions
- Role-based access control
- Feature-level permissions
- Data visibility restrictions

## Internationalization

- Support for both English and Nepali date formats
- Timezone handling for Asia/Kathmandu
- Ready for future localization expansion

## Performance & Accessibility

### Performance Requirements
- Optimized loading and caching
- Mobile-first responsive design
- Main lists load in less than 1.5 seconds for 10,000 applicants

### Accessibility
- WCAG compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast optimization

## Development Guidelines

### Service Layer Implementation
1. Data Architecture Setup with JSON mock data
2. Service layer functions for all data operations
3. UI components that consume services
4. User actions through services

### Code Quality Standards
- Comprehensive error handling
- Performance optimization
- Unit testing with Jest
- Code documentation

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

The application is built as a static site that can be deployed to any web server or CDN. The build process generates optimized assets in the `dist/` directory.