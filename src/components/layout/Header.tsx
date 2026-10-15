'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { ShopSettingsData, ShopCategory, MainMenuItem } from '@/data/defaultShopSettings';
import { fetchShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';

const formatNavigationLabel = (label: string) =>
  label.toLocaleLowerCase().replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());

const getMegaProductPreview = (label: string) => {
  const words = label.trim().split(/\s+/);
  return words.length > 4 ? `${words.slice(0, 4).join(' ')}…` : label;
};

export const formatMenuBadgeLabel = (badge?: string): string => {
  if (!badge) return '';
  const clean = badge.toUpperCase().trim();
  if (clean === 'OFFER' || clean === 'OFFER SALES' || clean === 'OFFER SALE') return 'OFFER SALES';
  if (clean.includes('LIMITED') || clean === 'SALE') return 'LIMITED SALES';
  return clean;
};

export const getMenuBadgeColor = (badge?: string): string => {
  if (!badge) return '#2563eb';
  const clean = badge.toUpperCase().trim();
  if (clean === 'NEW') return '#16a34a'; // Vibrant bright green
  if (clean === 'OFFER' || clean === 'OFFER SALES' || clean === 'OFFER SALE') return '#dc2626'; // Vibrant bright red
  if (clean.includes('LIMITED') || clean === 'SALE') return '#ea580c'; // Vibrant bright orange
  if (clean === 'HOT') return '#e11d48'; // Vibrant hot crimson/pink
  if (clean === 'TRENDING') return '#2563eb'; // Vibrant royal electric blue (reference style)
  return '#2563eb';
};

const getMenuBadgeStyle = (badge?: string): React.CSSProperties => {
  const bg = getMenuBadgeColor(badge);
  return { backgroundColor: bg, color: '#ffffff', border: `1px solid ${bg}` };
};

const getMenuDestination = (menu: MainMenuItem) => {
  if (menu.link && menu.link !== '#' && menu.link !== '/products') return menu.link;
  const badgeClean = (menu.badge || '').toUpperCase().trim();
  if (badgeClean === 'NEW') return '/new-arrival-products';
  if (badgeClean.includes('OFFER') || badgeClean === 'HOT') return '/offer-products';
  if (badgeClean.includes('LIMITED')) return '/limited-offers';
  return menu.link || '/products';
};

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { totalCartItems } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchCatOpen, setSearchCatOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchInput, setSearchInput] = useState('');
  const [shopCatOpen, setShopCatOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<ShopCategory | null>(null);
  const shopCatTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleShopCatMouseEnter = () => {
    if (shopCatTimerRef.current) {
      clearTimeout(shopCatTimerRef.current);
      shopCatTimerRef.current = null;
    }
    setShopCatOpen(true);
  };

  const handleShopCatMouseLeave = () => {
    if (shopCatTimerRef.current) {
      clearTimeout(shopCatTimerRef.current);
    }
    shopCatTimerRef.current = setTimeout(() => {
      setShopCatOpen(false);
      setHoveredCategory(null);
    }, 180);
  };
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
  const langRef = useRef<HTMLDivElement>(null);
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (shopCatTimerRef.current) clearTimeout(shopCatTimerRef.current);
    };
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
      <header className="header-area header-style-1 header-height-2" style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 1045 }}>
        
        {/* ========================================================
            MAIN HEADER (Logo Left Corner, Search Bar, Location & Language, Action Icons)
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
                    className="custom-header-search-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const params = new URLSearchParams();
                      if (searchInput.trim()) {
                        params.set('q', searchInput.trim());
                      }
                      if (selectedCategory && selectedCategory !== 'All Categories') {
                        params.set('category', selectedCategory);
                      }
                      router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      height: '46px',
                      backgroundColor: '#eef1f5',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      position: 'relative',
                      overflow: 'visible',
                      padding: '4px 6px 4px 4px',
                    }}
                  >
                    <div
                      ref={searchCatRef}
                      className="search-category-pill-wrap"
                      style={{
                        position: 'relative',
                        flexShrink: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        height: '38px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        overflow: 'visible',
                      }}
                    >
                      <button
                        type="button"
                        className="search-category-btn"
                        onClick={() => setSearchCatOpen(!searchCatOpen)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          height: '36px',
                          padding: '0 14px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#0f172a',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          outline: 'none',
                          flexShrink: 0,
                        }}
                      >
                        <span className="category-label" style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>
                          {selectedCategory}
                        </span>
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transition: 'transform 0.2s ease',
                            transform: searchCatOpen ? 'rotate(180deg)' : 'none',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      
                      {searchCatOpen && (
                        <div
                          className="categories-dropdown-wrap categories-dropdown-active-large font-heading open"
                          style={{
                            display: 'block',
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            minWidth: '220px',
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
                                maxHeight: '232px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 transparent',
                              }}
                            >
                              <li
                                onClick={() => {
                                  setSelectedCategory('All Categories');
                                  setSearchCatOpen(false);
                                }}
                                style={{
                                  padding: '9.5px 18px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: selectedCategory === 'All Categories' ? '600' : '400',
                                  color: selectedCategory === 'All Categories' ? '#0f172a' : '#475569',
                                  backgroundColor: selectedCategory === 'All Categories' ? '#f8fafc' : 'transparent',
                                  borderBottom: '1px solid #f1f5f9',
                                  textAlign: 'left',
                                }}
                              >
                                All Categories
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
                                    color: selectedCategory === cat.name ? '#0f172a' : '#475569',
                                    backgroundColor: selectedCategory === cat.name ? '#f8fafc' : 'transparent',
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
                      placeholder="Search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      style={{
                        flex: 1,
                        height: '38px',
                        border: 'none',
                        background: 'transparent',
                        padding: '0 12px 0 14px',
                        fontSize: '13.5px',
                        fontWeight: '400',
                        color: '#0f172a',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    />
                    
                    <button
                      type="submit"
                      className="search-btn"
                      aria-label="Search"
                      title="Search"
                      style={{
                        position: 'relative',
                        width: '38px',
                        height: '38px',
                        minWidth: '38px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#1e293b',
                        cursor: 'pointer',
                        padding: 0,
                        marginRight: '4px',
                        outline: 'none',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Language, Location & Action Icons + Hamburger Menu (Mobile/Tablet Right Corner) */}
              <div className="header-action-right d-flex align-items-center gap-3">
                
                {/* 1. Language Switcher: Pill shaped matching location selector size, placed between search and location (Desktop) */}
                <div ref={langRef} className="position-relative d-none d-xl-block">
                  <div
                    className="language-pill"
                    onClick={() => setLangOpen(!langOpen)}
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
                      border: '1px solid #e2e8f0',
                      height: '42px',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img
                      src={selectedLang === 'English' ? '/assets/imgs/theme/flag-en.jpg' : '/assets/imgs/theme/flag-ar.jpg'}
                      alt={selectedLang}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <span>{selectedLang}</span>
                    <i className="fi-rs-angle-small-down" style={{ fontSize: '11px', color: '#64748b' }}></i>
                  </div>

                  {/* Dropdown with flags when clicked */}
                  {langOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                        border: '1px solid #e2e8f0',
                        padding: '6px',
                        zIndex: 1000,
                        minWidth: '140px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLang('English');
                          setLangOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: selectedLang === 'English' ? '#f1f5f9' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0f172a',
                          textAlign: 'left',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            display: 'inline-flex',
                            flexShrink: 0,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <img src="/assets/imgs/theme/flag-en.jpg" alt="English" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </span>
                        <span>English</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLang('Arabic');
                          setLangOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: selectedLang === 'Arabic' ? '#f1f5f9' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0f172a',
                          textAlign: 'left',
                          marginTop: '3px',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            display: 'inline-flex',
                            flexShrink: 0,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <img src="/assets/imgs/theme/flag-ar.jpg" alt="Arabic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </span>
                        <span>عربى</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Location Dropdown (Desktop & Larger Screens) */}
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
                      border: '1px solid #e2e8f0',
                      height: '42px',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease',
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
                      <span className="pro-count blue">{totalCartItems}</span>
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
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
                          }}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgb(231, 231, 231)'
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

            {/* Mobile-only Search Bar: Matching reference style */}
            <div className="d-block d-xl-none mt-3 pt-1">
              <div className="search-style-2 w-100">
                <form
                  action="#"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchInput.trim()) {
                      router.push(`/products?q=${encodeURIComponent(searchInput.trim())}`);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    position: 'relative',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                      flex: 1,
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      padding: '0 14px',
                      fontSize: '13.5px',
                      fontWeight: '400',
                      color: '#0f172a',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    className="search-btn"
                    aria-label="Search"
                    title="Search"
                    style={{
                      position: 'relative',
                      width: '40px',
                      height: '100%',
                      minWidth: '40px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#1e293b',
                      cursor: 'pointer',
                      padding: 0,
                      marginRight: '4px',
                      outline: 'none',
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            3. DESKTOP & LAPTOP NAVIGATION BAR (header-bottom)
           ======================================================== */}
        <div className="header-bottom header-bottom-bg-color sticky-bar d-none d-xl-block" style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 1045 }}>
          <div className="container">
            <div className="header-wrap header-space-between position-relative">
              
              {/* Desktop Nav Items */}
              <div className="header-nav d-flex align-items-center">
                
                {/* All Categories Trigger & Dropdown */}
                <div
                  ref={shopCatRef}
                  className="main-categori-wrap ref-all-categories-wrap position-relative d-inline-flex align-items-center"
                  onMouseEnter={handleShopCatMouseEnter}
                  onMouseLeave={handleShopCatMouseLeave}
                >
                  <button
                    type="button"
                    className={`ref-all-categories-trigger ${shopCatOpen ? "open" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setShopCatOpen(prev => !prev);
                      if (shopCatOpen) setHoveredCategory(null);
                    }}
                    aria-expanded={shopCatOpen}
                    title="All Categories"
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                    <span>All Categories</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        color: '#64748b',
                        marginLeft: '2px',
                        transition: 'transform 0.2s ease',
                        transform: shopCatOpen ? 'rotate(180deg)' : 'none',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <span className="ref-nav-divider" />
                  
                  <div
                    className={"classic-categories-dropdown categories-dropdown-wrap categories-dropdown-active-large font-heading " + (shopCatOpen ? "open d-block" : "")}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      display: shopCatOpen ? 'flex' : 'none',
                    }}
                  >
                    <div className="categori-dropdown-inner" style={{ position: 'relative', width: '270px' }}>
                      <ul
                        className="shop-categories-scroll-list"
                        style={{
                          listStyle: 'none',
                          margin: 0,
                          padding: '4px 0',
                          maxHeight: '380px',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 transparent',
                          width: '100%',
                        }}
                      >
                        {categories.map((cat, idx) => {
                          const hasSub = Boolean(cat.subItems && cat.subItems.length > 0 && cat.hasSubItems !== false);
                          const isHovered = hasSub && ((hoveredCategory?.id && hoveredCategory.id === cat.id) || (hoveredCategory?.name === cat.name));
                          return (
                            <li
                              key={cat.id || idx}
                              className={`classic-cat-item ${isHovered ? 'active-sub' : ''}`}
                              onMouseEnter={() => {
                                if (hasSub) {
                                  setHoveredCategory(cat);
                                } else {
                                  setHoveredCategory(null);
                                }
                              }}
                            >
                              <Link
                                href={cat.link}
                                className="classic-cat-link"
                                onClick={() => {
                                  setShopCatOpen(false);
                                  setHoveredCategory(null);
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0, flexGrow: 1 }}>
                                  {cat.image ? (
                                    <img
                                      src={cat.image}
                                      alt=""
                                      className="classic-cat-thumb"
                                    />
                                  ) : null}
                                  <span className="classic-cat-name">
                                    {cat.name}
                                  </span>
                                </span>
                                {hasSub && (
                                  <i className="fi-rs-angle-right classic-cat-arrow"></i>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Flyout Sub-menu positioned outside scroll container so it NEVER gets clipped */}
                    {hoveredCategory && hoveredCategory.subItems && hoveredCategory.subItems.length > 0 && (
                      <div className="classic-flyout-menu shop-categories-flyout-menu">
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {hoveredCategory.subItems.map((sub, sIdx) => (
                            <li
                              key={sub.id || sIdx}
                              className="classic-flyout-item"
                            >
                              <Link
                                href={sub.link}
                                className="classic-flyout-link"
                                onClick={() => {
                                  setShopCatOpen(false);
                                  setHoveredCategory(null);
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
                        const menuDestination = getMenuDestination(menuItem);
                        const isMenuOpen = activeMegaMenu === menuItem.id;

                        if (hasMega) {
                          return (
                            <li
                              key={menuItem.id}
                              className={`position-static ${isMenuOpen ? 'hover-active' : ''}`}
                              onMouseEnter={() => handleMegaMenuEnter(menuItem.id)}
                              onMouseLeave={handleMegaMenuLeave}
                            >
                              <Link href={menuItem.link} onClick={() => setActiveMegaMenu(null)} className="nav-item-link-wrap">
                                {menuItem.badge && (
                                  <span
                                    className="nav-speech-badge"
                                    style={{ '--badge-bg': getMenuBadgeColor(menuItem.badge) } as React.CSSProperties}
                                  >
                                    {formatMenuBadgeLabel(menuItem.badge)}
                                  </span>
                                )}
                                <span>{formatNavigationLabel(menuItem.name)}</span>
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
                        return (
                          <li key={menuItem.id} onMouseEnter={() => handleMegaMenuEnter('')}>
                            <Link
                              href={menuDestination}
                              onClick={() => setActiveMegaMenu(null)}
                              className="nav-item-link-wrap"
                            >
                              {menuItem.badge && (
                                <span
                                  className="nav-speech-badge"
                                  style={{ '--badge-bg': getMenuBadgeColor(menuItem.badge) } as React.CSSProperties}
                                >
                                  {formatMenuBadgeLabel(menuItem.badge)}
                                </span>
                              )}
                              <span>{formatNavigationLabel(menuItem.name)}</span>
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
                      <span className="pro-count blue">{totalCartItems}</span>
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
                    style={{ position: 'relative', zIndex: 1047 }}
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
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
                            }}
                            style={{
                              border: '2px solid rgb(231, 231, 231)'
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
                      style={{ minWidth: '220px', zIndex: 99999 }}
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
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 'bold', color: '#253D4E' }}>
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
                  const menuDestination = getMenuDestination(menuItem);
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
                          <span className="d-flex align-items-center gap-2">
                            {formatNavigationLabel(menuItem.name)}
                            {menuItem.badge && (
                              <span
                                className="nav-speech-badge-mobile"
                                style={{ '--badge-bg': getMenuBadgeColor(menuItem.badge) } as React.CSSProperties}
                              >
                                {formatMenuBadgeLabel(menuItem.badge)}
                              </span>
                            )}
                          </span>
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

                  const mobileMenuLabelColor = '#253D4E';
                  return (
                    <li key={menuItem.id} className="py-2 border-bottom">
                      <Link
                        href={menuDestination}
                        onClick={() => setMobileMenuOpen(false)}
                        className="d-flex align-items-center justify-content-between"
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: mobileMenuLabelColor,
                        }}
                      >
                        <span className="d-flex align-items-center gap-2">
                          {formatNavigationLabel(menuItem.name)}
                          {menuItem.badge && (
                            <span
                              className="nav-speech-badge-mobile"
                              style={{ '--badge-bg': getMenuBadgeColor(menuItem.badge) } as React.CSSProperties}
                            >
                              {formatMenuBadgeLabel(menuItem.badge)}
                            </span>
                          )}
                        </span>
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
              <i className="fi-rs-headset text-success"></i>
              <a href="tel:+919876124553" className="text-muted text-decoration-none" suppressHydrationWarning>
                (+91) - 9876-124553
              </a>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="fi-rs-envelope text-success"></i>
              <a href="mailto:sales@veuz.com" className="text-muted text-decoration-none" suppressHydrationWarning>
                sales@veuz.com
              </a>
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
