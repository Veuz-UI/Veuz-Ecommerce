'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin, isLoading } = useAuth();

  // Layout Theme State (matching Rasket config.js)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [topbarColor, setTopbarColor] = useState<'light' | 'dark'>('light');
  const [menuColor, setMenuColor] = useState<'light' | 'dark'>('light');
  const [menuSize, setMenuSize] = useState<'default' | 'condensed' | 'hidden' | 'sm-hover-active' | 'sm-hover'>('default');

  // UI Interactive States
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openNestedSubmenu, setOpenNestedSubmenu] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeOffcanvasOpen, setThemeOffcanvasOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [overlayRemoved, setOverlayRemoved] = useState(false);
  const [sidebarBackdrop, setSidebarBackdrop] = useState(false);

  // Dropdown Refs & Click Outside Handler
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileHoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleProfileMouseEnter = () => {
    if (profileHoverTimeout.current) {
      clearTimeout(profileHoverTimeout.current);
      profileHoverTimeout.current = null;
    }
    setProfileDropdownOpen(true);
  };

  const handleProfileMouseLeave = () => {
    if (profileHoverTimeout.current) {
      clearTimeout(profileHoverTimeout.current);
    }
    profileHoverTimeout.current = setTimeout(() => {
      setProfileDropdownOpen(false);
    }, 180);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (profileHoverTimeout.current) {
        clearTimeout(profileHoverTimeout.current);
      }
    };
  }, []);

  // 1. One-time synchronous stylesheet isolation for the dashboard
  useIsomorphicLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    // Synchronously disable any storefront stylesheets (from /assets/) before paint
    const storefrontLinks = document.querySelectorAll<HTMLLinkElement>(
      'link[data-origin="storefront"], link[href*="/assets/css/"]'
    );
    storefrontLinks.forEach((link) => {
      if (!link.href.includes('/dashboard-assets/')) {
        link.disabled = true;
      }
    });

    // Synchronously enable dashboard stylesheets before paint
    const dashLinks = document.querySelectorAll<HTMLLinkElement>('link[href*="/dashboard-assets/"]');
    dashLinks.forEach((link) => {
      link.disabled = false;
    });

    return () => {
      // Re-enable storefront styles when leaving dashboard
      storefrontLinks.forEach((link) => {
        if (!link.href.includes('/dashboard-assets/')) {
          link.disabled = false;
        }
      });

      // Disable dashboard styles when leaving dashboard
      dashLinks.forEach((link) => {
        link.disabled = true;
      });

      // Clean up attributes when leaving dashboard so storefront website is 100% pure
      const html = document.documentElement;
      html.removeAttribute('data-bs-theme');
      html.removeAttribute('data-topbar-color');
      html.removeAttribute('data-menu-color');
      html.removeAttribute('data-menu-size');
      html.classList.remove('sidebar-enable');
    };
  }, []); // Run ONLY once when mounting/unmounting dashboard!

  // 2. Synchronously sync Rasket HTML attributes on <html> element without touching stylesheets
  useIsomorphicLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.setAttribute('data-bs-theme', theme);
    html.setAttribute('data-topbar-color', topbarColor);
    html.setAttribute('data-menu-color', 'light');
    html.setAttribute('data-menu-size', menuSize);
  }, [theme, topbarColor, menuColor, menuSize]);

  // 3. Responsive resize check
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth <= 1140) {
        setMenuSize((prev) => (prev !== 'hidden' ? 'hidden' : prev));
      } else {
        setMenuSize((prev) => (prev === 'hidden' ? 'default' : prev));
        document.documentElement.classList.remove('sidebar-enable');
        setSidebarBackdrop(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Robust readiness & security management
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      setIsLayoutReady(true);
      setOverlayRemoved(true);
      return;
    }

    // Give browser 180ms to compute CSS layout underneath the overlay
    const readyTimer = setTimeout(() => {
      setIsLayoutReady(true);
    }, 180);

    // Unmount overlay after 250ms fade-out finishes (180ms + 250ms = 430ms)
    const removeTimer = setTimeout(() => {
      setOverlayRemoved(true);
    }, 430);

    return () => {
      clearTimeout(readyTimer);
      clearTimeout(removeTimer);
    };
  }, [isLoading, user, isAdmin, router]);

  // Smoothly ensure page starts at the top without shaking or jumping
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    } catch (e) {}

    // Single smooth top reset without multiple jarring timeouts
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Menu Size Toggle (Hamburger)
  const toggleMenuSize = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1140) {
      const html = document.documentElement;
      const isEnabled = html.classList.toggle('sidebar-enable');
      setSidebarBackdrop(isEnabled);
    } else {
      setMenuSize((prev) => (prev === 'condensed' ? 'default' : 'condensed'));
    }
  };

  const closeSidebarDrawer = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('sidebar-enable');
    }
    setSidebarBackdrop(false);
  };

  // Submenu Toggle Accordion
  const toggleSubmenu = (menuId: string) => {
    setOpenSubmenu((prev) => (prev === menuId ? null : menuId));
  };

  const toggleNestedSubmenu = (nestedId: string) => {
    setOpenNestedSubmenu((prev) => (prev === nestedId ? null : nestedId));
  };

  // Reset Layout Configuration
  const resetLayout = () => {
    setTheme('light');
    setTopbarColor('light');
    setMenuColor('light');
    setMenuSize('default');
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('sidebar-enable');
    }
    setSidebarBackdrop(false);
  };

  return (
    <>
      {/* ========================================================
          ISOLATED DASHBOARD ASSETS (from src/Dashboard/assets)
          Rendered immediately from mount so styles are cached & ready!
         ======================================================== */}
      <link href="/dashboard-assets/css/vendor.min.css" rel="stylesheet" type="text/css" />
      <link href="/dashboard-assets/css/icons.min.css" rel="stylesheet" type="text/css" />
      <link href="/dashboard-assets/css/app.min.css" rel="stylesheet" type="text/css" />
      <script src="/dashboard-assets/vendor/iconify-icon/iconify-icon.min.js" async></script>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dashSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes dashFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ========================================================
           SYSTEM-MATCHED SIDEBAR & DASHBOARD HEADER AESTHETICS
           ======================================================== */

        /* 1. Header (Topbar) System Colors */
        header.topbar,
        .topbar {
          background-color: #ffffff !important;
          border-bottom: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03) !important;
        }

        .topbar .button-toggle-menu {
          color: #0f172a !important;
          border-radius: 8px !important;
        }

        .topbar .button-toggle-menu:hover {
          background-color: #f1f5f9 !important;
        }

        .topbar .app-search input {
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          color: #0f172a !important;
          font-size: 13px !important;
        }

        .topbar .app-search input:focus {
          border-color: #0f172a !important;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08) !important;
        }

        .topbar .search-widget-icon {
          color: #94a3b8 !important;
        }

        .topbar .topbar-button {
          color: #475569 !important;
        }

        .topbar .topbar-button:hover {
          color: #0f172a !important;
          background-color: #f1f5f9 !important;
          border-radius: 8px !important;
        }

        /* 2. Side Menu (Main Nav) System Colors & Background */
        .main-nav {
          background-color: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02) !important;
        }

        .main-nav .menu-title {
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.6px !important;
          text-transform: uppercase !important;
          padding: 16px 20px 8px 20px !important;
        }

        .main-nav .navbar-nav {
          padding: 0 10px !important;
        }

        .main-nav .navbar-nav .nav-item {
          margin-bottom: 4px !important;
        }

        .main-nav .navbar-nav .nav-link {
          color: #475569 !important;
          font-weight: 500 !important;
          font-size: 13.5px !important;
          border-radius: 8px !important;
          padding: 9.5px 14px !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          transition: background-color 0.15s ease, color 0.15s ease !important;
        }

        .main-nav .navbar-nav .nav-link .nav-icon {
          color: #64748b !important;
          font-size: 19px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: color 0.15s ease !important;
        }

        /* Hover: subtle system slate background */
        .main-nav .navbar-nav .nav-link:hover {
          color: #0f172a !important;
          background-color: #f1f5f9 !important;
        }

        .main-nav .navbar-nav .nav-link:hover .nav-icon {
          color: #0f172a !important;
        }

        /* Active: Solid System Black with Crisp White Text (Matches Shop Settings & Quick Links) */
        .main-nav .navbar-nav .nav-link.active {
          color: #ffffff !important;
          background-color: #0f172a !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 4px rgba(15, 23, 42, 0.18) !important;
        }

        .main-nav .navbar-nav .nav-link.active .nav-icon {
          color: #ffffff !important;
        }

        /* Sidebar: Completely kill horizontal scroll and provide sleek light scrollbar */
        .main-nav .scrollbar {
          height: calc(100vh - 70px) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(0, 0, 0, 0.15) transparent !important;
        }

        .main-nav .scrollbar::-webkit-scrollbar {
          width: 5px !important;
          height: 0px !important;
          display: block !important;
        }

        .main-nav .scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }

        .main-nav .scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15) !important;
          border-radius: 10px !important;
        }

        .main-nav .scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3) !important;
        }

        /* Prevent ApexCharts from overflowing into adjacent cards/columns */
        #dash-performance-chart {
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }

        #dash-performance-chart .apexcharts-canvas,
        #dash-performance-chart .apexcharts-canvas svg {
          max-width: 100% !important;
          width: 100% !important;
        }

        #dash-performance-chart .apexcharts-canvas foreignObject {
          max-width: 100% !important;
        }

        /* 3. Sidebar Logo Alignment & Sizing (Left aligned with menu text when expanded) */
        .main-nav .logo-box {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          height: 70px !important;
          padding: 0 24px !important;
          text-align: left !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .main-nav .logo-box a {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          width: auto !important;
          text-decoration: none !important;
        }

        /* Refined, balanced logo size (not overly big) left-aligned to start where menu text begins */
        .main-nav .logo-box .logo-img-lg,
        .main-nav .logo-box .logo-lg {
          display: inline-block !important;
          height: 30px !important;
          width: auto !important;
          max-width: 140px !important;
          object-fit: contain !important;
          object-position: left center !important;
        }

        .main-nav .logo-box .logo-icon-sm,
        .main-nav .logo-box .logo-sm {
          display: none !important;
          width: 32px !important;
          height: 32px !important;
          object-fit: contain !important;
        }

        /* When Condensed / Mini Sidebar: center the icon */
        html[data-menu-size=condensed] .main-nav .logo-box,
        html[data-menu-size=sm-hover] .main-nav:not(:hover) .logo-box {
          justify-content: center !important;
          padding: 0 !important;
        }

        html[data-menu-size=condensed] .main-nav .logo-box a,
        html[data-menu-size=sm-hover] .main-nav:not(:hover) .logo-box a {
          justify-content: center !important;
        }

        html[data-menu-size=condensed] .main-nav .logo-box .logo-img-lg,
        html[data-menu-size=condensed] .main-nav .logo-box .logo-lg,
        html[data-menu-size=sm-hover] .main-nav:not(:hover) .logo-box .logo-img-lg,
        html[data-menu-size=sm-hover] .main-nav:not(:hover) .logo-box .logo-lg {
          display: none !important;
        }

        html[data-menu-size=condensed] .main-nav .logo-box .logo-icon-sm,
        html[data-menu-size=condensed] .main-nav .logo-box .logo-sm,
        html[data-menu-size=sm-hover] .main-nav:not(:hover) .logo-box .logo-icon-sm,
        html[data-menu-size=sm-hover] .main-nav:not(:hover) .logo-box .logo-sm {
          display: inline-block !important;
        }

        /* Hovering in sm-hover mode: show full left-aligned logo */
        html[data-menu-size=sm-hover] .main-nav:hover .logo-box {
          justify-content: flex-start !important;
          padding: 0 24px !important;
        }

        html[data-menu-size=sm-hover] .main-nav:hover .logo-box a {
          justify-content: flex-start !important;
        }

        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-img-lg,
        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-lg {
          display: inline-block !important;
        }

        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-icon-sm,
        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-sm {
          display: none !important;
        }

        /* 5. Dashboard Modals Fullscreen Backdrop (Over Topbar & Sidebar) */
        .modal.show,
        .modal.fade.show,
        .modal.d-block {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 1070 !important;
          background-color: rgba(15, 23, 42, 0.72) !important;
          backdrop-filter: blur(2px) !important;
          -webkit-backdrop-filter: blur(2px) !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }

        .modal-dialog {
          z-index: 1075 !important;
        }
      `}} />

      {!isLoading && !user ? (
        /* Unauthenticated: Redirecting state */
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                border: '3.5px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'dashSpin 0.7s linear infinite',
                margin: '0 auto 16px auto',
              }}
            />
            <h6 style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', margin: '0 0 4px 0' }}>
              Redirecting to Sign In...
            </h6>
          </div>
        </div>
      ) : !isLoading && user && !isAdmin ? (
        /* Access Denied for regular non-admin customers */
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '440px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 20px auto',
              }}
            >
              🚫
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>Access Denied</h1>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              This administrator dashboard is strictly protected. Only authorized administrators with verified credentials can enter.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a
                href="/"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Return to Storefront
              </a>
              <a
                href="/login"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Admin Sign In
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Main Dashboard UI with Zero-FOUC Overlay */
        <>
          <div className="wrapper">

        {/* ========================================================
            1. TOPBAR (Exact Rasket Topbar)
           ======================================================== */}
        <header className="topbar">
          <div className="container-fluid">
            <div className="navbar-header">
              
              {/* Left Side: Menu Toggle + Search */}
              <div className="d-flex align-items-center gap-2">
                <div className="topbar-item">
                  <button
                    type="button"
                    className="button-toggle-menu topbar-button"
                    onClick={toggleMenuSize}
                    title="Toggle Sidebar"
                  >
                    <iconify-icon icon="solar:hamburger-menu-broken" class="fs-24 align-middle"></iconify-icon>
                  </button>
                </div>

                {/* App Search */}
                <form className="app-search d-none d-md-block me-auto" onSubmit={(e) => e.preventDefault()}>
                  <div className="position-relative">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search..."
                      autoComplete="off"
                    />
                    <iconify-icon icon="solar:magnifer-broken" class="search-widget-icon"></iconify-icon>
                  </div>
                </form>
              </div>

              {/* Right Side: Theme, Fullscreen, Notifications, Settings, User */}
              <div className="d-flex align-items-center gap-1">
                
                {/* Storefront Shortcut Link */}
                <div className="topbar-item d-none d-sm-flex me-1">
                  <a
                    href="/"
                    className="btn btn-sm d-inline-flex align-items-center gap-1.5"
                    title="View Storefront"
                    style={{
                      borderRadius: '8px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      color: '#0f172a',
                      padding: '6px 14px',
                      fontSize: '13px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <iconify-icon icon="solar:shop-2-broken" class="fs-17 align-middle text-dark"></iconify-icon>
                    <span>Storefront</span>
                  </a>
                </div>


                {/* Fullscreen Toggle */}
                <div className="dropdown topbar-item d-none d-lg-flex">
                  <button
                    type="button"
                    className="topbar-button"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                  >
                    <iconify-icon
                      icon={isFullscreen ? 'solar:quit-full-screen-broken' : 'solar:full-screen-broken'}
                      class="fs-24 align-middle"
                    ></iconify-icon>
                  </button>
                </div>

                {/* Notification Dropdown */}
                <div ref={notificationsRef} className="dropdown topbar-item position-relative">
                  <button
                    type="button"
                    className="topbar-button position-relative"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    title="Notifications"
                  >
                    <iconify-icon icon="solar:bell-bing-broken" class="fs-24 align-middle"></iconify-icon>
                    <span className="position-absolute topbar-badge fs-10 translate-middle badge bg-danger rounded-pill">
                      3<span className="visually-hidden">unread messages</span>
                    </span>
                  </button>

                  {notificationsOpen && (
                    <div
                      className="dropdown-menu py-0 dropdown-lg dropdown-menu-end show"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '8px',
                        display: 'block',
                        minWidth: '320px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        zIndex: 1050,
                      }}
                    >
                      <div className="p-3 border-bottom">
                        <div className="row align-items-center">
                          <div className="col">
                            <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                          </div>
                          <div className="col-auto">
                            <span className="badge bg-primary-subtle text-primary">3 New</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <div className="dropdown-item py-3 border-bottom text-wrap d-flex align-items-start gap-2">
                          <div className="avatar-sm bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center p-2">
                            <i className="bx bx-cart fs-18"></i>
                          </div>
                          <div>
                            <p className="mb-0 fs-13 fw-semibold">New Safety Order #9842</p>
                            <small className="text-muted">3M Respirator + Safety Harness (1,450 SR)</small>
                          </div>
                        </div>

                        <div className="dropdown-item py-3 border-bottom text-wrap d-flex align-items-start gap-2">
                          <div className="avatar-sm bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center p-2">
                            <i className="bx bx-shield fs-18"></i>
                          </div>
                          <div>
                            <p className="mb-0 fs-13 fw-semibold">Low Stock Alert</p>
                            <small className="text-muted">Heavy Duty Welding Gloves &lt; 15 units</small>
                          </div>
                        </div>

                        <div className="dropdown-item py-3 text-wrap d-flex align-items-start gap-2">
                          <div className="avatar-sm bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center p-2">
                            <i className="bx bx-user-check fs-18"></i>
                          </div>
                          <div>
                            <p className="mb-0 fs-13 fw-semibold">Admin Invite Accepted</p>
                            <small className="text-muted">Admin successfully onboarded</small>
                          </div>
                        </div>
                      </div>

                      <div className="text-center py-2 border-top">
                        <small className="text-muted">All clear for today</small>
                      </div>
                    </div>
                  )}
                </div>


                {/* User Dropdown */}
                <div
                  ref={profileDropdownRef}
                  className="dropdown topbar-item position-relative"
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  <button
                    type="button"
                    className="topbar-button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <img
                        className="rounded-circle"
                        width="32"
                        height="32"
                        src={user?.avatar || '/dashboard-assets/images/users/avatar-1.jpg'}
                        alt={user?.name || 'Admin'}
                        style={{ objectFit: 'cover' }}
                      />
                      <span className="d-none d-lg-block fw-semibold fs-13">
                        {user?.name?.split(' ')[0] || 'Admin'}
                      </span>
                    </span>
                  </button>

                  {profileDropdownOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show"
                      onMouseEnter={handleProfileMouseEnter}
                      onMouseLeave={handleProfileMouseLeave}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '8px',
                        display: 'block',
                        minWidth: '235px',
                        padding: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                        borderRadius: '12px',
                        zIndex: 1050,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Invisible hover bridge to prevent mouse leaving during cursor transit */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          left: 0,
                          right: 0,
                          height: '12px',
                        }}
                      />
                      {/* User Header */}
                      <div
                        style={{
                          padding: '12px 18px',
                          backgroundColor: '#f8fafc',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            lineHeight: 1.2,
                            marginBottom: '3px',
                          }}
                        >
                          Welcome
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#0f172a',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={user?.name || 'Administrator'}
                        >
                          {user?.name || 'Administrator'}
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: user?.role === 'SUPER_ADMIN' ? '#0f172a' : '#f1f5f9',
                              color: user?.role === 'SUPER_ADMIN' ? '#ffffff' : '#0f172a',
                              border: user?.role === 'SUPER_ADMIN' ? '1px solid #0f172a' : '1px solid #cbd5e1',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              letterSpacing: '0.4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {user?.role || 'ADMIN'}
                          </span>
                        </div>
                      </div>

                      {/* Menu List */}
                      <div style={{ padding: '6px 0' }}>
                        {/* 1. My Profile */}
                        <a
                          className="dropdown-item d-flex align-items-center"
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            padding: '9px 18px',
                            fontSize: '13.5px',
                            fontWeight: 500,
                            color: '#334155',
                            gap: '12px',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                        >
                          <i
                            className="bx bx-user text-muted fs-18"
                            style={{ width: '20px', textAlign: 'center', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          ></i>
                          <span className="align-middle">My Profile</span>
                        </a>

                        {/* 2. Settings */}
                        <a
                          className="dropdown-item d-flex align-items-center"
                          href="/profile#settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            padding: '9px 18px',
                            fontSize: '13.5px',
                            fontWeight: 500,
                            color: '#334155',
                            gap: '12px',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                        >
                          <i
                            className="bx bx-cog text-muted fs-18"
                            style={{ width: '20px', textAlign: 'center', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          ></i>
                          <span className="align-middle">Settings</span>
                        </a>

                        {/* 3. Go to Storefront */}
                        <a
                          className="dropdown-item d-flex align-items-center"
                          href="/"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            padding: '9px 18px',
                            fontSize: '13.5px',
                            fontWeight: 500,
                            color: '#334155',
                            gap: '12px',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                        >
                          <i
                            className="bx bx-store text-muted fs-18"
                            style={{ width: '20px', textAlign: 'center', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          ></i>
                          <span className="align-middle">Go to Storefront</span>
                        </a>

                        <div className="dropdown-divider my-1 border-top" style={{ borderColor: '#f1f5f9' }}></div>

                        {/* 4. Logout (Admin) */}
                        <button
                          type="button"
                          className="dropdown-item d-flex align-items-center text-danger w-100"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          style={{
                            padding: '9px 18px',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            gap: '12px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                        >
                          <i
                            className="bx bx-log-out fs-18 text-danger"
                            style={{ width: '20px', textAlign: 'center', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          ></i>
                          <span className="align-middle">Logout (Admin)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </header>

        {/* ========================================================
            2. APP MENU (Exact Rasket Main Sidenav)
           ======================================================== */}
        <div className="main-nav">
          
          {/* Sidebar Logo */}
          <div className="logo-box">
            <Link href="/dashboard">
              <img
                src="/assets/imgs/theme/veuz-icon.png"
                className="logo-icon-sm logo-sm"
                alt="Veuz"
              />
              <img
                src="/assets/imgs/theme/logo.jpg"
                className="logo-img-lg logo-lg"
                alt="Veuz Concepts"
              />
            </Link>
          </div>

          {/* Menu Toggle Button (sm-hover) */}
          <button
            type="button"
            className="button-sm-hover"
            aria-label="Show Full Sidebar"
            onClick={toggleMenuSize}
          >
            <iconify-icon icon="solar:hamburger-menu-broken" class="button-sm-hover-icon"></iconify-icon>
          </button>

          <div className="scrollbar" style={{ height: 'calc(100vh - 70px)', overflowY: 'auto', overflowX: 'hidden' }}>
            <ul className="navbar-nav" id="navbar-nav">
              
              {/* Section: Menu */}
              <li className="menu-title">Menu</li>

              {/* 1. Dashboard */}
              <li className="nav-item">
                <Link className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`} href="/dashboard">
                  <span className="nav-icon">
                    <iconify-icon icon="solar:home-2-broken"></iconify-icon>
                  </span>
                  <span className="nav-text"> Dashboard </span>
                </Link>
              </li>




              {/* 3. User Management (SUPER_ADMIN only) */}
              {user?.role === 'SUPER_ADMIN' && (
                <li className="nav-item">
                  <Link className={`nav-link ${pathname?.startsWith('/dashboard/users') ? 'active' : ''}`} href="/dashboard/users">
                    <span className="nav-icon">
                      <iconify-icon icon="solar:users-group-two-rounded-broken"></iconify-icon>
                    </span>
                    <span className="nav-text"> User Management </span>
                  </Link>
                </li>
              )}

              {/* 4. Products Management */}
              <li className="nav-item">
                <Link className={`nav-link ${pathname?.startsWith('/dashboard/all-products') ? 'active' : ''}`} href="/dashboard/all-products">
                  <span className="nav-icon">
                    <iconify-icon icon="solar:box-minimalistic-broken"></iconify-icon>
                  </span>
                  <span className="nav-text"> All Products </span>
                </Link>
              </li>

              {/* 5. Shop Settings */}
              <li className="nav-item">
                <Link className={`nav-link ${pathname?.startsWith('/dashboard/shop-settings') ? 'active' : ''}`} href="/dashboard/shop-settings">
                  <span className="nav-icon">
                    <iconify-icon icon="solar:settings-minimalistic-broken"></iconify-icon>
                  </span>
                  <span className="nav-text"> Shop Settings </span>
                </Link>
              </li>

              {/* 6. Banner Settings */}
              <li className="nav-item">
                <Link className={`nav-link ${pathname?.startsWith('/dashboard/banner-settings') ? 'active' : ''}`} href="/dashboard/banner-settings">
                  <span className="nav-icon">
                    <iconify-icon icon="solar:gallery-wide-broken"></iconify-icon>
                  </span>
                  <span className="nav-text"> Banner Settings </span>
                </Link>
              </li>

              {/* 7. Our Partners */}
              <li className="nav-item">
                <Link className={`nav-link ${pathname?.startsWith('/dashboard/our-partners') ? 'active' : ''}`} href="/dashboard/our-partners">
                  <span className="nav-icon">
                    <iconify-icon icon="solar:hand-shake-broken"></iconify-icon>
                  </span>
                  <span className="nav-text"> Our Partners </span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ========================================================
            3. RIGHT SIDEBAR (Theme Settings Offcanvas)
           ======================================================== */}
        <div
          className={`offcanvas offcanvas-end border-0 ${themeOffcanvasOpen ? 'show' : ''}`}
          tabIndex={-1}
          id="theme-settings-offcanvas"
          style={{ visibility: themeOffcanvasOpen ? 'visible' : 'hidden', zIndex: 1060 }}
        >
          <div className="d-flex align-items-center bg-primary p-3 offcanvas-header">
            <h5 className="text-white m-0">Theme Settings</h5>
            <button
              type="button"
              className="btn-close btn-close-white ms-auto"
              onClick={() => setThemeOffcanvasOpen(false)}
              aria-label="Close"
            ></button>
          </div>

          <div className="offcanvas-body p-0">
            <div className="p-3 settings-bar">
              
              {/* Color Scheme */}
              <div>
                <h5 className="mb-3 font-16 fw-semibold">Color Scheme</h5>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-bs-theme"
                    id="layout-color-light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                  />
                  <label className="form-check-label" htmlFor="layout-color-light">Light</label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-bs-theme"
                    id="layout-color-dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                  />
                  <label className="form-check-label" htmlFor="layout-color-dark">Dark</label>
                </div>
              </div>

              {/* Topbar Color */}
              <div>
                <h5 className="my-3 font-16 fw-semibold">Topbar Color</h5>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-topbar-color"
                    id="topbar-color-light"
                    checked={topbarColor === 'light'}
                    onChange={() => setTopbarColor('light')}
                  />
                  <label className="form-check-label" htmlFor="topbar-color-light">Light</label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-topbar-color"
                    id="topbar-color-dark"
                    checked={topbarColor === 'dark'}
                    onChange={() => setTopbarColor('dark')}
                  />
                  <label className="form-check-label" htmlFor="topbar-color-dark">Dark</label>
                </div>
              </div>

              {/* Menu Color */}
              <div>
                <h5 className="my-3 font-16 fw-semibold">Menu Color</h5>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-menu-color"
                    id="leftbar-color-light"
                    checked={true}
                    readOnly
                  />
                  <label className="form-check-label" htmlFor="leftbar-color-light">Light (Always Enabled)</label>
                </div>
              </div>

              {/* Sidebar Size */}
              <div>
                <h5 className="my-3 font-16 fw-semibold">Sidebar Size</h5>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-menu-size"
                    id="leftbar-size-default"
                    checked={menuSize === 'default'}
                    onChange={() => setMenuSize('default')}
                  />
                  <label className="form-check-label" htmlFor="leftbar-size-default">Default</label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-menu-size"
                    id="leftbar-size-small"
                    checked={menuSize === 'condensed'}
                    onChange={() => setMenuSize('condensed')}
                  />
                  <label className="form-check-label" htmlFor="leftbar-size-small">Condensed</label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="data-menu-size"
                    id="leftbar-size-small-hover"
                    checked={menuSize === 'sm-hover-active'}
                    onChange={() => setMenuSize('sm-hover-active')}
                  />
                  <label className="form-check-label" htmlFor="leftbar-size-small-hover">Small Hover</label>
                </div>
              </div>

            </div>
          </div>

          <div className="offcanvas-footer border-top p-3 text-center">
            <button type="button" className="btn btn-danger w-100" onClick={resetLayout}>
              Reset Settings
            </button>
          </div>
        </div>

        {/* Offcanvas Backdrop */}
        {themeOffcanvasOpen && (
          <div
            className="offcanvas-backdrop fade show"
            onClick={() => setThemeOffcanvasOpen(false)}
            style={{ zIndex: 1055 }}
          ></div>
        )}

        {/* ========================================================
            4. PAGE CONTENT (Right side container)
           ======================================================== */}
        <div className="page-content" style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 70px)' }}>
          <div className="container-fluid py-3">
            {children}
          </div>

          {/* ========== Footer Start ========== */}
          <footer className="footer">
            <div className="container-fluid">
              <div className="row">
                <div className="col-12 text-center text-muted fs-13">
                  {new Date().getFullYear()} &copy; Veuz Safety &amp; PPE Dashboard.
                </div>
              </div>
            </div>
          </footer>
          {/* ========== Footer End ========== */}
        </div>
      </div>

      {/* Mobile Sidebar Drawer Backdrop */}
      {sidebarBackdrop && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={closeSidebarDrawer}
          style={{ zIndex: 1035 }}
        />
      )}

      {/* Seamless Starter / Refresh Overlay with smooth fade-out */}
      {!overlayRemoved && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isLayoutReady ? 0 : 1,
            pointerEvents: isLayoutReady ? 'none' : 'auto',
            transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                border: '3.5px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'dashSpin 0.7s linear infinite',
                margin: '0 auto 16px auto',
              }}
            />
            <h6 style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', margin: '0 0 4px 0' }}>
              Loading Dashboard...
            </h6>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              Preparing administrative workspace
            </p>
          </div>
        </div>
      )}
    </>
  )}
</>
);
}
