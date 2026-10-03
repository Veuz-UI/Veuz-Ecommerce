'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type ToastType = 'success' | 'danger' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  message: string;
  title?: string;
  tag?: string;
  timestamp: string;
  isExiting?: boolean;
}

export interface ToastContextType {
  showToast: (
    typeOrMessage: ToastType | string,
    messageOrType?: string | ToastType,
    title?: string,
    tag?: string
  ) => void;
  dismissToast: (id: string, force?: boolean) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  danger: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

export function normalizeToastArgs(
  arg1: ToastType | string,
  arg2?: string | ToastType,
  title?: string,
  tag?: string
): { type: 'success' | 'danger' | 'info' | 'warning'; message: string; title: string; tag?: string } {
  const recognizedTypes = ['success', 'danger', 'info', 'warning', 'error'];

  let resolvedType: 'success' | 'danger' | 'info' | 'warning' = 'success';
  let resolvedMessage = '';
  let resolvedTitle = title || '';
  let resolvedTag = tag;

  if (typeof arg1 === 'string' && recognizedTypes.includes(arg1.toLowerCase()) && typeof arg2 === 'string') {
    // Called as showToast('success', 'Message', 'Title', 'Tag')
    const t = arg1.toLowerCase();
    resolvedType = t === 'error' ? 'danger' : (t as any);
    resolvedMessage = arg2;
  } else if (typeof arg1 === 'string' && typeof arg2 === 'string' && recognizedTypes.includes(arg2.toLowerCase())) {
    // Called as showToast('Message', 'error', 'Title', 'Tag')
    const t = arg2.toLowerCase();
    resolvedType = t === 'error' ? 'danger' : (t as any);
    resolvedMessage = arg1;
  } else if (typeof arg1 === 'string') {
    // Called as showToast('Message')
    resolvedMessage = arg1;
    if (typeof arg2 === 'string' && !recognizedTypes.includes(arg2.toLowerCase())) {
      resolvedTitle = arg2;
    }

    // Auto-detect type based on action keywords in message
    const lower = resolvedMessage.toLowerCase();
    if (lower.includes('delete') || lower.includes('removed')) {
      resolvedType = 'danger';
      if (!resolvedTitle) resolvedTitle = 'Deleted Successfully';
    } else if (lower.includes('block') || lower.includes('suspend')) {
      resolvedType = 'warning';
      if (!resolvedTitle) resolvedTitle = 'Account Suspended';
    } else if (lower.includes('fail') || lower.includes('error') || lower.includes('invalid') || lower.includes('not allow')) {
      resolvedType = 'danger';
      if (!resolvedTitle) resolvedTitle = 'Error Message';
    } else if (lower.includes('info') || lower.includes('notice')) {
      resolvedType = 'info';
      if (!resolvedTitle) resolvedTitle = 'Information';
    } else {
      resolvedType = 'success';
    }
  }

  // Derive intelligent, user-specified titles if not explicitly given
  if (!resolvedTitle) {
    const lower = resolvedMessage.toLowerCase();
    if (resolvedType === 'success') {
      if (lower.includes('save') || lower.includes('profile') || lower.includes('address') || lower.includes('setting') || lower.includes('preference') || lower.includes('detail') || lower.includes('password') || lower.includes('photo')) {
        resolvedTitle = 'Saved Successfully';
      } else if (lower.includes('activat') || lower.includes('unblock')) {
        resolvedTitle = 'Account Activated';
      } else {
        resolvedTitle = 'Successfully Message';
      }
    } else if (resolvedType === 'warning') {
      if (lower.includes('block') || lower.includes('suspend')) {
        resolvedTitle = 'Account Suspended';
      } else {
        resolvedTitle = 'Alert Message';
      }
    } else if (resolvedType === 'danger') {
      if (lower.includes('delete') || lower.includes('remov')) {
        resolvedTitle = 'Deleted Successfully';
      } else if (lower.includes('block') || lower.includes('suspend')) {
        resolvedTitle = 'Action Blocked';
      } else {
        resolvedTitle = 'Error Message';
      }
    } else {
      resolvedTitle = 'Information';
    }
  }

  return {
    type: resolvedType,
    message: resolvedMessage,
    title: resolvedTitle,
    tag: resolvedTag,
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global helper that can be called anywhere in the app (even outside React tree)
export const triggerGlobalToast = (
  typeOrMessage: ToastType | string,
  messageOrType?: string | ToastType,
  title?: string,
  tag?: string
) => {
  if (typeof window !== 'undefined') {
    const detail = normalizeToastArgs(typeOrMessage, messageOrType, title, tag);
    window.dispatchEvent(new CustomEvent('veuz-toast', { detail }));
  }
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (typeOrMessage, messageOrType, title, tag) => {
        triggerGlobalToast(typeOrMessage, messageOrType, title, tag);
      },
      dismissToast: () => {},
      success: (msg, title) => triggerGlobalToast('success', msg, title),
      error: (msg, title) => triggerGlobalToast('danger', msg, title),
      danger: (msg, title) => triggerGlobalToast('danger', msg, title),
      warning: (msg, title) => triggerGlobalToast('warning', msg, title),
      info: (msg, title) => triggerGlobalToast('info', msg, title),
    };
  }
  return context;
};

const formatToastTimestamp = (): string => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `Today ${hours}:${minutes}${ampm}`;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isHoveredRef = useRef<boolean>(false);
  const lastDismissTimeRef = useRef<number>(0);
  const pendingDismissTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string, force: boolean = false) => {
    // If auto-dismiss triggered while user is hovering the toast stack, wait until hover ends
    if (!force && isHoveredRef.current) {
      setTimeout(() => dismissToast(id, false), 1500);
      return;
    }

    // Cancel any pending automatic dismiss timer for this toast
    const existingTimer = pendingDismissTimeoutsRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      pendingDismissTimeoutsRef.current.delete(id);
    }

    // Mark as exiting
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );

    // Smooth removal
    const exitDuration = force ? 240 : 400;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      pendingDismissTimeoutsRef.current.delete(id);
    }, exitDuration);
  }, []);

  const showToast = useCallback(
    (
      typeOrMessage: ToastType | string,
      messageOrType?: string | ToastType,
      title?: string,
      tag?: string
    ) => {
      const { type, message, title: parsedTitle, tag: parsedTag } = normalizeToastArgs(
        typeOrMessage,
        messageOrType,
        title,
        tag
      );

      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newToast: ToastItem = {
        id,
        type,
        message,
        title: parsedTitle,
        tag: parsedTag,
        timestamp: formatToastTimestamp(),
        isExiting: false,
      };

      setToasts((prev) => [...prev, newToast]);

      const now = Date.now();
      // Ensure each toast stays visible and staggers with at least 2200ms spacing
      // so if 3 or 4 toasts arrive, they slowly and smoothly disappear one-by-one from top
      const minDuration = 5200; // minimum stay duration
      const scheduledTime = Math.max(now + minDuration, lastDismissTimeRef.current + 2200);
      lastDismissTimeRef.current = scheduledTime;

      const delayForThisToast = scheduledTime - now;

      const timerId = setTimeout(() => {
        dismissToast(id);
      }, delayForThisToast);

      pendingDismissTimeoutsRef.current.set(id, timerId);
    },
    [dismissToast]
  );

  const success = useCallback((msg: string, t?: string) => showToast('success', msg, t), [showToast]);
  const error = useCallback((msg: string, t?: string) => showToast('danger', msg, t), [showToast]);
  const danger = useCallback((msg: string, t?: string) => showToast('danger', msg, t), [showToast]);
  const warning = useCallback((msg: string, t?: string) => showToast('warning', msg, t), [showToast]);
  const info = useCallback((msg: string, t?: string) => showToast('info', msg, t), [showToast]);

  // Listen to global custom events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        const { type, message, text, title, tag } = customEvent.detail;
        const msg = message || text || '';
        showToast(type || 'success', msg, title, tag);
      }
    };

    window.addEventListener('veuz-toast', handleGlobalToast);
    return () => window.removeEventListener('veuz-toast', handleGlobalToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, success, error, danger, warning, info }}>
      {children}

      {/* Floating Vertical Toast Stack (Stacked down by down, smooth slide-down from top) */}
      <div
        className="toast-stack-container"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxWidth: '390px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none',
        }}
      >
        <style>{`
          @keyframes toastSlideInDown {
            0% {
              opacity: 0;
              transform: translateY(-24px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>

        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow:
                  '0 12px 28px -4px rgba(0, 0, 0, 0.08), 0 6px 12px -3px rgba(0, 0, 0, 0.03)',
                padding: '16px 20px',
                animation: 'toastSlideInDown 0.36s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                transition:
                  'opacity 0.65s cubic-bezier(0.4, 0, 0.2, 1), transform 0.65s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.65s ease, margin 0.65s ease, padding 0.65s ease',
                opacity: toast.isExiting ? 0 : 1,
                transform: toast.isExiting
                  ? 'translateY(-14px) scale(0.95)'
                  : 'translateY(0) scale(1)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                willChange: 'opacity, transform',
              }}
            >
              {/* Icon on Left */}
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {toast.type === 'success' && (
                  /* Green circular check outline */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.5" />
                    <path d="M8.5 12.2l2.4 2.4 4.8-4.8" />
                  </svg>
                )}

                {toast.type === 'warning' && (
                  /* Yellow / Amber exclamation circular outline */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.5" />
                    <line x1="12" y1="8" x2="12" y2="12.5" />
                    <circle cx="12" cy="16" r="1" fill="#f59e0b" stroke="none" />
                  </svg>
                )}

                {toast.type === 'danger' && (
                  /* Red bullseye / dot inside circle */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.5" />
                    <circle cx="12" cy="12" r="2.8" fill="#ef4444" stroke="none" />
                  </svg>
                )}

                {toast.type === 'info' && (
                  /* Blue circular info outline */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.5" />
                    <line x1="12" y1="16" x2="12" y2="11.5" />
                    <circle cx="12" cy="8" r="1" fill="#0284c7" stroke="none" />
                  </svg>
                )}
              </div>

              {/* Body Content */}
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <h6
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: 0,
                      letterSpacing: '-0.2px',
                      lineHeight: '1.3',
                    }}
                  >
                    {toast.title}
                  </h6>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dismissToast(toast.id, true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      borderRadius: '6px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#0f172a';
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    aria-label="Close"
                    title="Dismiss"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {toast.message && (
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: '#64748b',
                      marginTop: '4px',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                    }}
                  >
                    {toast.message}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '5px',
                    fontWeight: 500,
                  }}
                >
                  {toast.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
