'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  sanitizeNumeric,
  handleNumericKeyDown,
  validateMobileNumber,
  validateFullName,
  validateEmailAddress,
  validatePasswordStrength,
} from '@/utils/securityValidation';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, isLoading } = useAuth();
  const { showToast } = useToast();

  // If user is already authenticated (or authenticates in another window), redirect immediately
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  // Scroll to top on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
      } catch (e) {}
    }
  }, []);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [mobileTouched, setMobileTouched] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Full Name Validation
  const validateName = (val: string): boolean => {
    const res = validateFullName(val, 'Full name', true);
    setNameError(res.valid ? null : res.error!);
    return res.valid;
  };

  // Email Validation (RFC-compliant)
  const validateEmail = (val: string): boolean => {
    const res = validateEmailAddress(val);
    setEmailError(res.valid ? null : res.error!);
    return res.valid;
  };

  // Mobile Number Validation (Numbers Only, 7-15 Digits)
  const validateMobile = (val: string): boolean => {
    const res = validateMobileNumber(val, true);
    setMobileError(res.valid ? null : res.error!);
    return res.valid;
  };

  // Password Strength Checkers
  const passwordChecks = validatePasswordStrength(password).checks;
  const isPasswordSecure = validatePasswordStrength(password).valid;
  const isPasswordsMatch = Boolean(confirmPassword.length > 0 && password.length > 0 && confirmPassword === password);
  const isPasswordsMismatch = Boolean(confirmPassword.length > 0 && password.length > 0 && confirmPassword !== password);

  // Password Validation
  const validatePassword = (val: string): boolean => {
    const res = validatePasswordStrength(val);
    setPasswordError(res.valid ? null : res.error!);
    return res.valid;
  };

  // Confirm Password Validation
  const validateConfirmPassword = (confirmVal: string, passVal: string): boolean => {
    if (!confirmVal) {
      setConfirmPasswordError('Please confirm your password.');
      return false;
    }
    if (confirmVal !== passVal) {
      setConfirmPasswordError("Passwords don't match.");
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailTouched(true);
    setMobileTouched(true);

    let hasError = false;

    const isNameValid = validateName(name);
    if (!isNameValid) hasError = true;

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) hasError = true;

    const isMobileValid = validateMobile(mobile);
    if (!isMobileValid) hasError = true;

    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) hasError = true;

    const isConfirmValid = validateConfirmPassword(confirmPassword, password);
    if (!isConfirmValid) hasError = true;

    if (!agreeTerms) {
      showToast('warning', 'Please agree to the Terms of Service and Privacy Policy to proceed.', 'Alert Message');
      return;
    }

    if (hasError) {
      showToast('danger', 'Please fix the errors in the form before proceeding.', 'Validation Error');
      return;
    }

    setLoading(true);
    const res = await register(name.trim(), email.trim(), password, confirmPassword, mobile.trim());
    setLoading(false);

    if (res.success) {
      showToast('success', res.message || 'Account created successfully! Please verify your email in your profile.', 'Account Created');
      if (typeof window !== 'undefined') {
        try {
          if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
          }
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        } catch (e) {}
      }
      // Customer registration complete -> redirect to home page
      router.push('/', { scroll: true });
    } else {
      showToast('danger', res.message || 'Registration failed. Please try again.', 'Error Message');
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-card-container">
        
        {/* Auth Card */}
        <div className="register-card-body">
          
          {/* Brand Logo */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <img
                src="/assets/imgs/theme/logo.jpg"
                alt="Veuz Safety Logo"
                width={140}
                height={44}
                style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center',
            color: '#0f172a',
            margin: '0 0 8px 0'
          }}>
            Create Customer Account
          </h2>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            textAlign: 'center',
            margin: '0 0 24px 0'
          }}>
            Join Veuz to shop certified safety &amp; PPE industrial equipment
          </p>

          {/* Security Notice */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: '12px',
            padding: '9px 14px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <span>Customer Portal. Admin accounts are invite-only by Super Admin.</span>
          </div>

            {/* Form with responsive 2-column desktop/tablet grid */}
            <form onSubmit={handleSubmit} noValidate className="register-form-grid">
              
              {/* Row 1 / Col 1: Full Name */}
              <div>
                <label htmlFor="name" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Enter name"
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: nameError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    backgroundColor: nameError ? '#fef2f2' : '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#0f172a',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease'
                  }}
                />
                {nameError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {nameError}
                  </div>
                )}
              </div>

              {/* Row 1 / Col 2: Email Address */}
              <div>
                <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Email Address <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailTouched) {
                      validateEmail(e.target.value);
                    }
                  }}
                  onBlur={() => {
                    setEmailTouched(true);
                    validateEmail(email);
                  }}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: emailError && emailTouched ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    backgroundColor: emailError && emailTouched ? '#fef2f2' : '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#0f172a',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease'
                  }}
                />
                {emailError && emailTouched && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {emailError}
                  </div>
                )}
              </div>

              {/* Row 2: Mobile Number (Numbers Only Validation) */}
              <div className="register-col-span-2">
                <label htmlFor="mobile" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Mobile Number <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '400' }}>(Numbers only)</span> <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="mobile"
                  required
                  value={mobile}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => {
                    const numeric = sanitizeNumeric(e.target.value);
                    setMobile(numeric);
                    if (mobileTouched) {
                      validateMobile(numeric);
                    }
                  }}
                  onBlur={() => {
                    setMobileTouched(true);
                    validateMobile(mobile);
                  }}
                  placeholder="e.g. 966501234567"
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: mobileError && mobileTouched ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    backgroundColor: mobileError && mobileTouched ? '#fef2f2' : '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#0f172a',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease'
                  }}
                />
                {mobileError && mobileTouched && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {mobileError}
                  </div>
                )}
              </div>

              {/* Row 3 / Col 1: Password */}
              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Password (min. 8 chars) <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    required
                    minLength={8}
                    maxLength={16}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                      if (confirmPassword) validateConfirmPassword(confirmPassword, e.target.value);
                    }}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 42px 0 14px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: passwordError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      backgroundColor: passwordError ? '#fef2f2' : '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0f172a',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: showPassword ? '#0f172a' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {passwordError}
                  </div>
                )}
              </div>

              {/* Row 3 / Col 2: Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Confirm Password <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    minLength={8}
                    maxLength={16}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError || isPasswordsMismatch) {
                        validateConfirmPassword(e.target.value, password);
                      }
                    }}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 42px 0 14px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: isPasswordsMismatch || confirmPasswordError
                        ? '1.5px solid #ef4444'
                        : isPasswordsMatch
                        ? '1.5px solid #16a34a'
                        : '1px solid #cbd5e1',
                      backgroundColor: isPasswordsMismatch || confirmPasswordError
                        ? '#fef2f2'
                        : isPasswordsMatch
                        ? '#f0fdf4'
                        : '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0f172a',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: showConfirmPassword ? '#0f172a' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {isPasswordsMatch && (
                  <div style={{ color: '#16a34a', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <span>✓</span> Passwords match
                  </div>
                )}
                {(isPasswordsMismatch || (confirmPasswordError && !isPasswordsMatch)) && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {confirmPasswordError || "Passwords don't match."}
                  </div>
                )}
              </div>

              {/* Real-time Password Security Checklist (Full Width Span 2 Across Form) */}
              {password.length > 0 && (
                <div
                  className="register-col-span-2"
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '2px',
                    marginBottom: '2px',
                    fontSize: '12.5px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#334155', fontSize: '13px' }}>Password Requirements:</span>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {Object.values(passwordChecks).filter(Boolean).length} of 5 completed
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '6px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.minLength ? '#16a34a' : '#64748b' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{passwordChecks.minLength ? '✓' : '•'}</span>
                      <span>Between 8 and 16 characters</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.hasUpper ? '#16a34a' : '#64748b' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{passwordChecks.hasUpper ? '✓' : '•'}</span>
                      <span>At least one uppercase letter (A-Z)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.hasLower ? '#16a34a' : '#64748b' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{passwordChecks.hasLower ? '✓' : '•'}</span>
                      <span>At least one lowercase letter (a-z)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.hasNumber ? '#16a34a' : '#64748b' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{passwordChecks.hasNumber ? '✓' : '•'}</span>
                      <span>At least one numeric digit (0-9)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.hasSpecial ? '#16a34a' : '#64748b' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{passwordChecks.hasSpecial ? '✓' : '•'}</span>
                      <span>At least one special symbol (!@#$%^&*...)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms and Privacy Policy (Span 2) */}
              <div className="register-col-span-2" style={{ marginTop: '6px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  color: '#334155',
                  userSelect: 'none',
                  lineHeight: '1.4'
                }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#0f172a',
                      cursor: 'pointer',
                      margin: 0,
                      flexShrink: 0
                    }}
                  />
                  <span>
                    I agree to the <Link href="#" style={{ color: '#0f172a', fontWeight: '600', textDecoration: 'underline' }}>Terms of Service</Link> and <Link href="#" style={{ color: '#0f172a', fontWeight: '600', textDecoration: 'underline' }}>Privacy Policy</Link> <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </span>
                </label>
              </div>

              {/* Submit Button (Span 2) */}
              <div className="register-col-span-2" style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    letterSpacing: '-0.01em',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* Footer Link */}
          <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#64748b', marginTop: '22px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#0f172a', fontWeight: '700', textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>

      </div>
    </div>
  );
}
