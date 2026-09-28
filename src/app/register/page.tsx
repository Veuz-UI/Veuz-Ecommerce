'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email Validation (RFC-compliant)
  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address (e.g. name@example.com).');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Mobile Number Validation
  const validateMobile = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setMobileError('Mobile number is required.');
      return false;
    }
    const digits = trimmed.replace(/\D/g, '');
    const phoneFormatRegex = /^(\+?[0-9]{1,4}[\s-]?)?(\(?\d{1,4}\)?[\s-]?)?[\d\s-]{6,15}$/;
    if (digits.length < 7 || digits.length > 15 || !phoneFormatRegex.test(trimmed)) {
      setMobileError('Please enter a valid mobile number (e.g. +966 50 123 4567 or 0501234567).');
      return false;
    }
    setMobileError(null);
    return true;
  };

  // Password Validation
  const validatePassword = (val: string): boolean => {
    if (!val || val.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return false;
    }
    setPasswordError(null);
    return true;
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
    setErrorMsg(null);

    setEmailTouched(true);
    setMobileTouched(true);

    let hasError = false;

    if (!name.trim()) {
      setNameError('Full name is required.');
      hasError = true;
    } else {
      setNameError(null);
    }

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) hasError = true;

    const isMobileValid = validateMobile(mobile);
    if (!isMobileValid) hasError = true;

    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) hasError = true;

    const isConfirmValid = validateConfirmPassword(confirmPassword, password);
    if (!isConfirmValid) hasError = true;

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    if (hasError) return;

    setLoading(true);
    const res = await register(name.trim(), email.trim(), password, confirmPassword, mobile.trim());
    setLoading(false);

    if (res.success) {
      // Customer registration complete -> redirect to home page
      router.push('/');
    } else {
      setErrorMsg(res.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Responsive Card Container */
        .register-card-container {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          transition: max-width 0.25s ease;
        }

        .register-card-body {
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          padding: 32px 24px;
          transition: padding 0.25s ease;
        }

        .register-form-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Desktop, Laptop, and Tablet screens (>= 768px):
           Use spacious width and 2-input row grid */
        @media (min-width: 768px) {
          .register-card-container {
            max-width: 760px !important;
          }

          .register-card-body {
            padding: 40px 44px !important;
          }

          .register-form-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            column-gap: 22px !important;
            row-gap: 18px !important;
          }

          .register-col-span-2 {
            grid-column: 1 / -1 !important;
          }
        }

        /* Mobile screens (< 768px): Keep strictly 1 column stacked layout */
        @media (max-width: 767px) {
          .register-card-container {
            max-width: 100% !important;
          }

          .register-card-body {
            padding: 26px 18px !important;
          }

          .register-form-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
        }
      `}} />

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div className="register-card-container">
          
          {/* Auth Card */}
          <div className="register-card-body">
            
            {/* Brand Logo */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <img
                  src="/assets/imgs/theme/logo.jpg"
                  alt="Veuz Safety Logo"
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
              <i className="fi fi-rs-shield-check" style={{ fontSize: '15px' }}></i>
              <span>Customer Portal. Admin accounts are invite-only by Super Admin.</span>
            </div>

            {/* Form Top Error Message */}
            {errorMsg && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fi fi-rs-exclamation" style={{ fontSize: '15px' }}></i>
                <span>{errorMsg}</span>
              </div>
            )}

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
                  placeholder="Nabeel Khan"
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

              {/* Row 2: Mobile Number (Full Width / Span 2) */}
              <div className="register-col-span-2">
                <label htmlFor="mobile" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Mobile Number <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="tel"
                  id="mobile"
                  required
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (mobileTouched) {
                      validateMobile(e.target.value);
                    }
                  }}
                  onBlur={() => {
                    setMobileTouched(true);
                    validateMobile(mobile);
                  }}
                  placeholder="+966 50 123 4567 or 0501234567"
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
                      color: showPassword ? '#2563eb' : '#94a3b8',
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
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) validateConfirmPassword(e.target.value, password);
                    }}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 42px 0 14px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: confirmPasswordError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      backgroundColor: confirmPasswordError ? '#fef2f2' : '#ffffff',
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
                      color: showConfirmPassword ? '#2563eb' : '#94a3b8',
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
                {confirmPasswordError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {confirmPasswordError}
                  </div>
                )}
              </div>

              {/* Terms and Privacy Policy (Span 2) */}
              <div className="register-col-span-2" style={{ marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <span>
                    I agree to the <Link href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Terms of Service</Link> and <Link href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Privacy Policy</Link> <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </span>
                </label>
              </div>

              {/* Submit Button (Span 2) */}
              <div className="register-col-span-2" style={{ marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
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
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </>
  );
}
