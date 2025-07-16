import { AuthError } from "@supabase/supabase-js";

export interface AuthValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSignUpForm = (data: {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  password: string;
  confirmPassword: string;
}): AuthValidationResult => {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!data.firstName.trim()) {
    errors.firstName = "First name is required";
  }
  
  if (!data.lastName.trim()) {
    errors.lastName = "Last name is required";
  }
  
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  
  // Password validation
  if (!data.password) {
    errors.password = "Password is required";
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Show first error
    }
  }
  
  // Confirm password
  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSignInForm = (data: {
  email: string;
  password: string;
}): AuthValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  
  if (!data.password) {
    errors.password = "Password is required";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case "Invalid login credentials":
      return "The email or password you entered is incorrect. Please check your credentials and try again.";
    case "User already registered":
      return "An account with this email already exists. Please sign in instead.";
    case "Email not confirmed":
      return "Please check your email and click the confirmation link before signing in.";
    case "Too many requests":
      return "Too many login attempts. Please wait a moment before trying again.";
    case "Signup disabled":
      return "New account registration is currently disabled. Please contact support.";
    case "Invalid email":
      return "Please enter a valid email address.";
    case "Password too short":
      return "Password must be at least 8 characters long.";
    case "Weak password":
      return "Password is too weak. Please use a stronger password with uppercase, lowercase, numbers, and special characters.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
};

export const passwordStrengthScore = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  if (score < 3) {
    return { score, label: "Weak", color: "text-red-500" };
  } else if (score < 5) {
    return { score, label: "Medium", color: "text-yellow-500" };
  } else {
    return { score, label: "Strong", color: "text-green-500" };
  }
};