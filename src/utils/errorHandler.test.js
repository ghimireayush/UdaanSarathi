import { ServiceError, handleServiceError, createError } from './errorHandler.js';

// Test the ServiceError class
console.log('Testing ServiceError class...');
try {
  throw new ServiceError('Test error message', 'TEST_ERROR', 400, { test: 'data' });
} catch (error) {
  console.log('ServiceError created successfully:');
  console.log('Name:', error.name);
  console.log('Message:', error.message);
  console.log('Code:', error.code);
  console.log('Status:', error.status);
  console.log('Details:', error.details);
}

// Test handleServiceError with successful operation
console.log('\nTesting handleServiceError with successful operation...');
handleServiceError(async () => {
  return 'Success!';
}).then(result => {
  console.log('Success result:', result);
}).catch(error => {
  console.log('Unexpected error:', error);
});

// Test handleServiceError with retryable error
console.log('\nTesting handleServiceError with retryable error...');
let attemptCount = 0;
handleServiceError(async () => {
  attemptCount++;
  if (attemptCount < 3) {
    throw new Error('Failed to fetch');
  }
  return 'Success after retries!';
}, 3, 100).then(result => {
  console.log('Success after retries:', result);
  console.log('Attempts made:', attemptCount);
}).catch(error => {
  console.log('Error after retries:', error.message);
});

// Test handleServiceError with non-retryable error
console.log('\nTesting handleServiceError with non-retryable error...');
handleServiceError(async () => {
  throw { status: 400, message: 'Bad Request' };
}, 3, 100).then(result => {
  console.log('Unexpected success:', result);
}).catch(error => {
  console.log('Caught non-retryable error:', error.message);
});

// Test createError function
console.log('\nTesting createError function...');
const networkError = createError(new TypeError('fetch failed'), 'job service');
console.log('Network error:', networkError.message, networkError.code);

const httpError = createError({ status: 404, statusText: 'Not Found' }, 'candidate service');
console.log('HTTP error:', httpError.message, httpError.code);

const genericError = createError(new Error('Something went wrong'));
console.log('Generic error:', genericError.message, genericError.code);

console.log('\nAll tests completed!');