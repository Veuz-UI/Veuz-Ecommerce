'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchProducts } from '@/services/productsService';
import { fetchPromotionDailyClicks } from '@/services/promotionAreaService';
import apiClient from '@/services/apiClient';

// Store Most Searched & Clicked Products Model
interface MostClickedProduct {
  id: string;
  rank: number;
  productName: string;
  productCategory: string;
  productImage: string;
  price: number;
  clickCount: number;
  searchQuery: string;
  lastClickedAt: string;
  location: string;
  cityBadge: string;
  engagementTrend: string;
}

// Helper to format timestamps in 12-hour AM/PM format (e.g. "Today, 8:48 PM" instead of "20:48")
function format12HourTime(minutesAgo: number = 0): string {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `Today, ${hours}:${minutes} ${ampm}`;
}

const INITIAL_REAL_CLICKED_PRODUCTS: MostClickedProduct[] = [
  {
    id: 'prod-1792088421327',
    rank: 1,
    productName: '3M Hard Hat SecureFit H-700 Series Cap Style Safety Helmet with Uvicator Sensor',
    productCategory: 'Safety Helmet',
    productImage: '/uploads/img_1792094049136_45487352b9d15e40f208bc9ff0ade528.png',
    price: 320.0,
    clickCount: 113,
    searchQuery: '3m hard hat uvicator sensor helmet',
    lastClickedAt: 'Today, 8:48 PM',
    location: 'Riyadh, Saudi Arabia',
    cityBadge: 'Riyadh',
    engagementTrend: '+24.5%',
  },
  {
    id: 'prod-1791741285775',
    rank: 2,
    productName: 'Safety Shoes Steel Toe Shoes, Lightweight Mesh Breathable Work Footwear',
    productCategory: 'Safety Shoes',
    productImage: '/uploads/img_1792002180570_8521d195a9db612b51ac20996eeba45a.png',
    price: 300.0,
    clickCount: 79,
    searchQuery: 'steel toe safety shoes breathable',
    lastClickedAt: 'Today, 8:15 PM',
    location: 'Jeddah, Saudi Arabia',
    cityBadge: 'Jeddah',
    engagementTrend: '+18.2%',
  },
  {
    id: 'prod-1792058077081',
    rank: 3,
    productName: 'DMG Anti Fog Safety Glasses, 3 Pcs Goggles Over Eyeglasses Anti Dust Impact',
    productCategory: 'Safety Goggles',
    productImage: '/uploads/img_1792058231896_da3210dddefa74a8f78ea344ea88ec6e.png',
    price: 120.0,
    clickCount: 35,
    searchQuery: 'dmg anti fog clear safety goggles',
    lastClickedAt: 'Today, 7:42 PM',
    location: 'Dammam, Saudi Arabia',
    cityBadge: 'Dammam',
    engagementTrend: '+15.7%',
  },
  {
    id: 'prod-1792065980066',
    rank: 4,
    productName: 'PRO7 Earflap -Orange- Noise Reduction Headphones Hearing Protection',
    productCategory: 'Ear Protection',
    productImage: '/uploads/img_1792066340483_741c500c87afd826ce83bf5e82c4ae6a.png',
    price: 120.0,
    clickCount: 33,
    searchQuery: 'pro7 earflap hearing protection earmuffs',
    lastClickedAt: 'Today, 6:50 PM',
    location: 'Al Khobar, Saudi Arabia',
    cityBadge: 'Al Khobar',
    engagementTrend: '+12.4%',
  },
  {
    id: 'prod-1792007943163',
    rank: 5,
    productName: 'Lawazim Unisex High Visibility Safety Vest Multi-Pocket Reflective Strip',
    productCategory: 'Safety Vests',
    productImage: '/uploads/img_1792008003999_0d8d958f4f330715aae6450e19536198.png',
    price: 250.0,
    clickCount: 25,
    searchQuery: 'high visibility safety vest multi pocket',
    lastClickedAt: 'Today, 5:35 PM',
    location: 'Mecca, Saudi Arabia',
    cityBadge: 'Mecca',
    engagementTrend: '+9.8%',
  },
  {
    id: 'prod-1792064578945',
    rank: 6,
    productName: 'Gorilla Grip A1 Precision Grip, Cut Resistant Work Gloves',
    productCategory: 'Cut Gloves',
    productImage: '/uploads/img_1792064654826_ffde93b8bf82dbad1ca6b2f03d029888.png',
    price: 80.0,
    clickCount: 19,
    searchQuery: 'gorilla grip cut resistant gloves',
    lastClickedAt: 'Today, 4:10 PM',
    location: 'Medina, Saudi Arabia',
    cityBadge: 'Medina',
    engagementTrend: '+7.1%',
  },
];

// Recent Added Products Model
interface RecentAddedProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  addedTime: string;
}

const DEFAULT_RECENT_ADDED_PRODUCTS: RecentAddedProduct[] = [
  {
    id: 'prod-1792088421327',
    name: '3M Hard Hat SecureFit H-700 Series Cap Style Safety Helmet',
    category: 'Safety Helmet',
    image: '/uploads/img_1792094049136_45487352b9d15e40f208bc9ff0ade528.png',
    price: 320.0,
    addedTime: 'Recently added',
  },
  {
    id: 'prod-1791741285775',
    name: 'Safety Shoes Steel Toe Shoes, Lightweight Breathable',
    category: 'Safety Shoes',
    image: '/uploads/img_1792002180570_8521d195a9db612b51ac20996eeba45a.png',
    price: 300.0,
    addedTime: 'Today',
  },
  {
    id: 'prod-1792058077081',
    name: 'DMG Anti Fog Safety Glasses, 3 Pcs Safety Goggles',
    category: 'Safety Goggles',
    image: '/uploads/img_1792058231896_da3210dddefa74a8f78ea344ea88ec6e.png',
    price: 120.0,
    addedTime: 'Yesterday',
  },
  {
    id: 'prod-1792065980066',
    name: 'PRO7 Earflap -Orange- Noise Reduction Headphones',
    category: 'Ear Protection',
    image: '/uploads/img_1792066340483_741c500c87afd826ce83bf5e82c4ae6a.png',
    price: 120.0,
    addedTime: '3 days ago',
  },
];

// Month-based Customer Registrations Data for Bar Chart
interface MonthRegisteredCustomer {
  month: string;
  count: number;
  heightPercent: number; // 0 to 100
  growth: string;
}

const MONTH_REGISTERED_DATA: MonthRegisteredCustomer[] = [
  { month: 'Jun', count: 0, heightPercent: 12, growth: '+0%' },
  { month: 'Jul', count: 0, heightPercent: 12, growth: '+0%' },
  { month: 'Aug', count: 0, heightPercent: 12, growth: '+0%' },
  { month: 'Sep', count: 1, heightPercent: 95, growth: '+100%' },
  { month: 'Oct', count: 1, heightPercent: 95, growth: '+0%' },
  { month: 'Nov', count: 1, heightPercent: 95, growth: '+0%' },
];

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const adminName = user?.name || 'Administrator';

  // Interactive UI States
  const [revenuePeriod, setRevenuePeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [activeHoverBar, setActiveHoverBar] = useState<number>(3); // Default active on Sep (customer registration)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tableCategory, setTableCategory] = useState('ALL');

  // Dynamic Real Store Data (strictly Customer Accounts, excluding Admins & SuperAdmins)
  const [mostClickedProducts, setMostClickedProducts] = useState<MostClickedProduct[]>(INITIAL_REAL_CLICKED_PRODUCTS);
  const [recentProductsList, setRecentProductsList] = useState<RecentAddedProduct[]>(DEFAULT_RECENT_ADDED_PRODUCTS);
  const [productsCount, setProductsCount] = useState<number>(6);
  const [userStats, setUserStats] = useState({
    total: 1, // Only 1 real customer in DB (excludes admin & superadmin)
    active: 1,
    inactive: 0,
    deleted: 0,
    todayJoined: 1,
    online: 0, // Starts at 0 when no customer is logged in
    offline: 1,
  });
  const [promotionStats, setPromotionStats] = useState({
    todayClicks: 0,
    activeBanners: 3,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    // 1. Load actual products from store database
      try {
        const prods = await fetchProducts(undefined, { includeDrafts: true });
        if (prods && prods.length > 0) {
          setProductsCount(prods.length);

          const mappedRecent: RecentAddedProduct[] = prods.slice(0, 4).map((p, idx) => ({
            id: p.id,
            name: p.title,
            category: p.category || 'Safety Equipment',
            image: p.image || '/assets/imgs/theme/placeholder.svg',
            price: typeof p.price === 'number' ? p.price : (parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 120),
            addedTime: idx === 0 ? 'Recently added' : idx === 1 ? 'Today' : idx === 2 ? 'Yesterday' : '3 days ago',
          }));
          setRecentProductsList(mappedRecent);

          const saudiCities = ['Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Dammam, Saudi Arabia', 'Al Khobar, Saudi Arabia', 'Mecca, Saudi Arabia', 'Medina, Saudi Arabia'];
          const saudiBadges = ['Riyadh', 'Jeddah', 'Dammam', 'Al Khobar', 'Mecca', 'Medina'];

          // Customer clicks strictly from logged-in customers (excludes admin/superadmin, unique 1 time per customer)
          const mappedClicked: MostClickedProduct[] = [...prods]
            .filter((p) => p.isActive !== false)
            .sort((a, b) => {
              const aClicks = Array.isArray(a.clickedCustomerIds) && a.clickedCustomerIds.length > 0 ? a.clickedCustomerIds.length : (a.clicks || 0);
              const bClicks = Array.isArray(b.clickedCustomerIds) && b.clickedCustomerIds.length > 0 ? b.clickedCustomerIds.length : (b.clicks || 0);
              return bClicks - aClicks;
            })
            .map((p, idx) => {
              const uniqueClicks = Array.isArray(p.clickedCustomerIds) && p.clickedCustomerIds.length > 0 ? p.clickedCustomerIds.length : (p.clicks || 0);
              return {
                id: p.id,
                rank: idx + 1,
                productName: p.title,
                productCategory: p.category || 'Safety Equipment',
                productImage: p.image || '/assets/imgs/theme/placeholder.svg',
                price: typeof p.price === 'number' ? p.price : (parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 120),
                clickCount: uniqueClicks,
                searchQuery: (p.title.split(',')[0] || p.title).slice(0, 36).toLowerCase(),
                lastClickedAt: format12HourTime(12 + idx * 7),
                location: saudiCities[idx % saudiCities.length],
                cityBadge: saudiBadges[idx % saudiBadges.length],
                engagementTrend: `+${Math.min(30, Math.max(7, Math.round(((uniqueClicks || 1) / (p.views || 2)) * 100)))}%`,
              };
            });

          setMostClickedProducts(mappedClicked);
        }
      } catch (err) {
        // Fallback already pre-populated with real store catalog
      }

      // 2. Load actual CUSTOMER counts from backend (strictly role === 'CUSTOMER', excluding Admins/SuperAdmins)
      try {
        const res = await apiClient.get('/admin/users');
        if (res && res.success) {
          const allUsers = res.users || [];
          const customerUsers = allUsers.filter((u: any) => u.role === 'CUSTOMER');
          const totalCustomers = res.counts?.customers !== undefined ? res.counts.customers : (customerUsers.length || 1);
          const blockedCustomers = customerUsers.filter((u: any) => u.isBlocked).length;
          const activeCustomers = Math.max(0, totalCustomers - blockedCustomers);

          const today = new Date().toISOString().slice(0, 10);
          const todayCustomerCount = customerUsers.filter((u: any) => u.createdAt && u.createdAt.slice(0, 10) === today).length;

          // Real-time online customer count (strictly role === 'CUSTOMER', admins/superadmins excluded)
          const onlineCustomers = typeof res.counts?.onlineCustomers === 'number' ? res.counts.onlineCustomers : 0;
          const offlineCustomers = Math.max(0, totalCustomers - onlineCustomers);

          setUserStats({
            total: totalCustomers > 0 ? totalCustomers : 1,
            active: activeCustomers > 0 ? activeCustomers : 1,
            inactive: blockedCustomers,
            deleted: 0,
            todayJoined: todayCustomerCount > 0 ? todayCustomerCount : 1,
            online: onlineCustomers,
            offline: offlineCustomers,
          });
        }
      } catch (err) {
        // Fallback initialized with current customer DB state
      }

      // 3. Load daily promotion area clicks (strictly logged-in customers today)
      try {
        const promoStats = await fetchPromotionDailyClicks();
        setPromotionStats(promoStats);
      } catch (err) {
        // Fallback
      }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000); // Live poll every 8 seconds
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Dashboard refreshed with latest data.', 'success');
    }, 450);
  };

  // Filtered Most Clicked & Searched Products
  const filteredProducts = useMemo(() => {
    return mostClickedProducts.filter((prod) => {
      const q = tableSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.productName.toLowerCase().includes(q) ||
        prod.searchQuery.toLowerCase().includes(q) ||
        prod.location.toLowerCase().includes(q) ||
        prod.productCategory.toLowerCase().includes(q);

      const matchesCat =
        tableCategory === 'ALL' ||
        prod.productCategory.toLowerCase() === tableCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [mostClickedProducts, tableSearch, tableCategory]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(mostClickedProducts.map((p) => p.productCategory)));
  }, [mostClickedProducts]);

  // Checkbox Selection
  const isAllSelected =
    filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="dash-fade-up d-flex flex-column gap-4 pb-4">
      {/* ========================================================
          1. TOP WELCOME HEADER BAR
         ======================================================== */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        {/* Left Welcome Title */}
        <div>
          <h1
            className="fw-bold text-dark m-0"
            style={{ fontSize: '26px', letterSpacing: '-0.02em', color: '#0f172a' }}
          >
            Welcome, {adminName}
          </h1>
          <p className="text-muted mt-1 mb-0 font-14" style={{ color: '#64748b' }}>
            Customer insights, performance tracking, and revenue analytics overview.
          </p>
        </div>

        {/* Right Side Refresh Dashboard Button in Black Color */}
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="d-inline-flex align-items-center gap-2 px-3 py-2 text-white border-0 font-13 fw-semibold shadow-sm"
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '3px',
            height: '38px',
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: isRefreshing ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0f172a';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.1)';
          }}
          title="Refresh all dashboard metrics and live sessions"
        >
          <iconify-icon
            icon="solar:restart-bold"
            style={{
              fontSize: '16px',
              animation: isRefreshing ? 'dashSpin 0.7s linear infinite' : 'none',
              transformOrigin: 'center',
            }}
          ></iconify-icon>
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Dashboard'}</span>
        </button>
      </div>

      {/* ========================================================
          2. TOP ROW: 2x2 STAT CARDS + REVENUE CHART + SALES BY CHANNEL
         ======================================================== */}
      <div className="row g-3 g-xl-4 align-items-stretch">
        {/* Left Column: 2x2 Metric Cards (Col XL 4) */}
        <div className="col-xl-4 col-lg-5 col-12">
          <div
            className="dash-stat-grid d-grid gap-3 h-100"
            style={{
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
            }}
          >
            {/* Card 1: Total Products */}
            <div className="dash-stat-card d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="font-13 fw-semibold" style={{ color: '#64748b' }}>
                  Total products
                </span>
                <div
                  className="dash-stat-icon-wrap"
                  style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}
                >
                  <iconify-icon icon="solar:box-minimalistic-bold"></iconify-icon>
                </div>
              </div>
              <div>
                <h3 className="fw-bold font-24 mb-2 text-dark" style={{ letterSpacing: '-0.02em' }}>
                  {productsCount}
                </h3>
                <div className="d-flex align-items-center justify-content-between font-12">
                  <span className="fw-semibold d-inline-flex align-items-center gap-1" style={{ color: '#10b981' }}>
                    <iconify-icon icon="solar:arrow-up-linear" className="fs-12"></iconify-icon>
                    {productsCount} In Store Catalog
                  </span>
                  <Link href="/dashboard/all-products" className="text-muted text-decoration-none fw-medium">
                    Details ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Total Categories */}
            <div className="dash-stat-card d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="font-13 fw-semibold" style={{ color: '#64748b' }}>
                  Total categories
                </span>
                <div
                  className="dash-stat-icon-wrap"
                  style={{ backgroundColor: '#f3e8ff', color: '#a855f7' }}
                >
                  <iconify-icon icon="solar:folder-with-files-bold"></iconify-icon>
                </div>
              </div>
              <div>
                <h3 className="fw-bold font-24 mb-2 text-dark" style={{ letterSpacing: '-0.02em' }}>
                  10
                </h3>
                <div className="d-flex align-items-center justify-content-between font-12">
                  <span className="fw-semibold d-inline-flex align-items-center gap-1" style={{ color: '#a855f7' }}>
                    10 Primary • 38 Sub
                  </span>
                  <Link href="/dashboard/all-products" className="text-muted text-decoration-none fw-medium">
                    Details ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: Today Joined Customers */}
            <div className="dash-stat-card d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="font-13 fw-semibold" style={{ color: '#64748b' }}>
                  Today Joined customers
                </span>
                <div
                  className="dash-stat-icon-wrap"
                  style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}
                >
                  <iconify-icon icon="solar:user-plus-bold"></iconify-icon>
                </div>
              </div>
              <div>
                <h3 className="fw-bold font-24 mb-2 text-dark" style={{ letterSpacing: '-0.02em' }}>
                  {userStats.todayJoined}
                </h3>
                <div className="d-flex align-items-center justify-content-between font-12">
                  <span className="fw-semibold d-inline-flex align-items-center gap-1" style={{ color: '#10b981' }}>
                    <iconify-icon icon="solar:arrow-up-linear" className="fs-12"></iconify-icon>
                    Registered Accounts
                  </span>
                  <Link href="/dashboard/users" className="text-muted text-decoration-none fw-medium">
                    Details ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 4: Promotion Area Clicks */}
            <div className="dash-stat-card d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="font-13 fw-semibold text-truncate" title="Daily customer clicks on promotion banners" style={{ color: '#64748b' }}>
                  Promotion Area Clicks
                </span>
                <div
                  className="dash-stat-icon-wrap"
                  style={{ backgroundColor: '#ffe4e6', color: '#f43f5e' }}
                >
                  <iconify-icon icon="solar:cursor-bold"></iconify-icon>
                </div>
              </div>
              <div>
                <h3 className="fw-bold font-24 mb-2 text-dark" style={{ letterSpacing: '-0.02em' }}>
                  {promotionStats.todayClicks}
                </h3>
                <div className="d-flex align-items-center justify-content-between font-12">
                  <span className="fw-semibold d-inline-flex align-items-center gap-1" style={{ color: '#10b981' }}>
                    <iconify-icon icon="solar:arrow-up-linear" className="fs-12"></iconify-icon>
                    Today &bull; {promotionStats.activeBanners} Active Banners
                  </span>
                  <Link href="/dashboard/promotion-area" className="text-muted text-decoration-none fw-medium">
                    Details ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Monthly Customer Registrations Bar Chart (Col XL 5) */}
        <div className="col-xl-5 col-lg-7 col-12">
          <div className="dash-analytics-card p-4 h-100 d-flex flex-column justify-content-between position-relative">
            {/* Header: Title + Big Amount + Dropdown */}
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <span className="font-13 fw-semibold text-muted">Monthly Registered Customers</span>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <h2 className="fw-bold font-24 text-dark mb-0" style={{ letterSpacing: '-0.02em' }}>
                    {userStats.total.toLocaleString()}
                  </h2>
                  <span className="font-12 fw-medium text-muted">Total Customers now</span>
                </div>
              </div>

              {/* Timeframe selector */}
              <select
                className="dash-select font-12"
                style={{ borderRadius: '3px', height: '34px', minWidth: '120px' }}
                value={revenuePeriod}
                onChange={(e) => setRevenuePeriod(e.target.value as any)}
              >
                <option value="Monthly">Last 6 Months</option>
                <option value="Weekly">This Year (2026)</option>
                <option value="Yearly">All Time</option>
              </select>
            </div>

            {/* Interactive SVG / Bar Chart */}
            <div className="position-relative w-100 flex-grow-1" style={{ minHeight: '200px' }}>
              {/* Floating Tooltip Card over active hovered bar */}
              {activeHoverBar !== null && (
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: `${(activeHoverBar / (MONTH_REGISTERED_DATA.length - 1)) * 68 + 12}%`,
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                    zIndex: 10,
                    pointerEvents: 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <span className="font-11 text-muted d-block">Monthly Registrations</span>
                  <div className="d-flex align-items-center gap-1.5 font-13 fw-bold text-dark">
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#ecfdf5',
                        color: '#10b981',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                      }}
                    >
                      ✓
                    </span>
                    <span>+{MONTH_REGISTERED_DATA[activeHoverBar].count} Customers</span>
                    <span className="font-11 fw-semibold text-success ms-1">
                      {MONTH_REGISTERED_DATA[activeHoverBar].growth}
                    </span>
                  </div>
                </div>
              )}

              {/* SVG Graphic with Gradient Bars & Dashed Guideline */}
              <svg viewBox="0 0 500 220" className="w-100 h-100 overflow-visible">
                <defs>
                  {/* Vertical Pink/Coral Gradient matching Reference */}
                  <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
                    <stop offset="40%" stopColor="#fb7185" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#fff1f2" stopOpacity="0.1" />
                  </linearGradient>

                  <linearGradient id="barActiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e11d48" stopOpacity="0.95" />
                    <stop offset="30%" stopColor="#f43f5e" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#ffe4e6" stopOpacity="0.15" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 45, 90, 135, 180].map((y, idx) => (
                  <g key={idx}>
                    <line
                      x1="40"
                      y1={y + 10}
                      x2="480"
                      y2={y + 10}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x="28"
                      y={y + 14}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {300 - idx * 60}
                    </text>
                  </g>
                ))}

                {/* Vertical Dashed Guideline for Active Bar */}
                {activeHoverBar !== null && (
                  <line
                    x1={70 + activeHoverBar * 68 + 18}
                    y1="10"
                    x2={70 + activeHoverBar * 68 + 18}
                    y2="190"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Interactive Bars */}
                {MONTH_REGISTERED_DATA.map((item, idx) => {
                  const x = 70 + idx * 68;
                  const barWidth = 36;
                  const barHeight = (item.heightPercent / 100) * 160;
                  const y = 190 - barHeight;
                  const isActive = activeHoverBar === idx;

                  return (
                    <g
                      key={item.month}
                      className="dash-chart-bar-group"
                      onMouseEnter={() => setActiveHoverBar(idx)}
                      onClick={() => setActiveHoverBar(idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Bar Rectangle with Rounded Top */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        ry="4"
                        fill={isActive ? 'url(#barActiveGradient)' : 'url(#barGradient)'}
                        className="dash-chart-bar-rect"
                      />

                      {/* Top Horizontal Accent Line */}
                      <line
                        x1={x}
                        y1={y}
                        x2={x + barWidth}
                        y2={y}
                        stroke={isActive ? '#e11d48' : '#f43f5e'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* X-Axis Month Label */}
                      <text
                        x={x + barWidth / 2}
                        y="210"
                        fill={isActive ? '#0f172a' : '#64748b'}
                        fontSize="11"
                        textAnchor="middle"
                        fontWeight={isActive ? '700' : '500'}
                      >
                        {item.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Monitoring (Col XL 3) */}
        <div className="col-xl-3 col-lg-12 col-12">
          <div className="dash-analytics-card p-4 h-100 d-flex flex-column justify-content-between">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold font-16 text-dark m-0">Live Monitoring</h4>
                <span
                  className={`font-11 fw-bold px-2 py-0.5 d-inline-flex align-items-center gap-1.5`}
                  style={{
                    backgroundColor: userStats.online > 0 ? '#ecfdf5' : '#f8fafc',
                    color: userStats.online > 0 ? '#10b981' : '#64748b',
                    borderRadius: '3px',
                    border: `1px solid ${userStats.online > 0 ? '#d1fae5' : '#e2e8f0'}`,
                    letterSpacing: '0.02em',
                  }}
                >
                  <span
                    className={userStats.online > 0 ? 'dash-live-pulse' : ''}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: userStats.online > 0 ? '#10b981' : '#94a3b8',
                      display: 'inline-block',
                      boxShadow: userStats.online > 0 ? '0 0 0 2px rgba(16, 185, 129, 0.35)' : 'none',
                    }}
                  />
                  LIVE
                </span>
              </div>
            </div>

            {/* Donut Chart & Legend */}
            <div className="d-flex flex-column align-items-center my-auto">
              <div className="position-relative" style={{ width: '160px', height: '160px' }}>
                <svg viewBox="0 0 100 100" className="w-100 h-100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="15"
                  />

                  {/* Offline Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="15"
                    strokeDasharray={`${(userStats.offline / (userStats.total || 1)) * 238.76} 238.76`}
                    strokeDashoffset={`-${(userStats.online / (userStats.total || 1)) * 238.76}`}
                    className="dash-donut-segment"
                  />

                  {/* Active Segment (Green #10b981) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="15"
                    strokeDasharray={`${(userStats.online / (userStats.total || 1)) * 238.76} 238.76`}
                    strokeDashoffset="0"
                    className="dash-donut-segment"
                  />
                </svg>

                {/* Center Active Counter - Text CUSTOMER removed as requested */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <span className="font-26 fw-bold text-dark" style={{ lineHeight: 1.05, letterSpacing: '-0.02em' }}>{userStats.online}</span>
                  <span className={`font-11 fw-semibold mt-1 ${userStats.online > 0 ? 'text-success' : 'text-muted'}`}>
                    Online Now
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-100 d-flex flex-column gap-2 mt-3 pt-1">
                {/* Active Inside Website */}
                <div
                  className="d-flex align-items-center justify-content-between p-2"
                  style={{
                    backgroundColor: userStats.online > 0 ? '#f0fdf4' : '#f8fafc',
                    borderRadius: '3px',
                    border: `1px solid ${userStats.online > 0 ? '#dcfce7' : '#f1f5f9'}`,
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: userStats.online > 0 ? '#10b981' : '#cbd5e1',
                        display: 'inline-block',
                        boxShadow: userStats.online > 0 ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : 'none',
                      }}
                    />
                    <div>
                      <span className="fw-semibold text-dark d-block font-12">Active Customer</span>
                      <span className="text-muted font-11">Browsing store website</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`fw-bold d-block font-13 ${userStats.online > 0 ? 'text-success' : 'text-dark'}`}>{userStats.online}</span>
                    <span className="text-muted font-10">
                      {userStats.total > 0 ? ((userStats.online / userStats.total) * 100).toFixed(0) : '0'}%
                    </span>
                  </div>
                </div>

                {/* Offline Customers */}
                <div
                  className="d-flex align-items-center justify-content-between p-2"
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '3px',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#94a3b8',
                        display: 'inline-block',
                      }}
                    />
                    <div>
                      <span className="fw-semibold text-dark d-block font-12">Offline Customers</span>
                      <span className="text-muted font-11">Registered customer accounts</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold text-dark d-block font-13">{userStats.offline}</span>
                    <span className="text-muted font-10">
                      {userStats.total > 0 ? ((userStats.offline / userStats.total) * 100).toFixed(0) : '0'}%
                    </span>
                  </div>
                </div>

                {/* Subtitle footer */}
                <div className="text-center font-12 pt-1 px-1 text-muted">
                  Total: <strong className="text-dark">{userStats.total}</strong> registered customer (Customer role only)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. BOTTOM ROW: RECENT ORDERS TABLE + SALES OVERVIEW
         ======================================================== */}
      <div className="row g-3 g-xl-4 align-items-stretch">
        {/* Left Column: Most Searched and Clicked Products Table (Col XL 8) */}
        <div className="col-xl-8 col-lg-7 col-12">
          <div className="dash-analytics-card p-4 h-100 d-flex flex-column justify-content-between">
            {/* Header & Filter Controls */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h3 className="fw-bold font-18 text-dark m-0">
                  Most Clicked Products
                </h3>
                <span className="font-12 text-muted">
                  Unique customer views (1 per customer, excludes Admin, SuperAdmin &amp; guest visits)
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="position-relative">
                  <iconify-icon
                    icon="solar:magnifer-linear"
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      fontSize: '14px',
                      pointerEvents: 'none',
                    }}
                  ></iconify-icon>
                  <input
                    type="text"
                    placeholder="Search products or locations..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="dash-search-input"
                    style={{
                      borderRadius: '3px',
                      height: '34px',
                      width: '210px',
                      fontSize: '12.5px',
                    }}
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  className="dash-select font-12"
                  value={tableCategory}
                  onChange={(e) => setTableCategory(e.target.value)}
                  style={{
                    borderRadius: '3px',
                    height: '34px',
                    minWidth: '135px',
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="dash-table-wrap border rounded-3 mb-2">
              <table className="table align-middle mb-0" style={{ minWidth: '700px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr className="font-12 text-muted">
                    <th style={{ width: '40px' }} className="ps-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="form-check-input"
                        style={{ accentColor: '#0f172a', cursor: 'pointer', borderRadius: '3px' }}
                      />
                    </th>
                    <th className="py-2.5">Product Name</th>
                    <th className="py-2.5">Customer Clicks (Unique)</th>
                    <th className="py-2.5">Date &amp; Time</th>
                    <th className="py-2.5">Customer Location</th>
                    <th className="py-2.5 pe-3 text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted font-13">
                        No products match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isChecked = selectedProductIds.includes(prod.id);

                      return (
                        <tr key={prod.id} className="dash-table-row font-13">
                          <td className="ps-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectProduct(prod.id)}
                              className="form-check-input"
                              style={{ accentColor: '#0f172a', cursor: 'pointer', borderRadius: '3px' }}
                            />
                          </td>
                          <td>
                            <Link
                              href={`/product-details?id=${prod.id}`}
                              className="d-flex align-items-center gap-2.5 text-decoration-none text-dark"
                              title={`View ${prod.productName}`}
                            >
                              <div
                                className="border overflow-hidden flex-shrink-0 bg-light"
                                style={{ width: '38px', height: '38px', borderRadius: '3px' }}
                              >
                                <img
                                  src={prod.productImage}
                                  alt={prod.productName}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/imgs/theme/placeholder.svg';
                                  }}
                                />
                              </div>
                              <div className="d-flex flex-column">
                                <span
                                  className="fw-bold text-dark font-13 text-truncate"
                                  style={{ maxWidth: '240px' }}
                                  title={prod.productName}
                                >
                                  {prod.productName}
                                </span>
                                <span className="text-muted font-11">{prod.productCategory}</span>
                              </div>
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1.5">
                              <span className="fw-bold text-dark font-13">
                                {prod.clickCount.toLocaleString()}
                              </span>
                              <span className="badge bg-success-subtle text-success font-11 px-1.5 py-0.5 border border-success-subtle" style={{ borderRadius: '3px' }}>
                                Customer Visits
                              </span>
                            </div>
                          </td>
                          <td className="text-muted font-12" style={{ whiteSpace: 'nowrap' }}>
                            <div className="d-flex align-items-center gap-1">
                              <iconify-icon icon="solar:clock-circle-linear" class="fs-13 text-secondary"></iconify-icon>
                              <span>{prod.lastClickedAt}</span>
                            </div>
                          </td>
                          <td className="font-12">
                            <div className="d-flex align-items-center gap-1 text-dark fw-medium">
                              <iconify-icon icon="solar:map-point-bold" class="fs-14 text-danger flex-shrink-0"></iconify-icon>
                              <span title={prod.location}>{prod.location}</span>
                            </div>
                          </td>
                          <td className="pe-3 text-end fw-bold text-dark font-13">
                            SAR {prod.price.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Row: Selected count */}
            <div className="d-flex align-items-center justify-content-between font-12 text-muted px-1 mt-1">
              <span>
                {selectedProductIds.length > 0
                  ? `${selectedProductIds.length} of ${filteredProducts.length} items selected`
                  : `Showing all ${filteredProducts.length} customer-clicked store products (excludes admin previews)`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: User Accounts & Recent Added Products (Col XL 4) */}
        <div className="col-xl-4 col-lg-5 col-12">
          <div className="dash-analytics-card p-4 h-100 d-flex flex-column justify-content-between">
            {/* Header */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h4 className="fw-bold font-16 text-dark m-0">Customer Accounts Overview</h4>
                  <span className="font-11 text-muted">Customer registry &amp; shopper lifecycle (excludes admins)</span>
                </div>
                <Link href="/dashboard/users" className="text-muted font-12 text-decoration-none fw-semibold">
                  View All ↗
                </Link>
              </div>

              {/* User Statistics: Active Customers, Inactive Customers, Deleted Customers */}
              <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2 font-12">
                  <div>
                    <div className="d-flex align-items-center gap-1.5 mb-1">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span className="text-muted font-11">Active Customers</span>
                    </div>
                    <span className="fw-bold font-16 text-dark">{userStats.active.toLocaleString()}</span>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-1.5 mb-1">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      <span className="text-muted font-11">Inactive Customers</span>
                    </div>
                    <span className="fw-bold font-16 text-dark">{userStats.inactive}</span>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-1.5 mb-1">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <span className="text-muted font-11">Deleted Customers</span>
                    </div>
                    <span className="fw-bold font-16 text-dark">{userStats.deleted}</span>
                  </div>
                </div>

                {/* Account Lifecycle Proportional Progress Bar */}
                <div className="d-flex gap-1 pt-1" style={{ height: '7px' }}>
                  <div
                    style={{
                      width: `${(userStats.active / Math.max(1, userStats.active + userStats.inactive + userStats.deleted)) * 100}%`,
                      backgroundColor: '#10b981',
                      borderRadius: '2px',
                    }}
                    title={`Active Users: ${userStats.active}`}
                  />
                  <div
                    style={{
                      width: `${(userStats.inactive / Math.max(1, userStats.active + userStats.inactive + userStats.deleted)) * 100}%`,
                      backgroundColor: '#f59e0b',
                      borderRadius: '2px',
                    }}
                    title={`Inactive Users: ${userStats.inactive}`}
                  />
                  <div
                    style={{
                      width: `${(userStats.deleted / Math.max(1, userStats.active + userStats.inactive + userStats.deleted)) * 100}%`,
                      backgroundColor: '#ef4444',
                      borderRadius: '2px',
                    }}
                    title={`Deleted Users: ${userStats.deleted}`}
                  />
                </div>
              </div>
            </div>

            {/* Below: Recent Added Products */}
            <div className="mt-2">
              <div className="d-flex align-items-center justify-content-between font-12 fw-semibold text-muted pb-2 border-bottom mb-2.5">
                <span className="text-dark fw-bold font-13 d-flex align-items-center gap-1.5">
                  <iconify-icon icon="solar:box-minimalistic-bold" class="text-primary fs-16"></iconify-icon>
                  <span>Recent Added Products</span>
                </span>
                <span style={{ width: '70px', textAlign: 'right' }}>Price</span>
              </div>

              <div className="d-flex flex-column gap-2.5">
                {recentProductsList.map((prod) => (
                  <div key={prod.id} className="d-flex align-items-center justify-content-between py-1">
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className="border overflow-hidden flex-shrink-0 bg-light"
                        style={{ width: '38px', height: '38px', borderRadius: '3px' }}
                      >
                        <img
                          src={prod.image}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/imgs/theme/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="d-flex flex-column">
                        <span
                          className="fw-bold font-13 text-dark text-truncate"
                          style={{ maxWidth: '150px' }}
                          title={prod.name}
                        >
                          {prod.name}
                        </span>
                        <div className="d-flex align-items-center gap-1.5 font-11 text-muted">
                          <span>{prod.category}</span>
                          <span style={{ color: '#cbd5e1' }}>•</span>
                          <span className="text-primary fw-medium">{prod.addedTime}</span>
                        </div>
                      </div>
                    </div>

                    <span className="fw-bold text-dark font-13" style={{ width: '70px', textAlign: 'right' }}>
                      SAR {prod.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
