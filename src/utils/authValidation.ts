const PHONE_PATTERN = /^\d{10}$/;

export interface LoginErrors { phoneNumber?: string; password?: string }
export interface SignupErrors extends LoginErrors { username?: string; confirmPassword?: string }

export function validateLogin(phoneNumber: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (!phoneNumber.trim()) errors.phoneNumber = 'Phone number is required.';
  else if (!PHONE_PATTERN.test(phoneNumber.trim())) errors.phoneNumber = 'Enter a valid 10-digit phone number.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function validateSignup(username: string, phoneNumber: string, password: string, confirmPassword: string): SignupErrors {
  const errors: SignupErrors = validateLogin(phoneNumber, password);
  if (username.trim().length < 2) errors.username = 'Enter your full name.';
  if (password && password.length < 8) errors.password = 'Use at least 8 characters.';
  if (!confirmPassword) errors.confirmPassword = 'Confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}
