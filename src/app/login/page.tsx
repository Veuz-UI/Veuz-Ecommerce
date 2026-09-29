'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore remembered credentials on initial mount and scroll to top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
      } catch (e) {}

      const isRemembered = localStorage.getItem('veuz_remember_me') === 'true';
      const savedEmail = localStorage.getItem('veuz_remembered_email');
      if (isRemembered && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  // Standard RFC-compliant email regex validation
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailTouched(true);

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return;
    }

    if (!password || password.trim() === '') {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    // Save or clear Remember Me in localStorage
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem('veuz_remember_me', 'true');
        localStorage.setItem('veuz_remembered_email', email.trim());
      } else {
        localStorage.removeItem('veuz_remember_me');
        localStorage.removeItem('veuz_remembered_email');
      }
    }

    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success && res.user) {
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
      // Role-based smart redirection
      if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
        router.push('/dashboard', { scroll: true });
      } else {
        router.push('/', { scroll: true });
      }
    } else {
      setErrorMsg(res.message || 'Invalid email or password.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Auth Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          padding: '36px 32px'
        }}>
          
          {/* Brand Logo */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <img
                src="/assets/imgs/theme/logo.jpg"
                alt="Veuz Safety Logo"
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          <h2 style={{
            fontSize: '22px',
            fontWeight: '700',
            textAlign: 'center',
            color: '#0f172a',
            margin: '0 0 8px 0'
          }}>
            Welcome Back
          </h2>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            textAlign: 'center',
            margin: '0 0 24px 0'
          }}>
            Enter your credentials to access your account
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '13px',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fi fi-rs-exclamation" style={{ fontSize: '15px' }}></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Email Address
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
                onBlur={(e) => {
                  setEmailTouched(true);
                  validateEmail(e.target.value);
                }}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: emailError && emailTouched ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#0f172a',
                  backgroundColor: emailError && emailTouched ? '#fef2f2' : '#ffffff',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease'
                }}
              />
              {emailError && emailTouched && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚠️</span> {emailError}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="password" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                  Reset password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 42px 0 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#0f172a',
                    transition: 'border-color 0.15s ease'
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
                    /* Eye-off Icon */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    /* Eye Icon */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '44px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>

        {/* Footer Link */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
          New here?{' '}
          <Link href="/register" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
            Create Customer Account
          </Link>
        </p>

      </div>
    </div>
  );
}
