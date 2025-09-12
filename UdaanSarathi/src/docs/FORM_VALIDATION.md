# Form Validation Documentation

This document outlines the form validation utilities and hooks that have been implemented in the Udaan Sarathi application to ensure proper form validation and user experience.

## Form Validation Utilities

The form validation utilities provide a collection of validation functions that can be combined to create complex validation rules.

### Available Validators

#### required
Validates that a field is not empty.

```javascript
import { required } from '../utils/formValidation'

// Usage
const error = required(value) // Returns error message or null
```

#### email
Validates email format.

```javascript
import { email } from '../utils/formValidation'

// Usage
const error = email(value) // Returns error message or null
```

#### minLength
Validates minimum length of a string.

```javascript
import { minLength } from '../utils/formValidation'

// Usage
const validateMinLength = minLength(5)
const error = validateMinLength(value) // Returns error message or null
```

#### maxLength
Validates maximum length of a string.

```javascript
import { maxLength } from '../utils/formValidation'

// Usage
const validateMaxLength = maxLength(50)
const error = validateMaxLength(value) // Returns error message or null
```

#### exactLength
Validates exact length of a string.

```javascript
import { exactLength } from '../utils/formValidation'

// Usage
const validateExactLength = exactLength(10)
const error = validateExactLength(value) // Returns error message or null
```

#### min
Validates minimum value of a number.

```javascript
import { min } from '../utils/formValidation'

// Usage
const validateMin = min(18)
const error = validateMin(value) // Returns error message or null
```

#### max
Validates maximum value of a number.

```javascript
import { max } from '../utils/formValidation'

// Usage
const validateMax = max(100)
const error = validateMax(value) // Returns error message or null
```

#### phone
Validates phone number format.

```javascript
import { phone } from '../utils/formValidation'

// Usage
const error = phone(value) // Returns error message or null
```

#### url
Validates URL format.

```javascript
import { url } from '../utils/formValidation'

// Usage
const error = url(value) // Returns error message or null
```

#### matches
Validates that a field matches another field.

```javascript
import { matches } from '../utils/formValidation'

// Usage
const validatePasswordMatch = matches('password', 'Password')
const error = validatePasswordMatch(value, allValues) // Returns error message or null
```

#### combine
Combines multiple validators.

```javascript
import { combine, required, email } from '../utils/formValidation'

// Usage
const validateEmail = combine(required, email)
const error = validateEmail(value) // Returns first error or null
```

### Helper Functions

#### validateForm
Validates an entire form.

```javascript
import { validateForm } from '../utils/formValidation'

// Usage
const errors = validateForm(values, validators)
// Returns object with field errors
```

#### isFormValid
Checks if form is valid.

```javascript
import { isFormValid } from '../utils/formValidation'

// Usage
const isValid = isFormValid(errors) // Returns boolean
```

#### getFirstError
Gets the first error message.

```javascript
import { getFirstError } from '../utils/formValidation'

// Usage
const firstError = getFirstError(errors) // Returns first error or null
```

## useValidation Hook

The useValidation hook provides a complete form validation solution with state management.

### Usage

```jsx
import { useValidation } from '../hooks/useValidation'
import * as validators from '../utils/formValidation'

const MyForm = () => {
  const validationRules = {
    name: validators.combine(validators.required, validators.minLength(2)),
    email: validators.combine(validators.required, validators.email),
    age: validators.combine(validators.required, validators.min(18)),
    password: validators.combine(validators.required, validators.minLength(8)),
    confirmPassword: validators.matches('password', 'Password')
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    submitForm
  } = useValidation({
    name: '',
    email: '',
    age: '',
    password: '',
    confirmPassword: ''
  }, validationRules)

  const handleSubmit = async (formValues) => {
    // Submit form data
    try {
      await api.submitForm(formValues)
      alert('Form submitted successfully!')
    } catch (error) {
      alert('Failed to submit form')
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      submitForm(handleSubmit)
    }}>
      <div>
        <input
          type="text"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Name"
        />
        {touched.name && errors.name && <div className="error">{errors.name}</div>}
      </div>
      
      <div>
        <input
          type="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="Email"
        />
        {touched.email && errors.email && <div className="error">{errors.email}</div>}
      </div>
      
      <div>
        <input
          type="number"
          value={values.age}
          onChange={(e) => handleChange('age', e.target.value)}
          onBlur={() => handleBlur('age')}
          placeholder="Age"
        />
        {touched.age && errors.age && <div className="error">{errors.age}</div>}
      </div>
      
      <div>
        <input
          type="password"
          value={values.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder="Password"
        />
        {touched.password && errors.password && <div className="error">{errors.password}</div>}
      </div>
      
      <div>
        <input
          type="password"
          value={values.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder="Confirm Password"
        />
        {touched.confirmPassword && errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
      </div>
      
      <button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

### Hook Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| initialValues | Object | {} | Initial form values |
| validationRules | Object | {} | Validation rules for each field |

### Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| values | Object | Current form values |
| errors | Object | Current validation errors |
| touched | Object | Touched fields |
| isSubmitting | boolean | Whether form is submitting |
| isValid | boolean | Whether form is valid |
| handleChange | Function | Handle field change |
| handleBlur | Function | Handle field blur |
| reset | Function | Reset form to initial state |
| setFormValues | Function | Set form values |
| setFieldError | Function | Set field error |
| submitForm | Function | Submit form with validation |

## Implementation Examples

### Login Form with Validation

```jsx
import { useValidation } from '../hooks/useValidation'
import * as validators from '../utils/formValidation'
import { Card, CardContent, CardFooter, Button } from '../components/ui/Card'

const LoginForm = () => {
  const validationRules = {
    username: validators.required,
    password: validators.combine(
      validators.required,
      validators.minLength(6)
    )
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    submitForm
  } = useValidation({
    username: '',
    password: ''
  }, validationRules)

  const handleSubmit = async (formValues) => {
    try {
      await login(formValues.username, formValues.password)
      // Redirect on success
    } catch (error) {
      // Handle login error
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault()
          submitForm(handleSubmit)
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={values.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onBlur={() => handleBlur('username')}
                className={`w-full px-3 py-2 border rounded-md ${
                  touched.username && errors.username 
                    ? 'border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="Enter your username"
              />
              {touched.username && errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full px-3 py-2 border rounded-md ${
                  touched.password && errors.password 
                    ? 'border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500">
          All fields are required for login.
        </p>
      </CardFooter>
    </Card>
  )
}
```

### Job Application Form with Complex Validation

```jsx
import { useValidation } from '../hooks/useValidation'
import * as validators from '../utils/formValidation'

const JobApplicationForm = () => {
  const validationRules = {
    firstName: validators.combine(
      validators.required,
      validators.minLength(2),
      validators.maxLength(50)
    ),
    lastName: validators.combine(
      validators.required,
      validators.minLength(2),
      validators.maxLength(50)
    ),
    email: validators.combine(
      validators.required,
      validators.email
    ),
    phone: validators.combine(
      validators.required,
      validators.phone
    ),
    experience: validators.combine(
      validators.required,
      validators.min(0),
      validators.max(50)
    ),
    skills: validators.required,
    resume: validators.required,
    coverLetter: validators.combine(
      validators.required,
      validators.minLength(100)
    ),
    salaryExpectation: validators.combine(
      validators.required,
      validators.min(0)
    )
  }

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    submitForm
  } = useValidation({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: '',
    skills: [],
    resume: null,
    coverLetter: '',
    salaryExpectation: ''
  }, validationRules)

  const handleSubmit = async (formValues) => {
    // Submit application
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      submitForm(handleSubmit)
    }}>
      {/* Form fields with validation */}
      {/* ... */}
    </form>
  )
}
```

## Testing

The form validation utilities and hooks have been tested for:
- Correct validation logic
- Proper error messaging
- Edge case handling
- Performance with large forms
- Accessibility compliance
- Cross-browser compatibility

## Future Enhancements

Planned improvements include:
- Async validation support
- Custom validation rule creation
- Validation schema definition
- Integration with popular form libraries
- Advanced validation patterns
- Localization support for error messages