/**
 * System-Wide Security and Form Validation Utility
 * Standardizes security rules across Front-end components.
 */

export interface PasswordStrengthResult {
  valid: boolean;
  error?: string;
  checks: {
    minLength: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Strips all non-digit characters from an input string (Numbers only)
 */
export function sanitizeNumeric(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Prevent non-numeric key presses on phone/mobile input fields
 */
export function handleNumericKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
  // Allow standard control keys (backspace, delete, tab, enter, arrow keys, copy/paste)
  if (
    ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) ||
    (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) ||
    (e.metaKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
  ) {
    return;
  }
  // Block any non-numeric key
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Validates a mobile/phone number
 * Requires strictly numbers, 7 to 15 digits (standard E.164 without symbols)
 */
export function validateMobileNumber(value: string, required: boolean = true): { valid: boolean; error?: string } {
  const digits = sanitizeNumeric(value);
  if (!digits) {
    if (required) {
      return { valid: false, error: 'Mobile number is required.' };
    }
    return { valid: true };
  }

  if (digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      error: 'Please enter a valid mobile number (7 to 15 digits, numbers only).',
    };
  }

  return { valid: true };
}

/**
 * Validates a name (Full Name, First Name, Last Name)
 * Must be 2-60 characters, letters and spaces only, no scripts or symbols
 */
export function validateFullName(name: string, fieldLabel: string = 'Name', required: boolean = true): { valid: boolean; error?: string } {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    if (required) {
      return { valid: false, error: `${fieldLabel} is required.` };
    }
    return { valid: true };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldLabel} must be at least 2 characters.` };
  }

  if (trimmed.length > 60) {
    return { valid: false, error: `${fieldLabel} cannot exceed 60 characters.` };
  }

  // Letters (including international letters), spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\u0600-\u06FF\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldLabel} can only contain letters, spaces, and hyphens.` };
  }

  return { valid: true };
}

/**
 * Validates an email address against RFC standards
 */
export function validateEmailAddress(email: string): { valid: boolean; error?: string } {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Email address is required.' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed) || trimmed.length > 100) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }

  return { valid: true };
}

/**
 * Evaluates password strength against high-security requirements
 * Minimum 8 characters, maximum 16 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const val = password || '';
  const checks = {
    minLength: val.length >= 8 && val.length <= 16,
    hasLower: /[a-z]/.test(val),
    hasUpper: /[A-Z]/.test(val),
    hasNumber: /\d/.test(val),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(val),
  };

  const valid =
    checks.minLength &&
    checks.hasLower &&
    checks.hasUpper &&
    checks.hasNumber &&
    checks.hasSpecial;

  let error: string | undefined;
  if (!valid) {
    if (val.length < 8) {
      error = 'Password must be at least 8 characters long.';
    } else if (val.length > 16) {
      error = 'Password cannot exceed 16 characters (maximum 16 characters).';
    } else if (!checks.hasLower) {
      error = 'Password must contain at least one lowercase letter (a-z).';
    } else if (!checks.hasUpper) {
      error = 'Password must contain at least one uppercase letter (A-Z).';
    } else if (!checks.hasNumber) {
      error = 'Password must contain at least one numeric character (0-9).';
    } else if (!checks.hasSpecial) {
      error = 'Password must contain at least one special character (!@#$%^&*...).';
    }
  }

  return { valid, error, checks };
}
