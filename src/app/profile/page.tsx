'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import authService from '@/services/authService';
import { validateImageFile, compressImage } from '@/utils/imageSecurity';
import {
  sanitizeNumeric,
  handleNumericKeyDown,
  validateMobileNumber,
  validateFullName,
  validateEmailAddress,
} from '@/utils/securityValidation';
import { ProfileSkeleton } from '@/components/ui/skeletons';

const COUNTRIES = [
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Kuwait', flag: '🇰🇼' },
  { name: 'Bahrain', flag: '🇧🇭' },
  { name: 'Oman', flag: '🇴🇲' },
  { name: 'Jordan', flag: '🇯🇴' },
  { name: 'Egypt', flag: '🇪🇬' },
  { name: 'Iraq', flag: '🇮🇶' },
  { name: 'Lebanon', flag: '🇱🇧' },
  { name: 'Yemen', flag: '🇾🇪' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'China', flag: '🇨🇳' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Thailand', flag: '🇹🇭' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Ethiopia', flag: '🇪🇹' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'New Zealand', flag: '🇳🇿' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, isAdmin, isLoading, updateUserProfile, changeUserPassword, deleteUserAccount, verifyUserEmail } = useAuth();
  const { showToast } = useToast();

  // Helper to convert date strings (ISO, dd/mm/yyyy, or yyyy-mm-dd) into standard HTML input date format YYYY-MM-DD
  const formatToDateInput = (val?: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (trimmed.includes('T')) return trimmed.split('T')[0];
    const parts = trimmed.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return trimmed;
  };

  const isAdminRole = user?.role === 'ADMIN';
  const isSuperAdminRole = user?.role === 'SUPER_ADMIN';
  const isEmailReadOnly = (isAdminRole && !isSuperAdminRole) || !!user?.isEmailVerified;

  // Tab State: basic-info | password-change | address-setup | account-settings | delete-account
  const [activeTab, setActiveTab] = useState<'basic-info' | 'password-change' | 'address-setup' | 'account-settings' | 'delete-account'>('basic-info');
  const tabListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active tab smoothly into view on mobile
  useEffect(() => {
    if (tabListRef.current) {
      const activeEl = tabListRef.current.querySelector('.profile-tab-btn.active') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab]);

  // Sync tab with URL hash (#settings, #password, etc.) or query (?tab=settings)
  useEffect(() => {
    const handleUrlTab = () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash.toLowerCase().replace('#', '').trim();
      const params = new URLSearchParams(window.location.search);
      const tabParam = (params.get('tab') || '').toLowerCase().trim();

      const target = hash || tabParam;
      if (!target) return;

      if (
        target === 'settings' ||
        target === 'account-settings' ||
        target === 'account' ||
        target === 'notifications' ||
        target === 'notification'
      ) {
        setActiveTab('account-settings');
      } else if (target === 'password' || target === 'password-change' || target === 'security') {
        setActiveTab('password-change');
      } else if (target === 'address' || target === 'address-setup' || target === 'location') {
        if (!isAdminRole && !isSuperAdminRole) {
          setActiveTab('address-setup');
        }
      } else if (target === 'basic' || target === 'basic-info' || target === 'profile') {
        setActiveTab('basic-info');
      } else if (target === 'delete' || target === 'delete-account') {
        if (!isAdminRole && !isSuperAdminRole) {
          setActiveTab('delete-account');
        }
      }
    };

    handleUrlTab();
    window.addEventListener('hashchange', handleUrlTab);
    window.addEventListener('popstate', handleUrlTab);

    return () => {
      window.removeEventListener('hashchange', handleUrlTab);
      window.removeEventListener('popstate', handleUrlTab);
    };
  }, [isAdminRole, isSuperAdminRole]);

  // Admin and Super Admin do not need Location (Address Setup) or Delete Account
  useEffect(() => {
    if ((isAdminRole || isSuperAdminRole) && (activeTab === 'address-setup' || activeTab === 'delete-account')) {
      setActiveTab('basic-info');
    }
  }, [isAdminRole, isSuperAdminRole, activeTab]);

  // Basic Info Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  // Date of Birth must strictly be at least 12 years ago (minimum 12 years old)
  const maxAllowedDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 12);
    return d.toISOString().split('T')[0];
  }, []);
  const [gender, setGender] = useState('Prefer not to say');
  const fallbackAvatar = 'https://api.dicebear.com/7.x/initials/svg?seed=User';
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar || (user?.name ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}` : fallbackAvatar)
  );
  const [emailChangedWarning, setEmailChangedWarning] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Address Setup State
  const [country, setCountry] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [buildingNo, setBuildingNo] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Account Settings State
  const [language, setLanguage] = useState('English (US)');
  const [timezone, setTimezone] = useState('GMT+03:00 (Riyadh, Saudi Arabia)');
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);

  // Delete Account Confirmation State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Email Verification 2-Minute Cooldown & State
  const [verifyCooldown, setVerifyCooldown] = useState<number>(0);
  const [verifySending, setVerifySending] = useState(false);
  const [verifySentOnce, setVerifySentOnce] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedOtpIdx, setFocusedOtpIdx] = useState<number | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isVerifySuccess, setIsVerifySuccess] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [verifyCodeError, setVerifyCodeError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Smooth close modal with fade-out animation
  const handleCloseVerifyModal = () => {
    if (isVerifySuccess || isModalClosing) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setShowVerifyModal(false);
      setIsModalClosing(false);
      setVerifyCodeError(null);
      setResendNotice(null);
    }, 280);
  };

  // Lock body scroll when verification modal is open (covers header and prevents background scroll)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (showVerifyModal) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [showVerifyModal]);

  // Focus first OTP box whenever modal opens
  useEffect(() => {
    if (showVerifyModal) {
      setIsVerifySuccess(false);
      setIsModalClosing(false);
      setVerifyCodeError(null);
      setResendNotice(null);
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showVerifyModal]);

  // Load remaining 2-minute cooldown from localStorage if active
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = user?.id ? `veuz_verify_cooldown_${user.id}` : 'veuz_verify_cooldown';
    const savedExpiry = localStorage.getItem(storageKey);
    if (savedExpiry) {
      const remaining = Math.max(0, Math.ceil((parseInt(savedExpiry, 10) - Date.now()) / 1000));
      if (remaining > 0) {
        setVerifyCooldown(remaining);
        setVerifySentOnce(true);
      } else {
        localStorage.removeItem(storageKey);
        setVerifySentOnce(true);
      }
    }
  }, [user?.id]);

  // Countdown timer tick every 1 second
  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const timer = setInterval(() => {
      setVerifyCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (typeof window !== 'undefined') {
            const storageKey = user?.id ? `veuz_verify_cooldown_${user.id}` : 'veuz_verify_cooldown';
            localStorage.removeItem(storageKey);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verifyCooldown, user?.id]);

  // Auto-sync verification status when user returns to profile tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkVerificationStatus = () => {
      if (user && !user.isEmailVerified) {
        authService.getMe().then((res) => {
          if (res?.success && res.user?.isEmailVerified) {
            setUser(res.user);
            localStorage.setItem('veuz_user', JSON.stringify(res.user));
            showToast('Congratulations! Your email address has been verified.', 'success');
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', checkVerificationStatus);
    return () => window.removeEventListener('focus', checkVerificationStatus);
  }, [user, setUser, showToast]);

  // UI Feedback State
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close country dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Populate form with current user details
  useEffect(() => {
    if (user) {
      const parts = (user.name || '').trim().split(' ');
      setFirstName(user.firstName || parts[0] || '');
      setLastName(user.lastName || parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.mobile || '');
      setAlternatePhone(user.alternatePhone || '');
      setDateOfBirth(formatToDateInput(user.dateOfBirth));
      const safeAvatar = user.avatar && (!user.avatar.startsWith('data:image/') || user.avatar.length > 250)
        ? user.avatar
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
      setAvatarPreview(safeAvatar);

      if (user.address) {
        setCountry(user.address.country || '');
        setCity(user.address.city || '');
        setStreetAddress(user.address.streetAddress || '');
        setZipCode(user.address.zipCode || '');
        setBuildingNo(user.address.buildingNo || '');
      }

      if (user.settings) {
        setLanguage(user.settings.language || 'English (US)');
        setTimezone(user.settings.timezone || 'GMT+03:00 (Riyadh, Saudi Arabia)');
        if (user.settings.emailNotif !== undefined) setEmailNotif(user.settings.emailNotif);
        if (user.settings.smsNotif !== undefined) setSmsNotif(user.settings.smsNotif);
        if (user.settings.promoNotif !== undefined) setPromoNotif(user.settings.promoNotif);
      }
    }
  }, [user]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
      } catch (e) {}
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // Auto-detect country from IP when address tab opens (if no saved address)
  useEffect(() => {
    if (activeTab !== 'address-setup') return;
    if (user?.address?.country) return; // already have saved address
    if (country) return; // already set

    const detectCountryFromIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const data = await res.json();
        if (data.country_name) {
          setCountry(data.country_name);
        }
        if (data.city && !city) {
          setCity(data.city);
        }
      } catch {
        // Silently fail — user can still manually set or use GPS button
      }
    };

    detectCountryFromIP();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Use GPS + Nominatim reverse geocoding
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeolocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('Geocoding failed');
          const data = await res.json();
          const addr = data.address || {};

          // Country
          if (addr.country) setCountry(addr.country);

          // City: try multiple fields Nominatim can return
          const detectedCity =
            addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || '';
          if (detectedCity) setCity(detectedCity);

          // Street Address
          const streetParts = [
            addr.road || addr.pedestrian || addr.footway || '',
            addr.house_number || '',
            addr.suburb || addr.neighbourhood || '',
          ].filter(Boolean);
          if (streetParts.length > 0) setStreetAddress(streetParts.join(', '));

          // ZIP
          if (addr.postcode) setZipCode(addr.postcode);

          showToast('success', 'Location detected and address filled successfully!', 'Location Detected');
        } catch {
          setGeoError('Could not fetch address details. Please fill in manually.');
        } finally {
          setIsGeolocating(false);
        }
      },
      (err) => {
        setIsGeolocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access denied. Please allow location permission in your browser.');
        } else {
          setGeoError('Unable to retrieve your location. Please enter address manually.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Profile Photo Upload & Delete (Validated & Canvas Compressed)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value to allow re-selection
    e.target.value = '';
    if (!file) return;

    // 1. Strict File Type & Max 5MB Size Validation
    const validation = validateImageFile(file, 5 * 1024 * 1024);
    if (!validation.valid) {
      showToast('danger', validation.error || 'Please select a valid JPG, PNG, or WebP image.', 'Error Message');
      return;
    }

    try {
      showToast('info', 'Optimizing and uploading profile photo...', 'Uploading');
      // 2. Client-side Canvas Compression (Max 400x400 avatar WebP, quality 0.85)
      const compressedFile = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        mimeType: 'image/webp',
      });

      // Show immediate local preview
      const localPreview = URL.createObjectURL(compressedFile);
      setAvatarPreview(localPreview);

      // 3. Upload to server endpoint to get clean /uploads/ URL (avoids database truncation)
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.url) {
        setAvatarPreview(json.url);
        showToast('success', 'Photo uploaded and optimized! Click "Save Details" to save your profile.', 'Photo Uploaded');
      } else {
        showToast('warning', json.message || 'Image preview set locally.', 'Photo Uploaded');
      }
    } catch (err) {
      console.error('Profile photo upload error:', err);
      showToast('danger', 'Unable to process photo. Please try a different image.', 'Error Message');
    }
  };

  const handleDeletePhoto = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName || 'User')}`;
    setAvatarPreview(defaultAvatar);
    showToast('info', 'Photo removed. Click "Save Details" to apply.', 'Photo Removed');
  };

  // Handle Email Input Change & Rules
  const handleEmailChange = (newVal: string) => {
    setEmail(newVal);
    if (user && newVal.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      setEmailChangedWarning(true);
    } else {
      setEmailChangedWarning(false);
    }
  };

  // Save Basic Info with Comprehensive Security Validation
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate First Name
    const firstNameValidation = validateFullName(firstName, 'First name', true);
    if (!firstNameValidation.valid) {
      showToast('danger', firstNameValidation.error!, 'Validation Error');
      return;
    }

    // 2. Validate Last Name (optional but must be valid characters if provided)
    const lastNameValidation = validateFullName(lastName, 'Last name', false);
    if (!lastNameValidation.valid) {
      showToast('danger', lastNameValidation.error!, 'Validation Error');
      return;
    }

    // 3. Validate Email
    const emailValidation = validateEmailAddress(email);
    if (!emailValidation.valid) {
      showToast('danger', emailValidation.error!, 'Validation Error');
      return;
    }

    // 4. Validate Phone & Alternate Phone (Numbers only, 7-15 digits if provided)
    const phoneValidation = validateMobileNumber(phone, false);
    if (!phoneValidation.valid) {
      showToast('danger', phoneValidation.error!, 'Validation Error');
      return;
    }

    const altPhoneValidation = validateMobileNumber(alternatePhone, false);
    if (!altPhoneValidation.valid) {
      showToast('danger', altPhoneValidation.error!, 'Validation Error');
      return;
    }

    // 5. Validate Date of Birth (must strictly be at least 12 years old if provided)
    if (dateOfBirth && dateOfBirth > maxAllowedDob) {
      showToast('danger', 'You must be at least 12 years old. Please select a valid date of birth.', 'Invalid Date of Birth');
      return;
    }

    setIsSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const isEmailUpdated = user && email.toLowerCase().trim() !== user.email.toLowerCase().trim();

    try {
      const res = await updateUserProfile({
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender: gender.trim(),
        avatar: avatarPreview,
      });

      if (res.success) {
        showToast(
          'success',
          isEmailUpdated
            ? 'Profile saved! Your new email must be verified. Click "Verify Email" to proceed.'
            : 'Profile details saved successfully!',
          'Saved Successfully'
        );
        setEmailChangedWarning(false);
      } else {
        showToast('danger', res.message || 'Failed to update profile.', 'Error Message');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An error occurred while saving profile.', 'Error Message');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel Basic Info - Navigate back to Home Page
  const handleCancelBasicInfo = () => {
    router.push('/');
  };

  // Password Validation Checkers (High Security: 8-16 chars, upper, lower, number, special char)
  const hasMinLength = newPassword.length >= 8 && newPassword.length <= 16;
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar;
  const isPasswordsMatching = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const isPasswordsMismatch = Boolean(confirmPassword && newPassword && newPassword !== confirmPassword);

  // Handle Change Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('danger', 'Please enter your current password.', 'Error Message');
      return;
    }
    if (!isPasswordValid) {
      showToast('danger', 'New password must be between 8 and 16 characters and meet all security requirements.', 'Validation Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('danger', 'New passwords do not match.', 'Validation Error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await changeUserPassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        showToast('success', 'Password changed successfully!', 'Saved Successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('danger', res.message || 'Failed to update password.', 'Error Message');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error updating password.', 'Error Message');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Address Setup
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const addressData = {
      country,
      city: city.trim(),
      streetAddress: streetAddress.trim(),
      zipCode: zipCode.trim(),
      buildingNo: buildingNo.trim(),
      isDefault: isDefaultAddress,
    };

    try {
      const res = await updateUserProfile({ address: addressData });
      if (res.success) {
        showToast('Shipping address saved successfully!');
      } else {
        showToast(res.message || 'Failed to save address.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving address.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Account Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const settingsData = {
      language,
      timezone,
      emailNotif,
      smsNotif,
      promoNotif,
    };

    try {
      const res = await updateUserProfile({ settings: settingsData });
      if (res.success) {
        showToast('Account preferences saved successfully!');
      } else {
        showToast(res.message || 'Failed to save preferences.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccountSubmit = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm account deletion.', 'error');
      return;
    }

    if (user?.role === 'SUPER_ADMIN') {
      showToast('Super Admin accounts cannot be deleted.', 'error');
      return;
    }

    if (confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteUserAccount();
        showToast('danger', 'Your account has been deleted successfully. You will now be redirected.', 'Deleted Successfully');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete account.', 'error');
        setIsDeleting(false);
      }
    }
  };

  // Format cooldown time mm:ss
  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Dispatch real verification email with 2-minute (120s) rate limit cooldown
  const handleSendVerificationEmail = async (openModalAfter: boolean = true) => {
    if (verifyCooldown > 0) {
      if (openModalAfter) setShowVerifyModal(true);
      return;
    }
    if (verifySending) return;
    setVerifySending(true);

    try {
      const res = await authService.sendVerification();
      const expiry = Date.now() + 120 * 1000; // 2 minutes (120 seconds)
      const storageKey = user?.id ? `veuz_verify_cooldown_${user.id}` : 'veuz_verify_cooldown';
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, expiry.toString());
      }
      setVerifyCooldown(120);
      setVerifySentOnce(true);
      showToast(
        res?.message || `Verification code sent to ${user?.email || email}!`,
        'success'
      );
      if (openModalAfter) {
        setShowVerifyModal(true);
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Failed to send verification email. Please try again.';
      showToast(errMsg, 'error');
      if (openModalAfter) {
        setShowVerifyModal(true);
      }
    } finally {
      setVerifySending(false);
    }
  };

  const handleResendInsideModal = async () => {
    if (verifyCooldown > 0 || verifySending) return;
    setOtpDigits(['', '', '', '', '', '']);
    setVerifyCodeError(null);
    setResendNotice('Verification email with your 6-digit code has been sent!');
    await handleSendVerificationEmail(false);
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 120);
  };

  const handleOtpChange = (val: string, idx: number) => {
    const clean = val.replace(/\D/g, '');
    const char = clean.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[idx] = char;
    setOtpDigits(newDigits);
    setVerifyCodeError(null);

    if (char && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[idx] && idx > 0) {
        const newDigits = [...otpDigits];
        newDigits[idx - 1] = '';
        setOtpDigits(newDigits);
        otpInputRefs.current[idx - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[idx] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyOtpSubmit();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = paste[i] || '';
    }
    setOtpDigits(newDigits);
    setVerifyCodeError(null);
    const nextIdx = Math.min(paste.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  const handleVerifyOtpSubmit = async () => {
    const code = otpDigits.join('').trim();
    if (code.length !== 6) {
      setVerifyCodeError('Please enter the 6-digit verification code.');
      return;
    }
    setIsVerifyingCode(true);
    setVerifyCodeError(null);
    try {
      await verifyUserEmail(code);
      setIsVerifyingCode(false);
      setIsVerifySuccess(true);

      const storageKey = user?.id ? `veuz_verify_cooldown_${user.id}` : 'veuz_verify_cooldown';
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
      }
      setVerifyCooldown(0);

      // Show success state inside modal for 1.5s, then smoothly fade out
      setTimeout(() => {
        setIsModalClosing(true);
        setTimeout(() => {
          setShowVerifyModal(false);
          setIsVerifySuccess(false);
          setIsModalClosing(false);
          setOtpDigits(['', '', '', '', '', '']);
          showToast('Congratulations! Your email address has been verified.', 'success');
        }, 280);
      }, 1500);
    } catch (err: any) {
      setIsVerifyingCode(false);
      const msg = err?.data?.message || err?.message || 'Invalid or expired verification code. Please check and try again.';
      setVerifyCodeError(msg);
      showToast(msg, 'error');
    }
  };

  // Redirect to login if user is not authenticated (unless logging out directly to home)
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('veuz_is_logging_out') === 'true') {
      window.location.replace('/');
      return;
    }
    if (!isLoading && !user) {
      router.replace('/login?redirect=/profile%23basic-info');
    }
  }, [isLoading, user, router]);

  const isSkeletonPreview = typeof window !== 'undefined' && window.location.search.includes('skeleton=true');

  if (isLoading || isSkeletonPreview || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <main className="main" style={{ backgroundColor: '#ffffff', minHeight: '85vh', paddingBottom: '70px', animation: 'profileFadeIn 0.25s ease forwards' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes profileSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes profileFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes verifyBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes verifyBackdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes verifyCardZoomIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(14px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes verifyCardZoomOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.92) translateY(14px);
          }
        }
        @keyframes successCheckBounce {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
      <div className="container py-3 py-md-4">

        {/* Page Top Header with Title and Admin Back Button */}
        <div className="d-flex align-items-sm-center justify-content-between flex-column flex-sm-row gap-3 mb-3 mb-md-4 mt-1">
          <div>
            <h1 className="mb-1" style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: '800', color: '#0f172a' }}>
              My Profile
            </h1>
            <p className="mb-0" style={{ color: '#64748b', fontSize: 'clamp(12.5px, 2vw, 14px)' }}>
              Manage your personal information, security preferences, and addresses.
            </p>
          </div>

          {/* Admin Back Option to Dashboard */}
          {(isAdminRole || isSuperAdminRole) && (
            <a
              href="/dashboard"
              className="btn btn-outline-dark d-inline-flex align-items-center justify-content-center"
              style={{
                borderRadius: '9px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: '700',
                gap: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #0f172a',
                color: '#0f172a',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fi fi-rs-apps"></i> Back to Dashboard
            </a>
          )}
        </div>

        {/* Main Clean Profile Card Container (Match Reference Image 1 & 2) */}
        <div className="profile-page-card">

          {/* Top Clean Tabs Navigation Bar */}
          <div ref={tabListRef} className="profile-tabs-header">
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'basic-info' ? 'active' : ''}`}
              onClick={(e) => {
                setActiveTab('basic-info');
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
            >
              <i className="fi fi-rs-user"></i> Basic Info
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'password-change' ? 'active' : ''}`}
              onClick={(e) => {
                setActiveTab('password-change');
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
            >
              <i className="fi fi-rs-lock"></i> Password Change
            </button>
            {/* Address Setup (Location) - Customers only (hidden for Admin & Super Admin) */}
            {!isAdminRole && !isSuperAdminRole && (
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'address-setup' ? 'active' : ''}`}
                onClick={(e) => {
                  setActiveTab('address-setup');
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
              >
                <i className="fi fi-rs-marker"></i> Address Setup
              </button>
            )}
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'account-settings' ? 'active' : ''}`}
              onClick={(e) => {
                setActiveTab('account-settings');
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
            >
              <i className="fi fi-rs-settings-sliders"></i> Account Settings
            </button>
            {/* Delete Account - Customers only (hidden for Admin & Super Admin) */}
            {!isAdminRole && !isSuperAdminRole && (
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'delete-account' ? 'active' : ''}`}
                style={activeTab === 'delete-account' ? { color: '#ef4444', borderBottomColor: '#ef4444', backgroundColor: 'transparent' } : undefined}
                onClick={(e) => {
                  setActiveTab('delete-account');
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
              >
                <i className="fi fi-rs-trash"></i> Delete Account
              </button>
            )}
          </div>

          {/* TAB 1: BASIC INFO (Personal Data) */}
          {activeTab === 'basic-info' && (
            <div>
              {/* Profile Picture Box (Exact Image 1 Layout) */}
              <div className="profile-avatar-box">
                <img
                  src={avatarPreview || user?.avatar || fallbackAvatar}
                  alt={firstName || user?.name || 'User'}
                  className="profile-avatar-img"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = fallbackAvatar;
                  }}
                />
                <div>
                  <h6 style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                    Profile picture
                  </h6>
                  <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '13px' }}>
                    PNG or JPG no bigger than 1000px wide and tall.
                  </p>
                  <div className="d-flex align-items-center gap-2 flex-wrap profile-avatar-btns">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoSelect}
                    />
                    <button
                      type="button"
                      className="profile-btn-outline-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fi fi-rs-upload"></i> Upload New Photo
                    </button>
                    <button
                      type="button"
                      className="profile-btn-outline-danger"
                      onClick={handleDeletePhoto}
                    >
                      <i className="fi fi-rs-trash"></i> Delete Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Column Responsive Form */}
              <form onSubmit={handleSaveBasicInfo}>
                <div className="row g-3 g-md-4">
                  {/* First Name */}
                  <div className="col-md-6">
                    <label className="profile-input-label">First Name</label>
                    <input
                      type="text"
                      className="profile-input-field"
                      placeholder="Emma"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Last Name</label>
                    <input
                      type="text"
                      className="profile-input-field"
                      placeholder="Watson"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  {/* Email Address with Verification Badge & Action */}
                  <div className="col-md-6">
                    {/* Email Address Label */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                      <label className="profile-input-label mb-0">Email Address</label>
                      {user.isEmailVerified && !emailChangedWarning && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <input
                      type="email"
                      className="profile-input-field"
                      placeholder="bocouse@example.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      disabled={isEmailReadOnly}
                      readOnly={isEmailReadOnly}
                      style={
                        isEmailReadOnly
                          ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }
                          : undefined
                      }
                      required
                    />

                    {/* Below the input: smaller verify email link and warning icon */}
                    {!user.isEmailVerified && (
                      <div
                        style={{
                          marginTop: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#d97706"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>

                        <button
                          type="button"
                          onClick={() => handleSendVerificationEmail(true)}
                          disabled={verifySending}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#2563eb',
                            fontWeight: '600',
                            fontSize: '12px',
                            textDecoration: 'underline',
                            cursor: verifySending ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {verifySending ? 'Sending code...' : 'Verify email'}
                        </button>
                      </div>
                    )}

                    {/* Verified Locked Notice */}
                    {user.isEmailVerified && (
                      <small style={{ color: '#15803d', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fi fi-rs-lock"></i> Verified email address is locked for account security.
                      </small>
                    )}

                    {/* Admin Locked Notice */}
                    {!user.isEmailVerified && isEmailReadOnly && (
                      <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        <i className="fi fi-rs-lock mr-5"></i> Admin email is locked and can only be changed by a Super Admin.
                      </small>
                    )}

                    {/* Email Changed Notice */}
                    {emailChangedWarning && (
                      <small style={{ color: '#d97706', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        <i className="fi fi-rs-info mr-5"></i> Email modified. Saving this new address will require re-verification.
                      </small>
                    )}
                  </div>

                  {/* Phone (Numbers Only) */}
                  <div className="col-md-6">
                    <label className="profile-input-label">
                      Phone <span className="text-muted fs-12 fw-normal">(Numbers only)</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="profile-input-field"
                      placeholder="e.g. 966501234567"
                      value={phone}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) => setPhone(sanitizeNumeric(e.target.value))}
                    />
                  </div>

                  {/* Date of Birth (Normal Native Calendar Date Picker - strictly 12+ years old) */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Date of Birth</label>
                    <input
                      type="date"
                      className="profile-input-field"
                      value={dateOfBirth}
                      max={maxAllowedDob}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && val > maxAllowedDob) {
                          showToast('danger', 'You must be at least 12 years old. Dates within the last 12 years are not allowed.', 'Invalid Date of Birth');
                          return;
                        }
                        setDateOfBirth(val);
                      }}
                    />
                    <small className="text-muted fs-12 mt-1 d-block">
                      Must be at least 12 years old.
                    </small>
                  </div>

                  {/* Alternate Mobile Details (Numbers Only) */}
                  <div className="col-md-6">
                    <label className="profile-input-label">
                      Alternate mobile details <span className="text-muted fs-12 fw-normal">(Numbers only)</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="profile-input-field"
                      placeholder="e.g. 966559876543"
                      value={alternatePhone}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) => setAlternatePhone(sanitizeNumeric(e.target.value))}
                    />
                  </div>

                  {/* Gender */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Gender</label>
                    <select
                      className="profile-input-field"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Actions (Exact Image 1 Style) */}
                <div className="profile-form-actions mt-4 pt-2">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={isSaving}
                  >
                    <i className="fi fi-rs-check"></i> {isSaving ? 'Saving...' : 'Save Details'}
                  </button>
                  <button
                    type="button"
                    className="profile-btn-cancel"
                    onClick={handleCancelBasicInfo}
                  >
                    <i className="fi fi-rs-cross-circle"></i> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PASSWORD CHANGE (Matching Image 2 Design) */}
          {activeTab === 'password-change' && (
            <div>
              <div className="mb-4">
                <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Password Information</h5>
                <p style={{ color: '#64748b', fontSize: '13.5px' }}>
                  Ensure your account is protected with a strong, complex password.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword}>
                <div className="row g-3 g-md-4">
                  {/* Row 1 / Col 1: Email Address (Read-only) */}
                  <div className="col-md-6">
                    <label className="profile-input-label d-flex align-items-center justify-content-between">
                      <span>Email Address</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                        <i className="fi fi-rs-lock mr-5"></i> Read-only
                      </span>
                    </label>
                    <input
                      type="email"
                      className="profile-input-field"
                      value={user?.email || email}
                      readOnly
                      disabled
                      style={{
                        backgroundColor: '#f8fafc',
                        cursor: 'not-allowed',
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </div>

                  {/* Row 1 / Col 2: Current Password */}
                  <div className="col-md-6">
                    <label className="profile-input-label">
                      Current Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="profile-input-field"
                        placeholder="Enter your Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        style={{ paddingRight: '45px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        <i className={showCurrentPassword ? 'fi fi-rs-eye-crossed' : 'fi fi-rs-eye'}></i>
                      </button>
                    </div>
                  </div>

                  {/* Row 2 / Col 1: New Password */}
                  <div className="col-md-6">
                    <label className="profile-input-label">
                      New Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="profile-input-field"
                        placeholder="Enter Your New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ paddingRight: '45px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        <i className={showNewPassword ? 'fi fi-rs-eye-crossed' : 'fi fi-rs-eye'}></i>
                      </button>
                    </div>
                  </div>

                  {/* Row 2 / Col 2: Confirm New Password */}
                  <div className="col-md-6">
                    <label className="profile-input-label">
                      Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="profile-input-field"
                        placeholder="Confirm your New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{
                          paddingRight: '45px',
                          border: isPasswordsMismatch
                            ? '1.5px solid #ef4444'
                            : isPasswordsMatching
                            ? '1.5px solid #16a34a'
                            : undefined,
                          backgroundColor: isPasswordsMismatch
                            ? '#fef2f2'
                            : isPasswordsMatching
                            ? '#f0fdf4'
                            : undefined,
                          transition: 'border-color 0.15s ease, background-color 0.15s ease',
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
                          fontSize: '16px',
                        }}
                      >
                        <i className={showConfirmPassword ? 'fi fi-rs-eye-crossed' : 'fi fi-rs-eye'}></i>
                      </button>
                    </div>
                    {isPasswordsMatching && (
                      <div style={{ color: '#16a34a', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                        <span>✓</span> Passwords match
                      </div>
                    )}
                    {isPasswordsMismatch && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>⚠️</span> Passwords do not match
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Requirements Checklist (Full Width, Multi-Column Aligned) */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginTop: '24px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#334155' }}>
                      *Password requirements:
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {[hasMinLength, hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length} of 5 completed
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '8px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: hasMinLength ? '#16a34a' : '#64748b', fontWeight: hasMinLength ? '600' : 'normal' }}>
                      <span style={{ fontWeight: '800' }}>{hasMinLength ? '✓' : '•'}</span>
                      <span>Between 8 and 16 characters</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: hasLowerCase ? '#16a34a' : '#64748b', fontWeight: hasLowerCase ? '600' : 'normal' }}>
                      <span style={{ fontWeight: '800' }}>{hasLowerCase ? '✓' : '•'}</span>
                      <span>At least one lowercase character (a-z)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: hasUpperCase ? '#16a34a' : '#64748b', fontWeight: hasUpperCase ? '600' : 'normal' }}>
                      <span style={{ fontWeight: '800' }}>{hasUpperCase ? '✓' : '•'}</span>
                      <span>At least one uppercase character (A-Z)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: hasNumber ? '#16a34a' : '#64748b', fontWeight: hasNumber ? '600' : 'normal' }}>
                      <span style={{ fontWeight: '800' }}>{hasNumber ? '✓' : '•'}</span>
                      <span>At least one numeric character (0-9)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: hasSpecialChar ? '#16a34a' : '#64748b', fontWeight: hasSpecialChar ? '600' : 'normal' }}>
                      <span style={{ fontWeight: '800' }}>{hasSpecialChar ? '✓' : '•'}</span>
                      <span>At least one special symbol (!@#$%^&*...)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="profile-form-actions mt-4 pt-2">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={isSaving || !isPasswordValid || newPassword !== confirmPassword}
                  >
                    <i className="fi fi-rs-check"></i> {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    className="profile-btn-cancel"
                    onClick={() => router.push('/')}
                  >
                    <i className="fi fi-rs-cross-circle"></i> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ADDRESS SETUP (Shipping & Billing) - Customers Only */}
          {activeTab === 'address-setup' && !isAdminRole && !isSuperAdminRole && (
            <div>
              <div className="mb-4">
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-1">
                  <div>
                    <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Shipping Address Setup</h5>
                    <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
                      Provide your primary delivery destination for fast checkout and package tracking.
                    </p>
                  </div>

                  {/* Use Current Location Button */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isGeolocating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 16px',
                      borderRadius: '9px',
                      border: '1.5px solid #0f172a',
                      backgroundColor: isGeolocating ? '#f1f5f9' : '#ffffff',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: isGeolocating ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isGeolocating ? (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '14px',
                            height: '14px',
                            border: '2px solid #e2e8f0',
                            borderTopColor: '#0f172a',
                            borderRadius: '50%',
                            animation: 'profileSpin 0.7s linear infinite',
                          }}
                        />
                        Detecting location...
                      </>
                    ) : (
                      <>
                        <i className="fi fi-rs-marker" style={{ fontSize: '15px' }}></i>
                        Use Current Location
                      </>
                    )}
                  </button>
                </div>

                {/* Geo Error */}
                {geoError && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fi fi-rs-exclamation" style={{ flexShrink: 0 }}></i>
                    {geoError}
                    <button
                      type="button"
                      onClick={() => setGeoError(null)}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveAddress}>
                <div className="row g-3 g-md-4">
                  {/* Country */}
                  <div className="col-md-6" ref={countryDropdownRef} style={{ position: 'relative' }}>
                    <label className="profile-input-label">Country / Region</label>
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen((prev) => !prev)}
                      className={`profile-country-trigger ${countryDropdownOpen ? 'is-open' : ''}`}
                    >
                      <span style={{ color: country ? '#0f172a' : '#94a3b8', fontWeight: country ? 500 : 400 }}>
                        {(() => {
                          const selected = COUNTRIES.find((c) => c.name.toLowerCase() === (country || '').toLowerCase());
                          return selected ? `${selected.flag}  ${selected.name}` : country || '— Select Country —';
                        })()}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: countryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Dropdown Menu: shows 5 items, rest in scroller */}
                    {countryDropdownOpen && (
                      <div className="profile-country-menu">
                        {COUNTRIES.map((c) => {
                          const isSelected = country.toLowerCase() === c.name.toLowerCase();
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                setCountry(c.name);
                                setCountryDropdownOpen(false);
                              }}
                              className={`profile-country-item ${isSelected ? 'is-selected' : ''}`}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>{c.flag}</span>
                                <span>{c.name}</span>
                              </span>
                              {isSelected && (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {country && (
                      <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
                        Selected: <strong style={{ color: '#0f172a' }}>{country}</strong>
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className="col-md-6">
                    <label className="profile-input-label">City</label>
                    <input
                      type="text"
                      className="profile-input-field"
                      placeholder="e.g. Riyadh, Jeddah, Dammam"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  {/* Street Address / Location */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Street / Location</label>
                    <input
                      type="text"
                      className="profile-input-field"
                      placeholder="e.g. King Fahd Road, Plaza del Rey No. 1"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      required
                    />
                  </div>

                  {/* ZIP / Postal Code */}
                  <div className="col-md-6">
                    <label className="profile-input-label">ZIP / Postal Code</label>
                    <input
                      type="text"
                      className="profile-input-field"
                      placeholder="e.g. 11564 or 28004"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>

                  {/* Building / Flat No */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Building / Villa / Office No.</label>
                    <input
                      type="text"
                      className="profile-input-field"
                      placeholder="e.g. Villa 24B, Tower 2, Floor 5"
                      value={buildingNo}
                      onChange={(e) => setBuildingNo(e.target.value)}
                    />
                  </div>

                  {/* Default Address Checkbox */}
                  <div className="col-12">
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="defaultAddressCheck"
                        checked={isDefaultAddress}
                        onChange={(e) => setIsDefaultAddress(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="defaultAddressCheck" style={{ fontSize: '13.5px', color: '#334155' }}>
                        Set as primary default address for one-click checkout
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="profile-form-actions mt-4 pt-2">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={isSaving}
                  >
                    <i className="fi fi-rs-check"></i> {isSaving ? 'Saving...' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    className="profile-btn-cancel"
                    onClick={() => router.push('/')}
                  >
                    <i className="fi fi-rs-cross-circle"></i> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: ACCOUNT SETTINGS (Language, Timezone & Notifications) */}
          {activeTab === 'account-settings' && (
            <div>
              <div className="mb-4">
                <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Account Settings & Preferences</h5>
                <p style={{ color: '#64748b', fontSize: '13.5px' }}>
                  Customize your language, regional timezone, and notification channels.
                </p>
              </div>

              <form onSubmit={handleSaveSettings}>
                <div className="row g-3 g-md-4">
                  {/* Language Selection */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Select Language</label>
                    <select
                      className="profile-input-field"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="Arabic (العربية)">العربية (Saudi Arabia)</option>
                    </select>
                  </div>

                  {/* Timezone Selection */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Select Timezone</label>
                    <select
                      className="profile-input-field"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="GMT+03:00 (Riyadh, Saudi Arabia)">GMT+03:00 (Riyadh, Saudi Arabia)</option>
                      <option value="GMT+04:00 (Dubai, UAE)">GMT+04:00 (Dubai, UAE)</option>
                      <option value="GMT+00:00 (UTC / London)">GMT+00:00 (UTC / London)</option>
                      <option value="GMT+07:00 (Bangkok, Jakarta)">GMT+07:00 (Bangkok, Jakarta)</option>
                    </select>
                  </div>
                </div>

                {/* Communication & Alerts (Hidden for now as requested) */}
                {false && (
                  <>
                    <hr style={{ borderColor: '#f1f5f9', margin: '28px 0' }} />
                    <h6 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '14px', fontSize: '14.5px' }}>
                      Communication & Alerts
                    </h6>
                    <div className="d-flex flex-column gap-3 mb-4">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="emailNotifSwitch"
                          checked={emailNotif}
                          onChange={(e) => setEmailNotif(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="emailNotifSwitch" style={{ fontSize: '13.5px', color: '#334155' }}>
                          Email notifications for order confirmations and dispatch tracking
                        </label>
                      </div>

                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="smsNotifSwitch"
                          checked={smsNotif}
                          onChange={(e) => setSmsNotif(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="smsNotifSwitch" style={{ fontSize: '13.5px', color: '#334155' }}>
                          SMS alerts for instant delivery updates and OTP security
                        </label>
                      </div>

                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="promoNotifSwitch"
                          checked={promoNotif}
                          onChange={(e) => setPromoNotif(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="promoNotifSwitch" style={{ fontSize: '13.5px', color: '#334155' }}>
                          Promotional discounts, safety equipment offers, and quarterly catalogs
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Bottom Actions */}
                <div className="profile-form-actions mt-4 pt-2">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={isSaving}
                  >
                    <i className="fi fi-rs-check"></i> {isSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
                  <button
                    type="button"
                    className="profile-btn-cancel"
                    onClick={() => router.push('/')}
                  >
                    <i className="fi fi-rs-cross-circle"></i> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: DELETE ACCOUNT (Danger Zone) - Customers Only */}
          {activeTab === 'delete-account' && !isAdminRole && !isSuperAdminRole && (
            <div>
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '14px',
                  padding: '24px',
                  marginBottom: '28px',
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-2">
                  <i className="fi fi-rs-shield-exclamation" style={{ color: '#ef4444', fontSize: '26px' }}></i>
                  <h5 style={{ fontWeight: '800', color: '#991b1b', margin: 0 }}>
                    Danger Zone: Delete Account
                  </h5>
                </div>
                <p style={{ color: '#b91c1c', fontSize: '14px', marginBottom: '8px' }}>
                  Once you delete your account, there is no going back. All of your personal details, order history, active carts, and addresses will be permanently removed from our servers.
                </p>
                <small style={{ color: '#dc2626', fontWeight: '600' }}>
                  {isSuperAdminRole ? 'Note: Super Admin accounts cannot be deleted directly.' : 'Please proceed with caution.'}
                </small>
              </div>

              {!isSuperAdminRole && (
                <div style={{ maxWidth: '520px' }}>
                  <label className="profile-input-label" style={{ color: '#991b1b' }}>
                    To confirm deletion, please type <strong>DELETE</strong> below:
                  </label>
                  <input
                    type="text"
                    className="profile-input-field mb-3"
                    placeholder="Type DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />

                  <div className="d-flex align-items-center gap-3">
                    <button
                      type="button"
                      className="profile-btn-danger"
                      onClick={handleDeleteAccountSubmit}
                      disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                    >
                      <i className="fi fi-rs-trash"></i> {isDeleting ? 'Deleting...' : 'Permanently Delete My Account'}
                    </button>
                    <button
                      type="button"
                      className="profile-btn-cancel"
                      onClick={() => setDeleteConfirmText('')}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Exact OTP Verification Modal rendered via Portal to sit above header */}
      {showVerifyModal && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
            boxSizing: 'border-box',
            animation: isModalClosing
              ? 'verifyBackdropFadeOut 0.28s ease forwards'
              : 'verifyBackdropFadeIn 0.25s ease forwards',
          }}
          onClick={handleCloseVerifyModal}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: isVerifySuccess ? '44px 32px 38px 32px' : '36px 28px 32px 28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
              position: 'relative',
              textAlign: 'center',
              boxSizing: 'border-box',
              animation: isModalClosing
                ? 'verifyCardZoomOut 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                : 'verifyCardZoomIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button (hidden during success completion) */}
            {!isVerifySuccess && (
              <button
                type="button"
                onClick={handleCloseVerifyModal}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  transition: 'all 0.15s ease',
                }}
                aria-label="Close"
              >
                ✕
              </button>
            )}

            {isVerifySuccess ? (
              /* Success State inside Modal */
              <div style={{ animation: 'verifyCardZoomIn 0.3s ease' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: '#dcfce7',
                    border: '2px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    boxShadow: '0 10px 25px rgba(22, 163, 74, 0.22)',
                    animation: 'successCheckBounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                  }}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#0f172a',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Email Verified Successfully!
                </h3>

                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Your email address <strong style={{ color: '#0f172a' }}>{user?.email || email}</strong> is now verified and your account is secure.
                </p>
              </div>
            ) : (
              <>
                {/* Circular Blue Envelope Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#2563eb">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
                  </svg>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Check your email
                </h3>

                {/* Subtitle */}
                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: 1.5,
                    marginBottom: '26px',
                  }}
                >
                  Enter the verification code sent to
                  <br />
                  <strong style={{ color: '#0f172a', fontWeight: '600' }}>
                    {user?.email || email}
                  </strong>
                </p>

                {/* 6 OTP Input Boxes */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '22px',
                  }}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      placeholder={focusedOtpIdx === idx ? '' : '·'}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      onFocus={(e) => {
                        setFocusedOtpIdx(idx);
                        e.target.select();
                      }}
                      onBlur={() => setFocusedOtpIdx(null)}
                      style={{
                        width: '46px',
                        height: '52px',
                        borderRadius: '10px',
                        border: focusedOtpIdx === idx ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                        textAlign: 'center',
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        padding: 0,
                        margin: 0,
                        lineHeight: '50px',
                        caretColor: '#2563eb',
                        textIndent: 0,
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease',
                      }}
                    />
                  ))}
                </div>

                {/* Resend Notice */}
                {resendNotice && (
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      textAlign: 'center',
                    }}
                  >
                    ✓ {resendNotice}
                  </div>
                )}

                {/* Didn't get a code? resend (with red cooldown) */}
                <div
                  style={{
                    fontSize: '13.5px',
                    color: '#64748b',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <span>Didn&apos;t get a code?</span>
                  {verifyCooldown > 0 ? (
                    <span style={{ color: '#ef4444', fontWeight: '600' }}>
                      resend in {formatCooldown(verifyCooldown)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendInsideModal}
                      disabled={verifySending}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#2563eb',
                        fontWeight: '600',
                        textDecoration: 'underline',
                        cursor: verifySending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {verifySending ? 'sending...' : 'resend'}
                    </button>
                  )}
                </div>

                {/* Error Message if any */}
                {verifyCodeError && (
                  <div
                    style={{
                      color: '#ef4444',
                      fontSize: '12.5px',
                      fontWeight: '500',
                      backgroundColor: '#fef2f2',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    {verifyCodeError}
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleVerifyOtpSubmit}
                  disabled={isVerifyingCode || otpDigits.join('').length !== 6}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: otpDigits.join('').length === 6 && !isVerifyingCode ? '#2563eb' : '#93c5fd',
                    color: '#ffffff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: otpDigits.join('').length === 6 && !isVerifyingCode ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    boxShadow: otpDigits.join('').length === 6 ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                  }}
                >
                  {isVerifyingCode ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify email</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
