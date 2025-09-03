# useErrorHandler Hook Guide

This guide explains how to use the `useErrorHandler` hook for consistent error handling in React components.

## Overview

The `useErrorHandler` hook provides a standardized way to handle errors in React components. It manages error state and provides utility functions for handling different types of errors.

## Usage

```javascript
import useErrorHandler from '../hooks/useErrorHandler.js';

const MyComponent = () => {
  const { error, isRetryable, handleError, clearError } = useErrorHandler();
  
  const fetchData = async () => {
    try {
      const data = await someService.getData();
      // Process data
    } catch (err) {
      handleError(err, 'fetch data');
    }
  };
  
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        {isRetryable && (
          <button onClick={fetchData}>Retry</button>
        )}
        <button onClick={clearError}>Clear</button>
      </div>
    );
  }
  
  return <div>My Component Content</div>;
};
```

## Return Values

The hook returns an object with the following properties:

### `error`
- Type: `Object|null`
- Description: The current error state, or `null` if no error
- Properties:
  - `message`: Error message
  - `code`: Error code
  - `status`: HTTP status code (0 for network errors)
  - `timestamp`: When the error occurred

### `isRetryable`
- Type: `boolean`
- Description: Whether the error is likely to succeed on retry
- `true` for network errors and server errors (5xx)
- `false` for client errors (4xx)

### `handleError(error, context)`
- Type: `function`
- Description: Function to process and set error state
- Parameters:
  - `error`: The error to handle (can be ServiceError or generic Error)
  - `context`: Context string for logging purposes

### `clearError()`
- Type: `function`
- Description: Function to clear the current error state

## Error Handling Logic

The hook automatically determines retryability based on error type:

1. **ServiceError instances**:
   - Network errors (status 0) → retryable
   - Server errors (5xx) → retryable
   - Client errors (4xx) → not retryable

2. **Generic Error instances**:
   - Treated as retryable by default

## Best Practices

1. Always provide context when calling `handleError`
2. Use `isRetryable` to determine whether to show a retry button
3. Call `clearError` when attempting to retry an operation
4. Log errors appropriately (the hook automatically logs to console.error)
5. Display user-friendly error messages in the UI

## Example Implementation

```javascript
import React, { useState, useEffect } from 'react';
import useErrorHandler from '../hooks/useErrorHandler.js';
import { jobService } from '../services/index.js';

const JobList = () => {
  const { error, isRetryable, handleError, clearError } = useErrorHandler();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchJobs();
  }, []);
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await jobService.getJobs();
      setJobs(data);
    } catch (err) {
      handleError(err, 'fetch jobs');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && jobs.length === 0) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to load jobs</h2>
        <p>{error.message}</p>
        <div className="error-actions">
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
          {isRetryable && (
            <button onClick={fetchJobs}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Jobs</h1>
      <ul>
        {jobs.map(job => (
          <li key={job.id}>{job.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default JobList;
```