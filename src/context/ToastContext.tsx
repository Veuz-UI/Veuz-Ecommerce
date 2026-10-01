'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type ToastType = 'success' | 'danger' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  tag?: string;
  timestamp: string;
  isExiting?: boolean;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, tag?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (type: ToastType, message: string, title?: string, tag?: string) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('veuz-toast', { detail: { type, message, title, tag } })
          );
        }
      },
      dismissToast: () => {},
    };
  }
  return context;
};

// Global helper that can be called anywhere
export const triggerGlobalToast = (
  type: ToastType,
  message: string,
  title?: string,
  tag?: string
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('veuz-toast', { detail: { type, message, title, tag } })
    );
  }
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

  const dismissToast = useCallback((id: string) => {
    // If user is currently hovering the toast stack, wait until hover ends
    if (isHoveredRef.current) {
      setTimeout(() => dismissToast(id), 1200);
      return;
    }

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );

    // Smooth, slow 650ms gradual fade-out and slide-up before removing from DOM
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      pendingDismissTimeoutsRef.current.delete(id);
    }, 650);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, tag?: string) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newToast: ToastItem = {
        id,
        type,
        message,
        title,
        tag,
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

  // Listen to global custom events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: ToastType;
        message: string;
        title?: string;
        tag?: string;
      }>;
      if (customEvent.detail) {
        showToast(
          customEvent.detail.type || 'info',
          customEvent.detail.message || '',
          customEvent.detail.title,
          customEvent.detail.tag
        );
      }
    };

    window.addEventListener('veuz-toast', handleGlobalToast);
    return () => window.removeEventListener('veuz-toast', handleGlobalToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
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
          maxWidth: '380px',
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
          const defaultTitle =
            toast.type === 'success'
              ? 'Successfully Message'
              : toast.type === 'warning'
              ? 'Alert Message'
              : toast.type === 'danger'
              ? 'Error Message'
              : 'News Title';

          const titleText = toast.title || defaultTitle;
          const isNewsCard = toast.type === 'info' && (toast.tag || !toast.title);

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                border: '1px solid rgba(226, 232, 240, 0.85)',
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
                flexDirection: 'column',
                willChange: 'opacity, transform',
              }}
            >
              {isNewsCard ? (
                /* Top News Style Toast Card */
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        color: '#0284c7',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {toast.tag || 'NEWS'}
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        color: '#94a3b8',
                        cursor: 'pointer',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      aria-label="Close"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <h6
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: '0 0 6px 0',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {titleText}
                  </h6>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: '#64748b',
                      lineHeight: '1.45',
                      margin: '0 0 8px 0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {toast.message}
                  </p>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontWeight: 500,
                    }}
                  >
                    {toast.timestamp}
                  </div>
                </div>
              ) : (
                /* Action Toasts (Success, Warning, Danger, Info) */
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
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
                        {titleText}
                      </h6>
                      <button
                        type="button"
                        onClick={() => dismissToast(toast.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          color: '#94a3b8',
                          cursor: 'pointer',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        aria-label="Close"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                          marginTop: '3px',
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
                        marginTop: '4px',
                        fontWeight: 500,
                      }}
                    >
                      {toast.timestamp}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
