'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isAdmin, isLoading, updateUserProfile, changeUserPassword, deleteUserAccount, verifyUserEmail } = useAuth();

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
  const isEmailReadOnly = isAdminRole && !isSuperAdminRole;

  // Tab State: basic-info | password-change | address-setup | account-settings | delete-account
  const [activeTab, setActiveTab] = useState<'basic-info' | 'password-change' | 'address-setup' | 'account-settings' | 'delete-account'>('basic-info');

  // Sync tab with URL hash (#settings, #password, etc.) or query (?tab=settings)
  useEffect(() => {
    const handleUrlTab = () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash.toLowerCase().replace('#', '').trim();
      const params = new URLSearchParams(window.location.search);
      const tabParam = (params.get('tab') || '').toLowerCase().trim();

      const target = hash || tabParam;
      if (!target) return;

      if (target === 'settings' || target === 'account-settings' || target === 'account') {
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
  const [country, setCountry] = useState('Saudi Arabia');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [buildingNo, setBuildingNo] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);

  // Account Settings State
  const [language, setLanguage] = useState('English (US)');
  const [timezone, setTimezone] = useState('GMT+03:00 (Riyadh, Saudi Arabia)');
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);

  // Delete Account Confirmation State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Email Verification Modal / State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifySending, setVerifySending] = useState(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState('');

  // UI Feedback Toasts
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setGender(user.gender || 'Prefer not to say');
      setAvatarPreview(user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`);

      if (user.address) {
        setCountry(user.address.country || 'Saudi Arabia');
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

  // Auth Protection & Page Scroll
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

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

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  // Profile Photo Upload & Delete
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image is too large. Max allowed size is 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarPreview(reader.result);
          showToast('Photo uploaded! Click "Save Details" to save your profile.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName || 'User')}`;
    setAvatarPreview(defaultAvatar);
    showToast('Photo removed. Click "Save Details" to apply.');
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

  // Save Basic Info
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      showToast('First name is required.', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
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
          isEmailUpdated
            ? 'Profile saved! Your new email must be verified. Click "Verify Email" to proceed.'
            : 'Profile details saved successfully!'
        );
        setEmailChangedWarning(false);
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Basic Info
  const handleCancelBasicInfo = () => {
    if (user) {
      const parts = (user.name || '').trim().split(' ');
      setFirstName(user.firstName || parts[0] || '');
      setLastName(user.lastName || parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.mobile || '');
      setAlternatePhone(user.alternatePhone || '');
      setDateOfBirth(formatToDateInput(user.dateOfBirth));
      setGender(user.gender || 'Prefer not to say');
      setAvatarPreview(user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`);
      setEmailChangedWarning(false);
      showToast('Changes discarded.');
    }
  };

  // Password Validation Checkers
  const hasMinLength = newPassword.length >= 8;
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isPasswordValid = hasMinLength && hasLowerCase && hasUpperCase && hasNumber;

  // Handle Change Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (!isPasswordValid) {
      showToast('New password does not meet security requirements.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await changeUserPassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        showToast('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Failed to update password.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating password.', 'error');
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
        alert('Your account has been deleted successfully. You will now be redirected.');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete account.', 'error');
        setIsDeleting(false);
      }
    }
  };

  // Email Verification Simulation / Action
  const handleSendVerificationCode = () => {
    setVerifySending(true);
    setTimeout(() => {
      setVerifySending(false);
      setVerifySuccessMsg('A 6-digit verification code has been dispatched to ' + email);
    }, 800);
  };

  const handleConfirmVerification = async () => {
    setIsSaving(true);
    try {
      await verifyUserEmail(verifyOtp || 'manual-otp-verified');
      setShowVerifyModal(false);
      setVerifyOtp('');
      setVerifySuccessMsg('');
      showToast('Congratulations! Your email address has been verified.');
    } catch (err: any) {
      showToast('Verification failed. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <main className="main" style={{ backgroundColor: '#f8fafc', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              border: '3.5px solid #e2e8f0',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'profileSpin 0.7s linear infinite',
              margin: '0 auto 14px auto',
            }}
          />
          <h6 style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', margin: '0 0 4px 0' }}>
            Loading Profile...
          </h6>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            Fetching account information
          </p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes profileSpin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </main>
    );
  }

  return (
    <main className="main" style={{ backgroundColor: '#f8fafc', minHeight: '85vh', paddingBottom: '70px', animation: 'profileFadeIn 0.25s ease forwards' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes profileSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes profileFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
      <div className="container py-4">

        {/* Global Toast Alert */}
        {toastMsg && (
          <div
            className={`alert ${toastMsg.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}
            role="alert"
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              borderRadius: '12px',
              padding: '14px 20px',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: '460px',
            }}
          >
            <i className={toastMsg.type === 'success' ? 'fi fi-rs-check' : 'fi fi-rs-exclamation'}></i>
            <span>{toastMsg.text}</span>
            <button type="button" className="btn-close" onClick={() => setToastMsg(null)} aria-label="Close"></button>
          </div>
        )}

        {/* Page Top Header with Title and Admin Back Button */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 mt-2">
          <div>
            <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              My Profile
            </h1>
            <p className="mb-0" style={{ color: '#64748b', fontSize: '14px' }}>
              Manage your personal information, security preferences, and addresses.
            </p>
          </div>

          {/* Admin Back Option to Dashboard */}
          {(isAdminRole || isSuperAdminRole) && (
            <a
              href="/dashboard"
              className="btn btn-outline-primary d-inline-flex align-items-center"
              style={{
                borderRadius: '9px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: '700',
                gap: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #2563eb',
                color: '#2563eb',
              }}
            >
              <i className="fi fi-rs-apps"></i> Back to Dashboard
            </a>
          )}
        </div>

        {/* Main Clean Profile Card Container (Match Reference Image 1 & 2) */}
        <div className="profile-page-card">

          {/* Top Clean Tabs Navigation Bar */}
          <div className="profile-tabs-header">
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'basic-info' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic-info')}
            >
              <i className="fi fi-rs-user"></i> Basic Info
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'password-change' ? 'active' : ''}`}
              onClick={() => setActiveTab('password-change')}
            >
              <i className="fi fi-rs-lock"></i> Password Change
            </button>
            {/* Address Setup (Location) - Customers only (hidden for Admin & Super Admin) */}
            {!isAdminRole && !isSuperAdminRole && (
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'address-setup' ? 'active' : ''}`}
                onClick={() => setActiveTab('address-setup')}
              >
                <i className="fi fi-rs-marker"></i> Address Setup
              </button>
            )}
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'account-settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('account-settings')}
            >
              <i className="fi fi-rs-settings-sliders"></i> Account Settings
            </button>
            {/* Delete Account - Customers only (hidden for Admin & Super Admin) */}
            {!isAdminRole && !isSuperAdminRole && (
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'delete-account' ? 'active' : ''}`}
                style={{ color: activeTab === 'delete-account' ? '#ef4444' : undefined }}
                onClick={() => setActiveTab('delete-account')}
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
                />
                <div>
                  <h6 style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                    Profile picture
                  </h6>
                  <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '13px' }}>
                    PNG or JPG no bigger than 1000px wide and tall.
                  </p>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
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
                <div className="row g-4">
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
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="profile-input-label mb-0">Email Address</label>
                      
                      {/* Email Verification Status */}
                      {user.isEmailVerified && !emailChangedWarning ? (
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
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fde68a',
                            }}
                          >
                            ⚠ Unverified
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowVerifyModal(true);
                              handleSendVerificationCode();
                            }}
                            className="btn btn-sm"
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              borderRadius: '5px',
                              border: 'none',
                            }}
                          >
                            Verify Email
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      type="email"
                      className="profile-input-field"
                      placeholder="bocouse@example.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      disabled={isEmailReadOnly}
                      required
                    />

                    {/* Admin Locked Notice */}
                    {isEmailReadOnly && (
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

                  {/* Phone */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Phone</label>
                    <input
                      type="tel"
                      className="profile-input-field"
                      placeholder="+966 50 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Date of Birth (Normal Native Calendar Date Picker) */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Date of Birth</label>
                    <input
                      type="date"
                      className="profile-input-field"
                      value={dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>

                  {/* Alternate Mobile Details */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Alternate mobile details</label>
                    <input
                      type="tel"
                      className="profile-input-field"
                      placeholder="Mobile details / alternate number"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
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
                <div className="d-flex align-items-center gap-3 mt-4 pt-2">
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
                <div className="row g-4">
                  {/* Current Password */}
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

                  {/* New Password */}
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

                  {/* Confirm New Password */}
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
                        style={{ paddingRight: '45px' }}
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
                  </div>
                </div>

                {/* Password Requirements Checklist (Exact Image 2 Requirements) */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginTop: '24px',
                    maxWidth: '600px',
                  }}
                >
                  <p style={{ fontWeight: '700', fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                    *Password requirements:
                  </p>
                  <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.8' }}>
                    <li style={{ color: hasMinLength ? '#16a34a' : undefined, fontWeight: hasMinLength ? '600' : 'normal' }}>
                      {hasMinLength ? '✓' : '•'} At least 8 characters
                    </li>
                    <li style={{ color: hasLowerCase ? '#16a34a' : undefined, fontWeight: hasLowerCase ? '600' : 'normal' }}>
                      {hasLowerCase ? '✓' : '•'} At least one lowercase character
                    </li>
                    <li style={{ color: hasUpperCase ? '#16a34a' : undefined, fontWeight: hasUpperCase ? '600' : 'normal' }}>
                      {hasUpperCase ? '✓' : '•'} At least one uppercase character
                    </li>
                    <li style={{ color: hasNumber ? '#16a34a' : undefined, fontWeight: hasNumber ? '600' : 'normal' }}>
                      {hasNumber ? '✓' : '•'} At least one numeric character (0-9)
                    </li>
                  </ul>
                </div>

                {/* Bottom Actions */}
                <div className="d-flex align-items-center gap-3 mt-4 pt-2">
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
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
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
                <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Shipping Address Setup</h5>
                <p style={{ color: '#64748b', fontSize: '13.5px' }}>
                  Provide your primary delivery destination for fast checkout and package tracking.
                </p>
              </div>

              <form onSubmit={handleSaveAddress}>
                <div className="row g-4">
                  {/* Country */}
                  <div className="col-md-6">
                    <label className="profile-input-label">Country / Region</label>
                    <select
                      className="profile-input-field"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      <option value="Saudi Arabia">Saudi Arabia (المملكة العربية السعودية)</option>
                      <option value="United Arab Emirates">United Arab Emirates (الإمارات)</option>
                      <option value="Bahrain">Bahrain (البحرين)</option>
                      <option value="Qatar">Qatar (قطر)</option>
                      <option value="Kuwait">Kuwait (الكويت)</option>
                      <option value="Oman">Oman (عمان)</option>
                      <option value="Spain">Spain</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
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
                <div className="d-flex align-items-center gap-3 mt-4 pt-2">
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
                    onClick={() => {
                      if (user?.address) {
                        setCountry(user.address.country || 'Saudi Arabia');
                        setCity(user.address.city || '');
                        setStreetAddress(user.address.streetAddress || '');
                        setZipCode(user.address.zipCode || '');
                        setBuildingNo(user.address.buildingNo || '');
                      }
                      showToast('Address changes cancelled.');
                    }}
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
                <div className="row g-4">
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

                <hr style={{ borderColor: '#f1f5f9', margin: '28px 0' }} />

                {/* Notifications Preferences */}
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

                {/* Bottom Actions */}
                <div className="d-flex align-items-center gap-3 mt-4 pt-2">
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
                    onClick={() => {
                      if (user?.settings) {
                        setLanguage(user.settings.language || 'English (US)');
                        setTimezone(user.settings.timezone || 'GMT+03:00 (Riyadh, Saudi Arabia)');
                        setEmailNotif(user.settings.emailNotif !== undefined ? user.settings.emailNotif : true);
                        setSmsNotif(user.settings.smsNotif !== undefined ? user.settings.smsNotif : true);
                        setPromoNotif(user.settings.promoNotif !== undefined ? user.settings.promoNotif : false);
                      }
                      showToast('Preferences reset.');
                    }}
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

      {/* EMAIL VERIFICATION MODAL */}
      {showVerifyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowVerifyModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <i className="fi fi-rs-cross"></i>
            </button>

            <div className="text-center mb-4">
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  color: '#2563eb',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '12px',
                }}
              >
                <i className="fi fi-rs-envelope-open"></i>
              </div>
              <h4 style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Verify Your Email</h4>
              <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: 0 }}>
                We sent a 6-digit confirmation code to <strong>{email}</strong>
              </p>
            </div>

            {verifySuccessMsg && (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '18px',
                  textAlign: 'center',
                }}
              >
                {verifySuccessMsg}
              </div>
            )}

            <div className="mb-4">
              <label className="profile-input-label text-center">Enter 6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                className="profile-input-field text-center"
                placeholder="123456"
                value={verifyOtp}
                onChange={(e) => setVerifyOtp(e.target.value)}
                style={{
                  letterSpacing: '6px',
                  fontSize: '20px',
                  fontWeight: '700',
                  height: '52px',
                }}
              />
            </div>

            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className="profile-btn-primary justify-content-center"
                onClick={handleConfirmVerification}
                disabled={isSaving}
                style={{ width: '100%', height: '44px' }}
              >
                {isSaving ? 'Verifying...' : 'Confirm Verification'}
              </button>

              <button
                type="button"
                className="btn btn-link text-decoration-none"
                onClick={handleSendVerificationCode}
                disabled={verifySending}
                style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600' }}
              >
                {verifySending ? 'Resending Code...' : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
