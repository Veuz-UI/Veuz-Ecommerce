'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/services/authService';
import { useToast } from '@/context/ToastContext';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryEmail = searchParams.get('email') || '';
  const queryOtp = searchParams.get('otp') || searchParams.get('token') || '';

  // Step state: 1 = Email, 2 = Confirm OTP, 3 = New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');

  // Password fields (Only accessible after OTP is confirmed)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & loaders
  const [loading, setLoading] = useState(false);
  const [isOtpSuccess, setIsOtpSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resend OTP countdown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  const { showToast } = useToast();

  // Initialize from search params
  useEffect(() => {
    if (queryEmail) {
      setEmail(queryEmail.trim());
      setStep(2);
    }
    if (queryOtp) {
      setOtp(queryOtp.trim());
    }
  }, [queryEmail, queryOtp]);

  // Handle countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // ==========================================
  // Step 1: Send OTP to User's Email
  // ==========================================
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      showToast('warning', 'Please enter a valid email address.', 'Invalid Email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await authService.forgotPassword(cleanEmail);
      setLoading(false);
      setStep(2);
      setResendCooldown(60);
      showToast('success', res?.message || `A 6-digit OTP code has been sent to ${cleanEmail}`, 'OTP Sent');
    } catch (err: any) {
      setLoading(false);
      const errMsg = err?.data?.message || err?.message || 'No account found with this email address. Please register first.';
      setError(errMsg);
      showToast('error', errMsg, 'Error Sending OTP');
    }
  };

  // ==========================================
  // Step 2: Confirm OTP Number
  // ==========================================
  const handleConfirmOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP sent to your email.');
      showToast('warning', 'Please enter the complete 6-digit OTP code.', 'Invalid OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await authService.verifyResetOtp(email.trim(), cleanOtp);
      setVerifiedToken(res?.resetToken || cleanOtp);
      setIsOtpSuccess(true);
      showToast('success', 'OTP confirmed successfully! Please enter your new password.', 'Verified');

      // Smooth transition to Step 3 so the customer sees the green verified badge
      setTimeout(() => {
        setLoading(false);
        setIsOtpSuccess(false);
        setStep(3);
      }, 450);
    } catch (err: any) {
      setLoading(false);
      setIsOtpSuccess(false);
      const errMsg = err?.data?.message || err?.message || 'Invalid or expired OTP code. Please check and try again.';
      setError(errMsg);
      showToast('error', errMsg, 'OTP Verification Failed');
    }
  };

  // ==========================================
  // Step 3: Set New Password & Confirm Password
  // ==========================================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('Please enter your new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password.length > 16) {
      setError('Password cannot exceed 16 characters.');
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

    if (!hasUpper || !hasLower || !hasNum || !hasSpecial) {
      setError('Password must include uppercase, lowercase, number, and special character.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      showToast('error', 'New password and confirm password do not match.', 'Password Mismatch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await authService.resetPassword({
        token: verifiedToken || otp.trim(),
        email: email.trim(),
        password,
      });

      setLoading(false);
      setSuccess(true);
      showToast('success', res?.message || 'Password successfully reset! A confirmation email has been dispatched.', 'Success');

      setTimeout(() => {
        router.push('/login');
      }, 2600);
    } catch (err: any) {
      setLoading(false);
      const errMsg = err?.data?.message || err?.message || 'Failed to reset password. Please request a new OTP.';
      setError(errMsg);
      showToast('error', errMsg, 'Reset Failed');
    }
  };

  // Password validation checklist
  const isLengthValid = password.length >= 8 && password.length <= 16;
  const isUpperValid = /[A-Z]/.test(password);
  const isLowerValid = /[a-z]/.test(password);
  const isNumValid = /\d/.test(password);
  const isSpecialValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  const isAllValid = isLengthValid && isUpperValid && isLowerValid && isNumValid && isSpecialValid;
  const isMatch = Boolean(password && confirmPassword && password === confirmPassword);

  return (
    <div className="forgot-page-wrapper">
      <div className="forgot-card-container">
        <div className="forgot-card-body" style={{ position: 'relative' }}>
          
          {/* Brand Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} title="Return to Store">
              <img
                src="/assets/imgs/theme/logo.jpg"
                alt="Veuz Safety Logo"
                width={140}
                height={42}
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          {/* Stepper Progress Indicator */}
          {!success && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: step >= 1 ? '#0f172a' : '#e2e8f0',
                  color: step >= 1 ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#0f172a' : '#64748b' }}>
                  Email
                </span>
              </div>

              <div style={{ width: '28px', height: '2px', backgroundColor: step >= 2 ? '#0f172a' : '#e2e8f0', transition: 'background-color 0.25s ease' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: step >= 2 ? '#0f172a' : '#e2e8f0',
                  color: step >= 2 ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}>
                  {step > 2 ? '✓' : '2'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#0f172a' : '#64748b' }}>
                  Confirm OTP
                </span>
              </div>

              <div style={{ width: '28px', height: '2px', backgroundColor: step >= 3 ? '#0f172a' : '#e2e8f0', transition: 'background-color 0.25s ease' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: step === 3 ? '#0f172a' : '#e2e8f0',
                  color: step === 3 ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}>
                  3
                </span>
                <span style={{ fontSize: '12px', fontWeight: step === 3 ? 700 : 500, color: step === 3 ? '#0f172a' : '#64748b' }}>
                  New Password
                </span>
              </div>
            </div>
          )}

          {/* Heading */}
          <h2 style={{ fontSize: '22px', fontWeight: '800', textAlign: 'center', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {success
              ? 'Password Updated!'
              : step === 1
              ? 'Reset Your Password'
              : step === 2
              ? 'Enter OTP Code'
              : 'Create New Password'}
          </h2>

          <p style={{ fontSize: '13.5px', color: '#64748b', textAlign: 'center', margin: '0 0 22px 0', lineHeight: '1.5' }}>
            {success
              ? 'Your account password has been updated securely. A confirmation email has been dispatched.'
              : step === 1
              ? 'Enter your registered email to receive a 6-digit confirmation OTP'
              : step === 2
              ? `We sent a 6-digit OTP code to ${email || 'your email'}`
              : 'Your OTP is confirmed. Please enter your new password below.'}
          </p>

          {/* Alert / Error Banner */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              textAlign: 'left',
              animation: 'veuzPageFadeIn 0.2s ease forwards'
            }}>
              <span style={{ fontSize: '16px', lineHeight: '1.2' }}>⚠️</span>
              <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: '1.4', flex: 1 }}>
                {error}{' '}
                {error.includes('register') && (
                  <Link href="/register" style={{ fontWeight: '700', color: '#0f172a', textDecoration: 'underline', marginLeft: '4px' }}>
                    Register here
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              SUCCESS STATE
              ======================================================== */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '12px 0 8px 0', animation: 'veuzPageFadeIn 0.3s ease forwards' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                border: '2px solid #86efac',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '28px',
                fontWeight: 800
              }}>
                ✓
              </div>

              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '8px', lineHeight: '1.6', fontWeight: 600 }}>
                Password changed successfully!
              </p>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                A confirmation email has been dispatched to <strong>{email}</strong>.
              </p>

              <Link
                href="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14.5px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'background-color 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                Sign In Now
              </Link>
            </div>
          ) : step === 1 ? (
            /* ========================================================
               STEP 1: ENTER EMAIL TO RECEIVE OTP
               ======================================================== */
            <form onSubmit={handleSendOtp} noValidate style={{ animation: 'veuzPageFadeIn 0.25s ease forwards' }}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    id="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 16px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: '600',
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !email.trim() ? 0.65 : 1,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'universalSpin 0.7s linear infinite'
                    }} />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send OTP Code</span>
                )}
              </button>
            </form>
          ) : step === 2 ? (
            /* ========================================================
               STEP 2: CONFIRM OTP NUMBER
               ======================================================== */
            <form onSubmit={handleConfirmOtp} noValidate style={{ animation: 'veuzPageFadeIn 0.25s ease forwards' }}>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px'
              }}>
                <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  Sent to: <strong>{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f172a',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '12.5px'
                  }}
                >
                  Change
                </button>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label htmlFor="otp" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px', textAlign: 'center' }}>
                  Enter 6-Digit Confirmation OTP
                </label>

                <div style={{ position: 'relative', maxWidth: '280px', margin: '0 auto' }}>
                  <input
                    type="text"
                    id="otp"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      if (error) setError(null);
                    }}
                    placeholder="• • • • • •"
                    style={{
                      width: '100%',
                      height: '52px',
                      padding: '0 16px',
                      fontSize: '26px',
                      fontWeight: 800,
                      letterSpacing: '10px',
                      textAlign: 'center',
                      borderRadius: '10px',
                      border: isOtpSuccess ? '2px solid #16a34a' : '2px solid #0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: isOtpSuccess ? '#16a34a' : '#0f172a',
                      backgroundColor: '#ffffff',
                      fontFamily: 'monospace',
                      transition: 'border-color 0.2s ease, color 0.2s ease'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.trim().length < 6 || isOtpSuccess}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: isOtpSuccess ? '#16a34a' : '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: '600',
                  cursor: loading || otp.trim().length < 6 || isOtpSuccess ? 'not-allowed' : 'pointer',
                  opacity: loading || otp.trim().length < 6 ? 0.65 : 1,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '14px'
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'universalSpin 0.7s linear infinite'
                    }} />
                    <span>Verifying OTP...</span>
                  </>
                ) : isOtpSuccess ? (
                  <>
                    <span style={{ fontSize: '16px' }}>✓</span>
                    <span>OTP Confirmed!</span>
                  </>
                ) : (
                  <span>Confirm OTP</span>
                )}
              </button>

              {/* Resend OTP Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading || isOtpSuccess}
                  onClick={() => handleSendOtp()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#94a3b8' : '#0f172a',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                    padding: '6px'
                  }}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Didn't receive code? Resend OTP"}
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================
               STEP 3: NEW PASSWORD & CONFIRM PASSWORD
               (APPEARS ONLY ONCE OTP NUMBER IS CONFIRMED)
               ======================================================== */
            <form onSubmit={handleResetPassword} noValidate style={{ animation: 'veuzPageFadeIn 0.35s ease forwards' }}>
              
              {/* Confirmed OTP Notice Banner */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#166534'
              }}>
                <span style={{ fontWeight: 800 }}>✓</span>
                <span>OTP Confirmed for <strong>{email}</strong></span>
              </div>

              {/* 1. New Password Input */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="new-password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter new password"
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 42px 0 16px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0f172a',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Properly Aligned Password Requirements Area */}
              <div style={{
                marginBottom: '18px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                boxSizing: 'border-box'
              }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px' }}>
                  Password requirements:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  {/* 1. Length */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12px',
                    color: isLengthValid ? '#16a34a' : '#64748b',
                    fontWeight: isLengthValid ? 600 : 500,
                    transition: 'color 0.15s ease'
                  }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: isLengthValid ? '#dcfce7' : '#e2e8f0',
                      color: isLengthValid ? '#16a34a' : '#94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}>
                      {isLengthValid ? '✓' : '•'}
                    </span>
                    <span>8-16 characters</span>
                  </div>

                  {/* 2. Uppercase */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12px',
                    color: isUpperValid ? '#16a34a' : '#64748b',
                    fontWeight: isUpperValid ? 600 : 500,
                    transition: 'color 0.15s ease'
                  }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: isUpperValid ? '#dcfce7' : '#e2e8f0',
                      color: isUpperValid ? '#16a34a' : '#94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}>
                      {isUpperValid ? '✓' : '•'}
                    </span>
                    <span>1 Uppercase (A-Z)</span>
                  </div>

                  {/* 3. Lowercase */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12px',
                    color: isLowerValid ? '#16a34a' : '#64748b',
                    fontWeight: isLowerValid ? 600 : 500,
                    transition: 'color 0.15s ease'
                  }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: isLowerValid ? '#dcfce7' : '#e2e8f0',
                      color: isLowerValid ? '#16a34a' : '#94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}>
                      {isLowerValid ? '✓' : '•'}
                    </span>
                    <span>1 Lowercase (a-z)</span>
                  </div>

                  {/* 4. Number & Symbol */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12px',
                    color: (isNumValid && isSpecialValid) ? '#16a34a' : '#64748b',
                    fontWeight: (isNumValid && isSpecialValid) ? 600 : 500,
                    transition: 'color 0.15s ease'
                  }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: (isNumValid && isSpecialValid) ? '#dcfce7' : '#e2e8f0',
                      color: (isNumValid && isSpecialValid) ? '#16a34a' : '#94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}>
                      {(isNumValid && isSpecialValid) ? '✓' : '•'}
                    </span>
                    <span>Number & symbol</span>
                  </div>
                </div>
              </div>

              {/* 2. Confirm Password Input */}
              <div style={{ marginBottom: '22px' }}>
                <label htmlFor="confirm-password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Re-type new password"
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 42px 0 16px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${confirmPassword ? (isMatch ? '#16a34a' : '#ef4444') : '#e2e8f0'}`,
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0f172a',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Match Status */}
                {confirmPassword && (
                  <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600, color: isMatch ? '#16a34a' : '#dc2626' }}>
                    {isMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || !isMatch || !isAllValid}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: '600',
                  cursor: loading || !password || !confirmPassword || !isMatch || !isAllValid ? 'not-allowed' : 'pointer',
                  opacity: loading || !password || !confirmPassword || !isMatch || !isAllValid ? 0.65 : 1,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'universalSpin 0.7s linear infinite'
                    }} />
                    <span>Saving New Password...</span>
                  </>
                ) : (
                  <span>Save New Password</span>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer Navigation */}
        <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#64748b', marginTop: '22px' }}>
          Remember your password?{' '}
          <Link href="/login" style={{ color: '#0f172a', fontWeight: '700', textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="forgot-page-wrapper">
        <div className="forgot-card-container">
          <div className="forgot-card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #0f172a',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'universalSpin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Loading Reset Password...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
