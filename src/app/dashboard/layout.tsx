'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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

  // Security Gate: If user signs out or is unauthenticated, redirect directly to /login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Sync Rasket HTML attributes on <html> element and strictly isolate assets
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-bs-theme', theme);
    html.setAttribute('data-topbar-color', topbarColor);
    html.setAttribute('data-menu-color', 'light');
    html.setAttribute('data-menu-size', menuSize);

    // Actively disable any storefront stylesheets (from /assets/) so they NEVER conflict with dashboard!
    const storefrontLinks = document.querySelectorAll<HTMLLinkElement>(
      'link[data-origin="storefront"], link[href*="/assets/css/"]'
    );
    storefrontLinks.forEach((link) => {
      if (!link.href.includes('/dashboard-assets/')) {
        link.disabled = true;
      }
    });

    // Responsive initial check for mobile/tablet screens
    const handleResize = () => {
      if (window.innerWidth <= 1140) {
        html.setAttribute('data-menu-size', 'hidden');
      } else {
        html.setAttribute('data-menu-size', menuSize);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Clean up attributes when leaving the dashboard so storefront website is NEVER polluted!
      html.removeAttribute('data-bs-theme');
      html.removeAttribute('data-topbar-color');
      html.removeAttribute('data-menu-color');
      html.removeAttribute('data-menu-size');

      // Re-enable storefront styles when leaving dashboard
      storefrontLinks.forEach((link) => {
        if (!link.href.includes('/dashboard-assets/')) {
          link.disabled = false;
        }
      });
    };
  }, [theme, topbarColor, menuColor, menuSize]);

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
    setMenuSize((prev) => {
      if (prev === 'condensed' || prev === 'hidden') return 'default';
      return 'condensed';
    });
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
  };

  if (isLoading || (!isLoading && !user)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#ffffff',
        }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Redirecting...</span>
        </div>
      </div>
    );
  }

  // Security Gate: Protect Dashboard from regular non-admin customers
  if (!isLoading && user && !isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '440px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
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
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Access Denied</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            This administrator dashboard is strictly protected. Only authorized administrators with verified credentials can enter.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Return to Storefront
            </Link>
            <Link
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
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================================================
          ISOLATED DASHBOARD ASSETS (from src/Dashboard/assets)
          These styles and fonts are strictly scoped to /dashboard!
         ======================================================== */}
      <link href="/dashboard-assets/css/vendor.min.css" rel="stylesheet" type="text/css" />
      <link href="/dashboard-assets/css/icons.min.css" rel="stylesheet" type="text/css" />
      <link href="/dashboard-assets/css/app.min.css" rel="stylesheet" type="text/css" />
      <script src="/dashboard-assets/vendor/iconify-icon/iconify-icon.min.js" async></script>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Always enforce Light Mode Side Menu */
        .main-nav {
          background-color: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
        }

        .main-nav .menu-title {
          color: #64748b !important;
          font-weight: 600 !important;
        }

        .main-nav .navbar-nav .nav-link {
          color: #334155 !important;
          font-weight: 500 !important;
        }

        .main-nav .navbar-nav .nav-link:hover,
        .main-nav .navbar-nav .nav-link.active {
          color: #2563eb !important;
          background-color: rgba(37, 99, 235, 0.08) !important;
        }

        .main-nav .navbar-nav .nav-link .nav-icon {
          color: #64748b !important;
        }

        .main-nav .navbar-nav .nav-link:hover .nav-icon,
        .main-nav .navbar-nav .nav-link.active .nav-icon {
          color: #2563eb !important;
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

        /* Sidebar Logo behavior: show single full logo when expanded, show clean icon when condensed */
        .main-nav .logo-box {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 70px !important;
          padding: 0 16px !important;
          text-align: center !important;
        }

        .main-nav .logo-box a {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          text-decoration: none !important;
        }

        .main-nav .logo-box .logo-img-lg,
        .main-nav .logo-box .logo-lg {
          display: inline-block !important;
          height: 38px !important;
          width: auto !important;
          max-width: 180px !important;
          object-fit: contain !important;
        }

        .main-nav .logo-box .logo-icon-sm,
        .main-nav .logo-box .logo-sm {
          display: none !important;
          width: 34px !important;
          height: 34px !important;
          object-fit: contain !important;
        }

        /* Condensed & Collapsed states: hide full logo, show small icon */
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

        /* Hovering in sm-hover mode: show full logo */
        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-img-lg,
        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-lg {
          display: inline-block !important;
        }

        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-icon-sm,
        html[data-menu-size=sm-hover] .main-nav:hover .logo-box .logo-sm {
          display: none !important;
        }
      `}} />

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
                  <Link
                    href="/"
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    title="View Storefront"
                    style={{ borderRadius: '6px', fontWeight: '600' }}
                  >
                    <iconify-icon icon="solar:shop-2-broken" class="fs-18 align-middle"></iconify-icon>
                    <span>Storefront</span>
                  </Link>
                </div>

                {/* Theme Color (Light/Dark) */}
                <div className="topbar-item">
                  <button
                    type="button"
                    className="topbar-button"
                    id="light-dark-mode"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    title="Toggle Dark/Light Mode"
                  >
                    {theme === 'light' ? (
                      <iconify-icon icon="solar:moon-broken" class="fs-24 align-middle light-mode"></iconify-icon>
                    ) : (
                      <iconify-icon icon="solar:sun-broken" class="fs-24 align-middle dark-mode"></iconify-icon>
                    )}
                  </button>
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
                <div className="dropdown topbar-item position-relative">
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

                {/* Theme Settings Button */}
                <div className="topbar-item d-none d-md-flex">
                  <button
                    type="button"
                    className="topbar-button"
                    id="theme-settings-btn"
                    onClick={() => setThemeOffcanvasOpen(true)}
                    title="Theme Settings"
                  >
                    <iconify-icon icon="solar:settings-broken" class="fs-24 align-middle"></iconify-icon>
                  </button>
                </div>

                {/* User Dropdown */}
                <div className="dropdown topbar-item position-relative">
                  <button
                    type="button"
                    className="topbar-button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
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
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '8px',
                        display: 'block',
                        minWidth: '220px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        zIndex: 1050,
                      }}
                    >
                      <h6 className="dropdown-header">Welcome {user?.name || 'Administrator'}!</h6>
                      <div className="px-3 pb-2">
                        <span className="badge bg-primary-subtle text-primary fs-10">
                          {user?.role || 'ADMIN'}
                        </span>
                      </div>

                      <Link
                        className="dropdown-item"
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <i className="bx bx-home-alt text-muted fs-18 align-middle me-1"></i>
                        <span className="align-middle">Dashboard Overview</span>
                      </Link>

                      <Link
                        className="dropdown-item"
                        href="/"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <i className="bx bx-store text-muted fs-18 align-middle me-1"></i>
                        <span className="align-middle">Go to Storefront</span>
                      </Link>

                      <div className="dropdown-divider my-1"></div>

                      <button
                        type="button"
                        className="dropdown-item text-danger"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                      >
                        <i className="bx bx-log-out fs-18 align-middle me-1"></i>
                        <span className="align-middle">Logout (Admin)</span>
                      </button>
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

              {/* 2. Calendar */}
              <li className="nav-item">
                <Link className={`nav-link ${pathname === '/dashboard/calendar' ? 'active' : ''}`} href="/dashboard/calendar">
                  <span className="nav-icon">
                    <iconify-icon icon="solar:calendar-broken"></iconify-icon>
                  </span>
                  <span className="nav-text"> Calendar </span>
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
        <div className="page-content">
          <div className="container-fluid">
            {children}
          </div>

          {/* ========== Footer Start ========== */}
          <footer className="footer">
            <div className="container-fluid">
              <div className="row">
                <div className="col-12 text-center">
                  {new Date().getFullYear()} &copy; Veuz Safety &amp; PPE Dashboard. Crafted with{' '}
                  <iconify-icon icon="solar:hearts-bold-duotone" class="fs-18 align-middle text-danger"></iconify-icon>{' '}
                  for Industrial Safety E-Commerce.
                </div>
              </div>
            </div>
          </footer>
          {/* ========== Footer End ========== */}
        </div>

      </div>
    </>
  );
}
