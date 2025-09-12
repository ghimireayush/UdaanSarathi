import { useState, useCallback } from 'react';
import { ServiceError } from '../utils/errorHandler.js';

/**
 * Custom hook for handling service errors in components
 * @returns {Object} Object containing error state and error handling functions
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetryable, setIsRetryable] = useState(false);

  /**
   * Handle service errors and update state appropriately
   * @param {Error|ServiceError} error - The error to handle
   * @param {string} context - Context information for the error
   */
  const handleError = useCallback((error, context = '') => {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof ServiceError) {
      // Handle known service errors
      setError({
        message: error.message,
        code: error.code,
        status: error.status,
        timestamp: error.timestamp
      });
      
      // Set retryable flag for network/server errors
      setIsRetryable(error.status === 0 || error.status >= 500);
    } else {
      // Handle unexpected errors
      setError({
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      });
      
      // For unknown errors, assume they might be retryable
      setIsRetryable(true);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setIsRetryable(false);
  }, []);

  return {
    error,
    isRetryable,
    handleError,
    clearError
  };
};

export default useErrorHandler;