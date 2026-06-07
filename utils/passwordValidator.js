/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one number
 * - At least one special character
 * - At least one uppercase letter
 */
export function validatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character (!@#$%^&* etc)");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
