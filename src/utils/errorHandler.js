// Error Handler Utility - Centralized error handling for all service operations
export class ServiceError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', status = 500, details = null) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Enhanced error handler with retry logic
export const handleServiceError = async (operation, retries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry for client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        break;
      }
      
      // Don't retry if it's not a network or server error
      if (!isRetryableError(error)) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  // If we've exhausted retries, throw the last error with additional context
  if (lastError instanceof ServiceError) {
    throw lastError;
  }
  
  // Wrap unknown errors in ServiceError
  throw new ServiceError(
    lastError.message || 'An unexpected error occurred',
    'OPERATION_FAILED',
    lastError.status || 500,
    { originalError: lastError }
  );
};

// Determine if an error is retryable
const isRetryableError = (error) => {
  // Network errors are retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (error.status >= 500) {
    return true;
  }
  
  // Timeout errors are retryable
  if (error.name === 'TimeoutError') {
    return true;
  }
  
  // Simulated errors in mock services are retryable
  if (error.message.includes('Failed to fetch')) {
    return true;
  }
  
  return false;
};

// Create a standardized error from various error types
export const createError = (error, context = '') => {
  if (error instanceof ServiceError) {
    return error;
  }
  
  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new ServiceError(
      `Network error: Unable to connect to service${context ? ` (${context})` : ''}`,
      'NETWORK_ERROR',
      0,
      { originalError: error.message }
    );
  }
  
  // Handle HTTP errors
  if (error.status) {
    return new ServiceError(
      error.message || `HTTP ${error.status}: ${error.statusText || 'Request failed'}${context ? ` (${context})` : ''}`,
      `HTTP_${error.status}`,
      error.status,
      { originalError: error }
    );
  }
  
  // Handle generic errors
  return new ServiceError(
    error.message || `Operation failed${context ? ` (${context})` : ''}`,
    'OPERATION_FAILED',
    500,
    { originalError: error }
  );
};

export default {
  ServiceError,
  handleServiceError,
  createError
};