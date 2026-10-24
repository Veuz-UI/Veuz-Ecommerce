'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { ShopSettingsData, ShopCategory, MainMenuItem } from '@/data/defaultShopSettings';
import { fetchShopSettings, getCachedShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';
import { StoreNotificationDropdown } from '@/components/notifications/StoreNotificationDropdown';
import { getUserNotifications, NOTIFICATIONS_UPDATED_EVENT } from '@/services/storeNotificationService';
import { recordUserSearch } from '@/services/recommendationService';
import { HeaderSearchDropdown } from './HeaderSearchDropdown';
import { fetchProducts, getCachedProducts, getClientCachedProducts, PRODUCTS_EVENT } from '@/services/productsService';
import { ProductItem } from '@/data/categoryProductsData';

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

const getNavIcon = (name: string, badge?: string) => {
  const n = (name || '').toLowerCase();
  const b = (badge || '').toLowerCase();

  if (b.includes('hot') || b.includes('sale') || b.includes('offer') || n.includes('sale') || n.includes('offer')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    );
  }
  if (n.includes('helmet') || n.includes('head')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 14a10 10 0 0 1 20 0H2z" />
        <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      </svg>
    );
  }
  if (n.includes('shoe') || n.includes('boot') || n.includes('foot')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16v-2a4 4 0 0 1 4-4h2l2 4h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      </svg>
    );
  }
  if (n.includes('glove') || n.includes('hand')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V6a2 2 0 0 0-4 0v5" />
        <path d="M14 10V4a2 2 0 0 0-4 0v6" />
        <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
        <path d="M6 14a6 6 0 0 0 12 0v-3" />
      </svg>
    );
  }
  if (n.includes('vest') || n.includes('cloth') || n.includes('wear') || n.includes('jacket')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    );
  }
  if (n.includes('goggle') || n.includes('eye') || n.includes('glass')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="12" r="4" />
        <circle cx="18" cy="12" r="4" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
};

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { totalCartItems, wishlist } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchCatOpen, setSearchCatOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchInput, setSearchInput] = useState('');
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(() => getCachedProducts());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
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

  // Store Notifications State & Real-Time Sync (Strictly Profile / User-Scoped)
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const notifTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const mobileNotifTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sticky Navbar State on Scroll
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          if (currentScrollY > 150) {
            setIsSticky(true);
          } else if (currentScrollY < 100) {
            setIsSticky(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNotifMouseEnter = () => {
    if (notifTimerRef.current) {
      clearTimeout(notifTimerRef.current);
      notifTimerRef.current = null;
    }
    setNotificationsOpen(true);
  };

  const handleNotifMouseLeave = () => {
    notifTimerRef.current = setTimeout(() => {
      setNotificationsOpen(false);
    }, 280);
  };

  const handleMobileNotifMouseEnter = () => {
    if (mobileNotifTimerRef.current) {
      clearTimeout(mobileNotifTimerRef.current);
      mobileNotifTimerRef.current = null;
    }
    setMobileNotificationsOpen(true);
  };

  const handleMobileNotifMouseLeave = () => {
    mobileNotifTimerRef.current = setTimeout(() => {
      setMobileNotificationsOpen(false);
    }, 280);
  };

  useEffect(() => {
    if (!user) {
      setUnreadNotifCount(0);
      setNotificationsOpen(false);
      setMobileNotificationsOpen(false);
      return;
    }

    const updateCount = (e?: any) => {
      if (e?.detail && String(e.detail.userId) !== String(user.id)) return;
      const list = getUserNotifications(user.id, user.name);
      setUnreadNotifCount(list.filter((n) => !n.isRead).length);
    };
    updateCount();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, updateCount);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, updateCount);
    };
  }, [user]);

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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        (!mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(event.target as Node))
      ) {
        setIsSearchFocused(false);
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

  // Initialize directly from live cache / synced data to eliminate delay on refresh
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>(() => {
    const cats = getCachedShopSettings().categories || [];
    return cats.filter((c) => c.isActive !== false);
  });
  const [mainMenuItems, setMainMenuItems] = useState<MainMenuItem[]>(() => {
    const menu = getCachedShopSettings().mainMenu || [];
    return menu.filter((m) => m.isActive !== false);
  });

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

  // Fetch catalog products and subscribe to real-time updates for live search keywords
  useEffect(() => {
    let isMounted = true;
    const clientProds = getClientCachedProducts();
    if (clientProds && clientProds.length > 0) {
      setCatalogProducts(clientProds);
    }
    fetchProducts()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCatalogProducts(data);
        }
      })
      .catch(() => {});

    const handleProductsUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setCatalogProducts(customEvt.detail);
      }
    };
    window.addEventListener(PRODUCTS_EVENT, handleProductsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener(PRODUCTS_EVENT, handleProductsUpdated);
    };
  }, []);

  const handleSelectKeyword = (keyword: string) => {
    setSearchInput(keyword);
    setIsSearchFocused(false);
    recordUserSearch(keyword);
    const params = new URLSearchParams();
    params.set('q', keyword);
    if (selectedCategory && selectedCategory !== 'All Categories') {
      params.set('category', selectedCategory);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setSearchInput('');
    setIsSearchFocused(false);
    recordUserSearch(catName);
    router.push(`/products?category=${encodeURIComponent(catName)}`);
  };

  const handleSelectProduct = (prodId: string) => {
    setIsSearchFocused(false);
    router.push(`/product-details?id=${prodId}`);
  };

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
        <div
          className={`header-middle header-middle-ptb-1 ${isSticky ? 'mobile-header-sticky-active' : ''}`}
          style={{ padding: '16px 0', backgroundColor: '#ffffff', position: 'relative', zIndex: 1060 }}
        >
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
                <div ref={searchContainerRef} className="search-style-2 w-100 position-relative">
                  <form
                    action="#"
                    className="custom-header-search-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsSearchFocused(false);
                      const params = new URLSearchParams();
                      if (searchInput.trim()) {
                        recordUserSearch(searchInput.trim());
                        params.set('q', searchInput.trim());
                      }
                      if (selectedCategory && selectedCategory !== 'All Categories') {
                        params.set('category', selectedCategory);
                      }
                      router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
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
                      onFocus={() => setIsSearchFocused(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsSearchFocused(false);
                      }}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        if (!isSearchFocused) setIsSearchFocused(true);
                      }}
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

                  {/* Desktop Live Keywords, Categories & Products Search Suggestions Dropdown */}
                  <HeaderSearchDropdown
                    isOpen={isSearchFocused}
                    query={searchInput}
                    onClose={() => setIsSearchFocused(false)}
                    onSelectKeyword={handleSelectKeyword}
                    onSelectCategory={handleSelectCategory}
                    onSelectProduct={handleSelectProduct}
                    catalogProducts={catalogProducts}
                    shopCategories={shopCategories}
                  />
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
                        zIndex: 99999,
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
                          backgroundColor: selectedLang === 'English' ? '#0f172a' : 'transparent',
                          color: selectedLang === 'English' ? '#ffffff' : '#0f172a',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLang !== 'English') {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLang !== 'English') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
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
                          backgroundColor: selectedLang === 'Arabic' ? '#0f172a' : 'transparent',
                          color: selectedLang === 'Arabic' ? '#ffffff' : '#0f172a',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'left',
                          marginTop: '3px',
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLang !== 'Arabic') {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLang !== 'Arabic') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
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
                    <i className="fi-rs-marker" style={{ color: '#0f172a' }}></i>
                    <span>{selectedLocation}</span>
                    <i className="fi-rs-angle-small-down" style={{ fontSize: '11px', color: '#64748b' }}></i>
                  </div>

                  {locationOpen && (
                    <ul
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        margin: 0,
                        background: '#ffffff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        borderRadius: '10px',
                        padding: '6px',
                        zIndex: 99999,
                        minWidth: '200px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        listStyle: 'none',
                        border: '1px solid #e2e8f0',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent',
                      }}
                    >
                      {locations.map((loc, idx) => {
                        const isSelected = selectedLocation === loc;
                        return (
                          <li
                            key={idx}
                            style={{
                              padding: '8px 14px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              color: isSelected ? '#ffffff' : '#0f172a',
                              fontWeight: isSelected ? '600' : '500',
                              background: isSelected ? '#0f172a' : 'transparent',
                              borderRadius: '6px',
                              marginBottom: idx === locations.length - 1 ? 0 : '2px',
                              transition: 'background-color 0.15s ease, color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#f1f5f9';
                                e.currentTarget.style.color = '#0f172a';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#0f172a';
                              }
                            }}
                            onClick={() => {
                              setSelectedLocation(loc);
                              setLocationOpen(false);
                            }}
                          >
                            {loc}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Mobile/Tablet Action Icons: Notifications, Wishlist, Cart, Profile & Hamburger */}
                <div className="header-action-2 d-flex d-xl-none align-items-center" style={{ gap: '14px' }}>
                  
                  {/* Mobile Notification Bell + Badge (Only for logged in users) */}
                  {user && (
                    <div
                      className="header-action-icon-2 d-inline-flex align-items-center"
                      style={{ position: 'relative' }}
                      onMouseEnter={handleMobileNotifMouseEnter}
                      onMouseLeave={handleMobileNotifMouseLeave}
                    >
                      <button
                        type="button"
                        className="header-notif-bell-btn"
                        onClick={() => setMobileNotificationsOpen((prev) => !prev)}
                        title="Notifications"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1e293b',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <line x1="10" y1="20" x2="14" y2="20" />
                          </svg>
                          {unreadNotifCount > 0 && (
                            <span
                              className="notif-active-dot"
                              style={{
                                position: 'absolute',
                                bottom: '-7px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '5px',
                                height: '5px',
                                backgroundColor: '#dc2626',
                                borderRadius: '50%',
                                display: 'block',
                              }}
                            />
                          )}
                        </div>
                      </button>

                      {/* Storefront Notifications Dropdown Panel (Mobile) */}
                      <div className="d-xl-none">
                        <StoreNotificationDropdown
                          isOpen={mobileNotificationsOpen}
                          onClose={() => setMobileNotificationsOpen(false)}
                          onMouseEnter={handleMobileNotifMouseEnter}
                          onMouseLeave={handleMobileNotifMouseLeave}
                          alignRight={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* Wishlist Heart Icon + Red Dot */}
                  <div className="header-action-icon-2 d-inline-flex align-items-center">
                    <Link
                      href={user ? "/wishlist" : "/login?redirect=/wishlist"}
                      title="Wishlist"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1e293b',
                        textDecoration: 'none',
                        padding: '4px',
                      }}
                    >
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {wishlist && wishlist.length > 0 && (
                          <span
                            className="wishlist-active-dot"
                            style={{
                              position: 'absolute',
                              bottom: '-7px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '5px',
                              height: '5px',
                              backgroundColor: '#dc2626',
                              borderRadius: '50%',
                              display: 'block'
                            }}
                          />
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Cart Icon + Inline Count + Red Dot */}
                  <div className="header-action-icon-2 d-inline-flex align-items-center">
                    <Link
                      href="/cart"
                      title="View Cart"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#1e293b',
                        textDecoration: 'none',
                        padding: '4px',
                      }}
                    >
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="8" width="16" height="13" rx="3" />
                          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                        </svg>
                        {totalCartItems > 0 && (
                          <span
                            className="cart-active-dot"
                            style={{
                              position: 'absolute',
                              bottom: '-7px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '5px',
                              height: '5px',
                              backgroundColor: '#dc2626',
                              borderRadius: '50%',
                              display: 'block'
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', lineHeight: 1 }}>
                        {totalCartItems}
                      </span>
                    </Link>
                  </div>

                  {/* 4. Vertical Divider */}
                  <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0', margin: '0 3px', flexShrink: 0 }} />

                  {/* 5. Profile Dropdown */}
                  <div
                    ref={mobileAccountRef}
                    className={"header-action-icon-2 " + (mobileAccountOpen ? "active" : "")}
                    style={{ position: 'relative' }}
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileAccountOpen(!mobileAccountOpen);
                      }}
                      title={user ? user.name : "Account"}
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                    >
                      {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <img
                            src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid rgb(231, 231, 231)'
                            }}
                          />
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transition: 'transform 0.2s ease',
                              transform: mobileAccountOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </a>

                    <div className={"cart-dropdown-wrap cart-dropdown-hm2 account-dropdown " + (mobileAccountOpen ? "open" : "")}>
                      {user ? (
                        <ul>
                          <li style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{user.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{user.email}</div>
                          </li>

                          {/* Admin: Quick Access to Dashboard */}
                          {isAdmin && (
                            <li>
                              <a
                                href="/dashboard"
                                onClick={() => setMobileAccountOpen(false)}
                              >
                                <i className="fi fi-rs-apps mr-10"></i>Dashboard Overview
                              </a>
                            </li>
                          )}

                          {/* Notifications */}
                          <li>
                            <Link
                              href={isAdmin ? "/dashboard" : "/profile"}
                              onClick={() => setMobileAccountOpen(false)}
                            >
                              <i className="fi fi-rs-bell mr-10"></i>Notifications
                            </Link>
                          </li>

                          {/* My Wishlist */}
                          <li>
                            <Link href="/wishlist" onClick={() => setMobileAccountOpen(false)}>
                              <i className="fi fi-rs-heart mr-10"></i>My Wishlist
                            </Link>
                          </li>

                          {/* Profile */}
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
                              <i className="fi fi-rs-user mr-10"></i>Profile
                            </Link>
                          </li>

                          {/* Settings */}
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

                          {/* Order History (Customer only) */}
                          {!isAdmin && (
                            <li>
                              <Link href="/history" onClick={() => setMobileAccountOpen(false)}>
                                <i className="fi-rs-time-past mr-10"></i>Order History
                              </Link>
                            </li>
                          )}

                          {/* Sign out */}
                          <li style={{ borderTop: '1px solid #f1f5f9', marginTop: '6px', paddingTop: '8px' }}>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setMobileAccountOpen(false);
                                logout();
                              }}
                              style={{ color: '#ef4444', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <i className="fi fi-rs-sign-out mr-10"></i>Sign out
                            </a>
                          </li>
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

                  {/* Hamburger Menu: Round Black Background with Tiered White Rounded Bars */}
                  <button
                    type="button"
                    className="mobile-hamburger-btn"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open Navigation Menu"
                    title="Open Menu"
                    style={{
                      width: '38px',
                      height: '38px',
                      minWidth: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#0f172a',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.22)',
                      transition: 'transform 0.15s ease, background-color 0.15s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1e293b';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0f172a';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg
                      width="18"
                      height="13"
                      viewBox="0 0 18 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="0" y="0" width="18" height="2.2" rx="1.1" fill="#ffffff" />
                      <rect x="0" y="5.4" width="12" height="2.2" rx="1.1" fill="#ffffff" />
                      <rect x="0" y="10.8" width="6.5" height="2.2" rx="1.1" fill="#ffffff" />
                    </svg>
                  </button>

                </div>

              </div>
            </div>

            {/* Mobile-only Search Bar: Matching reference style */}
            <div className="d-block d-xl-none mt-3 pt-1">
              <div ref={mobileSearchContainerRef} className="search-style-2 w-100 position-relative">
                <form
                  action="#"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsSearchFocused(false);
                    if (searchInput.trim()) {
                      recordUserSearch(searchInput.trim());
                      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
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
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsSearchFocused(false);
                    }}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      if (!isSearchFocused) setIsSearchFocused(true);
                    }}
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

                {/* Mobile Live Keywords, Categories & Products Search Suggestions Dropdown */}
                <HeaderSearchDropdown
                  isOpen={isSearchFocused}
                  query={searchInput}
                  onClose={() => setIsSearchFocused(false)}
                  onSelectKeyword={handleSelectKeyword}
                  onSelectCategory={handleSelectCategory}
                  onSelectProduct={handleSelectProduct}
                  catalogProducts={catalogProducts}
                  shopCategories={shopCategories}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            3. DESKTOP & LAPTOP NAVIGATION BAR (header-bottom)
           ======================================================== */}
        <div
          className="header-bottom-placeholder d-none d-xl-block"
          style={{
            height: isSticky ? '58px' : 'auto',
          }}
        >
          <div
            className={`header-bottom header-bottom-bg-color d-none d-xl-block ${isSticky ? 'sticky-navbar-active' : ''}`}
            style={{
              backgroundColor: '#ffffff',
              position: isSticky ? 'fixed' : 'relative',
              top: isSticky ? 0 : 'auto',
              left: isSticky ? 0 : 'auto',
              right: isSticky ? 0 : 'auto',
              width: '100%',
              zIndex: 1045,
            }}
          >
            <div className="container">
              <div className="header-wrap header-space-between position-relative">
                
                {/* Desktop Nav Items */}
                <div className="header-nav d-flex align-items-center">
                  
                  {/* Sticky Mini Brand Logo (Fades in when navbar sticks) */}
                  {isSticky && (
                    <Link
                      href="/"
                      className="sticky-nav-brand-logo d-flex align-items-center"
                      style={{
                        marginRight: '20px',
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                      title="Home"
                    >
                      <img
                        src="/assets/imgs/theme/logo.jpg"
                        alt="logo"
                        style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                      />
                    </Link>
                  )}
                
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
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
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
                      width="14"
                      height="14"
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

              {/* Action Icons in Header Bottom (Desktop) matching reference */}
              <div className="icns">
                <div className="header-action-2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  
                  {/* 1. Notification Bell & Dropdown (Only for logged in users) */}
                  {user && (
                    <div
                      className="header-action-icon-2"
                      style={{ position: 'relative' }}
                      onMouseEnter={handleNotifMouseEnter}
                      onMouseLeave={handleNotifMouseLeave}
                    >
                      <button
                        type="button"
                        className="header-notif-bell-btn"
                        onClick={() => setNotificationsOpen((prev) => !prev)}
                        title="Notifications"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#1e293b',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <line x1="10" y1="20" x2="14" y2="20" />
                          </svg>
                          {unreadNotifCount > 0 && (
                            <span
                              className="notif-active-dot"
                              style={{
                                position: 'absolute',
                                bottom: '-7px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '5px',
                                height: '5px',
                                backgroundColor: '#dc2626',
                                borderRadius: '50%',
                                display: 'block',
                              }}
                            />
                          )}
                        </div>
                      </button>

                      {/* Storefront Notifications Dropdown Panel (Desktop) */}
                      <StoreNotificationDropdown
                        isOpen={notificationsOpen}
                        onClose={() => setNotificationsOpen(false)}
                        onMouseEnter={handleNotifMouseEnter}
                        onMouseLeave={handleNotifMouseLeave}
                        alignRight={true}
                      />
                    </div>
                  )}

                  {/* 2. Wishlist Heart + Red Dot when has items */}
                  <div className="header-action-icon-2">
                    <Link
                      href={user ? "/wishlist" : "/login?redirect=/wishlist"}
                      title="Wishlist"
                      style={{ display: 'flex', alignItems: 'center', color: '#1e293b', fontSize: '25px', transition: 'color 0.2s' }}
                    >
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {wishlist && wishlist.length > 0 && (
                          <span
                            className="wishlist-active-dot"
                            style={{
                              position: 'absolute',
                              bottom: '-7px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '5px',
                              height: '5px',
                              backgroundColor: '#dc2626',
                              borderRadius: '50%',
                              display: 'block'
                            }}
                          />
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* 3. Shopping Bag + Count + Red Dot when has items */}
                  <div className="header-action-icon-2">
                    <Link
                      href="/cart"
                      title="View Cart"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#1e293b',
                        textDecoration: 'none',
                        fontSize: '25px',
                        transition: 'color 0.2s'
                      }}
                    >
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="8" width="16" height="13" rx="3" />
                          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                        </svg>
                        {totalCartItems > 0 && (
                          <span
                            className="cart-active-dot"
                            style={{
                              position: 'absolute',
                              bottom: '-7px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '5px',
                              height: '5px',
                              backgroundColor: '#dc2626',
                              borderRadius: '50%',
                              display: 'block'
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '500', color: '#0f172a', lineHeight: 1 }}>
                        {totalCartItems}
                      </span>
                    </Link>
                  </div>

                  {/* 4. Vertical Divider */}
                  <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0', margin: 0 }} />

                  {/* 5. Account / Profile Icon with Hover Dropdown */}
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: 0,
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      {user ? (
                        <div className="header-user-content" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid rgb(231, 231, 231)'
                            }}
                          />
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
                              transform: accountOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
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
      </div>

      </header>

      {/* ========================================================
          4. MOBILE / TABLET SLIDEOUT DRAWER (Full Menu & Accordions)
         ======================================================== */}
      <div className={"mobile-header-active mobile-header-wrapper-style " + (mobileMenuOpen ? "sidebar-visible" : "")}>
        <div className="mobile-header-wrapper-inner" style={{ height: '100%', overflowY: 'auto', padding: '16px 18px 40px 18px', display: 'flex', flexDirection: 'column' }}>
          
          {/* 1. Header Bar: Aligned Logo on Left, Clean Text-only EN/AR Language Dropdown, Close Button on Right */}
          <div
            className="mobile-header-top d-flex align-items-center justify-content-between pb-3 mb-2"
            style={{ width: '100%', borderBottom: '1px solid #f1f5f9', gap: '10px' }}
          >
            {/* Left: Brand Logo only */}
            <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                <img
                  src="/assets/imgs/theme/logo.svg"
                  alt="logo"
                  style={{ height: '32px', width: 'auto', maxWidth: '125px', objectFit: 'contain' }}
                />
              </Link>
            </div>

            {/* Right: Language Dropdown, Divider Line, and Close Button */}
            <div className="d-flex align-items-center" style={{ gap: '10px', marginLeft: 'auto' }}>
              {/* Language Switcher Dropdown (Text-only EN / AR, No Flags) */}
              <div className="position-relative">
                <button
                  type="button"
                  onClick={() => setMobileLangOpen(!mobileLangOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#1e293b',
                    lineHeight: 1,
                  }}
                  title="Change Language"
                >
                  <span>{selectedLang === 'Arabic' ? 'AR' : 'EN'}</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: '#64748b',
                      transition: 'transform 0.2s ease',
                      transform: mobileLangOpen ? 'rotate(180deg)' : 'none',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {mobileLangOpen && (
                  <ul
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      background: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                      border: '1px solid #e2e8f0',
                      padding: '4px 0',
                      listStyle: 'none',
                      minWidth: '70px',
                      zIndex: 1000,
                      margin: 0,
                    }}
                  >
                    <li
                      onClick={() => {
                        setSelectedLang('English');
                        setMobileLangOpen(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: selectedLang === 'English' ? '700' : '500',
                        color: selectedLang === 'English' ? '#3BB77E' : '#334155',
                        cursor: 'pointer',
                        backgroundColor: selectedLang === 'English' ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      EN
                    </li>
                    <li
                      onClick={() => {
                        setSelectedLang('Arabic');
                        setMobileLangOpen(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: selectedLang === 'Arabic' ? '700' : '500',
                        color: selectedLang === 'Arabic' ? '#3BB77E' : '#334155',
                        cursor: 'pointer',
                        backgroundColor: selectedLang === 'Arabic' ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      AR
                    </li>
                  </ul>
                )}
              </div>

              {/* Vertical Divider Border */}
              <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }} />

              {/* Close Button */}
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  cursor: 'pointer',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1e293b',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                title="Close Menu"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* 2. Search Bar in Drawer: Matching Reference Image Style */}
          <div style={{ margin: '8px 0 16px 0' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInput.trim()) {
                  recordUserSearch(searchInput.trim());
                  router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
                  setMobileMenuOpen(false);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0 14px',
                height: '46px',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none',
                  boxShadow: 'none',
                  padding: 0,
                }}
              />
              <button
                type="submit"
                aria-label="Search"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '0 0 0 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#64748b',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>
          </div>

          {/* 3. Navigation Items List: Styled Matching the Reference Image */}
          <div className="mobile-menu-wrap" style={{ flex: 1 }}>
            <nav>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                
                {/* Main Navigation Links Only */}
                {mainMenuItems.filter(m => m.isActive !== false).map((menuItem) => {
                  const hasSub = Boolean(menuItem.hasMegaMenu && menuItem.columns && menuItem.columns.length > 0);
                  const isAccordionOpen = openAccordion === `menu-${menuItem.id}`;
                  const menuDest = getMenuDestination(menuItem);

                  return (
                    <li key={menuItem.id}>
                      <div
                        onClick={() => {
                          if (hasSub) {
                            toggleAccordion(`menu-${menuItem.id}`);
                          } else {
                            router.push(menuDest);
                            setMobileMenuOpen(false);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          color: '#1e293b',
                          backgroundColor: isAccordionOpen ? '#f8fafc' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getNavIcon(menuItem.name, menuItem.badge)}
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {formatNavigationLabel(menuItem.name)}
                            </span>
                            {menuItem.badge && (
                              <span
                                style={{
                                  backgroundColor: getMenuBadgeColor(menuItem.badge),
                                  color: '#ffffff',
                                  fontSize: '10.5px',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px',
                                  flexShrink: 0,
                                }}
                              >
                                {formatMenuBadgeLabel(menuItem.badge)}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Right Action Button (Chevron that rotates if has dropdown) */}
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            flexShrink: 0,
                            marginLeft: '8px',
                            transition: 'transform 0.2s ease',
                            transform: hasSub && isAccordionOpen ? 'rotate(90deg)' : 'none',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>

                      {/* Expandable Submenu / Mega Menu columns (matches desktop dropdown) */}
                      {hasSub && (
                        <div
                          style={{
                            display: isAccordionOpen ? 'block' : 'none',
                            padding: '6px 0 6px 48px',
                            margin: '2px 0 6px 0',
                            borderLeft: '2px solid #e2e8f0',
                            marginLeft: '28px',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {menuItem.columns!.map((col) => (
                              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <Link
                                  href={col.link || menuItem.link}
                                  onClick={() => setMobileMenuOpen(false)}
                                  style={{
                                    display: 'block',
                                    padding: '6px 12px',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: '#0f172a',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {formatNavigationLabel(col.title)}
                                </Link>

                                {col.items && col.items.length > 0 && (
                                  <ul style={{ listStyle: 'none', padding: '0 0 0 8px', margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {col.items.map((subItem) => (
                                      <li key={subItem.id}>
                                        <Link
                                          href={subItem.link}
                                          onClick={() => setMobileMenuOpen(false)}
                                          style={{
                                            display: 'block',
                                            padding: '5px 12px',
                                            fontSize: '13.5px',
                                            fontWeight: '500',
                                            color: '#475569',
                                            textDecoration: 'none',
                                            borderRadius: '4px',
                                            transition: 'color 0.15s ease',
                                          }}
                                        >
                                          {subItem.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}

                            <div style={{ marginTop: '2px', paddingLeft: '12px' }}>
                              <Link
                                href={menuDest}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#3BB77E',
                                  textDecoration: 'none',
                                }}
                              >
                                View all {formatNavigationLabel(menuItem.name)} →
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}

              </ul>
            </nav>

            {/* Quick Access: Profile, Wishlist & Notifications inside Mobile Drawer */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Link
                href={user ? "/profile#basic-info" : "/login?redirect=/profile%23basic-info"}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  fontSize: '14.5px',
                  fontWeight: '600',
                  backgroundColor: '#f8fafc',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span>{user ? `My Profile (${user.name})` : "My Profile / Sign In"}</span>
              </Link>

              <Link
                href={user ? "/wishlist" : "/login?redirect=/wishlist"}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  fontSize: '14.5px',
                  fontWeight: '600',
                  backgroundColor: '#f8fafc',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <span>My Wishlist</span>
              </Link>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setNotificationsOpen(true);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#1e293b',
                    fontSize: '14.5px',
                    fontWeight: '600',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <line x1="10" y1="20" x2="14" y2="20" />
                    </svg>
                    {unreadNotifCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#10b981',
                          borderRadius: '50%',
                          border: '1.5px solid #ffffff',
                        }}
                      />
                    )}
                  </div>
                  <span>Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span className="badge rounded-pill bg-success ms-auto fs-11 fw-bold">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              )}
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
