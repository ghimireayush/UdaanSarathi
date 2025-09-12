import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler.js';
import { ServiceError } from '../utils/errorHandler.js';

// Mock console.error to avoid noisy output during tests
console.error = jest.fn();

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    expect(result.current.error).toBeNull();
    expect(result.current.isRetryable).toBe(false);
  });

  it('should handle ServiceError instances', () => {
    const { result } = renderHook(() => useErrorHandler());
    const serviceError = new ServiceError('Test error', 'TEST_ERROR', 500);
    
    act(() => {
      result.current.handleError(serviceError, 'test context');
    });
    
    expect(result.current.error).toEqual({
      message: 'Test error',
      code: 'TEST_ERROR',
      status: 500,
      timestamp: expect.any(String)
    });
    expect(result.current.isRetryable).toBe(true);
  });

  it('should handle network errors as retryable', () => {
    const { result } = renderHook(() => useErrorHandler());
    const networkError = new ServiceError('Network error', 'NETWORK_ERROR', 0);
    
    act(() => {
      result.current.handleError(networkError, 'test context');
    });
    
    expect(result.current.isRetryable).toBe(true);
  });

  it('should handle client errors as non-retryable', () => {
    const { result } = renderHook(() => useErrorHandler());
    const clientError = new ServiceError('Bad request', 'HTTP_400', 400);
    
    act(() => {
      result.current.handleError(clientError, 'test context');
    });
    
    expect(result.current.isRetryable).toBe(false);
  });

  it('should handle generic errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const genericError = new Error('Generic error');
    
    act(() => {
      result.current.handleError(genericError, 'test context');
    });
    
    expect(result.current.error).toEqual({
      message: 'Generic error',
      code: 'UNKNOWN_ERROR',
      status: 500,
      timestamp: expect.any(String)
    });
    // Generic errors are considered retryable by default
    expect(result.current.isRetryable).toBe(true);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const serviceError = new ServiceError('Test error', 'TEST_ERROR', 500);
    
    act(() => {
      result.current.handleError(serviceError, 'test context');
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
    expect(result.current.isRetryable).toBe(false);
  });
});