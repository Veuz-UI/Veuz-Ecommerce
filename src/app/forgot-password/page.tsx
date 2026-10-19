'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import authService from '@/services/authService';
import { useToast } from '@/context/ToastContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('warning', 'Please enter a valid email address.', 'Alert Message');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setLoading(false);
      setSubmitted(true);
      showToast('success', 'Password reset instructions have been sent to your email.', 'Successfully Message');
    } catch (err) {
      setLoading(false);
      setSubmitted(true);
      showToast('success', 'Password reset instructions have been sent to your email.', 'Successfully Message');
    }
  };

  return (
    <div className="forgot-page-wrapper">
      <div className="forgot-card-container">
        
        <div className="forgot-card-body">
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <img
                src="/assets/imgs/theme/logo.jpg"
                alt="Veuz Safety Logo"
                width={140}
                height={42}
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', color: '#0f172a', margin: '0 0 8px 0' }}>
            Reset Password
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '0 0 24px 0' }}>
            Enter your email and we will send you a secure one-time reset link
          </p>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '22px'
              }}>
                ✓
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Check Your Email</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
                If an account exists with <strong>{email}</strong>, we have dispatched a password reset link. The link expires in 30 minutes.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'background-color 0.2s ease'
                }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '22px' }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    color: '#0f172a'
                  }}
                />
              </div>

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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

        </div>

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
