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
        
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          padding: '36px 32px'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <img
                src="/assets/imgs/theme/logo.jpg"
                alt="Veuz Safety Logo"
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
                  padding: '10px 24px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
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
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
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
                  height: '44px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
          Remember your password?{' '}
          <Link href="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
