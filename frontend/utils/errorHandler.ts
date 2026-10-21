
import axios from 'axios';

/**
 * Parses an error of unknown type and returns a user-friendly message.
 * It specifically handles Axios errors and Firebase Auth errors to provide more context.
 * @param error The error object, which can be of any type.
 * @returns A user-friendly error message string.
 */
export function getErrorMessage(error: any): string {
  // --- Firebase Auth Errors ---
  if (error.code) {
    switch (error.code) {
      case 'auth/invalid-phone-number':
        return 'The phone number you entered is invalid. Please check and try again.';
      case 'auth/code-expired':
        return 'The verification code has expired. Please request a new one.';
      case 'auth/invalid-verification-code':
        return 'The verification code is incorrect. Please double-check the code.';
      case 'auth/too-many-requests':
        return 'You have sent too many requests. Please wait a while before trying again.';
      case 'auth/network-request-failed':
        return 'Could not connect to Firebase. Please check your internet connection.';
      // Add other specific Firebase error codes here
    }
  }

  // --- Axios Network & Server Errors ---
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Unable to connect to the server. Please ensure your backend is running and you have configured the correct IP address for development.';
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail; // Use backend-provided error message
    }
    return `An unexpected server error occurred (Status: ${error.response?.status}).`;
  }

  // --- Standard JavaScript Errors ---
  if (error instanceof Error) {
    return error.message;
  }

  // --- Fallback for any other type of error ---
  return 'An unexpected error occurred. Please try again.';
}
