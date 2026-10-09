'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShopSettingsData, ShopCategory, MainMenuItem } from '@/data/defaultShopSettings';
import { fetchShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';

const formatNavigationLabel = (label: string) =>
  label.toLocaleLowerCase().replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());

const getMegaProductPreview = (label: string) => {
  const words = label.trim().split(/\s+/);
  return words.length > 4 ? `${words.slice(0, 4).join(' ')}…` : label;
};

const getMenuBadgeStyle = (badge?: string): React.CSSProperties => {
  if (badge === 'NEW') return { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' };
  if (badge === 'OFFER') return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
  if (badge === 'LIMITED SALE') return { backgroundColor: '#fef9c3', color: '#a16207', border: '1px solid #fde68a' };
  return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
};

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchCatOpen, setSearchCatOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Search by CATEGORIES');
  const [searchInput, setSearchInput] = useState('');
  const [shopCatOpen, setShopCatOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<ShopCategory | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');
  const [locationOpen, setLocationOpen] = useState(false);
  const [mobileLocOpen, setMobileLocOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Khobar Shamaliya');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleAccountMouseEnter = () => {
    if (accountTimerRef.current) {
      clearTimeout(accountTimerRef.current);
      accountTimerRef.current = null;
    }
    setAccountOpen(true);
  };

  const handleAccountMouseLeave = () => {
    accountTimerRef.current = setTimeout(() => {
      setAccountOpen(false);
    }, 300);
  };

  // Desktop Mega Menu Graceful Hover State (280ms grace period to prevent premature closing on diagonal cursor moves)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const megaMenuTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMegaMenuEnter = (menuKey: string) => {
    if (megaMenuTimerRef.current) {
      clearTimeout(megaMenuTimerRef.current);
      megaMenuTimerRef.current = null;
    }
    setActiveMegaMenu(menuKey);
  };

  const handleMegaMenuLeave = () => {
    if (megaMenuTimerRef.current) {
      clearTimeout(megaMenuTimerRef.current);
    }
    megaMenuTimerRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 280);
  };

  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const accountRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLLIElement>(null);
  const searchCatRef = useRef<HTMLDivElement>(null);
  const shopCatRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
      if (mobileAccountRef.current && !mobileAccountRef.current.contains(event.target as Node)) {
        setMobileAccountOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setLocationOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (searchCatRef.current && !searchCatRef.current.contains(event.target as Node)) {
        setSearchCatOpen(false);
      }
      if (shopCatRef.current && !shopCatRef.current.contains(event.target as Node)) {
        setShopCatOpen(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(prev => (prev === id ? null : id));
  };

  // Do not render demo/default navigation while the current dashboard settings load.
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [mainMenuItems, setMainMenuItems] = useState<MainMenuItem[]>([]);

  // Sync settings dynamically from local cache & server
  useEffect(() => {
    let isMounted = true;
    fetchShopSettings().then((data) => {
      if (isMounted && data) {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setShopCategories(data.categories);
        }
        if (Array.isArray(data.mainMenu) && data.mainMenu.length > 0) {
          setMainMenuItems(data.mainMenu);
        }
      }
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ShopSettingsData>;
      if (customEvent.detail) {
        if (Array.isArray(customEvent.detail.categories)) {
          setShopCategories(customEvent.detail.categories);
        }
        if (Array.isArray(customEvent.detail.mainMenu)) {
          setMainMenuItems(customEvent.detail.mainMenu);
        }
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'veuz_shop_settings_cache' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.categories) setShopCategories(parsed.categories);
          if (parsed.mainMenu) setMainMenuItems(parsed.mainMenu);
        } catch (err) {}
      }
    };

    window.addEventListener(SHOP_SETTINGS_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener(SHOP_SETTINGS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const categories = shopCategories.filter((c) => c.isActive !== false);

  const locations = [
    'Khobar Shamaliya',
    'Riyadh Central',
    'Jeddah Port',
    'Dammam City',
    'Dubai Downtown',
    'Abu Dhabi Marina',
    'India',
    'Alabama',
    'Alaska',
    'Arizona',
    'Florida',
    'Georgia',
    'Hawaii',
    'New York'
  ];

  const profileMenuItems = [
    { name: 'My Profile', link: '/profile', icon: 'fi fi-rs-user' },
    { name: 'Order Tracking', link: '/order-tracking', icon: 'fi fi-rs-location-alt' },
    { name: 'Order History', link: '/history', icon: 'fi-rs-time-past' },
    { name: 'My Voucher', link: '/voucher', icon: 'fi fi-rs-label' },
    { name: 'My Wishlist', link: '/wishlist', icon: 'fi fi-rs-heart' },
    { name: 'Sign out', link: '/login', icon: 'fi fi-rs-sign-out' }
  ];

  return (
    <>
      <header className="header-area header-style-1 header-height-2" style={{ backgroundColor: '#ffffff' }}>
        
        {/* ========================================================
            1. TOP BAR (Language, Order Tracking, Sign In)
           ======================================================== */}
        <div className="header-top header-top-ptb-1 d-none d-xl-block">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-xl-12 col-lg-12">
                <div className="header-info header-info-right">
                  <ul>
                    {/* Language Dropdown */}
                    <li ref={langRef} className="position-relative">
                      <a
                        className="language-dropdown-active"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setLangOpen(!langOpen);
                        }}
                      >
                        <span className="box1">
                          <img
                            src={selectedLang === 'English' ? '/assets/imgs/theme/flag-en.jpg' : '/assets/imgs/theme/flag-ar.jpg'}
                            alt=""
                            className="img-fluid"
                          />
                        </span>
                        {selectedLang === 'English' ? 'Select Language' : 'عربى'}
                      </a>
                      <ul className={"language-dropdown " + (langOpen ? "d-block" : "")} style={{ display: langOpen ? 'block' : 'none' }}>
                        <li>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedLang('English');
                              setLangOpen(false);
                            }}
                          >
                            <img src="/assets/imgs/theme/flag-en.jpg" alt="" />
                            English
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedLang('Arabic');
                              setLangOpen(false);
                            }}
                          >
                            <img src="/assets/imgs/theme/flag-ar.jpg" alt="" />
                            عربى
                          </a>
                        </li>
                      </ul>
                    </li>

                    <li>
                      <Link href="/order-tracking">
                        <span className="box2">
                          <img src="/assets/imgs/theme/track.png" alt="" className="img-fluid" />
                        </span>
                        Track Order
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. MAIN HEADER (Logo Left Corner, Search Bar, Action Icons + Hamburger Right)
           ======================================================== */}
        <div className="header-middle header-middle-ptb-1" style={{ padding: '16px 0', backgroundColor: '#ffffff' }}>
          <div className="container">
            <div className="header-wrap d-flex align-items-center justify-content-between gap-3">
              
              {/* Left: Brand Logo (Flush Left Corner) */}
              <div className="logo logo-width-1" style={{ margin: 0, padding: 0 }}>
                <Link href="/" style={{ display: 'block', lineHeight: 1 }}>
                  <img src="/assets/imgs/theme/logo.jpg" alt="logo" />
                </Link>
              </div>

              {/* Center: Search Bar with Category Selector & Yellow Search Button (Desktop & Tablet) */}
              <div className="header-right d-none d-xl-flex flex-grow-1 justify-content-center" style={{ maxWidth: '880px', width: '100%' }}>
                <div className="search-style-2 w-100">
                  <form
                    action="#"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const params = new URLSearchParams();
                      if (searchInput.trim()) {
                        params.set('q', searchInput.trim());
                      }
                      if (selectedCategory && selectedCategory !== 'Search by CATEGORIES') {
                        params.set('category', selectedCategory);
                      }
                      router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
                    }}
                  >
                    <div ref={searchCatRef} style={{ position: 'relative' }}>
                      <a
                        href="#"
                        className={"categories-button-active " + (searchCatOpen ? "open" : "")}
                        onClick={(e) => {
                          e.preventDefault();
                          setSearchCatOpen(!searchCatOpen);
                        }}
                      >
                        <div
                          className="search-cat"
                          style={{
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            justifyContent: 'flex-start',
                            paddingLeft: '18px',
                            paddingRight: '28px',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'left',
                              maxWidth: '130px',
                              fontWeight: '600',
                              color: '#253D4E',
                            }}
                          >
                            {selectedCategory}
                          </div>
                          <span></span>
                        </div>
                      </a>
                      
                      {searchCatOpen && (
                        <div
                          className="categories-dropdown-wrap categories-dropdown-active-large font-heading open"
                          style={{
                            display: 'block',
                            minWidth: '225px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                            border: '1px solid #e2e8f0',
                            padding: '6px 0',
                            zIndex: 9999,
                          }}
                        >
                          <div className="categori-dropdown-inner">
                            <ul
                              className="search-categories-scroll-list"
                              style={{
                                listStyle: 'none',
                                margin: 0,
                                padding: 0,
                                maxHeight: '232px', /* Always shows maximum 6 items before scrolling */
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 transparent',
                              }}
                            >
                              <li
                                onClick={() => {
                                  setSelectedCategory('Search by CATEGORIES');
                                  setSearchCatOpen(false);
                                }}
                                style={{
                                  padding: '9.5px 18px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: selectedCategory === 'Search by CATEGORIES' ? '600' : '400',
                                  color: selectedCategory === 'Search by CATEGORIES' ? '#3BB77E' : '#253D4E',
                                  backgroundColor: selectedCategory === 'Search by CATEGORIES' ? '#f0fdf4' : 'transparent',
                                  borderBottom: '1px solid #f1f5f9',
                                  textAlign: 'left',
                                }}
                              >
                                Search by CATEGORIES
                              </li>
                              {categories.map((cat, idx) => (
                                <li
                                  key={cat.id || idx}
                                  onClick={() => {
                                    setSelectedCategory(cat.name);
                                    setSearchCatOpen(false);
                                  }}
                                  style={{
                                    padding: '9px 18px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: selectedCategory === cat.name ? '600' : '400',
                                    color: selectedCategory === cat.name ? '#3BB77E' : '#475569',
                                    backgroundColor: selectedCategory === cat.name ? '#f0fdf4' : 'transparent',
                                    borderBottom: idx === categories.length - 1 ? 'none' : '1px solid #f8fafc',
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {cat.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      id="searchInput"
                      placeholder="Search Products ..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                    
                    <button type="submit" className="search-btn">
                      <i className="fi-rs-search"></i>Search
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Location Selector & Action Icons + Hamburger Menu (Mobile/Tablet Right Corner) */}
              <div className="header-action-right d-flex align-items-center gap-3">
                
                {/* Location Dropdown (Desktop & Larger Screens) */}
                <div ref={locationRef} className="search-location position-relative d-none d-xl-block">
                  <div
                    className="location-pill"
                    style={{
                      background: '#f4f5f9',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#253D4E',
                      border: '1px solid #e2e8f0'
                    }}
                    onClick={() => setLocationOpen(!locationOpen)}
                  >
                    <i className="fi-rs-marker" style={{ color: '#3BB77E' }}></i>
                    <span>{selectedLocation}</span>
                    <i className="fi-rs-angle-small-down"></i>
                  </div>

                  {locationOpen && (
                    <ul
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '6px',
                        background: '#fff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        borderRadius: '10px',
                        padding: '6px 0',
                        zIndex: 1000,
                        minWidth: '180px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        listStyle: 'none',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {locations.map((loc, idx) => (
                        <li
                          key={idx}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: selectedLocation === loc ? '#3BB77E' : '#4f5d77',
                            fontWeight: selectedLocation === loc ? '700' : '500',
                            background: selectedLocation === loc ? '#f0fdf4' : 'transparent'
                          }}
                          onClick={() => {
                            setSelectedLocation(loc);
                            setLocationOpen(false);
                          }}
                        >
                          {loc}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Mobile/Tablet Action Icons + Hamburger on Right Corner */}
                <div className="header-action-2 d-flex d-xl-none align-items-center gap-2">
                  
                  {/* Wishlist Icon */}
                  <div className="header-action-icon-2">
                    <Link href="/wishlist" title="Wishlist">
                      <img className="svgInject" alt="Wishlist" src="/assets/imgs/theme/icons/icon-heart.svg" />
                    </Link>
                  </div>

                  {/* Cart Icon with Count Badge */}
                  <div className="header-action-icon-2">
                    <Link className="mini-cart-icon position-relative" href="/cart" title="Cart">
                      <img alt="Cart" src="/assets/imgs/theme/icons/icon-cart.svg" />
                      <span className="pro-count blue">2</span>
                    </Link>
                  </div>

                  {/* Profile Dropdown */}
                  <div
                    ref={mobileAccountRef}
                    className={"header-action-icon-2 " + (mobileAccountOpen ? "active" : "")}
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileAccountOpen(!mobileAccountOpen);
                      }}
                      title={user ? user.name : "Account"}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      {user ? (
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                          alt={user.name}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: isAdmin ? '2px solid #2563eb' : '2px solid #3BB77E'
                          }}
                        />
                      ) : (
                        <img className="svgInject" alt="Account" src="/assets/imgs/theme/icons/icon-user.svg" />
                      )}
                    </a>

                    <div className={"cart-dropdown-wrap cart-dropdown-hm2 account-dropdown " + (mobileAccountOpen ? "open" : "")}>
                      {user ? (
                        <ul>
                          <li style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{user.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{user.email}</div>
                          </li>

                          {/* Admin: Show Back to Dashboard ONLY (No user profile link) */}
                          {isAdmin ? (
                            <>
                              <li>
                                <a
                                  href="/dashboard"
                                  onClick={() => setMobileAccountOpen(false)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontWeight: '700',
                                    padding: '8px 12px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  <i className="fi fi-rs-apps"></i>Back to Dashboard ⚡
                                </a>
                              </li>
                              <li>
                                <a
                                  href="/login"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setMobileAccountOpen(false);
                                    logout();
                                  }}
                                  style={{ color: '#ef4444' }}
                                >
                                  <i className="fi fi-rs-sign-out mr-10"></i>Sign out
                                </a>
                              </li>
                            </>
                          ) : (
                            /* Regular Customer: Show profile, order history, wishlist */
                            <>
                              <li>
                                <Link
                                  href="/profile#basic-info"
                                  onClick={() => {
                                    setMobileAccountOpen(false);
                                    if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
                                      window.location.hash = '#basic-info';
                                    }
                                  }}
                                >
                                  <i className="fi fi-rs-user mr-10"></i>My Profile
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/profile#settings"
                                  onClick={() => {
                                    setMobileAccountOpen(false);
                                    if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
                                      window.location.hash = '#settings';
                                    }
                                  }}
                                >
                                  <i className="fi fi-rs-settings-sliders mr-10"></i>Settings
                                </Link>
                              </li>
                              <li>
                                <Link href="/history" onClick={() => setMobileAccountOpen(false)}>
                                  <i className="fi-rs-time-past mr-10"></i>Order History
                                </Link>
                              </li>
                              <li>
                                <Link href="/wishlist" onClick={() => setMobileAccountOpen(false)}>
                                  <i className="fi fi-rs-heart mr-10"></i>My Wishlist
                                </Link>
                              </li>
                              <li>
                                <a
                                  href="/"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setMobileAccountOpen(false);
                                    logout();
                                  }}
                                  style={{ color: '#ef4444' }}
                                >
                                  <i className="fi fi-rs-sign-out mr-10"></i>Sign out
                                </a>
                              </li>
                            </>
                          )}
                        </ul>
                      ) : (
                        /* Guest: Sign in / Register */
                        <ul>
                          <li>
                            <a href="/login" onClick={() => setMobileAccountOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
                              <i className="fi fi-rs-user mr-10"></i>Sign In
                            </a>
                          </li>
                          <li>
                            <a href="/register" onClick={() => setMobileAccountOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
                              <i className="fi fi-rs-label mr-10"></i>Create Account
                            </a>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Hamburger Menu placed directly on Right Side near Profile */}
                  <div
                    className="burger-icon burger-icon-white ms-1"
                    onClick={() => setMobileMenuOpen(true)}
                    style={{ cursor: 'pointer', display: 'block', padding: '6px' }}
                    title="Open Menu"
                  >
                    <span className="burger-icon-top"></span>
                    <span className="burger-icon-mid"></span>
                    <span className="burger-icon-bottom"></span>
                  </div>

                </div>

              </div>
            </div>

            {/* Mobile-only Search Bar: Styled with yellow Search button matching desktop */}
            <div className="d-block d-xl-none mt-3 pt-1">
              <div className="search-style-2 w-100">
                <form
                  action="#"
                  onSubmit={(e) => e.preventDefault()}
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '46px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #E2E2E2',
                    borderRadius: '6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search Products ..."
                    style={{
                      flex: 1,
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      padding: '0 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#253D4E',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    className="search-btn"
                    style={{
                      backgroundColor: '#FDC839',
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '700',
                      height: '100%',
                      minHeight: '46px',
                      padding: '0 18px 0 38px',
                      borderRadius: '0 5px 5px 0',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="fi-rs-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px' }}></i>
                    Search
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            3. DESKTOP & LAPTOP NAVIGATION BAR (header-bottom)
           ======================================================== */}
        <div className="header-bottom header-bottom-bg-color sticky-bar d-none d-xl-block" style={{ backgroundColor: '#ffffff' }}>
          <div className="container">
            <div className="header-wrap header-space-between position-relative">
              
              {/* Desktop Nav Items */}
              <div className="header-nav d-flex align-items-center">
                
                {/* Shop by Categories Button & Dropdown */}
                <div ref={shopCatRef} className="main-categori-wrap">
                  <a
                    className={"categories-button-active " + (shopCatOpen ? "open" : "")}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShopCatOpen(!shopCatOpen);
                      if (shopCatOpen) setHoveredCategory(null);
                    }}
                  >
                    <span className="fi-rs-apps"></span>
                    <span className="et">Shop by Categories</span>
                  </a>
                  
                  <div
                    className={"categories-dropdown-wrap categories-dropdown-active-large font-heading " + (shopCatOpen ? "open d-block" : "")}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 999,
                      background: '#ffffff',
                      border: '1px solid #BCE3C9',
                      borderRadius: '8px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      display: shopCatOpen ? 'flex' : 'none',
                    }}
                  >
                    <div className="categori-dropdown-inner" style={{ position: 'relative', width: '270px' }}>
                      <ul
                        className="shop-categories-scroll-list"
                        style={{
                          listStyle: 'none',
                          margin: 0,
                          padding: '6px 0',
                          maxHeight: '252px', /* Always show 6 items only before scrolling */
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 transparent',
                          width: '100%',
                        }}
                      >
                        {categories.map((cat, idx) => {
                          const hasSub = cat.hasSubItems === true && Boolean(cat.subItems && cat.subItems.length > 0);
                          const isHovered = hasSub && ((hoveredCategory?.id && hoveredCategory.id === cat.id) || (hoveredCategory?.name === cat.name));
                          return (
                            <li
                              key={cat.id || idx}
                              onMouseEnter={() => {
                                if (hasSub) {
                                  setHoveredCategory(cat);
                                } else {
                                  setHoveredCategory(null);
                                }
                              }}
                              style={{
                                height: '42px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 20px',
                                backgroundColor: isHovered ? '#FDC839' : 'transparent',
                                transition: 'background-color 0.2s',
                                cursor: 'pointer',
                              }}
                            >
                              <Link
                                href={cat.link}
                                onClick={() => {
                                  setShopCatOpen(false);
                                  setHoveredCategory(null);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  color: isHovered ? '#000000' : '#253D4E',
                                  fontWeight: isHovered ? '700' : '600',
                                  fontSize: '14px',
                                  textDecoration: 'none',
                                }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: hasSub ? '200px' : '230px' }}>
                                  {cat.name}
                                </span>
                                {hasSub && (
                                  <i
                                    className="fi-rs-angle-right"
                                    style={{
                                      fontSize: '11px',
                                      color: isHovered ? '#000000' : '#4bb34d',
                                      flexShrink: 0,
                                    }}
                                  ></i>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Flyout Sub-menu positioned outside scroll container so it NEVER gets clipped */}
                    {hoveredCategory && hoveredCategory.hasSubItems === true && hoveredCategory.subItems && hoveredCategory.subItems.length > 0 && (
                      <div
                        className="shop-categories-flyout-menu"
                        style={{
                          position: 'absolute',
                          left: '100%',
                          top: '-1px',
                          width: '240px',
                          minHeight: '254px',
                          maxHeight: '360px',
                          overflowY: 'auto',
                          backgroundColor: '#ffffff',
                          border: '1px solid #BCE3C9',
                          borderRadius: '0 8px 8px 0',
                          boxShadow: '8px 10px 25px rgba(0, 0, 0, 0.08)',
                          zIndex: 1000,
                          padding: '6px 0',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 transparent',
                        }}
                      >
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {hoveredCategory.subItems.map((sub, sIdx) => (
                            <li
                              key={sub.id || sIdx}
                              style={{
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 20px',
                                transition: 'background-color 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <Link
                                href={sub.link}
                                onClick={() => {
                                  setShopCatOpen(false);
                                  setHoveredCategory(null);
                                }}
                                style={{
                                  color: '#253D4E',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  textDecoration: 'none',
                                  width: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Nav Menu with Mega Menus */}
                <div className="main-menu main-menu-padding-1 main-menu-lh-2 font-heading">
                  <nav>
                    <ul>
                      {mainMenuItems.filter(m => m.isActive !== false).slice(0, 6).map((menuItem) => {
                        const hasMega = menuItem.hasMegaMenu && menuItem.columns && menuItem.columns.length > 0;
                        const isMenuOpen = activeMegaMenu === menuItem.id;

                        if (hasMega) {
                          return (
                            <li
                              key={menuItem.id}
                              className={`position-static ${isMenuOpen ? 'hover-active' : ''}`}
                              onMouseEnter={() => handleMegaMenuEnter(menuItem.id)}
                              onMouseLeave={handleMegaMenuLeave}
                            >
                              <Link href={menuItem.link} onClick={() => setActiveMegaMenu(null)}>
                                {formatNavigationLabel(menuItem.name)}
                                {menuItem.badge && (
                                  <span className="badge ms-1" style={{ fontSize: '10px', ...getMenuBadgeStyle(menuItem.badge) }}>
                                    {menuItem.badge}
                                  </span>
                                )}
                                <i className="fi-rs-plus"></i>
                              </Link>
                              <ul
                                className={`mega-menu ${isMenuOpen ? 'is-open' : ''}`}
                                onMouseEnter={() => handleMegaMenuEnter(menuItem.id)}
                                onMouseLeave={handleMegaMenuLeave}
                                onClick={() => setActiveMegaMenu(null)}
                              >
                                {menuItem.columns?.map((col) => (
                                  <li key={col.id} className="sub-mega-menu sub-mega-menu-width-22">
                                    <Link className="menu-title" href={col.link || menuItem.link}>{col.title}</Link>
                                    <ul>
                                      {col.items.map((subItem) => (
                                        <li key={subItem.id}>
                                          <Link href={subItem.link} className="mega-product-link" aria-label={subItem.name}>
                                            <span className="mega-product-label">
                                              <span className="mega-product-preview">{getMegaProductPreview(subItem.name)}</span>
                                              <span className="mega-product-full">{subItem.name}</span>
                                            </span>
                                          </Link>
                                        </li>
                                      ))}
                                      <li className="see-more-item">
                                        <Link href={col.link || menuItem.link} className="see-more-link">
                                          See More <i className="fi-rs-arrow-small-right"></i>
                                        </Link>
                                      </li>
                                    </ul>
                                  </li>
                                ))}

                                {menuItem.banner && menuItem.banner.enabled && (
                                  <li className="sub-mega-menu sub-mega-menu-banner">
                                    <div className="menu-banner-wrap">
                                      <Link href={menuItem.banner.btnLink || menuItem.link}>
                                        <img
                                          src={menuItem.banner.image || '/assets/imgs/banner/banner-menu.png'}
                                          alt={menuItem.banner.title || menuItem.name}
                                        />
                                      </Link>
                                      <div className="menu-banner-content">
                                        {menuItem.banner.tag && (
                                          <h4
                                            style={{
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              maxWidth: '100%',
                                              display: 'block',
                                            }}
                                            title={menuItem.banner.tag}
                                          >
                                            {menuItem.banner.tag}
                                          </h4>
                                        )}
                                        <h3
                                          style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            wordBreak: 'break-word',
                                            maxHeight: '3em',
                                            lineHeight: '1.5',
                                          }}
                                          title={menuItem.banner.title}
                                        >
                                          {menuItem.banner.title}
                                        </h3>
                                        {menuItem.banner.priceNote && (
                                          <div className="menu-banner-price">
                                            <span
                                              className="new-price text-success"
                                              style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.25',
                                              }}
                                              title={menuItem.banner.priceNote}
                                            >
                                              {menuItem.banner.priceNote}
                                            </span>
                                          </div>
                                        )}
                                        {menuItem.banner.showBtn !== false && (
                                          <div className="menu-banner-btn">
                                            <Link href={menuItem.banner.btnLink || menuItem.link}>
                                              {menuItem.banner.btnText || 'Shop now'}
                                            </Link>
                                          </div>
                                        )}
                                      </div>
                                      {menuItem.banner.discountBadge && (
                                        <div className="menu-banner-discount">
                                          <h3>{menuItem.banner.discountBadge}</h3>
                                        </div>
                                      )}
                                    </div>
                                  </li>
                                )}
                              </ul>
                            </li>
                          );
                        }

                        // Direct link (no mega menu)
                        const isSpecial = menuItem.link.includes('offer') || menuItem.name.toLowerCase().includes('offer');
                        return (
                          <li key={menuItem.id} onMouseEnter={() => handleMegaMenuEnter('')}>
                            <Link
                              href={menuItem.link || '/products'}
                              className={isSpecial ? 'spcl' : ''}
                              onClick={() => setActiveMegaMenu(null)}
                            >
                              {formatNavigationLabel(menuItem.name)}
                              {menuItem.badge && (
                                <span className="badge ms-1" style={{ fontSize: '10px', ...getMenuBadgeStyle(menuItem.badge) }}>
                                  {menuItem.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                </div>
              </div>

              {/* Action Icons in Header Bottom (Desktop) with Profile Hover List */}
              <div className="icns">
                <div className="header-action-2">
                  
                  {/* Cart Icon */}
                  <div className="header-action-icon-2">
                    <Link className="mini-cart-icon position-relative" href="/cart" title="View Cart">
                      <img alt="Cart" src="/assets/imgs/theme/icons/icon-cart.svg" />
                      <span className="pro-count blue">2</span>
                    </Link>
                  </div>

                  {/* Wishlist Icon */}
                  <div className="header-action-icon-2">
                    <Link href="/wishlist" title="Wishlist">
                      <img className="svgInject" alt="Wishlist" src="/assets/imgs/theme/icons/icon-heart.svg" />
                    </Link>
                  </div>

                  {/* Account / Profile Icon with Hover Dropdown */}
                  <div
                    ref={accountRef}
                    className={"header-action-icon-2 header-action-user-profile " + (accountOpen ? "active" : "")}
                    onMouseEnter={handleAccountMouseEnter}
                    onMouseLeave={handleAccountMouseLeave}
                  >
                    <a
                      href={user ? "#" : "/login"}
                      onClick={(e) => {
                        if (user) {
                          e.preventDefault();
                          setAccountOpen(!accountOpen);
                        }
                      }}
                      title={user ? user.name : "Sign In / Register"}
                      className="header-user-btn"
                    >
                      {user ? (
                        <div className="header-user-content">
                          <img
                            src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                            className="header-user-avatar"
                            style={{
                              border: isAdmin ? '2px solid #2563eb' : '2px solid #3BB77E'
                            }}
                          />
                          <span className="header-user-name">
                            {user.name.split(' ')[0]}
                          </span>
                          <i className="fi-rs-angle-small-down header-user-chevron"></i>
                        </div>
                      ) : (
                        <img className="svgInject" alt="Account" src="/assets/imgs/theme/icons/icon-user.svg" />
                      )}
                    </a>

                    <div
                      className={"cart-dropdown-wrap cart-dropdown-hm2 account-dropdown " + (accountOpen ? "open" : "")}
                      onMouseEnter={handleAccountMouseEnter}
                      onMouseLeave={handleAccountMouseLeave}
                      style={{ minWidth: '220px' }}
                    >
                      {user ? (
                        <ul>
                          <li
                            className="account-header-item"
                            style={{
                              margin: '-16px -18px 12px -18px',
                              padding: '12px 18px',
                              background: '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
                              borderTopLeftRadius: '9px',
                              borderTopRightRadius: '9px',
                              borderBottomLeftRadius: '0',
                              borderBottomRightRadius: '0'
                            }}
                          >
                            <div className="account-header-name" style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                              {user.name}
                            </div>
                            <div className="account-header-email" style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {user.email}
                            </div>
                          </li>

                          {/* Admin: Quick Access to Dashboard */}
                          {isAdmin && (
                            <li>
                              <a href="/dashboard" onClick={() => setAccountOpen(false)}>
                                <i className="fi fi-rs-apps mr-10"></i>Dashboard Overview
                              </a>
                            </li>
                          )}

                          {/* Profile */}
                          <li>
                            <Link
                              href="/profile#basic-info"
                              onClick={() => {
                                setAccountOpen(false);
                                if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
                                  window.location.hash = '#basic-info';
                                }
                              }}
                            >
                              <i className="fi fi-rs-user mr-10"></i>Profile
                            </Link>
                          </li>

                          {/* Settings */}
                          <li>
                            <Link
                              href="/profile#settings"
                              onClick={() => {
                                setAccountOpen(false);
                                if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
                                  window.location.hash = '#settings';
                                }
                              }}
                            >
                              <i className="fi fi-rs-settings-sliders mr-10"></i>Settings
                            </Link>
                          </li>

                          {/* Order History & Wishlist (Customer) */}
                          {!isAdmin && (
                            <>
                              <li>
                                <Link href="/history" onClick={() => setAccountOpen(false)}>
                                  <i className="fi-rs-time-past mr-10"></i>Order History
                                </Link>
                              </li>
                              <li>
                                <Link href="/wishlist" onClick={() => setAccountOpen(false)}>
                                  <i className="fi fi-rs-heart mr-10"></i>My Wishlist
                                </Link>
                              </li>
                            </>
                          )}

                          {/* Sign out */}
                          <li style={{ borderTop: '1px solid #f1f5f9', marginTop: '6px', paddingTop: '8px' }}>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setAccountOpen(false);
                                logout();
                              }}
                              style={{ color: '#ef4444', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <i className="fi fi-rs-sign-out mr-10"></i>Sign out
                            </a>
                          </li>
                        </ul>
                      ) : (
                        /* Guest */
                        <ul>
                          <li>
                            <a
                              href="/login"
                              onClick={() => setAccountOpen(false)}
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <i className="fi fi-rs-user mr-10"></i>Sign In
                            </a>
                          </li>
                          <li>
                            <a
                              href="/register"
                              onClick={() => setAccountOpen(false)}
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <i className="fi fi-rs-label mr-10"></i>Create Account
                            </a>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

      </header>

      {/* ========================================================
          4. MOBILE / TABLET SLIDEOUT DRAWER (Full Menu & Accordions)
         ======================================================== */}
      <div className={"mobile-header-active mobile-header-wrapper-style " + (mobileMenuOpen ? "sidebar-visible" : "")}>
        <div className="mobile-header-wrapper-inner" style={{ height: '100%', overflowY: 'auto', padding: '16px 18px 40px 18px' }}>
          
          {/* Top: Language Switcher on Left & Close Button on Right Corner */}
          <div
            className="mobile-header-top d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom"
            style={{ width: '100%', margin: '0 0 16px 0', padding: '0 0 14px 0' }}
          >
            {/* Language Switcher */}
            <div className="mobile-lang-switcher position-relative">
              <div
                className="d-flex align-items-center gap-2"
                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                style={{
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#253D4E',
                  padding: '6px 12px',
                  background: '#f8fafc',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <img
                  src={selectedLang === 'English' ? '/assets/imgs/theme/flag-en.jpg' : '/assets/imgs/theme/flag-ar.jpg'}
                  alt=""
                  style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span>{selectedLang === 'English' ? 'English' : 'عربى'}</span>
                <i className={"fi-rs-angle-small-" + (mobileLangOpen ? "up" : "down") + " text-muted"}></i>
              </div>

              {/* Language Dropdown List */}
              {mobileLangOpen && (
                <ul
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    background: '#ffffff',
                    borderRadius: '10px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                    border: '1px solid #e2e8f0',
                    padding: '6px 0',
                    listStyle: 'none',
                    minWidth: '130px',
                    zIndex: 1000,
                    margin: 0
                  }}
                >
                  <li
                    onClick={() => {
                      setSelectedLang('English');
                      setMobileLangOpen(false);
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: selectedLang === 'English' ? '700' : '500',
                      color: selectedLang === 'English' ? '#3BB77E' : '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: selectedLang === 'English' ? '#f0fdf4' : 'transparent'
                    }}
                  >
                    <img src="/assets/imgs/theme/flag-en.jpg" alt="" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                    English
                  </li>
                  <li
                    onClick={() => {
                      setSelectedLang('Arabic');
                      setMobileLangOpen(false);
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: selectedLang === 'Arabic' ? '700' : '500',
                      color: selectedLang === 'Arabic' ? '#3BB77E' : '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: selectedLang === 'Arabic' ? '#f0fdf4' : 'transparent'
                    }}
                  >
                    <img src="/assets/imgs/theme/flag-ar.jpg" alt="" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                    عربى
                  </li>
                </ul>
              )}
            </div>

            {/* Close Button on Right Corner */}
            <div
              className="mobile-menu-close"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                cursor: 'pointer',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 'auto',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              title="Close Menu"
            >
              <i className="fi-rs-cross" style={{ fontSize: '13px', color: '#253D4E' }}></i>
            </div>
          </div>

          {/* Drawer Location Select: Shows exactly 3 items at a time with smooth scrollbar */}
          <div className="p-2 mb-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2 px-1">
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.5px' }}>LOCATION:</span>
              <span className="text-success fw-bold" style={{ fontSize: '12px' }}>{selectedLocation}</span>
            </div>

            {/* Custom Location Selector Box */}
            <div
              className="d-flex align-items-center justify-content-between bg-white px-3 py-2 rounded"
              style={{
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: '#253D4E'
              }}
              onClick={() => setMobileLocOpen(!mobileLocOpen)}
            >
              <span>{selectedLocation}</span>
              <i className={"fi-rs-angle-small-" + (mobileLocOpen ? "up" : "down") + " text-muted"}></i>
            </div>

            {/* 3-Item Balanced Scrollable List */}
            {mobileLocOpen && (
              <div
                className="mt-2 bg-white rounded border"
                style={{
                  maxHeight: '115px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {locations.map((loc, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setMobileLocOpen(false);
                      }}
                      style={{
                        padding: '9px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: selectedLocation === loc ? '#3BB77E' : '#334155',
                        fontWeight: selectedLocation === loc ? '700' : '500',
                        backgroundColor: selectedLocation === loc ? '#f0fdf4' : 'transparent',
                        borderBottom: idx === locations.length - 1 ? 'none' : '1px solid #f1f5f9'
                      }}
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Full Navigation List & Expandable Accordions */}
          <div className="mobile-menu-wrap">
            <nav>
              <ul className="mobile-menu font-heading" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                
                {/* 1. Home */}
                <li className="py-2 border-bottom">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 'bold', color: '#3BB77E' }}>
                    Home
                  </Link>
                </li>

                {/* 2. Shop by Categories */}
                <li className={"py-2 border-bottom menu-item-has-children " + (openAccordion === 'categories' ? 'active' : '')}>
                  <div
                    className="d-flex align-items-center justify-content-between"
                    onClick={() => toggleAccordion('categories')}
                    style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#253D4E' }}
                  >
                    <span>Shop by Categories</span>
                    <span className="menu-expand"><i className="fi-rs-angle-small-down"></i></span>
                  </div>
                  <div className={`mobile-accordion-collapse ${openAccordion === 'categories' ? 'is-open' : ''}`}>
                    <div className="mobile-accordion-inner">
                      <ul className="dropdown-menu-list">
                        {categories.slice(0, 6).map((cat, idx) => (
                          <li key={idx}>
                            <Link href={cat.link} onClick={() => setMobileMenuOpen(false)}>
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                        <li className="view-all-item">
                          <Link href="/category" onClick={() => setMobileMenuOpen(false)} className="view-all-link">
                            View All Categories <i className="fi-rs-arrow-small-right"></i>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>

                {/* Dynamic Main Menu items in Mobile Drawer */}
                {mainMenuItems.filter(m => m.isActive !== false).slice(0, 6).map((menuItem) => {
                  const hasSub = menuItem.hasMegaMenu && menuItem.columns && menuItem.columns.length > 0;
                  const isAccordionOpen = openAccordion === menuItem.id;

                  if (hasSub) {
                    const menuCategories = menuItem.columns!;
                    return (
                      <li
                        key={menuItem.id}
                        className={"py-2 border-bottom menu-item-has-children " + (isAccordionOpen ? 'active' : '')}
                      >
                        <div
                          className="d-flex align-items-center justify-content-between"
                          onClick={() => toggleAccordion(menuItem.id)}
                          style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#253D4E' }}
                        >
                          <span>{formatNavigationLabel(menuItem.name)}</span>
                          <span className="menu-expand"><i className="fi-rs-angle-small-down"></i></span>
                        </div>
                        <div className={`mobile-accordion-collapse ${isAccordionOpen ? 'is-open' : ''}`}>
                          <div className="mobile-accordion-inner">
                            <ul className="dropdown-menu-list">
                              {menuCategories.map((category) => (
                                <li key={category.id}>
                                  <Link href={category.link || menuItem.link} onClick={() => setMobileMenuOpen(false)}>
                                    {formatNavigationLabel(category.title)}
                                  </Link>
                                </li>
                              ))}
                              <li className="view-all-item">
                                <Link href={menuItem.link} onClick={() => setMobileMenuOpen(false)} className="view-all-link">
                                  View All {formatNavigationLabel(menuItem.name)} <i className="fi-rs-arrow-small-right"></i>
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </li>
                    );
                  }

                  const isOffer = menuItem.link.includes('offer') || menuItem.name.toLowerCase().includes('offer');
                  return (
                    <li key={menuItem.id} className="py-2 border-bottom">
                      <Link
                        href={menuItem.link || '/products'}
                        onClick={() => setMobileMenuOpen(false)}
                        className={isOffer ? "d-flex align-items-center justify-content-between" : ""}
                        style={{
                          fontSize: '14px',
                          fontWeight: isOffer ? 'bold' : '600',
                          color: isOffer ? '#e11d48' : '#253D4E'
                        }}
                      >
                        <span>{formatNavigationLabel(menuItem.name)}</span>
                        {menuItem.badge && <span className="badge" style={getMenuBadgeStyle(menuItem.badge)}>{menuItem.badge}</span>}
                      </Link>
                    </li>
                  );
                })}

              </ul>
            </nav>
          </div>

          {/* Drawer Contact Footer */}
          <div className="mt-4 pt-3 border-top text-muted" style={{ fontSize: '12px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="fi-rs-headset text-success"></i> (+91) - 9876-124553
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="fi-rs-envelope text-success"></i> sales@veuz.com
            </div>
          </div>

        </div>
      </div>

      {/* Backdrop overlay */}
      <div
        className={"body-overlay-1 " + (mobileMenuOpen ? "active" : "")}
        onClick={() => setMobileMenuOpen(false)}
      ></div>
    </>
  );
};
