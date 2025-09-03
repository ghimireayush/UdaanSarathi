# Draft List Management Feature

## Overview
The Draft List Management component provides a comprehensive interface for managing draft job postings before they are published. It supports both grid and list views with advanced filtering, sorting, and bulk operations.

## Features Implemented

### ✅ View Options
- **Grid View**: 3 cards per row (tall cards) for better visual presentation
- **List View**: Tabular format with multiselect capability for bulk operations
- **Responsive Design**: Adapts to different screen sizes

### ✅ Sorting & Search
- **Sort by Created Date**: Default sorting by most recent drafts
- **Sort by Title**: Alphabetical sorting by job title
- **Sort by Company**: Alphabetical sorting by company name
- **Search Functionality**: Search by job title, company name, or job ID

### ✅ Actions
- **Edit**: Navigate to edit job form (placeholder implementation)
- **Delete**: Remove individual drafts with confirmation
- **Bulk Delete**: Remove multiple selected drafts
- **Publish**: Publish individual drafts with validation
- **Bulk Publish**: Publish multiple selected drafts with validation

### ✅ Information Display
- **Creator Info**: "Created by <UserName> N days ago"
- **Nepali Date**: Shows Nepali weekday names (आइतबार, सोमबार, etc.)
- **Info Button**: Clickable (i) button showing detailed date information
- **Relative Time**: Human-readable time format (e.g., "2 days ago")

### ✅ Acceptance Criteria
- **Draft Status**: All drafts have status="draft" and proper country setting
- **Validation**: Mandatory field validation before publishing
- **Bulk Operations**: Support for bulk create, delete, and publish operations

## Component Structure

```
src/components/DraftListManagement.jsx
├── Main Component (DraftListManagement)
├── DraftCard (Grid View)
├── DraftRow (List View)
└── ValidationModal
```

## Key Functions

### Data Management
- `fetchDrafts()`: Loads draft jobs from the service
- `handleDraftSelect()`: Manages individual draft selection
- `handleSelectAll()`: Toggles all drafts selection

### Filtering & Sorting
- `useEffect` for real-time filtering and sorting
- Search by title, company, or ID
- Sort by created date, title, or company

### Validation & Publishing
- `validateDraftForPublishing()`: Checks required fields
- `handlePublish()`: Publishes single draft with validation
- `handleBulkPublish()`: Publishes multiple drafts with validation

### Required Fields for Publishing
- Job Title
- Company Name
- Job Description (minimum 50 characters)
- Country
- Job Category
- Salary Amount (must be > 0)
- Salary Currency

## Usage

```jsx
import DraftListManagement from '../components/DraftListManagement'

function DraftPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DraftListManagement />
    </div>
  )
}
```

## Data Structure

### Draft Job Object
```json
{
  "id": "job_007",
  "title": "Chef Assistant",
  "company": "Golden Palace Restaurant",
  "country": "Qatar",
  "city": "Doha",
  "status": "draft",
  "created_at": "2025-08-28T14:20:00.000Z",
  "published_at": null,
  "salary_amount": 1400,
  "currency": "QAR",
  "description": "Assistant chef needed...",
  "category": "Chef",
  "applications_count": 0,
  "shortlisted_count": 0,
  "interviews_today": 0,
  "total_interviews": 0,
  "view_count": 0
}
```

## Styling

The component uses Tailwind CSS with custom classes defined in `DraftListManagement.css`:

- `.card`: Base card styling
- `.btn-primary`, `.btn-secondary`, `.btn-danger`: Button variants
- `.draft-grid`: 3-column grid layout
- `.draft-card`: Tall card styling for grid view
- `.selected`: Selection state styling

## Responsive Behavior

- **Mobile**: Single column grid, stacked controls
- **Tablet**: 2-column grid, horizontal controls
- **Desktop**: 3-column grid, full feature set

## Error Handling

- **Network Errors**: Displays error messages for failed operations
- **Validation Errors**: Shows detailed validation modal with specific field errors
- **Loading States**: Skeleton loading animation during data fetch

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order

## Future Enhancements

1. **Nepali Calendar Integration**: Replace placeholder with actual Nepali calendar library
2. **Advanced Filters**: Add filters by category, country, salary range
3. **Drag & Drop**: Reorder drafts with drag and drop
4. **Export**: Export draft list to CSV/Excel
5. **Templates**: Create drafts from predefined templates
6. **Auto-save**: Automatic saving of draft changes
7. **Collaboration**: Multi-user editing with conflict resolution

## Testing

The component includes test data with various draft states:
- Complete drafts ready for publishing
- Incomplete drafts missing required fields
- Drafts with different creation dates for sorting tests

## Dependencies

- React 18+
- Lucide React (icons)
- date-fns (date formatting)
- Tailwind CSS (styling)

## Performance Considerations

- **Virtualization**: For large lists (1000+ items), consider implementing virtual scrolling
- **Debounced Search**: Search input is debounced to prevent excessive API calls
- **Memoization**: Consider memoizing expensive calculations for large datasets
- **Lazy Loading**: Implement pagination for better performance with many drafts