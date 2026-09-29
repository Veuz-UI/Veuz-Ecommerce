'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/services/apiClient';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  avatar: string | null;
  phone: string | null;
  alternatePhone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: any | null;
  isEmailVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
  };
}

interface UserCounts {
  total: number;
  superAdmins: number;
  admins: number;
  customers: number;
  blocked: number;
  active: number;
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'admins' | 'customers'>('admins');

  // Data States
  const [users, setUsers] = useState<UserItem[]>([]);
  const [counts, setCounts] = useState<UserCounts>({
    total: 0,
    superAdmins: 0,
    admins: 0,
    customers: 0,
    blocked: 0,
    active: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN'>('ALL');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'danger' | 'info'; text: string } | null>(null);

  // Modal States
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [viewDetailsUser, setViewDetailsUser] = useState<UserItem | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN' as 'ADMIN' | 'SUPER_ADMIN' | 'CUSTOMER',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      if (res.success) {
        setUsers(res.users || []);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      showAlert('danger', err.message || 'Failed to load user records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showAlert = (type: 'success' | 'danger' | 'info', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4500);
  };

  // Toggle Block / Suspend
  const handleToggleBlock = async (targetUser: UserItem) => {
    if (currentUser?.id === targetUser.id) {
      showAlert('danger', 'You cannot block your own logged-in account.');
      return;
    }
    if ((targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') && !isSuperAdmin) {
      showAlert('danger', 'Only Super Administrators can modify administrator access status.');
      return;
    }

    try {
      const res = await apiClient.patch(`/admin/users/${targetUser.id}/block`, {
        isBlocked: !targetUser.isBlocked,
      });

      if (res.success) {
        showAlert('success', res.message || 'Status updated successfully.');
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isBlocked: !targetUser.isBlocked } : u))
        );
        setCounts((prev) => ({
          ...prev,
          blocked: targetUser.isBlocked ? prev.blocked - 1 : prev.blocked + 1,
          active: targetUser.isBlocked ? prev.active + 1 : prev.active - 1,
        }));
      }
    } catch (err: any) {
      showAlert('danger', err.message || 'Failed to update user status.');
    }
  };

  // Handle Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!newPassword || newPassword.length < 8) {
      showAlert('danger', 'Password must be at least 8 characters long.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await apiClient.post(`/admin/users/${resetModalUser.id}/reset-password`, {
        newPassword,
      });

      if (res.success) {
        showAlert('success', `Password successfully updated for ${resetModalUser.name}!`);
        setResetModalUser(null);
        setNewPassword('');
      }
    } catch (err: any) {
      showAlert('danger', err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Guarantee letter and number
    pwd += 'A1!';
    setNewPassword(pwd);
  };

  // Handle Delete User
  const handleDeleteUserSubmit = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.delete(`/admin/users/${deleteModalUser.id}`);
      if (res.success) {
        showAlert('success', res.message || 'Account successfully removed.');
        setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
        setDeleteModalUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      showAlert('danger', err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      showAlert('danger', 'Name, email, and password are required.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await apiClient.post('/admin/users', createForm);
      if (res.success) {
        showAlert('success', res.message || 'Account created successfully!');
        setCreateModalOpen(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'ADMIN',
          phone: '',
          gender: 'Male',
          dateOfBirth: '',
        });
        fetchUsers();
      }
    } catch (err: any) {
      showAlert('danger', err.message || 'Failed to create user account.');
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered Users for Tab 1: Admins (SUPER_ADMIN and ADMIN)
  const staffList = useMemo(() => {
    return users.filter((u) => {
      const isStaff = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
      if (!isStaff) return false;

      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && u.isBlocked) return false;
      if (statusFilter === 'BLOCKED' && !u.isBlocked) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Filtered Users for Tab 2: Customers
  const customerList = useMemo(() => {
    return users.filter((u) => {
      const isCustomer = u.role === 'CUSTOMER';
      if (!isCustomer) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && u.isBlocked) return false;
      if (statusFilter === 'BLOCKED' && !u.isBlocked) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [users, statusFilter, searchQuery]);

  return (
    <>
      {/* Global Toast Alert */}
      {alertMessage && (
        <div
          className={`alert alert-${alertMessage.type} alert-dismissible fade show d-flex align-items-center gap-2 shadow-sm mb-3`}
          role="alert"
          style={{ borderRadius: '10px' }}
        >
          <iconify-icon
            icon={
              alertMessage.type === 'success'
                ? 'solar:check-circle-bold'
                : alertMessage.type === 'danger'
                ? 'solar:danger-circle-bold'
                : 'solar:info-circle-bold'
            }
            class="fs-20 flex-shrink-0"
          ></iconify-icon>
          <div className="fs-13 fw-medium flex-grow-1">{alertMessage.text}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlertMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* ========================================================
          MAIN BACKGROUND WHITE CARD (Master Architecture)
         ======================================================== */}
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-3 p-md-4">
          {/* 1. Header & Actions */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-2">
            <div>
              <div className="d-flex align-items-center gap-2 text-muted fs-12 mb-1">
                <span>Dashboard</span>
                <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-12"></iconify-icon>
                <span className="text-primary fw-medium">User Management</span>
              </div>
              <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>
                User &amp; Staff Management
              </h3>
              <p className="text-muted fs-13 mb-0">
                Control platform administrators, super admins, permissions, and registered customer accounts.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-1.5 fs-12 fw-semibold"
                style={{
                  borderRadius: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#334155',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.15s ease-in-out',
                }}
                onClick={fetchUsers}
                disabled={isLoading}
              >
                <iconify-icon
                  icon="solar:restart-bold"
                  class={`fs-14 ${isLoading ? 'spin' : ''}`}
                ></iconify-icon>
                <span>Refresh</span>
              </button>

              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-1.5 fs-12 fw-semibold text-white"
                style={{
                  borderRadius: '6px',
                  padding: '7px 16px',
                  backgroundColor: '#2563eb',
                  border: '1px solid #1d4ed8',
                  boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.35), 0 1px 2px -1px rgba(37, 99, 235, 0.2)',
                  transition: 'all 0.15s ease-in-out',
                }}
                onClick={() => {
                  setCreateForm((prev) => ({
                    ...prev,
                    role: activeTab === 'admins' ? 'ADMIN' : 'CUSTOMER',
                  }));
                  setCreateModalOpen(true);
                }}
              >
                <iconify-icon icon="solar:user-plus-bold" class="fs-15 text-white"></iconify-icon>
                <span>{activeTab === 'admins' ? 'Add Administrator' : 'Add Customer'}</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 20px 0' }}></div>

          {/* 2. Metric KPI Cards (Inside Main Card) */}
          <div className="row g-3 mb-4">
            {/* Total Users */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Total Accounts
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #dbeafe',
                      }}
                    >
                      <iconify-icon icon="solar:users-group-two-rounded-bold" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{counts.total}</h3>
                    <span
                      className="badge fs-11 fw-semibold d-inline-flex align-items-center gap-1"
                      style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px' }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                      {counts.active} Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Super Admins */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Super Admins
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#faf5ff',
                        color: '#7e22ce',
                        border: '1px solid #f3e8ff',
                      }}
                    >
                      <iconify-icon icon="solar:crown-star-bold" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{counts.superAdmins}</h3>
                    <span className="fs-12 text-muted fw-medium">Full Platform Root</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admins */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Administrators
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#f0fdfa',
                        color: '#0d9488',
                        border: '1px solid #ccfbf1',
                      }}
                    >
                      <iconify-icon icon="solar:shield-check-bold" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{counts.admins}</h3>
                    <span className="fs-12 text-muted fw-medium">Staff Access</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Registered Customers
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #dcfce7',
                      }}
                    >
                      <iconify-icon icon="solar:bag-smile-bold" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{counts.customers}</h3>
                    {counts.blocked > 0 ? (
                      <span
                        className="badge fs-11 fw-semibold"
                        style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px' }}
                      >
                        {counts.blocked} Blocked
                      </span>
                    ) : (
                      <span className="fs-12 text-muted fw-medium">Active Buyers</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Table Container Card with Classic Segmented Control & Filter Header */}
          <div
            className="card border overflow-hidden mb-0"
            style={{
              borderRadius: '8px',
              borderColor: '#e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Segmented Control Header */}
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div
                className="d-inline-flex p-1"
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-sm d-flex align-items-center gap-2 fs-13"
                  style={{
                    borderRadius: '6px',
                    padding: '7px 18px',
                    backgroundColor: activeTab === 'admins' ? '#ffffff' : 'transparent',
                    color: activeTab === 'admins' ? '#0f172a' : '#64748b',
                    fontWeight: activeTab === 'admins' ? 600 : 500,
                    border: activeTab === 'admins' ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
                    boxShadow: activeTab === 'admins' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    letterSpacing: '-0.1px',
                  }}
                  onClick={() => {
                    setActiveTab('admins');
                    setStatusFilter('ALL');
                    setRoleFilter('ALL');
                  }}
                >
                  <span>Administrators</span>
                  <span
                    className="badge rounded-pill px-2 fs-11"
                    style={{
                      backgroundColor: activeTab === 'admins' ? '#eff6ff' : '#e2e8f0',
                      color: activeTab === 'admins' ? '#1d4ed8' : '#64748b',
                      fontWeight: 600,
                      lineHeight: '1.6',
                    }}
                  >
                    {counts.superAdmins + counts.admins}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm d-flex align-items-center gap-2 fs-13"
                  style={{
                    borderRadius: '6px',
                    padding: '7px 18px',
                    backgroundColor: activeTab === 'customers' ? '#ffffff' : 'transparent',
                    color: activeTab === 'customers' ? '#0f172a' : '#64748b',
                    fontWeight: activeTab === 'customers' ? 600 : 500,
                    border: activeTab === 'customers' ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
                    boxShadow: activeTab === 'customers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    letterSpacing: '-0.1px',
                  }}
                  onClick={() => {
                    setActiveTab('customers');
                    setStatusFilter('ALL');
                  }}
                >
                  <span>Customers</span>
                  <span
                    className="badge rounded-pill px-2 fs-11"
                    style={{
                      backgroundColor: activeTab === 'customers' ? '#f0fdf4' : '#e2e8f0',
                      color: activeTab === 'customers' ? '#15803d' : '#64748b',
                      fontWeight: 600,
                      lineHeight: '1.6',
                    }}
                  >
                    {counts.customers}
                  </span>
                </button>
              </div>

              <div className="fs-12 text-muted d-none d-md-block">
                Showing <strong className="text-dark">{activeTab === 'admins' ? staffList.length : customerList.length}</strong>{' '}
                {activeTab === 'admins' ? 'staff members' : 'registered customer accounts'}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-light-subtle border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '420px' }}>
                <div
                  className="input-group"
                  style={{
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    className="input-group-text bg-white text-muted"
                    style={{ border: '1px solid #d1d5db', borderRight: 'none' }}
                  >
                    <iconify-icon icon="solar:magnifer-broken" class="fs-16"></iconify-icon>
                  </span>
                  <input
                    type="text"
                    className="form-control ps-0 fs-13"
                    style={{ border: '1px solid #d1d5db', borderLeft: 'none' }}
                    placeholder={
                      activeTab === 'admins'
                        ? 'Search administrator by name, email, or mobile...'
                        : 'Search customer by name, email, or mobile...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-white text-muted"
                      style={{ border: '1px solid #d1d5db', borderLeft: 'none' }}
                      type="button"
                      onClick={() => setSearchQuery('')}
                    >
                      <iconify-icon icon="solar:close-circle-broken" class="fs-16"></iconify-icon>
                    </button>
                  )}
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Role Filter (Only for Admins Tab) */}
                {activeTab === 'admins' && (
                  <select
                    className="form-select form-select-sm fs-13 fw-medium"
                    style={{
                      width: '160px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                      color: '#334155',
                    }}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                  >
                    <option value="ALL">All Staff Roles</option>
                    <option value="SUPER_ADMIN">Super Admins Only</option>
                    <option value="ADMIN">Admins Only</option>
                  </select>
                )}

                {/* Status Filter */}
                <select
                  className="form-select form-select-sm fs-13 fw-medium"
                  style={{
                    width: '150px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                    color: '#334155',
                  }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="BLOCKED">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* 5. Table View */}
            <div className="table-responsive">
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading users...</span>
                  </div>
                  <p className="text-muted fs-13 mb-0">Loading user database...</p>
                </div>
              ) : activeTab === 'admins' ? (
                /* ========================================================
                   TAB 1: ADMINISTRATORS TABLE
                   ======================================================== */
                staffList.length === 0 ? (
                  <div className="text-center py-5">
                    <iconify-icon icon="solar:user-cross-broken" class="fs-48 text-muted mb-2"></iconify-icon>
                    <h6 className="fw-semibold text-dark">No Administrators Found</h6>
                    <p className="text-muted fs-13 mb-3">Try adjusting your search criteria or role filters.</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      style={{ borderRadius: '6px' }}
                      onClick={() => {
                        setSearchQuery('');
                        setRoleFilter('ALL');
                        setStatusFilter('ALL');
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr className="fs-11 text-uppercase text-muted fw-bold">
                        <th scope="col" className="ps-3 py-3" style={{ letterSpacing: '0.5px' }}>Administrator</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Role</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Contact</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Account Status</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Email Verified</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Joined Date</th>
                        <th scope="col" className="text-end pe-3" style={{ letterSpacing: '0.5px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="fs-13">
                      {staffList.map((item) => {
                        const isSelf = currentUser?.id === item.id;
                        const canManage = isSuperAdmin || !['SUPER_ADMIN', 'ADMIN'].includes(item.role);

                        return (
                          <tr key={item.id} style={{ transition: 'background-color 0.15s ease' }}>
                            {/* Administrator */}
                            <td className="ps-3 py-3">
                              <div className="d-flex align-items-center" style={{ gap: '14px' }}>
                                <img
                                  src={
                                    item.avatar ||
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`
                                  }
                                  alt={item.name}
                                  className="rounded-circle border flex-shrink-0"
                                  width="40"
                                  height="40"
                                  style={{ objectFit: 'cover', borderColor: '#e2e8f0', borderWidth: '2px' }}
                                />
                                <div>
                                  <div className="fw-semibold text-dark d-flex align-items-center gap-2" style={{ fontSize: '13.5px', lineHeight: '1.35' }}>
                                    <span>{item.name}</span>
                                    {isSelf && (
                                      <span
                                        className="badge text-secondary"
                                        style={{ fontSize: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', fontWeight: 500 }}
                                      >
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-muted mt-1" style={{ fontSize: '12px' }}>{item.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td>
                              {item.role === 'SUPER_ADMIN' ? (
                                <span
                                  className="badge d-inline-flex align-items-center gap-1"
                                  style={{
                                    backgroundColor: '#faf5ff',
                                    color: '#7e22ce',
                                    border: '1px solid #f3e8ff',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <iconify-icon icon="solar:crown-star-bold" class="fs-12"></iconify-icon>
                                  SUPER ADMIN
                                </span>
                              ) : (
                                <span
                                  className="badge d-inline-flex align-items-center gap-1"
                                  style={{
                                    backgroundColor: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #dbeafe',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <iconify-icon icon="solar:shield-check-bold" class="fs-12"></iconify-icon>
                                  ADMINISTRATOR
                                </span>
                              )}
                            </td>

                            {/* Contact */}
                            <td>
                              {item.phone ? (
                                <span className="text-dark fw-medium fs-13">{item.phone}</span>
                              ) : (
                                <span className="text-muted">â€”</span>
                              )}
                            </td>

                            {/* Account Status */}
                            <td>
                              {item.isBlocked ? (
                                <span
                                  className="badge d-inline-flex align-items-center gap-1"
                                  style={{
                                    fontSize: '11.5px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: '#fef2f2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    fontWeight: 600,
                                  }}
                                >
                                  <iconify-icon icon="solar:forbidden-circle-bold" class="fs-13"></iconify-icon>
                                  Suspended
                                </span>
                              ) : (
                                <span
                                  className="badge d-inline-flex align-items-center gap-1.5"
                                  style={{
                                    fontSize: '11.5px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: '#f0fdf4',
                                    color: '#15803d',
                                    border: '1px solid #bbf7d0',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      backgroundColor: '#16a34a',
                                      borderRadius: '50%',
                                    }}
                                  ></span>
                                  Active
                                </span>
                              )}
                            </td>

                            {/* Email Verified */}
                            <td>
                              {item.isEmailVerified ? (
                                <span className="d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ color: '#15803d' }}>
                                  <iconify-icon icon="solar:check-circle-bold" class="fs-15"></iconify-icon>
                                  Verified
                                </span>
                              ) : (
                                <span className="d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ color: '#b45309' }}>
                                  <iconify-icon icon="solar:clock-circle-bold" class="fs-15"></iconify-icon>
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* Joined Date */}
                            <td className="text-muted fs-12">
                              {new Date(item.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>

                            {/* Actions */}
                            <td className="text-end pe-3">
                              <div className="d-flex align-items-center justify-content-end" style={{ gap: '8px' }}>
                                {/* Reset Password */}
                                <button
                                  type="button"
                                  className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '7px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    color: '#475569',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Reset Password"
                                  onClick={() => {
                                    setResetModalUser(item);
                                    setNewPassword('');
                                  }}
                                  disabled={item.role === 'SUPER_ADMIN' && !isSuperAdmin}
                                >
                                  <iconify-icon icon="solar:key-bold" class="fs-15"></iconify-icon>
                                </button>

                                {/* Block / Unblock Admin */}
                                <button
                                  type="button"
                                  className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '7px',
                                    backgroundColor: item.isBlocked ? '#f0fdf4' : '#fffbeb',
                                    border: `1px solid ${item.isBlocked ? '#86efac' : '#fcd34d'}`,
                                    color: item.isBlocked ? '#15803d' : '#92400e',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title={item.isBlocked ? 'Activate Account' : 'Suspend Account'}
                                  onClick={() => handleToggleBlock(item)}
                                  disabled={isSelf || (item.role === 'SUPER_ADMIN' && !isSuperAdmin)}
                                >
                                  <iconify-icon
                                    icon={item.isBlocked ? 'solar:check-circle-bold' : 'solar:forbidden-circle-bold'}
                                    class="fs-15"
                                  ></iconify-icon>
                                </button>

                                {/* Delete Admin */}
                                <button
                                  type="button"
                                  className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '7px',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fca5a5',
                                    color: '#dc2626',
                                    boxShadow: '0 1px 3px 0 rgba(220, 38, 38, 0.12)',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Delete Account"
                                  onClick={() => setDeleteModalUser(item)}
                                  disabled={isSelf || (item.role === 'SUPER_ADMIN' && !isSuperAdmin)}
                                >
                                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-15"></iconify-icon>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                /* ========================================================
                   TAB 2: CUSTOMERS TABLE
                   ======================================================== */
                customerList.length === 0 ? (
                  <div className="text-center py-5">
                    <iconify-icon icon="solar:user-cross-broken" class="fs-48 text-muted mb-2"></iconify-icon>
                    <h6 className="fw-semibold text-dark">No Customers Found</h6>
                    <p className="text-muted fs-13 mb-3">Try adjusting your search query or status filter.</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      style={{ borderRadius: '6px' }}
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr className="fs-11 text-uppercase text-muted fw-bold">
                        <th scope="col" className="ps-3 py-3" style={{ letterSpacing: '0.5px' }}>Customer</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Phone</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Gender / DOB</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Account Status</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Email Verified</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Orders</th>
                        <th scope="col" style={{ letterSpacing: '0.5px' }}>Registered</th>
                        <th scope="col" className="text-end pe-3" style={{ letterSpacing: '0.5px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="fs-13">
                      {customerList.map((item) => (
                        <tr key={item.id} style={{ transition: 'background-color 0.15s ease' }}>
                          {/* Customer Info */}
                          <td className="ps-3 py-3">
                            <div className="d-flex align-items-center" style={{ gap: '14px' }}>
                              <img
                                src={
                                  item.avatar ||
                                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`
                                }
                                alt={item.name}
                                className="rounded-circle border flex-shrink-0"
                                width="40"
                                height="40"
                                style={{ objectFit: 'cover', borderColor: '#e2e8f0', borderWidth: '2px' }}
                              />
                              <div>
                                <div className="fw-semibold text-dark" style={{ fontSize: '13.5px', lineHeight: '1.35' }}>{item.name}</div>
                                <div className="text-muted mt-1" style={{ fontSize: '12px' }}>{item.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td>
                            {item.phone ? (
                              <span className="text-dark fw-medium fs-13">{item.phone}</span>
                            ) : (
                              <span className="text-muted">â€”</span>
                            )}
                          </td>

                          {/* Gender / DOB */}
                          <td className="text-muted fs-12">
                            {item.gender || item.dateOfBirth ? (
                              <div>
                                {item.gender && <span className="fw-medium text-dark">{item.gender}</span>}
                                {item.gender && item.dateOfBirth && <span> â€¢ </span>}
                                {item.dateOfBirth && <span>{item.dateOfBirth}</span>}
                              </div>
                            ) : (
                              <span>â€”</span>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            {item.isBlocked ? (
                              <span
                                className="badge d-inline-flex align-items-center gap-1"
                                style={{
                                  fontSize: '11.5px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#fef2f2',
                                  color: '#b91c1c',
                                  border: '1px solid #fecaca',
                                  fontWeight: 600,
                                }}
                              >
                                <iconify-icon icon="solar:forbidden-circle-bold" class="fs-13"></iconify-icon>
                                Suspended
                              </span>
                            ) : (
                              <span
                                className="badge d-inline-flex align-items-center gap-1.5"
                                style={{
                                  fontSize: '11.5px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f0fdf4',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  fontWeight: 600,
                                }}
                              >
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#16a34a',
                                    borderRadius: '50%',
                                  }}
                                ></span>
                                Active
                              </span>
                            )}
                          </td>

                          {/* Email Status */}
                          <td>
                            {item.isEmailVerified ? (
                              <span className="d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ color: '#15803d' }}>
                                <iconify-icon icon="solar:check-circle-bold" class="fs-15"></iconify-icon>
                                Verified
                              </span>
                            ) : (
                              <span className="d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ color: '#b45309' }}>
                                <iconify-icon icon="solar:clock-circle-bold" class="fs-15"></iconify-icon>
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Orders */}
                          <td>
                            <span
                              className="badge fw-semibold"
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#334155',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                padding: '4px 8px',
                              }}
                            >
                              {item._count?.orders ?? 0} Orders
                            </span>
                          </td>

                          {/* Registered */}
                          <td className="text-muted fs-12">
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Actions */}
                          <td className="text-end pe-3">
                            <div className="d-flex align-items-center justify-content-end" style={{ gap: '8px' }}>
                              {/* View Details */}
                              <button
                                type="button"
                                className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '7px',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1d4ed8',
                                  boxShadow: '0 1px 3px 0 rgba(29, 78, 216, 0.1)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="View Customer Profile"
                                onClick={() => setViewDetailsUser(item)}
                              >
                                <iconify-icon icon="solar:eye-bold" class="fs-15"></iconify-icon>
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '7px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  color: '#475569',
                                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Reset Password"
                                onClick={() => {
                                  setResetModalUser(item);
                                  setNewPassword('');
                                }}
                              >
                                <iconify-icon icon="solar:key-bold" class="fs-15"></iconify-icon>
                              </button>

                              {/* Block / Unblock */}
                              <button
                                type="button"
                                className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '7px',
                                  backgroundColor: item.isBlocked ? '#f0fdf4' : '#fffbeb',
                                  border: `1px solid ${item.isBlocked ? '#86efac' : '#fcd34d'}`,
                                  color: item.isBlocked ? '#15803d' : '#92400e',
                                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07)',
                                  transition: 'all 0.15s ease',
                                }}
                                title={item.isBlocked ? 'Unblock Customer' : 'Suspend Customer'}
                                onClick={() => handleToggleBlock(item)}
                              >
                                <iconify-icon
                                  icon={item.isBlocked ? 'solar:check-circle-bold' : 'solar:forbidden-circle-bold'}
                                  class="fs-15"
                                ></iconify-icon>
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '7px',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fca5a5',
                                  color: '#dc2626',
                                  boxShadow: '0 1px 3px 0 rgba(220, 38, 38, 0.12)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Delete Customer Account"
                                onClick={() => setDeleteModalUser(item)}
                              >
                                <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-15"></iconify-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: RESET PASSWORD MODAL
         ======================================================== */}
      {resetModalUser && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: '10px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #dbeafe',
                    }}
                  >
                    <iconify-icon icon="solar:key-broken" class="fs-18"></iconify-icon>
                  </div>
                  <div>
                    <h5 className="modal-title fs-15 fw-bold mb-0 text-dark">Reset Password</h5>
                    <small className="text-muted fs-12">
                      Assign new credentials for {resetModalUser.name}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setResetModalUser(null)}
                  disabled={isResetting}
                ></button>
              </div>

              <form onSubmit={handleResetPasswordSubmit}>
                <div className="modal-body px-4 py-3">
                  <div
                    className="p-3 mb-3 d-flex align-items-center gap-2.5 border"
                    style={{ backgroundColor: '#f8fafc', borderRadius: '8px', borderColor: '#e2e8f0' }}
                  >
                    <img
                      src={
                        resetModalUser.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          resetModalUser.name
                        )}`
                      }
                      alt={resetModalUser.name}
                      className="rounded-circle border"
                      width="38"
                      height="38"
                      style={{ objectFit: 'cover', borderColor: '#e2e8f0' }}
                    />
                    <div>
                      <div className="fw-bold text-dark fs-13">{resetModalUser.name}</div>
                      <div className="text-muted fs-12">{resetModalUser.email}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">
                      New Password <span className="text-danger">*</span>
                    </label>
                    <div
                      className="input-group"
                      style={{ borderRadius: '6px', overflow: 'hidden' }}
                    >
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control fs-13"
                        style={{ border: '1px solid #d1d5db', borderRight: 'none' }}
                        placeholder="Enter minimum 8 characters with letter & number"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="btn btn-white text-muted"
                        style={{ border: '1px solid #d1d5db', borderLeft: 'none' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <iconify-icon
                          icon={showPassword ? 'solar:eye-closed-broken' : 'solar:eye-broken'}
                          class="fs-16 align-middle"
                        ></iconify-icon>
                      </button>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small className="text-muted fs-11">
                        Must be at least 8 chars, 1 letter and 1 digit.
                      </small>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 fs-12 text-primary fw-semibold text-decoration-none"
                        onClick={generateStrongPassword}
                      >
                        âš¡ Generate Strong Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-2.5 bg-light-subtle d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm fs-13 fw-semibold text-secondary"
                    style={{
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      padding: '6px 14px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                    onClick={() => setResetModalUser(null)}
                    disabled={isResetting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary fs-13 fw-semibold d-flex align-items-center gap-1.5 text-white"
                    style={{
                      borderRadius: '6px',
                      backgroundColor: '#2563eb',
                      border: '1px solid #1d4ed8',
                      padding: '6px 16px',
                      boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.35)',
                    }}
                    disabled={isResetting}
                  >
                    {isResetting && <span className="spinner-border spinner-border-sm"></span>}
                    <span>Confirm &amp; Reset Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CONFIRM DELETE MODAL
          ======================================================== */}
      {deleteModalUser && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: '10px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-danger-subtle text-danger">
                <div className="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:danger-triangle-bold" class="fs-22"></iconify-icon>
                  <h5 className="modal-title fs-15 fw-bold mb-0">Confirm Account Deletion</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteModalUser(null)}
                  disabled={isDeleting}
                ></button>
              </div>

              <div className="modal-body px-4 py-3">
                <p className="text-dark fs-14 mb-2">
                  Are you sure you want to permanently delete the account for{' '}
                  <strong className="text-danger">{deleteModalUser.name}</strong> ({deleteModalUser.email})?
                </p>
                <div
                  className="alert alert-warning d-flex align-items-start gap-2 p-2.5 fs-12 mb-0 border"
                  style={{ borderRadius: '6px', borderColor: '#fef08a' }}
                >
                  <iconify-icon icon="solar:info-circle-broken" class="fs-18 flex-shrink-0 mt-0.5"></iconify-icon>
                  <div>
                    This action is permanent and cannot be undone. All active sessions, tokens, and
                    administrative privileges will be immediately revoked.
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-2.5 bg-light-subtle d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm fs-13 fw-semibold text-secondary"
                  style={{
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    padding: '6px 14px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                  onClick={() => setDeleteModalUser(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger fs-13 fw-semibold d-flex align-items-center gap-1.5 text-white"
                  style={{
                    borderRadius: '6px',
                    backgroundColor: '#dc2626',
                    border: '1px solid #b91c1c',
                    padding: '6px 16px',
                    boxShadow: '0 1px 3px 0 rgba(220, 38, 38, 0.35)',
                  }}
                  onClick={handleDeleteUserSubmit}
                  disabled={isDeleting}
                >
                  {isDeleting && <span className="spinner-border spinner-border-sm"></span>}
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: VIEW CUSTOMER DETAILS MODAL
          ======================================================== */}
      {viewDetailsUser && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: '10px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #dbeafe',
                    }}
                  >
                    <iconify-icon icon="solar:user-id-broken" class="fs-18"></iconify-icon>
                  </div>
                  <div>
                    <h5 className="modal-title fs-15 fw-bold mb-0 text-dark">Customer Profile Overview</h5>
                    <small className="text-muted fs-12">User ID #{viewDetailsUser.id}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewDetailsUser(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* Header card */}
                <div
                  className="p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 border"
                  style={{ backgroundColor: '#f8fafc', borderRadius: '8px', borderColor: '#e2e8f0' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={
                        viewDetailsUser.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          viewDetailsUser.name
                        )}`
                      }
                      alt={viewDetailsUser.name}
                      className="rounded-circle border"
                      width="52"
                      height="52"
                      style={{ objectFit: 'cover', borderColor: '#e2e8f0' }}
                    />
                    <div>
                      <h5 className="fw-bold text-dark mb-0.5">{viewDetailsUser.name}</h5>
                      <div className="text-muted fs-13 mb-1.5">{viewDetailsUser.email}</div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #dbeafe',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {viewDetailsUser.role}
                        </span>
                        {viewDetailsUser.isBlocked ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            Suspended
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            Active
                          </span>
                        )}
                        {viewDetailsUser.isEmailVerified ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            Email Verified
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            Email Unverified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className="fs-12 text-muted d-block">Account Created</span>
                    <span className="fw-semibold text-dark fs-13">
                      {new Date(viewDetailsUser.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div
                      className="border p-3 h-100"
                      style={{ borderRadius: '8px', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                    >
                      <h6 className="fw-bold text-dark fs-13 border-bottom pb-2 mb-3">
                        Personal &amp; Contact Info
                      </h6>
                      <ul className="list-unstyled mb-0 fs-13">
                        <li className="d-flex justify-content-between py-1.5 border-bottom border-light">
                          <span className="text-muted">Primary Phone:</span>
                          <span className="fw-medium text-dark">{viewDetailsUser.phone || 'Not provided'}</span>
                        </li>
                        <li className="d-flex justify-content-between py-1.5 border-bottom border-light">
                          <span className="text-muted">Alternate Phone:</span>
                          <span className="fw-medium text-dark">{viewDetailsUser.alternatePhone || 'Not provided'}</span>
                        </li>
                        <li className="d-flex justify-content-between py-1.5 border-bottom border-light">
                          <span className="text-muted">Gender:</span>
                          <span className="fw-medium text-dark">{viewDetailsUser.gender || 'Not specified'}</span>
                        </li>
                        <li className="d-flex justify-content-between py-1.5">
                          <span className="text-muted">Date of Birth:</span>
                          <span className="fw-medium text-dark">{viewDetailsUser.dateOfBirth || 'Not specified'}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div
                      className="border p-3 h-100"
                      style={{ borderRadius: '8px', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                    >
                      <h6 className="fw-bold text-dark fs-13 border-bottom pb-2 mb-3">
                        Address Setup
                      </h6>
                      {viewDetailsUser.address && typeof viewDetailsUser.address === 'object' ? (
                        <ul className="list-unstyled mb-0 fs-13">
                          <li className="d-flex justify-content-between py-1.5 border-bottom border-light">
                            <span className="text-muted">Street:</span>
                            <span className="fw-medium text-dark">
                              {(viewDetailsUser.address as any).street || 'â€”'}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between py-1.5 border-bottom border-light">
                            <span className="text-muted">City / Region:</span>
                            <span className="fw-medium text-dark">
                              {(viewDetailsUser.address as any).city || 'â€”'}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between py-1.5 border-bottom border-light">
                            <span className="text-muted">Postal Code:</span>
                            <span className="fw-medium text-dark">
                              {(viewDetailsUser.address as any).postalCode || 'â€”'}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between py-1.5">
                            <span className="text-muted">Country:</span>
                            <span className="fw-medium text-dark">
                              {(viewDetailsUser.address as any).country || 'Saudi Arabia'}
                            </span>
                          </li>
                        </ul>
                      ) : (
                        <p className="text-muted fs-13 mb-0">No shipping or billing address recorded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-2.5 bg-light-subtle d-flex justify-content-between">
                <div>
                  <button
                    type="button"
                    className="btn btn-sm d-inline-flex align-items-center gap-1.5"
                    style={{
                      borderRadius: '6px',
                      backgroundColor: viewDetailsUser.isBlocked ? '#f0fdf4' : '#fffbeb',
                      border: `1px solid ${viewDetailsUser.isBlocked ? '#bbf7d0' : '#fde68a'}`,
                      color: viewDetailsUser.isBlocked ? '#15803d' : '#b45309',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      padding: '6px 14px',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      handleToggleBlock(viewDetailsUser);
                      setViewDetailsUser((prev) =>
                        prev ? { ...prev, isBlocked: !prev.isBlocked } : null
                      );
                    }}
                  >
                    <iconify-icon
                      icon={
                        viewDetailsUser.isBlocked
                          ? 'solar:check-circle-bold'
                          : 'solar:forbidden-circle-bold'
                      }
                      class="fs-15"
                    ></iconify-icon>
                    <span>{viewDetailsUser.isBlocked ? 'Unblock Customer' : 'Suspend Customer'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-sm text-secondary"
                  style={{
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    padding: '6px 16px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontWeight: 600,
                  }}
                  onClick={() => setViewDetailsUser(null)}
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: CREATE USER / ADMIN MODAL
          ======================================================== */}
      {createModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: '10px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #dbeafe',
                    }}
                  >
                    <iconify-icon icon="solar:user-plus-bold" class="fs-18"></iconify-icon>
                  </div>
                  <div>
                    <h5 className="modal-title fs-15 fw-bold mb-0 text-dark">
                      {createForm.role === 'CUSTOMER' ? 'Add New Customer' : 'Add New Administrator'}
                    </h5>
                    <small className="text-muted fs-12">
                      Create an account directly with full access credentials
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isCreating}
                ></button>
              </div>

              <form onSubmit={handleCreateUserSubmit}>
                <div className="modal-body px-4 py-3">
                  {/* Role Type Selector */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">Account Role</label>
                    <select
                      className="form-select fs-13"
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                      }}
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          role: e.target.value as any,
                        })
                      }
                    >
                      <option value="ADMIN">Administrator (Staff)</option>
                      {isSuperAdmin && <option value="SUPER_ADMIN">Super Administrator (Root)</option>}
                      <option value="CUSTOMER">Customer (Storefront Shopper)</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control fs-13"
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                      }}
                      placeholder="e.g. John Doe"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control fs-13"
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                      }}
                      placeholder="e.g. admin@veuz.sa"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control fs-13"
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                      }}
                      placeholder="Minimum 8 characters with letter & number"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">Mobile / Phone</label>
                    <input
                      type="tel"
                      className="form-control fs-13"
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                      }}
                      placeholder="e.g. +966 50 123 4567"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>

                  {/* Gender & DOB */}
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label fs-13 fw-semibold text-dark">Gender</label>
                      <select
                        className="form-select fs-13"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                        }}
                        value={createForm.gender}
                        onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fs-13 fw-semibold text-dark">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control fs-13"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                        }}
                        value={createForm.dateOfBirth}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-2.5 bg-light-subtle d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm fs-13 fw-semibold text-secondary"
                    style={{
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      padding: '6px 14px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                    onClick={() => setCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary fs-13 fw-semibold d-flex align-items-center gap-1.5 text-white"
                    style={{
                      borderRadius: '6px',
                      backgroundColor: '#2563eb',
                      border: '1px solid #1d4ed8',
                      padding: '6px 16px',
                      boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.35)',
                    }}
                    disabled={isCreating}
                  >
                    {isCreating && <span className="spinner-border spinner-border-sm"></span>}
                    <span>Create Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
