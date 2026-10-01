'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
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
  const { user: currentUser, isLoading: authLoading } = useAuth();

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
  const { showToast } = useToast();

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
    role: 'ADMIN' as 'ADMIN' | 'SUPER_ADMIN',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      if (res.success) {
        setUsers(res.users || []);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      showToast('danger', err.message || 'Failed to load user records.');
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, showToast]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin, fetchUsers]);

  // Toggle Block / Suspend
  const handleToggleBlock = async (targetUser: UserItem) => {
    if (currentUser?.id === targetUser.id) {
      showToast('danger', 'You cannot block your own logged-in account.');
      return;
    }
    if ((targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') && !isSuperAdmin) {
      showToast('danger', 'Only Super Administrators can modify administrator access status.');
      return;
    }

    try {
      const res = await apiClient.patch(`/admin/users/${targetUser.id}/block`, {
        isBlocked: !targetUser.isBlocked,
      });

      if (res.success) {
        const nextState = !targetUser.isBlocked;
        if (nextState) {
          showToast('warning', res.message || `Account for ${targetUser.name} has been suspended/blocked.`, 'Alert Message');
        } else {
          showToast('success', res.message || `Account for ${targetUser.name} has been activated.`, 'Successfully Message');
        }
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isBlocked: nextState } : u))
        );
        setCounts((prev) => ({
          ...prev,
          blocked: targetUser.isBlocked ? prev.blocked - 1 : prev.blocked + 1,
          active: targetUser.isBlocked ? prev.active + 1 : prev.active - 1,
        }));
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Failed to update user status.', 'Error Message');
    }
  };

  // Handle Reset Password (Staff only)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!newPassword || newPassword.length < 8) {
      showToast('danger', 'Password must be at least 8 characters long.', 'Error Message');
      return;
    }

    setIsResetting(true);
    try {
      const res = await apiClient.post(`/admin/users/${resetModalUser.id}/reset-password`, {
        newPassword,
      });

      if (res.success) {
        showToast('success', `Password successfully updated for ${resetModalUser.name}!`, 'Successfully Message');
        setResetModalUser(null);
        setNewPassword('');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Failed to reset password.', 'Error Message');
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
    pwd += 'A1!';
    setNewPassword(pwd);
  };

  // Handle Delete User (Staff only)
  const handleDeleteUserSubmit = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.delete(`/admin/users/${deleteModalUser.id}`);
      if (res.success) {
        showToast('danger', res.message || `Account for ${deleteModalUser.name} successfully deleted.`, 'Deleted Successfully');
        setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
        setDeleteModalUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Failed to delete user.', 'Error Message');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Create User Submit (Staff only: ADMIN or SUPER_ADMIN)
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      showToast('danger', 'Name, email, and password are required.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await apiClient.post('/admin/users', createForm);
      if (res.success) {
        showToast('success', res.message || 'Administrator account created successfully!');
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
      showToast('danger', err.message || 'Failed to create user account.');
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered Users for Tab 1: Staff Admins (SUPER_ADMIN and ADMIN)
  // Current logged in user is explicitly excluded
  const staffList = useMemo(() => {
    return users.filter((u) => {
      // Exclude logged in user's own profile from the table
      if (currentUser?.id && u.id === currentUser.id) return false;

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
  }, [users, currentUser?.id, roleFilter, statusFilter, searchQuery]);

  // Filtered Users for Tab 2: Customers
  // Current logged in user is explicitly excluded
  const customerList = useMemo(() => {
    return users.filter((u) => {
      // Exclude logged in user
      if (currentUser?.id && u.id === currentUser.id) return false;

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
  }, [users, currentUser?.id, statusFilter, searchQuery]);

  // If user is not superadmin, restrict access
  if (!authLoading && !isSuperAdmin) {
    return (
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-5 text-center">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            }}
          >
            <iconify-icon icon="solar:shield-warning-bold" class="fs-28"></iconify-icon>
          </div>
          <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>
            Access Restricted
          </h3>
          <p className="text-muted fs-14 mb-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
            User &amp; Staff Management is strictly restricted to Super Administrators. You do not have permission to view or manage platform accounts.
          </p>
          <Link
            href="/dashboard"
            className="btn btn-sm text-white fw-semibold px-4 py-2"
            style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================================================
          MAIN BACKGROUND WHITE CARD (Matching Shop Settings)
         ======================================================== */}
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-4 p-md-4">
          
          {/* 1. Header & Actions Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center text-muted fs-13" style={{ marginBottom: '24px', gap: '10px' }}>
                <Link href="/dashboard" className="text-muted text-decoration-none">
                  Dashboard
                </Link>
                <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
                <span className="text-dark fw-bold">User &amp; Staff Management</span>
              </div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                User &amp; Staff Management
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Manage team administrators, super administrators, platform permissions, and registered customer accounts.
              </p>
            </div>

            {/* Top Action Buttons: Refresh & Add Administrator (Only for Super Admin) */}
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                style={{
                  borderRadius: '8px',
                  padding: '9px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#0f172a',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s ease',
                }}
                onClick={fetchUsers}
                disabled={isLoading}
              >
                <iconify-icon icon="solar:restart-bold" class={`fs-16 ${isLoading ? 'spin' : ''}`}></iconify-icon>
                <span>Refresh</span>
              </button>

              {/* Add Administrator is strictly for SuperAdmin (Customers register directly via storefront) */}
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white"
                style={{
                  borderRadius: '8px',
                  padding: '10px 22px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  setCreateForm({
                    name: '',
                    email: '',
                    password: '',
                    role: 'ADMIN',
                    phone: '',
                    gender: 'Male',
                    dateOfBirth: '',
                  });
                  setCreateModalOpen(true);
                }}
              >
                <iconify-icon icon="solar:user-plus-bold" class="fs-17 text-white"></iconify-icon>
                <span>+ Add Administrator</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 22px 0' }}></div>

          {/* 2. Top Metric KPI Summary Cards (Using Standard System Styling - No Out-of-theme Colors) */}
          <div className="row g-3 mb-4">
            {/* Total Accounts */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '10px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Total Accounts
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <iconify-icon icon="solar:users-group-two-rounded-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>{counts.total}</h3>
                    <span
                      className="badge fs-11 fw-semibold d-inline-flex align-items-center gap-1.5"
                      style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px 8px' }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                      {counts.active} Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Super Admins (Clean System Theme) */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '10px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Super Admins
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <iconify-icon icon="solar:crown-star-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>{counts.superAdmins}</h3>
                    <span className="fs-12 text-muted fw-medium">Root Access</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrators (Clean System Theme) */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '10px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Administrators
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <iconify-icon icon="solar:shield-check-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>{counts.admins}</h3>
                    <span className="fs-12 text-muted fw-medium">Staff Members</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers (Clean System Theme) */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '10px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Registered Customers
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <iconify-icon icon="solar:bag-smile-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>{counts.customers}</h3>
                    {counts.blocked > 0 ? (
                      <span
                        className="badge fs-11 fw-semibold"
                        style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', padding: '4px 8px' }}
                      >
                        {counts.blocked} Blocked
                      </span>
                    ) : (
                      <span className="fs-12 text-muted fw-medium">Active Store Shoppers</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Navigation Tabs (Black & White Theme Matching Shop Settings) */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pb-3 mb-3 border-bottom">
            <div className="d-flex align-items-center gap-2.5">
              <button
                type="button"
                className={`btn d-flex align-items-center gap-2 fs-14 fw-semibold ${
                  activeTab === 'admins' ? 'text-white shadow-sm' : 'text-secondary border'
                }`}
                style={{
                  borderRadius: '8px',
                  padding: '9px 20px',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'admins' ? '#0f172a' : '#ffffff',
                  borderColor: activeTab === 'admins' ? '#0f172a' : '#e2e8f0',
                  color: activeTab === 'admins' ? '#ffffff' : '#475569',
                }}
                onClick={() => {
                  setActiveTab('admins');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                <iconify-icon icon="solar:shield-user-bold" class="fs-17"></iconify-icon>
                <span>Administrators</span>
                <span
                  className="badge rounded-pill px-2"
                  style={{
                    backgroundColor: activeTab === 'admins' ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                    color: activeTab === 'admins' ? '#ffffff' : '#475569',
                    fontSize: '11px',
                  }}
                >
                  {staffList.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn d-flex align-items-center gap-2 fs-14 fw-semibold ${
                  activeTab === 'customers' ? 'text-white shadow-sm' : 'text-secondary border'
                }`}
                style={{
                  borderRadius: '8px',
                  padding: '9px 20px',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'customers' ? '#0f172a' : '#ffffff',
                  borderColor: activeTab === 'customers' ? '#0f172a' : '#e2e8f0',
                  color: activeTab === 'customers' ? '#ffffff' : '#475569',
                }}
                onClick={() => {
                  setActiveTab('customers');
                  setStatusFilter('ALL');
                }}
              >
                <iconify-icon icon="solar:users-group-rounded-bold" class="fs-17"></iconify-icon>
                <span>Customers</span>
                <span
                  className="badge rounded-pill px-2"
                  style={{
                    backgroundColor: activeTab === 'customers' ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                    color: activeTab === 'customers' ? '#ffffff' : '#475569',
                    fontSize: '11px',
                  }}
                >
                  {customerList.length}
                </span>
              </button>
            </div>

            <div className="fs-13 text-muted">
              Showing <strong className="text-dark">{activeTab === 'admins' ? staffList.length : customerList.length}</strong> {activeTab === 'admins' ? 'team administrators' : 'registered customer accounts'}
            </div>
          </div>

          {/* 4. Search & Filter Bar (Strict Single Line & Unified 40px Height Alignment) */}
          <div
            className="p-3 mb-4 rounded-3 border d-flex align-items-center gap-3 flex-wrap flex-md-nowrap"
            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
          >
            {/* Search Input */}
            <div className="flex-grow-1" style={{ minWidth: '240px' }}>
              <div className="input-group" style={{ height: '40px', borderRadius: '8px', overflow: 'hidden' }}>
                <span
                  className="input-group-text bg-white border-end-0 text-muted px-3"
                  style={{ borderColor: '#d1d5db' }}
                >
                  <iconify-icon icon="solar:magnifer-linear" class="fs-16"></iconify-icon>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 fs-13"
                  style={{ borderColor: '#d1d5db', height: '40px' }}
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
                    className="btn btn-white border-start-0 text-muted"
                    style={{ borderColor: '#d1d5db' }}
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <iconify-icon icon="solar:close-circle-bold" class="fs-16"></iconify-icon>
                  </button>
                )}
              </div>
            </div>

            {/* Staff Role Filter (Only on Administrators Tab) */}
            {activeTab === 'admins' && (
              <div style={{ width: '180px', flexShrink: 0 }}>
                <select
                  className="form-select fs-13 fw-medium"
                  style={{
                    height: '40px',
                    borderRadius: '8px',
                    borderColor: '#d1d5db',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                  }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                >
                  <option value="ALL">All Staff Roles</option>
                  <option value="SUPER_ADMIN">Super Admins Only</option>
                  <option value="ADMIN">Admins Only</option>
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div style={{ width: '170px', flexShrink: 0 }}>
              <select
                className="form-select fs-13 fw-medium"
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  borderColor: '#d1d5db',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
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

          {/* 5. Table View: Matching Shop Settings Table Container */}
          <div className="table-responsive rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
            {isLoading ? (
              <div className="dashboard-loading-stable text-center py-5">
                <div className="spinner-border text-dark" role="status"></div>
                <p className="mt-2 fs-14 text-muted">Loading user database...</p>
              </div>
            ) : activeTab === 'admins' ? (
              /* ========================================================
                 TAB 1: ADMINISTRATORS TABLE (SUPER ADMIN & ADMIN ONLY)
                 ======================================================== */
              staffList.length === 0 ? (
                <div className="text-center py-5">
                  <iconify-icon icon="solar:user-cross-broken" class="fs-40 text-muted mb-2"></iconify-icon>
                  <h5 className="fs-15 text-dark fw-bold mb-1">No Administrators Found</h5>
                  <p className="fs-13 text-muted mb-3">Try adjusting your search criteria or role filters.</p>
                  <button
                    type="button"
                    className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                    style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
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
                <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '60px', letterSpacing: '0.6px' }}>#</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Administrator</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Role</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Contact</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold text-center" style={{ letterSpacing: '0.6px' }}>Status</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold text-center" style={{ letterSpacing: '0.6px' }}>Email Verified</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Joined Date</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold text-end" style={{ letterSpacing: '0.6px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((item, idx) => {
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td className="py-3.5 px-4 text-muted fs-13 fw-semibold">{idx + 1}</td>

                          {/* Administrator Info */}
                          <td className="py-3.5 px-4">
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
                                <div className="fw-bold text-dark" style={{ fontSize: '13.5px', lineHeight: '1.35' }}>
                                  {item.name}
                                </div>
                                <div className="text-muted mt-0.5" style={{ fontSize: '12px' }}>{item.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge (Standard System Colors: Black for SuperAdmin, Slate for Admin) */}
                          <td className="py-3.5 px-4">
                            {item.role === 'SUPER_ADMIN' ? (
                              <span
                                className="badge d-inline-flex align-items-center gap-1.5"
                                style={{
                                  backgroundColor: '#0f172a',
                                  color: '#ffffff',
                                  border: '1px solid #0f172a',
                                  fontWeight: 700,
                                  fontSize: '11.5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                <iconify-icon icon="solar:crown-star-bold" class="fs-13 text-white"></iconify-icon>
                                SUPER ADMIN
                              </span>
                            ) : (
                              <span
                                className="badge d-inline-flex align-items-center gap-1.5"
                                style={{
                                  backgroundColor: '#f1f5f9',
                                  color: '#0f172a',
                                  border: '1px solid #cbd5e1',
                                  fontWeight: 700,
                                  fontSize: '11.5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                <iconify-icon icon="solar:shield-check-bold" class="fs-13" style={{ color: '#0f172a' }}></iconify-icon>
                                ADMINISTRATOR
                              </span>
                            )}
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4">
                            {item.phone ? (
                              <span className="text-dark fw-semibold fs-13 font-monospace">{item.phone}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>

                          {/* Account Status */}
                          <td className="py-3.5 px-4 text-center">
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
                          <td className="py-3.5 px-4 text-center">
                            {item.isEmailVerified ? (
                              <span className="badge d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px 8px' }}>
                                <iconify-icon icon="solar:check-circle-bold" class="fs-13"></iconify-icon>
                                Verified
                              </span>
                            ) : (
                              <span className="badge d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '4px', padding: '4px 8px' }}>
                                <iconify-icon icon="solar:clock-circle-bold" class="fs-13"></iconify-icon>
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-muted fs-12">
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Actions: Matching Shop Settings Button Aesthetics */}
                          <td className="py-3.5 px-4 text-end">
                            <div className="d-flex align-items-center justify-content-end gap-2">
                              {/* Reset Password */}
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                style={{
                                  borderRadius: '8px',
                                  width: '36px',
                                  height: '36px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #d1d5db',
                                  color: '#0f172a',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Reset Password"
                                onClick={() => {
                                  setResetModalUser(item);
                                  setNewPassword('');
                                }}
                              >
                                <iconify-icon icon="solar:key-bold" class="fs-16"></iconify-icon>
                              </button>

                              {/* Block / Unblock Admin */}
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                style={{
                                  borderRadius: '8px',
                                  width: '36px',
                                  height: '36px',
                                  backgroundColor: item.isBlocked ? '#f0fdf4' : '#fffbeb',
                                  border: `1px solid ${item.isBlocked ? '#bbf7d0' : '#fde68a'}`,
                                  color: item.isBlocked ? '#16a34a' : '#b45309',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                  transition: 'all 0.15s ease',
                                }}
                                title={item.isBlocked ? 'Activate Account' : 'Suspend Account'}
                                onClick={() => handleToggleBlock(item)}
                              >
                                <iconify-icon
                                  icon={item.isBlocked ? 'solar:check-circle-bold' : 'solar:forbidden-circle-bold'}
                                  class="fs-17"
                                ></iconify-icon>
                              </button>

                              {/* Delete Admin */}
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                style={{
                                  borderRadius: '8px',
                                  width: '36px',
                                  height: '36px',
                                  backgroundColor: '#fee2e2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  boxShadow: '0 1px 2px rgba(220, 38, 38, 0.1)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Delete Account"
                                onClick={() => setDeleteModalUser(item)}
                              >
                                <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-17"></iconify-icon>
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
                 (ONLY VIEW & BLOCK ACTIONS - NO RESET PASSWORD, NO DELETE)
                 ======================================================== */
              customerList.length === 0 ? (
                <div className="text-center py-5">
                  <iconify-icon icon="solar:user-cross-broken" class="fs-40 text-muted mb-2"></iconify-icon>
                  <h5 className="fs-15 text-dark fw-bold mb-1">No Customers Found</h5>
                  <p className="fs-13 text-muted mb-3">Try adjusting your search query or status filter.</p>
                  <button
                    type="button"
                    className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                    style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '60px', letterSpacing: '0.6px' }}>#</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Customer</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Mobile Number</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Gender / DOB</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold text-center" style={{ letterSpacing: '0.6px' }}>Status</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold text-center" style={{ letterSpacing: '0.6px' }}>Email Verified</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold text-center" style={{ letterSpacing: '0.6px' }}>Orders</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Registered</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold text-end" style={{ letterSpacing: '0.6px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerList.map((item, idx) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td className="py-3.5 px-4 text-muted fs-13 fw-semibold">{idx + 1}</td>

                        {/* Customer Info */}
                        <td className="py-3.5 px-4">
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
                              <div className="fw-bold text-dark" style={{ fontSize: '13.5px', lineHeight: '1.35' }}>
                                {item.name}
                              </div>
                              <div className="text-muted mt-0.5" style={{ fontSize: '12px' }}>{item.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Mobile Number */}
                        <td className="py-3.5 px-4">
                          {item.phone ? (
                            <span className="badge bg-light text-dark border font-monospace fs-12" style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                              {item.phone}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        {/* Gender / DOB */}
                        <td className="py-3.5 px-4 text-muted fs-12">
                          {item.gender || item.dateOfBirth ? (
                            <div>
                              {item.gender && <span className="fw-medium text-dark">{item.gender}</span>}
                              {item.gender && item.dateOfBirth && <span> • </span>}
                              {item.dateOfBirth && <span>{item.dateOfBirth}</span>}
                            </div>
                          ) : (
                            <span>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
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
                        <td className="py-3.5 px-4 text-center">
                          {item.isEmailVerified ? (
                            <span className="badge d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px 8px' }}>
                              <iconify-icon icon="solar:check-circle-bold" class="fs-13"></iconify-icon>
                              Verified
                            </span>
                          ) : (
                            <span className="badge d-inline-flex align-items-center gap-1 fs-12 fw-semibold" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '4px', padding: '4px 8px' }}>
                              <iconify-icon icon="solar:clock-circle-bold" class="fs-13"></iconify-icon>
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Orders */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className="badge fw-semibold"
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '12px',
                            }}
                          >
                            {item._count?.orders ?? 0} Orders
                          </span>
                        </td>

                        {/* Registered */}
                        <td className="py-3.5 px-4 text-muted fs-12">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Actions: Strictly VIEW and BLOCK/UNBLOCK ONLY (No Reset Password, No Delete) */}
                        <td className="py-3.5 px-4 text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            {/* View Profile */}
                            <button
                              type="button"
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              style={{
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                backgroundColor: '#f1f5f9',
                                color: '#0f172a',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.15s ease',
                              }}
                              title="View Customer Profile"
                              onClick={() => setViewDetailsUser(item)}
                            >
                              <iconify-icon icon="solar:eye-bold" class="fs-17"></iconify-icon>
                            </button>

                            {/* Block / Unblock Toggle */}
                            <button
                              type="button"
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              style={{
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                backgroundColor: item.isBlocked ? '#f0fdf4' : '#fee2e2',
                                border: `1px solid ${item.isBlocked ? '#bbf7d0' : '#fecaca'}`,
                                color: item.isBlocked ? '#16a34a' : '#dc2626',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.15s ease',
                              }}
                              title={item.isBlocked ? 'Activate / Unblock Customer' : 'Suspend / Block Customer'}
                              onClick={() => handleToggleBlock(item)}
                            >
                              <iconify-icon
                                icon={item.isBlocked ? 'solar:check-circle-bold' : 'solar:forbidden-circle-bold'}
                                class="fs-17"
                              ></iconify-icon>
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

      {/* ========================================================
          MODAL 1: RESET PASSWORD MODAL (Staff Admins Only)
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
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <iconify-icon icon="solar:key-bold" class="fs-20"></iconify-icon>
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
                    className="p-3 mb-3 d-flex align-items-center gap-3 border"
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
                      width="42"
                      height="42"
                      style={{ objectFit: 'cover', borderColor: '#e2e8f0' }}
                    />
                    <div>
                      <div className="fw-bold text-dark fs-14">{resetModalUser.name}</div>
                      <div className="text-muted fs-12">{resetModalUser.email}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">
                      New Password <span className="text-danger">*</span>
                    </label>
                    <div
                      className="input-group"
                      style={{ borderRadius: '8px', overflow: 'hidden' }}
                    >
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control fs-13 py-2"
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
                        ⚡ Generate Strong Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light-subtle d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm fs-13 fw-semibold text-dark"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      padding: '9px 18px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                    onClick={() => setResetModalUser(null)}
                    disabled={isResetting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm fs-13 fw-semibold d-flex align-items-center gap-2 text-white"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #0f172a',
                      padding: '9px 20px',
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
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
          MODAL 2: CONFIRM DELETE MODAL (Staff Admins Only)
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
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-danger-subtle text-danger">
                <div className="d-flex align-items-center gap-2.5">
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
                  style={{ borderRadius: '8px', borderColor: '#fef08a' }}
                >
                  <iconify-icon icon="solar:info-circle-broken" class="fs-18 flex-shrink-0 mt-0.5"></iconify-icon>
                  <div>
                    This action is permanent and cannot be undone. All active sessions, tokens, and
                    administrative privileges will be immediately revoked.
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light-subtle d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm fs-13 fw-semibold text-dark"
                  style={{
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    padding: '9px 18px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                  onClick={() => setDeleteModalUser(null)}
                  disabled={isDeleting}
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm fs-13 fw-semibold d-flex align-items-center gap-2 text-white"
                  style={{
                    borderRadius: '8px',
                    backgroundColor: '#dc2626',
                    border: '1px solid #b91c1c',
                    padding: '9px 20px',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                  }}
                  onClick={handleDeleteUserSubmit}
                  disabled={isDeleting}
                >
                  {isDeleting && <span className="spinner-border spinner-border-sm"></span>}
                  <span>Yes, Delete Account</span>
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
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <iconify-icon icon="solar:user-id-bold" class="fs-20"></iconify-icon>
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
                {/* Header Profile Card */}
                <div
                  className="p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 border"
                  style={{ backgroundColor: '#f8fafc', borderRadius: '10px', borderColor: '#e2e8f0' }}
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
                      width="54"
                      height="54"
                      style={{ objectFit: 'cover', borderColor: '#e2e8f0', borderWidth: '2px' }}
                    />
                    <div>
                      <h5 className="fw-bold text-dark mb-0.5" style={{ fontSize: '16px' }}>{viewDetailsUser.name}</h5>
                      <div className="text-muted fs-13 mb-1.5">{viewDetailsUser.email}</div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 8px',
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
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 8px',
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
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 8px',
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
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 8px',
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
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 8px',
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
                      className="border p-3.5 h-100"
                      style={{ borderRadius: '10px', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                    >
                      <h6 className="fw-bold text-dark fs-13 border-bottom pb-2 mb-3">
                        Personal &amp; Contact Info
                      </h6>
                      <ul className="list-unstyled mb-0 fs-13">
                        <li className="d-flex justify-content-between py-2 border-bottom border-light">
                          <span className="text-muted">Mobile / Phone:</span>
                          <span className="fw-semibold text-dark font-monospace">{viewDetailsUser.phone || 'Not provided'}</span>
                        </li>
                        <li className="d-flex justify-content-between py-2 border-bottom border-light">
                          <span className="text-muted">Alternate Phone:</span>
                          <span className="fw-semibold text-dark font-monospace">{viewDetailsUser.alternatePhone || 'Not provided'}</span>
                        </li>
                        <li className="d-flex justify-content-between py-2 border-bottom border-light">
                          <span className="text-muted">Gender:</span>
                          <span className="fw-medium text-dark">{viewDetailsUser.gender || 'Not specified'}</span>
                        </li>
                        <li className="d-flex justify-content-between py-2">
                          <span className="text-muted">Date of Birth:</span>
                          <span className="fw-medium text-dark">{viewDetailsUser.dateOfBirth || 'Not specified'}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div
                      className="border p-3.5 h-100"
                      style={{ borderRadius: '10px', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                    >
                      <h6 className="fw-bold text-dark fs-13 border-bottom pb-2 mb-3">
                        Address Setup
                      </h6>
                      {viewDetailsUser.address && typeof viewDetailsUser.address === 'object' ? (
                        <ul className="list-unstyled mb-0 fs-13">
                          <li className="d-flex justify-content-between py-2 border-bottom border-light">
                            <span className="text-muted">Street:</span>
                            <span className="fw-medium text-dark">
                              {(viewDetailsUser.address as any).street || '—'}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between py-2 border-bottom border-light">
                            <span className="text-muted">City / Region:</span>
                            <span className="fw-medium text-dark">
                              {(viewDetailsUser.address as any).city || '—'}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between py-2 border-bottom border-light">
                            <span className="text-muted">Postal Code:</span>
                            <span className="fw-medium text-dark">
                              {(viewDetailsUser.address as any).postalCode || '—'}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between py-2">
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

              {/* Modal Footer: Matching Shop Settings Actions */}
              <div className="modal-footer border-top px-4 py-3 bg-light-subtle d-flex justify-content-between">
                <div>
                  <button
                    type="button"
                    className="btn btn-sm d-inline-flex align-items-center gap-2 fs-13 fw-semibold"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: viewDetailsUser.isBlocked ? '#f0fdf4' : '#fee2e2',
                      border: `1px solid ${viewDetailsUser.isBlocked ? '#bbf7d0' : '#fecaca'}`,
                      color: viewDetailsUser.isBlocked ? '#16a34a' : '#dc2626',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      padding: '8px 16px',
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
                      class="fs-16"
                    ></iconify-icon>
                    <span>{viewDetailsUser.isBlocked ? 'Unblock / Activate Customer' : 'Suspend / Block Customer'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-sm fs-13 fw-semibold text-dark"
                  style={{
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    padding: '8px 20px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
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
          MODAL 4: CREATE ADMINISTRATOR MODAL (SuperAdmin Only)
          (Only ADMIN and SUPER_ADMIN roles - No Customer role)
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
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <iconify-icon icon="solar:user-plus-bold" class="fs-20"></iconify-icon>
                  </div>
                  <div>
                    <h5 className="modal-title fs-15 fw-bold mb-0 text-dark">
                      Add New Administrator
                    </h5>
                    <small className="text-muted fs-12">
                      Create an administrative staff account with management privileges
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
                  {/* Role Type Selector (Only Admin & SuperAdmin) */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">Administrator Role</label>
                    <select
                      className="form-select fs-13 py-2"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
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
                      <option value="SUPER_ADMIN">Super Administrator (Root)</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control fs-13 py-2"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
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
                      className="form-control fs-13 py-2"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
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
                      className="form-control fs-13 py-2"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                      }}
                      placeholder="Minimum 8 characters with letter & number"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>

                  {/* Mobile Number (NUMBERS ONLY VALIDATION) */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">
                      Mobile / Phone Number <span className="text-muted fw-normal fs-12">(Numbers only)</span>
                    </label>
                    <div className="input-group" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                      <span className="input-group-text bg-light text-muted border-end-0 px-3" style={{ borderColor: '#d1d5db' }}>
                        <iconify-icon icon="solar:phone-calling-bold" class="fs-16"></iconify-icon>
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="form-control fs-13 py-2 border-start-0"
                        style={{
                          borderColor: '#d1d5db',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                        }}
                        placeholder="e.g. 966501234567"
                        value={createForm.phone}
                        onKeyDown={(e) => {
                          // Allow numbers, backspace, delete, arrows, tab, enter
                          if (
                            !/[0-9]/.test(e.key) &&
                            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                            !e.ctrlKey &&
                            !e.metaKey
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const numeric = e.target.value.replace(/\D/g, '');
                          setCreateForm((prev) => ({ ...prev, phone: numeric }));
                        }}
                      />
                    </div>
                  </div>

                  {/* Gender & DOB */}
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label fs-13 fw-semibold text-dark">Gender</label>
                      <select
                        className="form-select fs-13 py-2"
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
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
                        className="form-control fs-13 py-2"
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                        }}
                        value={createForm.dateOfBirth}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light-subtle d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm fs-13 fw-semibold text-dark"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      padding: '9px 18px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                    onClick={() => setCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm fs-13 fw-semibold d-flex align-items-center gap-2 text-white"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #0f172a',
                      padding: '9px 20px',
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                    }}
                    disabled={isCreating}
                  >
                    {isCreating && <span className="spinner-border spinner-border-sm"></span>}
                    <span>Create Administrator</span>
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
