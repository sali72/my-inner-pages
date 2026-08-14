/**
 * Handle API errors consistently across the application
 */
export const handleApiError = (error: unknown, fallbackMessage: string): string => {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.detail === 'string') return errObj.detail;
    if (typeof errObj.message === 'string') return errObj.message;
  }
  
  return fallbackMessage;
};

/**
 * Format error for user display
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Remove technical details for user-friendly message
    return error.message.replace(/^Error:\s*/i, '');
  }
  
  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.detail === 'string') return errObj.detail.replace(/^Error:\s*/i, '');
    if (typeof errObj.message === 'string') return errObj.message.replace(/^Error:\s*/i, '');
  }
  
  return 'An unexpected error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('connection')
    );
  }
  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('401') ||
      error.message.includes('unauthorized') ||
      error.message.includes('authentication')
    );
  }
  return false;
};
