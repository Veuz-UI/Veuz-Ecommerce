'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  fetchLoginSetup,
  getCachedLoginSetup,
  LOGIN_SETUP_EVENT,
  LoginSetupData,
  DEFAULT_LOGIN_SETUP,
} from '@/services/loginSetupService';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectTarget = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';

  const { login, user, isLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Login Slider Setup state
  const [setupData, setSetupData] = useState<LoginSetupData>(DEFAULT_LOGIN_SETUP);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);

  // Load Setup from Local Cache & API
  useEffect(() => {
    const cached = getCachedLoginSetup();
    if (cached && Array.isArray(cached.slides) && cached.slides.length > 0) {
      setSetupData(cached);
    }

    fetchLoginSetup().then((data) => {
      if (data && Array.isArray(data.slides) && data.slides.length > 0) {
        setSetupData(data);
      }
    });

    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail.slides)) {
        setSetupData(customEvent.detail);
      }
    };

    window.addEventListener(LOGIN_SETUP_EVENT, handleUpdated);
    return () => window.removeEventListener(LOGIN_SETUP_EVENT, handleUpdated);
  }, []);

  // Maximum 4 slides enforced
  const activeSlides = (setupData.slides && setupData.slides.length > 0 ? setupData.slides : DEFAULT_LOGIN_SETUP.slides).slice(0, 4);
  const safeSlideIdx = activeSlideIdx < activeSlides.length ? activeSlideIdx : 0;
  const currentSlide = activeSlides[safeSlideIdx] || activeSlides[0];
  const slideDuration = setupData.autoSlideInterval || 5000;

  // Auto-slide ticker with smooth progress fill
  useEffect(() => {
    if (activeSlides.length <= 1) return;

    let start = Date.now();
    const interval = 50; // 50ms tick for smooth progress bar fill

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / slideDuration) * 100);
      setSlideProgress(pct);

      if (elapsed >= slideDuration) {
        start = Date.now();
        setSlideProgress(0);
        setActiveSlideIdx((prev) => (prev + 1) % activeSlides.length);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [activeSlides.length, slideDuration, safeSlideIdx]);

  const handleSelectSlide = (idx: number) => {
    setActiveSlideIdx(idx);
    setSlideProgress(0);
  };

  // If user is already authenticated (or authenticates in another window), redirect immediately
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.replace('/dashboard');
      } else {
        router.replace(redirectTarget);
      }
    }
  }, [user, isLoading, router, redirectTarget]);

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
    setEmailTouched(true);

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      showToast('warning', 'Please enter a valid email address.', 'Alert Message');
      return;
    }

    if (!password || password.trim() === '') {
      showToast('danger', 'Please enter your password.', 'Error Message');
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
      showToast('success', `Welcome back, ${res.user.name || 'User'}!`, 'Successfully Message');
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
        router.push(redirectTarget, { scroll: true });
      }
    } else {
      showToast('danger', res.message || 'Invalid email or password.', 'Error Message');
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-split-card">
        {/* Left Side: Dynamic Auto Slide Carousel (Max 4 Slides) with Smooth Cross-Fade */}
        <div className="auth-visual-panel">
          {/* Stacked Slide Layers for Ultra-Smooth Dissolve / Cross-Fade */}
          <div className="auth-slides-container">
            {activeSlides.map((slide, idx) => {
              const isActive = idx === safeSlideIdx;
              return (
                <div
                  key={slide.id || idx}
                  className={`auth-slide-layer ${isActive ? 'is-active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <img
                    src={slide.image}
                    alt={slide.caption ? slide.caption.slice(0, 30) : 'Veuz Store'}
                    className="auth-hero-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/imgs/theme/placeholder.svg';
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Story Indicator Bars (Max 4 Bars) with Live Progress */}
          <div className="auth-story-bars">
            {activeSlides.map((slide, i) => {
              let fillWidth = '0%';
              if (i < safeSlideIdx) fillWidth = '100%';
              else if (i === safeSlideIdx) fillWidth = `${slideProgress}%`;

              return (
                <button
                  key={slide.id || i}
                  type="button"
                  onClick={() => handleSelectSlide(i)}
                  className="auth-story-bar-btn"
                  aria-label={`Jump to slide ${i + 1}`}
                  title={`View slide ${i + 1}`}
                >
                  <span
                    className="auth-story-bar-fill"
                    style={{ width: fillWidth }}
                  />
                </button>
              );
            })}
          </div>

          {/* Bottom Gradient Overlay & Smooth Cross-Fading 3-Line Maximum Caption Text */}
          <div className="auth-visual-overlay">
            <div className="auth-captions-wrapper">
              {activeSlides.map((slide, idx) => {
                const isActive = idx === safeSlideIdx;
                return (
                  <p
                    key={slide.id || idx}
                    className={`auth-visual-caption ${isActive ? 'is-active' : ''}`}
                  >
                    {slide.caption || 'Veuz is an online fashion store that provides a variety of clothes, shoes, bags, and accessories for men and women.'}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Account Sign In Form with Company Logo */}
        <div className="auth-form-panel">
          {/* Top Header Row with Company Logo and Close Button */}
          <div className="auth-header-row">
            <Link href="/" className="auth-brand-logo-link" title="Return to Store">
              <img
                src="/assets/imgs/theme/logo.jpg"
                alt="Logo"
                width={140}
                height={42}
                className="auth-company-logo"
              />
            </Link>

            <Link href="/" className="auth-close-btn" aria-label="Close and return to store" title="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Link>
          </div>

          {/* Form Body */}
          <div className="auth-form-body">
            <h1 className="auth-heading">Welcome Back!</h1>
            <p className="auth-subheading">Enter your account credentials to access your store profile</p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <div className="auth-field-group">
                <label htmlFor="email" className="auth-label">
                  Email
                </label>
                <div className="auth-input-wrap">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailTouched) validateEmail(e.target.value);
                    }}
                    onBlur={() => {
                      setEmailTouched(true);
                      validateEmail(email);
                    }}
                    placeholder="name@example.com"
                    className={`auth-input ${emailError && emailTouched ? 'has-error' : ''}`}
                  />
                </div>
                {emailError && emailTouched && (
                  <div className="auth-error-text">
                    <span>⚠️</span> {emailError}
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="auth-field-group">
                <div className="auth-password-header">
                  <label htmlFor="password" className="auth-label" style={{ margin: 0 }}>
                    Password
                  </label>
                  <Link href="/forgot-password" className="auth-forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="auth-input with-eye"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-eye-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      /* Eye-off Icon matching reference */
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      /* Eye Icon matching reference */
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="auth-btn-spinner" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer Prompt */}
          <div className="auth-footer-prompt">
            Don't have an account?{' '}
            <Link
              href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
              className="auth-footer-link"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }} />}>
      <LoginForm />
    </Suspense>
  );
}
