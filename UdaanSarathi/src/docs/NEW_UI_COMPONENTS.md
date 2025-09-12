# New UI Components Documentation

This document outlines the new UI components that have been implemented in the Udaan Sarathi application to enhance the user interface with modern design patterns and improved user experience.

## Button Component

The Button component provides a consistent and accessible way to create interactive elements throughout the application.

### Usage

```jsx
import { Button } from '../components/ui/Card' // Note: Button is exported from Card component

// Primary button
<Button variant="primary">Primary Button</Button>

// Secondary button
<Button variant="secondary">Secondary Button</Button>

// Success button
<Button variant="success">Success Button</Button>

// Danger button
<Button variant="danger">Danger Button</Button>

// Outline button
<Button variant="outline">Outline Button</Button>

// Ghost button
<Button variant="ghost">Ghost Button</Button>

// Button with loading state
<Button loading>Loading...</Button>

// Button with icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Next</Button>

// Disabled button
<Button disabled>Disabled Button</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Full width button
<Button fullWidth>Full Width Button</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | "primary" | Style variant (primary, secondary, success, danger, outline, ghost) |
| size | string | "md" | Size variant (sm, md, lg, xl) |
| fullWidth | boolean | false | Makes button full width of container |
| loading | boolean | false | Shows loading spinner |
| disabled | boolean | false | Disables the button |
| leftIcon | ReactNode | null | Icon to show on the left side |
| rightIcon | ReactNode | null | Icon to show on the right side |
| className | string | "" | Additional CSS classes |

## Modal Component

The Modal component provides a way to display content in an overlay that appears on top of the main content.

### Usage

```jsx
import { Modal } from '../components/ui/Modal'

const MyModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modal Title"
      size="md"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      showCloseButton={true}
    >
      <div>Modal content goes here</div>
      
      <div slot="footer">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </div>
    </Modal>
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | boolean | false | Controls visibility of the modal |
| onClose | function | null | Function called when modal is closed |
| title | string | null | Modal title |
| children | ReactNode | null | Modal content |
| footer | ReactNode | null | Footer content |
| size | string | "md" | Size of modal (sm, md, lg, xl, full) |
| closeOnOverlayClick | boolean | true | Close modal when clicking overlay |
| closeOnEsc | boolean | true | Close modal when pressing Escape key |
| showCloseButton | boolean | true | Show close button in header |

## Alert Component

The Alert component provides a way to display important information to the user.

### Usage

```jsx
import { Alert } from '../components/ui/Alert'

// Default alert
<Alert>This is a default alert</Alert>

// Success alert
<Alert variant="success" title="Success">Operation completed successfully!</Alert>

// Warning alert
<Alert variant="warning" title="Warning">Please check your input</Alert>

// Error alert
<Alert variant="error" title="Error">Something went wrong</Alert>

// Info alert
<Alert variant="info" title="Information">Here's some useful information</Alert>

// Alert with close button
<Alert variant="info" onClose={() => console.log('Alert closed')}>
  This alert can be closed
</Alert>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | "default" | Style variant (default, success, warning, error, info) |
| title | string | null | Alert title |
| children | ReactNode | null | Alert content |
| className | string | "" | Additional CSS classes |
| onClose | function | null | Function called when close button is clicked |

## UI Utilities CSS

Additional CSS utilities have been added to support the new components and maintain consistency.

### Glass-morphism Effects

- `.glass-effect`: Standard glass effect with 10px blur
- `.glass-effect-strong`: Stronger glass effect with 20px blur
- `.glass-effect-subtle`: Subtle glass effect with 5px blur

### Gradient Text Effects

- `.gradient-text-brand`: Navy to Bright Blue gradient
- `.gradient-text-success`: Vibrant Green to Dark Green gradient
- `.gradient-text-warning`: Amber to Orange gradient

### Gradient Backgrounds

- `.gradient-bg-brand`: Navy to Bright Blue gradient background
- `.gradient-bg-success`: Vibrant Green to Dark Green gradient background
- `.gradient-bg-warning`: Amber to Orange gradient background

### Hover and Focus Effects

- `.hover-scale`: Scale effect on hover
- `.hover-lift`: Lift effect with shadow on hover
- `.focus-ring-brand`: Brand color focus ring
- `.focus-ring-success`: Success color focus ring

### Shadow Utilities

- `.shadow-soft`: Soft shadow
- `.shadow-soft-lg`: Large soft shadow
- `.shadow-soft-xl`: Extra large soft shadow

### Border Utilities

- `.border-subtle`: Subtle border
- `.border-brand`: Brand color border
- `.border-success`: Success color border

### Animation Utilities

- `.animate-fade-in`: Fade in animation
- `.animate-slide-up`: Slide up animation

### Touch Target Utilities

- `.touch-target`: Ensures minimum 44px touch target size for mobile

## Accessibility Features

All new components follow accessibility best practices:

1. Proper ARIA attributes
2. Keyboard navigation support
3. Focus management
4. Sufficient color contrast
5. Semantic HTML structure
6. Screen reader support

## Responsive Design

All components are designed with mobile-first responsive principles:

1. Touch-friendly sizes
2. Adaptive layouts
3. Performance optimizations for mobile
4. Media query support

## Implementation Examples

### Using Buttons in Forms

```jsx
<form onSubmit={handleSubmit}>
  <Button type="submit" loading={isSubmitting}>
    Submit
  </Button>
  <Button type="button" variant="secondary" onClick={handleCancel}>
    Cancel
  </Button>
</form>
```

### Using Modals for Confirmation

```jsx
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Deletion"
    >
      <p>Are you sure you want to delete this item?</p>
      
      <div slot="footer">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  )
}
```

### Using Alerts for Form Validation

```jsx
{error && (
  <Alert variant="error" title="Validation Error">
    {error}
  </Alert>
)}

{success && (
  <Alert variant="success" title="Success">
    {success}
  </Alert>
)}
```

## Testing

The new components have been tested for:

1. Cross-browser compatibility
2. Responsive behavior
3. Accessibility compliance
4. Performance impact
5. User experience

## Future Enhancements

Planned improvements include:

1. Dark mode support
2. Additional animation effects
3. More comprehensive component library
4. Advanced accessibility features
5. Performance optimizations