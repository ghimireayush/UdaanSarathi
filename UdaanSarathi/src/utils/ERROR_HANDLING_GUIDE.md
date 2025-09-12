# Error Handling Guide

This guide explains how to use the centralized error handling system implemented in the Udaan Sarathi application.

## Overview

The error handling system consists of:

1. `ServiceError` class - A standardized error class for all service operations
2. `handleServiceError` function - A wrapper that provides retry logic and error standardization
3. `createError` function - A utility to convert various error types to ServiceError instances

## ServiceError Class

The `ServiceError` class extends the built-in JavaScript Error class and adds additional properties:

```javascript
class ServiceError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', status = 500, details = null) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}
```

### Properties

- `message`: Human-readable error message
- `code`: Error code for programmatic handling
- `status`: HTTP status code equivalent
- `details`: Additional error details
- `timestamp`: When the error occurred

## handleServiceError Function

This function wraps service operations and provides:

1. Retry logic for transient failures
2. Error standardization
3. Exponential backoff between retries

### Usage

```javascript
import { handleServiceError } from '../utils/errorHandler.js';

// Basic usage
const result = await handleServiceError(async () => {
  // Your service operation here
  return await someServiceOperation();
});

// With custom retry settings
const result = await handleServiceError(async () => {
  // Your service operation here
  return await someServiceOperation();
}, 5, 1000); // 5 retries, 1000ms base delay
```

### Retry Logic

- Default: 3 retries with exponential backoff (1s, 2s, 4s)
- Only retries network errors and server errors (5xx)
- Does not retry client errors (4xx) as they're typically not transient

## createError Function

Converts various error types to standardized ServiceError instances:

```javascript
import { createError } from '../utils/errorHandler.js';

// Convert network error
const serviceError = createError(new TypeError('fetch failed'), 'job service');

// Convert HTTP error
const serviceError = createError({ status: 404, statusText: 'Not Found' }, 'candidate service');
```

## Implementation in Services

All service methods should be wrapped with `handleServiceError`:

```javascript
// Before
async getJobs(filters = {}) {
  await delay();
  if (shouldSimulateError()) {
    throw new Error('Failed to fetch jobs');
  }
  // ... implementation
}

// After
async getJobs(filters = {}) {
  return handleServiceError(async () => {
    await delay();
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch jobs');
    }
    // ... implementation
  }, 3, 500); // 3 retries, 500ms base delay
}
```

## Error Handling in Components

Components should catch ServiceError instances and handle them appropriately:

```javascript
import { ServiceError } from '../utils/errorHandler.js';

try {
  const jobs = await jobService.getJobs(filters);
  setJobs(jobs);
} catch (error) {
  if (error instanceof ServiceError) {
    // Handle known service errors
    setError({
      message: error.message,
      code: error.code,
      retryable: error.status >= 500
    });
  } else {
    // Handle unexpected errors
    setError({
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    });
  }
}
```

## Best Practices

1. Always wrap service operations with `handleServiceError`
2. Provide meaningful error messages and codes
3. Use appropriate retry counts based on operation criticality
4. Handle ServiceError instances specifically in components
5. Log errors for debugging (but don't expose sensitive information to users)
6. Provide user-friendly error messages in the UI

## Common Error Codes

- `NETWORK_ERROR`: Connection issues
- `HTTP_400`: Bad request
- `HTTP_401`: Unauthorized
- `HTTP_403`: Forbidden
- `HTTP_404`: Not found
- `HTTP_500`: Internal server error
- `OPERATION_FAILED`: Generic operation failure

## Testing Error Handling

The error handling system includes retry logic which should be tested:

1. Test successful operations
2. Test retryable errors (network failures, 5xx errors)
3. Test non-retryable errors (4xx errors)
4. Verify correct number of retry attempts
5. Ensure proper error propagation