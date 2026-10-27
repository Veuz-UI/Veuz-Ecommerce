'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import {
  StoreNotificationItem,
  NotificationType,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
  checkCartWaitingNotification,
  NOTIFICATIONS_UPDATED_EVENT,
} from '@/services/storeNotificationService';

interface StoreNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  alignRight?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const StoreNotificationDropdown: React.FC<StoreNotificationDropdownProps> = ({
  isOpen,
  onClose,
  alignRight = true,
  onMouseEnter,
  onMouseLeave,
}) => {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const { cart, totalCartItems } = useStore();
  const [notifications, setNotifications] = useState<StoreNotificationItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync user notifications from real store products & cart state
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    if (totalCartItems > 0 && cart.length > 0) {
      const firstItem = cart[0];
      checkCartWaitingNotification(
        user.id,
        totalCartItems,
        firstItem?.product?.name,
        firstItem?.product?.image
      );
    }

    setNotifications(getUserNotifications(user.id, user.name, undefined, user.settings));

    const handleUpdate = (e: any) => {
      if (e.detail && String(e.detail.userId) === String(user.id)) {
        setNotifications(e.detail.notifications);
      } else {
        setNotifications(getUserNotifications(user.id, user.name, undefined, user.settings));
      }
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    };
  }, [user, totalCartItems, cart]);

  // Click outside and Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Never close if clicked inside ANY notification dropdown or bell trigger button
      if (
        (panelRef.current && panelRef.current.contains(target)) ||
        target.closest('.store-notification-dropdown') ||
        target.closest('.header-notif-bell-btn')
      ) {
        return;
      }
      onClose();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!user || !isOpen) return null;

  // Immediate 100% reliable navigation to product details
  const navigateToProduct = (targetUrl?: string, notifId?: string) => {
    if (!targetUrl) return;
    if (notifId && user) {
      markNotificationAsRead(user.id, notifId);
    }
    onClose();
    window.location.href = targetUrl;
  };

  const handleRowClick = (item: StoreNotificationItem) => {
    const targetUrl = item.card?.linkUrl || item.actionUrl;
    if (targetUrl) {
      navigateToProduct(targetUrl, item.id);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(user.id, id, user, updateUserProfile);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user?.id) {
      clearAllNotifications(user.id, user, updateUserProfile);
    }
    setNotifications([]);
  };

  // Group notifications dynamically by date group (TODAY, YESTERDAY, 21 OCT, etc.)
  const groupedNotifications = notifications.reduce<Record<string, StoreNotificationItem[]>>((acc, item) => {
    const groupKey = item.group || 'TODAY';
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});

  // Round shape light transparent background with icon inside (NO profile photo!)
  const renderIconCircle = (type: NotificationType) => {
    switch (type) {
      case 'offer':
        return (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
        );

      case 'cart':
        return (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
        );

      case 'product':
        return (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
        );

      case 'welcome':
      default:
        return (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(14, 165, 233, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        );
    }
  };

  const renderNotificationRow = (item: StoreNotificationItem) => {
    const targetUrl = item.card?.linkUrl || item.actionUrl;

    return (
      <div
        key={item.id}
        onClick={() => handleRowClick(item)}
        onMouseDown={(e) => e.stopPropagation()}
        className="notif-row-wrapper position-relative"
        style={{
          padding: '14px 24px',
          cursor: targetUrl ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          borderBottom: '1px solid #f8fafc',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* 1. Round shape light transparent background inside icon (NO profile photo) */}
        {renderIconCircle(item.type)}

        {/* 2. Middle & Right Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top Line: Sender Name + Verified Badge + Time + Orange Unread Dot */}
          <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-1.5" style={{ minWidth: 0 }}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: '1.25',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.senderName || item.title}
              </span>

              {item.isVerified && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#2563eb" style={{ flexShrink: 0 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>

            {/* Time & Unread Orange Dot / Delete Icon */}
            <div className="d-flex flex-column align-items-end flex-shrink-0" style={{ minWidth: '42px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                {item.timeAgo}
              </span>

              <div className="d-flex align-items-center gap-1 mt-1">
                {!item.isRead && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#f97316',
                      display: 'inline-block',
                    }}
                    title="Unread"
                  />
                )}

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, item.id)}
                  className="btn btn-sm btn-link p-0 text-decoration-none border-0"
                  style={{
                    color: '#cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    transition: 'color 0.15s',
                  }}
                  title="Remove notification"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Message Text */}
          <div
            style={{
              fontSize: '12.8px',
              lineHeight: '1.45',
              color: '#334155',
              marginTop: '4px',
              wordBreak: 'break-word',
            }}
          >
            {item.message}
          </div>

          {/* 3. Embedded Preview Card for Real Product / Offer / Cart - Direct Instant Navigation */}
          {item.card && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateToProduct(targetUrl, item.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="notif-embedded-card d-flex align-items-center justify-content-between"
              style={{
                marginTop: '10px',
                padding: '9px 12px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
                transition: 'all 0.15s ease',
                gap: '10px',
                color: 'inherit',
                cursor: 'pointer',
                display: 'flex',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#f1f5f9';
              }}
            >
              {/* Card Left: Real Product Thumbnail / Icon */}
              <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0 }}>
                {item.card.image ? (
                  <img
                    src={item.card.image}
                    alt={item.card.title}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      objectFit: 'contain',
                      backgroundColor: '#ffffff',
                      padding: '3px',
                      border: '1px solid #eef2f6',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid #eef2f6',
                      color: item.card.badgeColor || '#2563eb',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                )}

                {/* Card Middle: Status Badge + Real Product Title + Real Price */}
                <div style={{ minWidth: 0 }}>
                  {item.card.badge && (
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: item.card.badgeColor || '#ea580c',
                        lineHeight: '1.2',
                        marginBottom: '2px',
                      }}
                    >
                      {item.card.badge}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.card.title}
                  </div>

                  {item.card.ratingOrPrice && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: 500,
                        marginTop: '2px',
                      }}
                    >
                      {item.card.ratingOrPrice}
                      {item.card.originalPrice && (
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginLeft: '6px' }}>
                          {item.card.originalPrice}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Right: Circular Arrow Action Button ( → ) */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop overlay to dismiss cleanly on outside tap */}
      <div
        className="d-xl-none store-notif-mobile-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          zIndex: 10090,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      <div
        ref={panelRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="store-notification-dropdown"
        style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: alignRight ? 0 : 'auto',
          left: alignRight ? 'auto' : 0,
          width: '390px',
          maxWidth: 'calc(100vw - 20px)',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 24px 50px -12px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          zIndex: 10095,
          overflow: 'hidden',
          animation: 'notifFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 1. Header Row (Title on Left, Clear & Close Buttons on Right) */}
        <div
          className="d-flex align-items-center justify-content-between store-notification-header"
          style={{
            padding: '16px 20px 14px 20px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <h5
              className="mb-0 fw-bold store-notification-title"
              style={{
                fontSize: '17px',
                color: '#0f172a',
                letterSpacing: '-0.3px',
              }}
            >
              Notifications
            </h5>
            {notifications.length > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {notifications.length}
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Clear Button: Cleans all messages & keeps notifications empty */}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                onMouseDown={(e) => e.stopPropagation()}
                className="btn btn-sm btn-link p-0 text-decoration-none d-flex align-items-center gap-1.5"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid rgba(239, 68, 68, 0.16)',
                  transition: 'all 0.15s ease',
                }}
                title="Clean all messages and keep empty"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Clear</span>
              </button>
            )}

            {/* Mobile / Quick Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="store-notif-close-btn"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* 2. Notification List with Sleek Scrollbar (Dynamic Date Groups) */}
        <div
          className="notifications-scroll-wrap"
          style={{
            overflowY: 'auto',
            maxHeight: '480px',
          }}
        >
          {notifications.length === 0 ? (
            <div
              className="store-notification-empty-wrap"
              style={{
                padding: '36px 20px 32px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Illustration with grid background & bell silhouette with '0' badge */}
              <div
                className="store-notification-empty-illus"
                style={{
                  position: 'relative',
                  width: '100px',
                  height: '84px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                {/* Subtle grid background pattern */}
                <svg
                  width="100"
                  height="84"
                  viewBox="0 0 130 110"
                  fill="none"
                  style={{ position: 'absolute', inset: 0, opacity: 0.6 }}
                >
                  <defs>
                    <pattern id="notif-empty-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#f1f5f9" strokeWidth="1.2" />
                    </pattern>
                  </defs>
                  <rect width="130" height="110" fill="url(#notif-empty-grid)" />
                </svg>

                {/* Bell Silhouette with dark '0' badge */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="#e2e8f0" style={{ display: 'block' }}>
                    <path d="M12 2C10.9 2 10 2.9 10 4V4.29C7.03 5.17 5 7.9 5 11.14V16.5L3.29 18.21C3.11 18.39 3 18.65 3 18.92C3 19.52 3.48 20 4.08 20H19.92C20.52 20 21 19.52 21 18.92C21 18.65 20.89 18.39 20.71 18.21L19 16.5V11.14C19 7.9 16.97 5.17 14 4.29V4C14 2.9 13.1 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z" />
                  </svg>

                  {/* Dark circular badge with '0' */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '7px',
                      right: '5px',
                      width: '17px',
                      height: '17px',
                      borderRadius: '50%',
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    0
                  </span>
                </div>
              </div>

              <h6
                className="store-notification-empty-title"
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '5px',
                  letterSpacing: '-0.2px',
                }}
              >
                No notifications yet!
              </h6>
              <p
                className="store-notification-empty-sub"
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: '1.45',
                  maxWidth: '260px',
                  margin: 0,
                }}
              >
                This area will light up with new notifications once there&apos;s activity on your account.
              </p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([groupTitle, items]) => (
              <div key={groupTitle}>
                <div
                  style={{
                    padding: '10px 20px 4px 20px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '0.6px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  {groupTitle}
                </div>
                {items.map(renderNotificationRow)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Responsive Styles for Phone Viewports */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .store-notification-dropdown {
            position: fixed !important;
            top: 68px !important;
            left: 10px !important;
            right: 10px !important;
            width: auto !important;
            max-width: calc(100vw - 20px) !important;
            max-height: calc(100vh - 85px) !important;
            border-radius: 16px !important;
            z-index: 10095 !important;
            margin: 0 auto !important;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.08) !important;
          }

          .notifications-scroll-wrap {
            max-height: calc(100vh - 160px) !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .store-notification-header {
            padding: 13px 16px 11px 16px !important;
          }

          .store-notification-title {
            font-size: 15.5px !important;
          }

          .store-notification-empty-wrap {
            padding: 26px 16px 22px 16px !important;
          }

          .store-notification-empty-illus {
            width: 86px !important;
            height: 72px !important;
            margin-bottom: 10px !important;
          }

          .store-notification-empty-title {
            font-size: 14px !important;
            margin-bottom: 3px !important;
          }

          .store-notification-empty-sub {
            font-size: 11.5px !important;
            line-height: 1.4 !important;
            max-width: 250px !important;
          }

          .notif-row-wrapper {
            padding: 11px 14px !important;
            gap: 11px !important;
          }
        }
      `}</style>
    </>
  );
};
