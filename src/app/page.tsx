'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

import { fetchBannerSettings, BANNER_SETTINGS_EVENT } from '@/services/bannerSettingsService';
import { DEFAULT_BANNER_SETTINGS, MainBannerItem, PromoBannerItem } from '@/data/defaultBannerSettings';
import { fetchShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';
import { DEFAULT_SHOP_SETTINGS, ShopCategory } from '@/data/defaultShopSettings';
import { fetchProducts, recordProductClick, PRODUCTS_EVENT } from '@/services/productsService';
import { ProductItem } from '@/data/categoryProductsData';

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeSideSlide, setActiveSideSlide] = useState(0);
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [isCatHovered, setIsCatHovered] = useState(false);
  const newProdScrollRef = useRef<HTMLDivElement>(null);
  const browseCatScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic Catalog Products from Products Service
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);

  // Dynamic Banners from Banner Settings
  const [heroSlides, setHeroSlides] = useState<MainBannerItem[]>(DEFAULT_BANNER_SETTINGS.mainBanners);
  const [sideBannerSlides, setSideBannerSlides] = useState<PromoBannerItem[]>(DEFAULT_BANNER_SETTINGS.promoBanners);

  // Dynamic Categories from Shop Settings (Shop by Categories)
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>(DEFAULT_SHOP_SETTINGS.categories);

  // Guarantee that the home page always starts at the very top (0, 0)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
      } catch (e) {}
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // Fetch dynamic banners & listen for real-time updates across tabs
  useEffect(() => {
    let isMounted = true;

    const loadBanners = async () => {
      try {
        const data = await fetchBannerSettings();
        if (isMounted && data) {
          const activeMain = (data.mainBanners || [])
            .filter((b) => b.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const activePromo = (data.promoBanners || [])
            .filter((b) => b.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          setHeroSlides(activeMain.length > 0 ? activeMain : DEFAULT_BANNER_SETTINGS.mainBanners);
          setSideBannerSlides(activePromo.length > 0 ? activePromo : DEFAULT_BANNER_SETTINGS.promoBanners);
        }
      } catch (err) {
        console.warn('Error loading dynamic banners:', err);
      }
    };

    loadBanners();

    const handleBannerUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        const data = customEvt.detail;
        const activeMain = (data.mainBanners || [])
          .filter((b: MainBannerItem) => b.isActive !== false)
          .sort((a: MainBannerItem, b: MainBannerItem) => (a.order || 0) - (b.order || 0));
        const activePromo = (data.promoBanners || [])
          .filter((b: PromoBannerItem) => b.isActive !== false)
          .sort((a: PromoBannerItem, b: PromoBannerItem) => (a.order || 0) - (b.order || 0));

        setHeroSlides(activeMain.length > 0 ? activeMain : DEFAULT_BANNER_SETTINGS.mainBanners);
        setSideBannerSlides(activePromo.length > 0 ? activePromo : DEFAULT_BANNER_SETTINGS.promoBanners);
      } else {
        loadBanners();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'veuz_banners_cache') {
        loadBanners();
      }
    };

    window.addEventListener(BANNER_SETTINGS_EVENT, handleBannerUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener(BANNER_SETTINGS_EVENT, handleBannerUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch dynamic categories & listen for real-time updates across tabs & dashboard
  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const data = await fetchShopSettings();
        if (isMounted && data && Array.isArray(data.categories)) {
          const activeCats = data.categories.filter((c) => c.isActive !== false);
          setShopCategories(activeCats.length > 0 ? activeCats : DEFAULT_SHOP_SETTINGS.categories);
        }
      } catch (err) {
        console.warn('Error loading dynamic categories:', err);
      }
    };

    loadCategories();

    const handleCategoryUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail.categories)) {
        const activeCats = customEvt.detail.categories.filter((c: ShopCategory) => c.isActive !== false);
        setShopCategories(activeCats.length > 0 ? activeCats : DEFAULT_SHOP_SETTINGS.categories);
      } else {
        loadCategories();
      }
    };

    const handleCategoryStorage = (e: StorageEvent) => {
      if (e.key === 'veuz_shop_settings_cache') {
        loadCategories();
      }
    };

    window.addEventListener(SHOP_SETTINGS_EVENT, handleCategoryUpdate);
    window.addEventListener('storage', handleCategoryStorage);

    return () => {
      isMounted = false;
      window.removeEventListener(SHOP_SETTINGS_EVENT, handleCategoryUpdate);
      window.removeEventListener('storage', handleCategoryStorage);
    };
  }, []);

  // Fetch dynamic catalog products & subscribe to updates
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const prods = await fetchProducts();
        if (isMounted && Array.isArray(prods) && prods.length > 0) {
          setCatalogProducts(prods);
        }
      } catch (err) {
        console.warn('Error loading products for homepage:', err);
      }
    };

    loadProducts();

    const handleProductsUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setCatalogProducts(customEvt.detail);
      } else {
        loadProducts();
      }
    };

    window.addEventListener(PRODUCTS_EVENT, handleProductsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener(PRODUCTS_EVENT, handleProductsUpdated);
    };
  }, []);

  // Bounds safety check for category slide index
  useEffect(() => {
    const maxSlide = Math.max(0, shopCategories.length - 7);
    if (activeCatIndex > maxSlide) {
      setActiveCatIndex(0);
    }
  }, [shopCategories.length, activeCatIndex]);

  // Bounds safety checks for active slide indices
  useEffect(() => {
    if (activeSlide >= heroSlides.length) {
      setActiveSlide(0);
    }
  }, [heroSlides.length, activeSlide]);

  useEffect(() => {
    if (activeSideSlide >= sideBannerSlides.length) {
      setActiveSideSlide(0);
    }
  }, [sideBannerSlides.length, activeSideSlide]);

  const scrollNewProd = (direction: 'prev' | 'next') => {
    if (newProdScrollRef.current) {
      const container = newProdScrollRef.current;
      const firstCol = container.querySelector('.new-prod-pair-column') as HTMLElement;
      const colWidth = firstCol ? firstCol.offsetWidth + 20 : 300;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: colWidth, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 15) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -colWidth, behavior: 'smooth' });
        }
      }
    }
  };

  const [activeNewProdIndex, setActiveNewProdIndex] = useState(0);
  const [wishlist, setWishlist] = useState<{ [key: string]: boolean }>({});

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const newProducts = [
    {
      id: 'np-1',
      title: 'GuardianPro Vented Hard Hat with Ratchet Suspension',
      desc: 'High-density impact shell with adjustable 4-point ratchet suspension and ventilation slots.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      oldPrice: '180 SR',
      discount: '15% OFF',
      price: '149 SR',
      rating: '4.9/5',
      reviews: '1420 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-2',
      title: 'IronClad S3 Steel Toe Waterproof Work Safety Boots',
      desc: 'Heavy-duty steel toe cap with puncture-resistant Kevlar midsole and slip-resistant PU outsole.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '289 SR',
      rating: '4.8/5',
      reviews: '2190 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-3',
      title: 'ArmorFlex Level 5 Cut Resistant Nitrile Work Gloves',
      desc: 'Seamless HPPE knit fiber providing maximum Level 5 cut protection with enhanced sandy nitrile grip.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '65 SR',
      rating: '5.0/5',
      reviews: '980 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-4',
      title: 'OptiShield Anti-Fog UV400 Industrial Safety Goggles',
      desc: 'Panoramic wraparound polycarbonate lens with anti-scratch coating and 99.9% UV radiation blocking.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      oldPrice: '95 SR',
      discount: '15% OFF',
      price: '79 SR',
      rating: '4.9/5',
      reviews: '1650 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-5',
      title: 'ProReflect Class 3 High-Visibility Weatherproof Jacket',
      desc: 'ANSI/ISEA Class 3 compliant waterproof Oxford fabric with 3M reflective tape for night visibility.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '199 SR',
      rating: '4.7/5',
      reviews: '890 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-6',
      title: 'Full Body Fall Arrest Safety Harness with Shock Absorber',
      desc: 'OSHA certified ergonomic fall protection harness with dorsal D-ring and energy-absorbing lanyard.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '349 SR',
      rating: '5.0/5',
      reviews: '740 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-7',
      title: 'Half-Face Dual Cartridge Chemical Respirator Mask',
      desc: 'Medical-grade silicone facepiece with dual cartridge filtration against toxic fumes and dust particles.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '175 SR',
      rating: '4.9/5',
      reviews: '1120 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-8',
      title: 'Laser-Gard Heavy Duty Sound Cancelling Ear Defenders',
      desc: 'Industrial 34dB SNR noise reduction ear muffs with cushioned headband for prolonged loud environments.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      oldPrice: '120 SR',
      discount: '20% OFF',
      price: '96 SR',
      rating: '4.9/5',
      reviews: '1310 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-9',
      title: 'DuraShield Chemical Resistant Heavy Neoprene Coverall',
      desc: 'Heavyweight chemical splash protective suit with sealed seams for hazardous material operations.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '225 SR',
      rating: '4.8/5',
      reviews: '640 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-10',
      title: 'ThermalGrip Insulated Cold-Store Heavy Work Gloves',
      desc: 'Thermal fleece lined waterproof winter work gloves with textured palm for sub-zero warehouse handling.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      oldPrice: '85 SR',
      discount: '12% OFF',
      price: '74 SR',
      rating: '4.9/5',
      reviews: '830 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-11',
      title: 'AirFlow Powered Air Purifying Heavy Hood System',
      desc: 'PAPR constant positive pressure blower unit with HEPA filter and wide-vision impact visor.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '480 SR',
      rating: '5.0/5',
      reviews: '410 - Reviews',
      link: '/product-details'
    },
    {
      id: 'np-12',
      title: 'VoltGuard 1000V Dielectric High-Voltage Safety Boots',
      desc: 'Individually tested dielectric rubber safety boots certified for high-voltage utility electrical hazard protection.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '310 SR',
      rating: '4.9/5',
      reviews: '920 - Reviews',
      link: '/product-details'
    }
  ];

  // Touch / navigation refs

  const mostSearchedScrollRef = useRef<HTMLDivElement>(null);

  const scrollMostSearched = (direction: 'prev' | 'next') => {
    if (mostSearchedScrollRef.current) {
      const container = mostSearchedScrollRef.current;
      const firstCol = container.querySelector('.new-prod-pair-column') as HTMLElement;
      const colWidth = firstCol ? firstCol.offsetWidth + 20 : 300;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: colWidth, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 15) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -colWidth, behavior: 'smooth' });
        }
      }
    }
  };

  const mostSearchedProducts = [
    {
      id: 'ms-1',
      title: 'DeltaPlus Diamond V Ergonomic Baseball Hard Hat',
      desc: 'Innovative baseball cap shape safety helmet with reflective bands and adjustable rotor headband.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Top Searched',
      badgeClass: 'new',
      oldPrice: '145 SR',
      discount: '18% OFF',
      price: '119 SR',
      rating: '4.9/5',
      reviews: '1840 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-2',
      title: 'Uvex Pheos CX2 Anti-Glare High-Clarity Safety Glasses',
      desc: 'Direct-injected soft forehead and nose piece with permanent anti-fog interior and scratch-resistant exterior.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Trending',
      badgeClass: 'hot',
      oldPrice: '105 SR',
      discount: '19% OFF',
      price: '85 SR',
      rating: '4.8/5',
      reviews: '2420 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-3',
      title: 'Ansell HyFlex 11-840 Multi-Purpose Abrasion Resistant Gloves',
      desc: 'FORTIX abrasive nitrile coating with ultra-thin ergonomic breathable liner for precision manual dexterity.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Best Seller',
      badgeClass: 'hot',
      price: '48 SR',
      rating: '5.0/5',
      reviews: '3190 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-4',
      title: 'Caterpillar Holton S3 Heavy Duty Leather Work Boots',
      desc: 'Full-grain water-repellent leather with Goodyear welted construction and puncture-proof steel midsole.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Top Searched',
      badgeClass: 'new',
      oldPrice: '395 SR',
      discount: '12% OFF',
      price: '345 SR',
      rating: '4.9/5',
      reviews: '1580 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-5',
      title: 'Portwest Hi-Vis Multi-Pocket Executive Safety Vest',
      desc: 'Dual ID holder with radio loop, smartphone pocket, and certified EN ISO 20471 Class 2 reflective strips.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Trending',
      badgeClass: 'hot',
      oldPrice: '65 SR',
      discount: '20% OFF',
      price: '52 SR',
      rating: '4.7/5',
      reviews: '920 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-6',
      title: '3M Aura 9320A+ FFP2 Particulate Foldable Respirator (Box of 20)',
      desc: '3-panel flat-fold design with low breathing resistance filter technology and sculptured top nose panel.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Top Searched',
      badgeClass: 'new',
      price: '135 SR',
      rating: '4.9/5',
      reviews: '2750 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-7',
      title: 'MSA V-Gard 500 Vented Industrial Safety Helmet with Fas-Trac III',
      desc: 'UV-stabilized ABS shell with cooling vents, rain trough edge, and 4-point ratchet suspension system.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Best Seller',
      badgeClass: 'hot',
      oldPrice: '190 SR',
      discount: '15% OFF',
      price: '160 SR',
      rating: '4.8/5',
      reviews: '1230 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-8',
      title: 'Honeywell Miller Revolution R2 Full Body Fall Protection Harness',
      desc: 'DualTech webbing with shape-retention memory, quick-connect chest and leg buckles, and pivotlink design.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Top Searched',
      badgeClass: 'new',
      price: '389 SR',
      rating: '5.0/5',
      reviews: '690 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-9',
      title: 'DuPont Tyvek 500 Chemical & Particle Protective Hooded Coverall',
      desc: 'Breathable high-density polyethylene barrier fabric protecting against airborne particulates and hazardous light chemical splash.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Top Searched',
      badgeClass: 'new',
      oldPrice: '95 SR',
      discount: '15% OFF',
      price: '80 SR',
      rating: '4.9/5',
      reviews: '1940 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-10',
      title: 'Dräger X-plore 3500 Twin-Filter Chemical Half Mask Respirator',
      desc: 'Ergonomic DrägerFlex material with low-profile backward filter position providing optimal peripheral vision and seal.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Best Seller',
      badgeClass: 'hot',
      price: '165 SR',
      rating: '4.8/5',
      reviews: '1150 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-11',
      title: 'Timberland PRO Pit Boss 6-Inch Steel Toe Heavy Work Boots',
      desc: 'Rugged oiled leather with PRO 24/7 comfort suspension system and heat/oil resistant non-marking rubber outsole.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Trending',
      badgeClass: 'hot',
      oldPrice: '420 SR',
      discount: '10% OFF',
      price: '378 SR',
      rating: '4.9/5',
      reviews: '2890 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-12',
      title: 'Bolle Safety Contour Smoke Lens Ultra-Lightweight Eyewear',
      desc: 'Featherlight 21g frame with non-slip TIPGRIP temples and platinum anti-fog/anti-scratch ballistic lens coating.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '62 SR',
      rating: '4.7/5',
      reviews: '1430 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-13',
      title: 'Showa 377 Nitrile Coated Heavy Duty Mechanical Grip Gloves',
      desc: 'Double nitrile coating with extra foam nitrile palm finish for superior oily grip and mechanical abrasion resistance.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Top Searched',
      badgeClass: 'new',
      oldPrice: '75 SR',
      discount: '20% OFF',
      price: '60 SR',
      rating: '5.0/5',
      reviews: '2210 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-14',
      title: 'KStrong Kapture Elite Tower Harness with Comfort Lumbar Belt',
      desc: 'Full body fall protection harness with front, dorsal, and side positioning D-rings plus breathable ergonomic padding.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '495 SR',
      rating: '4.9/5',
      reviews: '580 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-15',
      title: '3M Peltor Optime III Extreme High-Noise Ear Muffs (35dB SNR)',
      desc: 'Double-casing cup technology minimizing resonance in severe high-frequency noise environments like power plants.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Best Seller',
      badgeClass: 'hot',
      oldPrice: '155 SR',
      discount: '16% OFF',
      price: '130 SR',
      rating: '4.8/5',
      reviews: '1720 - Reviews',
      link: '/product-details'
    },
    {
      id: 'ms-16',
      title: 'Red Wing PetroKing S3 Anti-Static Oil & Gas Industry Safety Boots',
      desc: 'Full grain leather with puncture-resistant insole and Vibram rubber sole certified for hazardous refinery sites.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Trending',
      badgeClass: 'new',
      price: '520 SR',
      rating: '5.0/5',
      reviews: '3410 - Reviews',
      link: '/product-details'
    }
  ];



  const onsaleProducts = [
    {
      id: 'onsale-1',
      title: 'ErgoGrip Anti-Vibration Heavy Impact Mechanics Gloves',
      desc: 'Engineered with reinforced palm padding and high-dexterity grip for heavy tools.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '125 SR',
      oldPrice: '160 SR',
      rating: '4.8/5',
      reviews: '1350 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-2',
      title: 'UltraComfort S1P Lightweight Breathable Safety Sneakers',
      desc: 'Ultra-flexible composite toe protection with breathable mesh lining for all-day wear.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '219 SR',
      oldPrice: '260 SR',
      rating: '4.9/5',
      reviews: '2850 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-3',
      title: 'Multi-Gas Dual Cartridge Respirator Half-Mask Protection',
      desc: 'Dual filtration system protecting against organic vapors, acid gases and fine dust.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '189 SR',
      oldPrice: '220 SR',
      rating: '4.7/5',
      reviews: '920 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-4',
      title: 'Heavy Duty Fall Arrest Body Harness with Lanyard System',
      desc: 'Full-body 5-point harness with energy-absorbing lanyard and forged steel carabiners.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Out of stock',
      badgeClass: 'out',
      price: '299 SR',
      oldPrice: '360 SR',
      rating: '5.0/5',
      reviews: '650 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-5',
      title: 'High-Visibility Class 2 Reflective Mesh Work Safety Vest',
      desc: 'Breathable polyester mesh with 360-degree high-reflectivity strips and zipper closure.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '45 SR',
      oldPrice: '60 SR',
      rating: '4.8/5',
      reviews: '1100 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-6',
      title: 'Industrial Emergency 50-Person Workplace OSHA First Aid Kit',
      desc: 'Complete medical first aid supply box tailored for construction and warehouse crews.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '160 SR',
      oldPrice: '195 SR',
      rating: '4.9/5',
      reviews: '430 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-7',
      title: 'ThermoGuard Flame Retardant Arc Flash Protection Coverall',
      desc: 'Treated flame-resistant fabric certified for electrical arc flash and heat protection.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '380 SR',
      oldPrice: '450 SR',
      rating: '5.0/5',
      reviews: '510 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-8',
      title: 'OptiClear Anti-Scratch Panoramic Safety Face Shield Visor',
      desc: 'Full-face polycarbonate shield offering high-velocity impact protection and clarity.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '68 SR',
      oldPrice: '85 SR',
      rating: '4.7/5',
      reviews: '780 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-9',
      title: 'SteelMax Metatarsal Protection S3 Heavy Duty Work Boots',
      desc: 'Integrated internal metatarsal guard with puncture-resistant steel midsole.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '310 SR',
      oldPrice: '380 SR',
      rating: '4.9/5',
      reviews: '1420 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-10',
      title: 'SilentPro 34dB SNR Helmet-Mounted Industrial Ear Defenders',
      desc: 'Universal slot-mount hearing protection with soft memory foam acoustic cushions.',
      img: '/assets/imgs/shop/pr1.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '85 SR',
      oldPrice: '110 SR',
      rating: '4.8/5',
      reviews: '890 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-11',
      title: 'ChemicalMaster Heavy Duty Chemical Resistant Gauntlet Gloves',
      desc: 'Thick chemical-proof nitrile formulation with textured grip for wet chemical handling.',
      img: '/assets/imgs/shop/pr3.jpg',
      badge: 'Limited Stock',
      badgeClass: 'hot',
      price: '42 SR',
      oldPrice: '55 SR',
      rating: '4.9/5',
      reviews: '620 - Reviews',
      link: '/product-details'
    },
    {
      id: 'onsale-12',
      title: 'High-Altitude Emergency Rescue Descender Harness System',
      desc: 'Controlled rate friction descender with durable braided kernmantle rope system.',
      img: '/assets/imgs/shop/pr2.jpg',
      badge: 'In Stock',
      badgeClass: 'new',
      price: '460 SR',
      oldPrice: '540 SR',
      rating: '5.0/5',
      reviews: '310 - Reviews',
      link: '/product-details'
    }
  ];

  // Derive dynamic lists from catalogProducts (synced live with dashboard products)
  const displayedNewProducts = catalogProducts.length > 0
    ? catalogProducts
        .filter((p) => p.isNewArrival !== false && p.isActive !== false)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .map((p) => ({
          id: p.id,
          title: p.title,
          desc: p.desc || 'Certified workplace safety and protection equipment.',
          img: p.image || '/assets/imgs/shop/pr1.jpg',
          badge: p.badge || 'New Arrival',
          badgeClass: (p.badgeClass || 'new') as 'new' | 'hot' | 'sale' | 'featured',
          price: p.price,
          oldPrice: p.oldPrice,
          discount: p.discount,
          rating: p.rating ? `${p.rating}/5` : '5.0/5',
          reviews: p.reviews ? `${p.reviews} - Reviews` : '120 - Reviews',
          link: p.link || '/product-details',
        }))
    : newProducts;

  const displayedMostSearched = catalogProducts.length > 0
    ? [...catalogProducts]
        .filter((p) => p.isActive !== false)
        .sort((a, b) => ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0)))
        .map((p) => ({
          id: p.id,
          title: p.title,
          desc: p.desc || 'High-performance certified workplace protection equipment.',
          img: p.image || '/assets/imgs/shop/pr2.jpg',
          badge: 'Top Searched',
          badgeClass: 'new' as const,
          price: p.price,
          oldPrice: p.oldPrice,
          discount: p.discount,
          rating: p.rating ? `${p.rating}/5` : '4.9/5',
          reviews: p.reviews ? `${p.reviews} - Reviews` : '200 - Reviews',
          link: p.link || '/product-details',
        }))
    : mostSearchedProducts;

  const displayedOnsale = catalogProducts.length > 0
    ? catalogProducts
        .filter((p) => (p.isSpecialOffer === true || Boolean(p.discount)) && p.isActive !== false)
        .map((p) => ({
          id: p.id,
          title: p.title,
          desc: p.desc || 'Special discounted offer on certified PPE supplies.',
          img: p.image || '/assets/imgs/shop/pr3.jpg',
          badge: p.discount || (p.offerPercent ? `${p.offerPercent}% OFF` : 'Special Offer'),
          badgeClass: 'hot' as const,
          price: p.price,
          oldPrice: p.oldPrice,
          rating: p.rating ? `${p.rating}/5` : '5.0/5',
          reviews: p.reviews ? `${p.reviews} - Reviews` : '150 - Reviews',
          link: p.link || '/product-details',
        }))
    : onsaleProducts;

  const newProductPairs: any[] = [];
  const halfCount = Math.ceil(displayedNewProducts.length / 2);
  for (let i = 0; i < halfCount; i++) {
    newProductPairs.push([displayedNewProducts[i], displayedNewProducts[i + halfCount]].filter(Boolean));
  }

  const mostSearchedPairs: any[] = [];
  for (let i = 0; i < displayedMostSearched.length; i += 2) {
    mostSearchedPairs.push(displayedMostSearched.slice(i, i + 2));
  }

  // Auto slide for Main Hero Slider (5300ms)
  useEffect(() => {
    const mainTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5300);
    return () => clearInterval(mainTimer);
  }, [heroSlides.length]);

    // Smooth scroll handler for Browse by Safety Categories
  const scrollBrowseCat = (direction: 'prev' | 'next') => {
    if (browseCatScrollRef.current) {
      const container = browseCatScrollRef.current;
      const firstCol = container.querySelector('.browse-cat-card-wrapper') as HTMLElement;
      const colWidth = firstCol ? firstCol.offsetWidth + 16 : 180;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: colWidth, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 15) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -colWidth, behavior: 'smooth' });
        }
      }
    }
  };

  // Auto slide for Browse by Safety Categories (3500ms) with pause on hover
  useEffect(() => {
    if (isCatHovered) return;
    const catTimer = setInterval(() => {
      scrollBrowseCat('next');
    }, 3500);
    return () => clearInterval(catTimer);
  }, [isCatHovered]);

  // Auto slide for Second Banner Slider (3800ms)
  useEffect(() => {
    const sideTimer = setInterval(() => {
      setActiveSideSlide((prev) => (prev + 1) % sideBannerSlides.length);
    }, 3800);
    return () => clearInterval(sideTimer);
  }, [sideBannerSlides.length]);

  const handlePrevCat = () => {
    scrollBrowseCat('prev');
  };

  const handleNextCat = () => {
    scrollBrowseCat('next');
  };

  const handlePrevNewProd = () => {
    setActiveNewProdIndex((prev) => (prev <= 0 ? newProducts.length - 4 : prev - 1));
  };

  const handleNextNewProd = () => {
    setActiveNewProdIndex((prev) => (prev >= newProducts.length - 4 ? 0 : prev + 1));
  };

  return (
    <main className="main">
      {/* 1. Hero Slider Section (Expanded 530px Height & Perfect Image Fitting) */}
      <section className="home-slider style-2 position-relative section-spacer-mb">
        <div className="container-fluid">
          <div className="row">
            
            {/* Left: Main Slider (Expanded Height + Perfect Background Fit + Hover Nav Buttons) */}
            <div className="col-xl-8 px-0 col-lg-12">
              <div className="home-slide-cover position-relative">
                <div className="hero-slider-1 style-4 hero-slider-height-custom position-relative overflow-hidden">
                  {heroSlides.map((slide, idx) => (
                    <div
                      key={slide.id || idx}
                      className={"hero-fade-slide " + (idx === activeSlide ? "active" : "")}
                      style={{
                        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.45) 45%, rgba(15, 23, 42, 0.1) 100%), url(${(slide as any).image || (slide as any).bg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 60px',
                        opacity: idx === activeSlide ? 1 : 0,
                        visibility: idx === activeSlide ? 'visible' : 'hidden',
                        transition: 'opacity 0.8s ease-in-out, visibility 0.8s ease-in-out',
                        zIndex: idx === activeSlide ? 2 : 1
                      }}
                    >
                      <div className="slider-content" style={{ maxWidth: '620px' }}>
                        <h1 className="display-2 mb-35 text-white" style={{ whiteSpace: 'pre-line', textShadow: '0 2px 8px rgba(0,0,0,0.5)', fontWeight: '800' }}>
                          {slide.title}
                        </h1>
                        <Link href={slide.link || '/products'} className="ordr" style={{ fontSize: '15px', padding: '12px 32px' }}>
                          {slide.buttonText || 'Explore Catalog'}
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Main Slider Navigation buttons: Visible only when user hovers over slider */}
                  <div className="slider-arrow hero-slider-1-arrow" style={{ zIndex: 10 }}>
                    <span
                      className="slider-btn slider-prev"
                      onClick={() => setActiveSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                      style={{ cursor: 'pointer' }}
                      title="Previous Slide"
                    >
                      <i className="fi-rs-angle-left"></i>
                    </span>
                    <span
                      className="slider-btn slider-next"
                      onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
                      style={{ cursor: 'pointer' }}
                      title="Next Slide"
                    >
                      <i className="fi-rs-angle-right"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Second Banner (Expanded Height + Perfect Background Fit) */}
            <div className="col-lg-4 px-0 d-none d-xl-block">
              <div
                className="second-banner-container position-relative overflow-hidden"
              >
                {sideBannerSlides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className={"side-fade-slide " + (idx === activeSideSlide ? "active" : "")}
                    style={{
                      backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.25) 50%, rgba(0, 0, 0, 0.15) 100%), url(${(slide as any).image || (slide as any).bg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      backgroundRepeat: 'no-repeat',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: idx === activeSideSlide ? 1 : 0,
                      visibility: idx === activeSideSlide ? 'visible' : 'hidden',
                      transition: 'opacity 0.8s ease-in-out, visibility 0.8s ease-in-out',
                      zIndex: idx === activeSideSlide ? 2 : 1
                    }}
                  >
                    <div className="banner-text text-center" style={{ position: 'relative', zIndex: 3, padding: '30px' }}>
                      <h2 className="mb-10 text-white" style={{ fontWeight: '800', letterSpacing: '0.5px', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                        {slide.title}
                      </h2>
                      <h5 className="mb-20" style={{ color: 'rgba(255,255,255,0.95)', fontSize: '15px', fontWeight: '600', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                        {slide.subtitle}
                      </h5>
                      <h1 className="mb-25" style={{ color: '#FDC839', fontWeight: '900', fontSize: '36px', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                        {slide.price}
                      </h1>
                      <Link href={slide.link || '/products'} className="ordr" style={{ fontSize: '14px', padding: '10px 28px' }}>
                        {slide.buttonText || 'Order Now'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Top Categories Section (Browse by Safety Categories) */}
      <section id="categories-section" className="popular-categories section-spacer-mb">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-25 flex-wrap gap-2">
            <div className="section-tit">
              <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>Browse by Safety Categories</h3>
            </div>
            
            <div className="d-flex align-items-center" style={{ gap: '10px' }}>
              <Link className="btn-outline-custom" href="/all-categories-products">
                View All
              </Link>
              
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrevCat}
                  className="btn-outline-custom btn-nav-circle"
                  aria-label="Previous Categories"
                  title="Previous"
                >
                  <i className="fi-rs-angle-left"></i>
                </button>
                <button
                  type="button"
                  onClick={handleNextCat}
                  className="btn-outline-custom btn-nav-circle"
                  aria-label="Next Categories"
                  title="Next"
                >
                  <i className="fi-rs-angle-right"></i>
                </button>
              </div>
            </div>
          </div>

          <hr className="hr mb-30" />

          {/* Smooth Category Slider Track */}
          <div
            className="browse-categories-slider-wrapper position-relative"
            onMouseEnter={() => setIsCatHovered(true)}
            onMouseLeave={() => setIsCatHovered(false)}
          >
            <div ref={browseCatScrollRef} className="browse-cat-track-container">
              {shopCategories.map((cat, idx) => {
                const imgSrc = cat.image || (cat as any).img || `/assets/imgs/shop/p${(idx % 8) + 1}.jpg`;
                const catLink = cat.link && cat.link !== '#' ? cat.link : `/category?category=${encodeURIComponent(cat.name)}`;
                return (
                  <div key={cat.id || idx} className="browse-cat-card-wrapper">
                    <Link href={catLink} className="browse-cat-card">
                      <div className="browse-cat-img-box">
                        <img
                          src={imgSrc}
                          alt={cat.name}
                          className="browse-cat-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `/assets/imgs/shop/p${(idx % 8) + 1}.jpg`;
                          }}
                        />
                      </div>
                      <div className="browse-cat-title-box">
                        <span className="browse-cat-title">{cat.name}</span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEW PRODUCTS (2 Rows Slider with Touch Navigation & Perfectly Aligned Action Buttons) */}
      <section className="product-tabs section-padding position-relative section-spacer-mb">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-25 flex-wrap gap-2">
            <div className="section-tit">
              <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>New Arrival Safety Gear & PPE</h3>
            </div>
            
            <div className="d-flex align-items-center" style={{ gap: '10px' }}>
              <Link className="btn-outline-custom" href="/new-arrival-products">
                View All
              </Link>
              
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => scrollNewProd('prev')}
                  className="btn-outline-custom btn-nav-circle"
                  aria-label="Previous Products"
                  title="Previous"
                >
                  <i className="fi-rs-angle-left"></i>
                </button>
                <button
                  type="button"
                  onClick={() => scrollNewProd('next')}
                  className="btn-outline-custom btn-nav-circle"
                  aria-label="Next Products"
                  title="Next"
                >
                  <i className="fi-rs-angle-right"></i>
                </button>
              </div>
            </div>
          </div>
          
          <hr className="hr mb-30" />

          {/* 2-Row Smooth Slider Track with Scroll Snap & Navigation */}
          <div className="new-products-slider-wrapper position-relative">
            <div ref={newProdScrollRef} className="new-products-track-container">
              {newProductPairs.map((pair, colIdx) => (
                <div key={'col-' + colIdx} className="new-prod-pair-column">
                  {pair.map((prod: any) => (
                    <div key={prod.id} className="new-prod-card-wrapper">
                      <div className="product-cart-wrap uniform-product-card">
                        <div className="product-img-action-wrap position-relative">
                          <div className="product-img product-img-zoom">
                            <Link href={prod.link} onClick={() => recordProductClick(prod.id)}>
                              <img className="default-img" src={prod.img} alt={prod.title} />
                            </Link>
                            <ul className="clrs">
                              <li className="first"></li>
                              <li className="sec"></li>
                              <li className="third"></li>
                            </ul>
                          </div>

                          <div className="product-badges product-badges-position product-badges-mrg">
                            <span className={prod.badgeClass === 'hot' ? 'hot' : 'new'}>{prod.badge}</span>
                          </div>
                        </div>

                        <div className="product-content-wrap">
                          <div>
                            <h2 className="new-prod-title">
                              <Link href={prod.link} onClick={() => recordProductClick(prod.id)}>{prod.title}</Link>
                            </h2>

                            <p className="new-prod-desc">{prod.desc}</p>

                            <div className="product-rate d-flex align-items-center">
                              <img src="/assets/imgs/icons/star.png" alt="star" className="star-icon" width={14} height={14} />
                              <h6 className="rating-score mb-0">{prod.rating}</h6>
                              <span className="rating-reviews font-small">({prod.reviews})</span>
                            </div>

                            <div className="new-prod-price-box">
                              <div className="d-flex align-items-center" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                <span className="new-prod-current-price">{prod.price}</span>
                                {prod.oldPrice && (
                                  <span className="new-prod-old-price">{prod.oldPrice}</span>
                                )}
                                {prod.discount && (
                                  <span className="new-prod-discount-badge">{prod.discount}</span>
                                )}
                              </div>
                              <div className="new-prod-vat-label">Inclusive of VAT</div>
                            </div>
                          </div>

                          {/* Perfectly Aligned Bottom Action Bar with Wishlist Heart & Add to Cart */}
                          <div className="product-card-bottom d-flex align-items-center justify-content-between">
                            <span className="express-delivery-badge"><i className="fi-rs-bolt"></i>Express Delivery</span>
                            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                              <button
                                type="button"
                                aria-label="Add To Wishlist"
                                className={`btn-wishlist-action ${wishlist[prod.id] ? 'active' : ''}`}
                                onClick={() => toggleWishlist(prod.id)}
                                title="Add to Wishlist"
                              >
                                <i className={`fi-rs-heart ${wishlist[prod.id] ? 'fill-heart text-danger' : ''}`}></i>
                              </button>
                              <Link href="/cart" className="btn-add-cart-custom">
                                <i className="fi-rs-shopping-cart mr-5"></i>Add
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Promotional 3-Card Banners */}
      <section className="banners section-spacer-mb">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="promo-feature-card overflow-hidden">
                <Link href="/products" className="d-block position-relative overflow-hidden w-100 h-100">
                  <img
                    src="/assets/imgs/banner/promo-card-1.jpg"
                    alt="Head & Eye Protection PPE Collection"
                    className="promo-card-img"
                  />
                </Link>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="promo-feature-card overflow-hidden">
                <Link href="/products" className="d-block position-relative overflow-hidden w-100 h-100">
                  <img
                    src="/assets/imgs/banner/promo-card-2.jpg"
                    alt="Industrial Communications & High-Vis Workwear"
                    className="promo-card-img"
                  />
                </Link>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="promo-feature-card overflow-hidden">
                <Link href="/products" className="d-block position-relative overflow-hidden w-100 h-100">
                  <img
                    src="/assets/imgs/banner/promo-card-3.jpg"
                    alt="Workplace Safety & Emergency First Aid Kits"
                    className="promo-card-img"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* Most Searched Items (Placed Directly Above Eco Promo Banner) */}
      <section className="product-tabs section-padding position-relative section-spacer-mb">
        <div className="container">
          <div className="section-title d-flex align-items-center justify-content-between mb-25 flex-wrap gap-2">
            <div className="section-tit">
              <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>Most Searched Items</h3>
            </div>
            
            <div className="d-flex align-items-center" style={{ gap: '10px' }}>
              <Link className="btn-outline-custom" href="/most-searched-products">
                View All
              </Link>
              
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => scrollMostSearched('prev')}
                  className="btn-outline-custom btn-nav-circle"
                  aria-label="Previous Most Searched Products"
                  title="Previous"
                >
                  <i className="fi-rs-angle-left"></i>
                </button>
                <button
                  type="button"
                  onClick={() => scrollMostSearched('next')}
                  className="btn-outline-custom btn-nav-circle"
                  aria-label="Next Most Searched Products"
                  title="Next"
                >
                  <i className="fi-rs-angle-right"></i>
                </button>
              </div>
            </div>
          </div>
          
          <hr className="hr mb-30" />

          {/* 2-Row Smooth Slider Track with Scroll Snap & Navigation */}
          <div className="new-products-slider-wrapper position-relative">
            <div ref={mostSearchedScrollRef} className="new-products-track-container">
              {mostSearchedPairs.map((pair, colIdx) => (
                <div key={'ms-col-' + colIdx} className="new-prod-pair-column">
                  {pair.map((prod: any) => (
                    <div key={prod.id} className="new-prod-card-wrapper">
                      <div className="product-cart-wrap uniform-product-card">
                        <div className="product-img-action-wrap position-relative">
                          <div className="product-img product-img-zoom">
                            <Link href={prod.link} onClick={() => recordProductClick(prod.id)}>
                              <img className="default-img" src={prod.img} alt={prod.title} />
                            </Link>
                            <ul className="clrs">
                              <li className="first"></li>
                              <li className="sec"></li>
                              <li className="third"></li>
                            </ul>
                          </div>

                          <div className="product-badges product-badges-position product-badges-mrg">
                            <span className={prod.badgeClass === 'hot' ? 'hot' : 'new'}>{prod.badge}</span>
                          </div>
                        </div>

                        <div className="product-content-wrap">
                          <div>
                            <h2 className="new-prod-title">
                              <Link href={prod.link} onClick={() => recordProductClick(prod.id)}>{prod.title}</Link>
                            </h2>

                            <p className="new-prod-desc">{prod.desc}</p>

                            <div className="product-rate d-flex align-items-center">
                              <img src="/assets/imgs/icons/star.png" alt="star" className="star-icon" width={14} height={14} />
                              <h6 className="rating-score mb-0">{prod.rating}</h6>
                              <span className="rating-reviews font-small">({prod.reviews})</span>
                            </div>

                            <div className="new-prod-price-box">
                              <div className="d-flex align-items-center" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                <span className="new-prod-current-price">{prod.price}</span>
                                {prod.oldPrice && (
                                  <span className="new-prod-old-price">{prod.oldPrice}</span>
                                )}
                                {prod.discount && (
                                  <span className="new-prod-discount-badge">{prod.discount}</span>
                                )}
                              </div>
                              <div className="new-prod-vat-label">Inclusive of VAT</div>
                            </div>
                          </div>

                          <div className="product-card-bottom d-flex align-items-center justify-content-between">
                            <span className="express-delivery-badge">
                              <i className="fi-rs-bolt"></i>Express Delivery
                            </span>
                            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                              <button
                                type="button"
                                aria-label="Add To Wishlist"
                                className={`btn-wishlist-action ${wishlist[prod.id] ? 'active text-danger' : ''}`}
                                title="Wishlist"
                                onClick={() => toggleWishlist(prod.id)}
                              >
                                <i className={wishlist[prod.id] ? "fi-ss-heart text-danger toggle-heart" : "fi-rs-heart toggle-heart"}></i>
                              </button>
                              <Link href="/cart" className="btn-add-cart-custom">
                                <i className="fi-rs-shopping-cart mr-5"></i>Add
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* 5. VIBRANT PROMO BANNER WITH 5 OVERLAPPING WHITE CATEGORY CARDS (Exact Reference Design) */}
      <section className="eco-promo-section section-spacer-mb">
        <div className="container">
          {/* Top Vibrant Green Banner */}
          <div className="eco-banner-wrap">
            {/* Background Decorative SVG */}
            <svg className="eco-banner-vector" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20C50 20 20 70 20 120C20 170 70 180 120 180C170 180 180 130 180 80C180 30 150 20 100 20Z" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M60 140C90 110 130 90 170 70" stroke="white" strokeWidth="6" strokeLinecap="round"/>
              <path d="M110 110C125 95 145 85 165 75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
            </svg>

            {/* Left Banner Text */}
            <div className="eco-banner-content">
              <h2 className="eco-banner-heading">
                Shop Eco-Friendly, Live Sustainably!
              </h2>
              <p className="eco-banner-subtitle">
                Good for you, great for the Earth—explore eco-conscious products.
              </p>
            </div>

            {/* Right Banner Button */}
            <div className="eco-banner-btn-wrap">
              <Link href="/products" className="eco-banner-pill-btn">
                Buy a eco friendly product
              </Link>
            </div>
          </div>

          {/* 5 Overlapping White Feature Category Cards */}
          <div className="eco-cards-grid">
            {/* Card 1: Home & Kitchen */}
            <Link href="/products" className="eco-card-item">
              <div className="eco-card-img-wrap">
                <img src="/assets/imgs/shop/pr1.jpg" alt="Home & Kitchen" className="eco-card-img" />
              </div>
              <h4 className="eco-card-title">Home & Kitchen</h4>
            </Link>

            {/* Card 2: Personal Care */}
            <Link href="/products" className="eco-card-item">
              <div className="eco-card-img-wrap">
                <img src="/assets/imgs/shop/pr2.jpg" alt="Personal Care" className="eco-card-img" />
              </div>
              <h4 className="eco-card-title">Personal Care</h4>
            </Link>

            {/* Card 3: Tech & Gadgets */}
            <Link href="/products" className="eco-card-item">
              <div className="eco-card-img-wrap">
                <img src="/assets/imgs/shop/pr3.jpg" alt="Tech & Gadgets" className="eco-card-img" />
              </div>
              <h4 className="eco-card-title">Tech & Gadgets</h4>
            </Link>

            {/* Card 4: Kids Products */}
            <Link href="/products" className="eco-card-item">
              <div className="eco-card-img-wrap">
                <img src="/assets/imgs/shop/p4.jpg" alt="Kids Products" className="eco-card-img" />
              </div>
              <h4 className="eco-card-title">Kids Products</h4>
            </Link>

            {/* Card 5: Food & Groceries */}
            <Link href="/products" className="eco-card-item">
              <div className="eco-card-img-wrap">
                <img src="/assets/imgs/shop/p5.jpg" alt="Food & Groceries" className="eco-card-img" />
              </div>
              <h4 className="eco-card-title">Food & Groceries</h4>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. ONSALE PRODUCTS Section (Aligned Action Icons, 2-Line Title & 2-Line Paragraph) */}
      <section className="onsal section-spacer-mb">
        <div className="container">
          <div className="section-title wow animate__animated animate__fadeIn d-flex align-items-center justify-content-between mb-25 flex-wrap gap-2" data-wow-delay="0">
            <div className="title">
              <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>Special Offers & Bulk PPE Deals</h3>
            </div>
            <Link className="show-all btn-outline-custom" href="/offer-products">
              View All
            </Link>
          </div>
          <hr className="mb-25" />

          {/* Clean 12-Card Responsive Grid */}
          <div className="row g-3 g-lg-4">
            {(displayedOnsale.length > 0 ? displayedOnsale : onsaleProducts).map((prod) => (
              <div key={prod.id} className="col-xl-4 col-md-6 col-12 d-flex">
                <div className="compact-onsale-card w-100">
                  {/* Corner Ribbon Badge */}
                  <span className={"onsale-corner-badge " + (prod.badgeClass === 'hot' ? 'badge-hot' : prod.badgeClass === 'out' ? 'badge-out' : 'badge-new')}>
                    {prod.badge}
                  </span>

                  {/* Top-Right Quick Action Icons: View + Love + Cart (Icon-Only) */}
                  <div className="onsale-top-actions">
                    <Link href={prod.link} className="onsale-action-btn" title="Quick View">
                      <i className="fi-rs-eye"></i>
                    </Link>
                    <button
                      type="button"
                      className={`onsale-action-btn btn-wish ${wishlist[prod.id] ? 'active text-danger' : ''}`}
                      title="Wishlist"
                      onClick={() => toggleWishlist(prod.id)}
                    >
                      <i className={wishlist[prod.id] ? "fi-ss-heart text-danger toggle-heart" : "fi-rs-heart toggle-heart"}></i>
                    </button>
                    <Link href="/cart" className="onsale-action-btn btn-cart" title="Add to Cart">
                      <i className="fi-rs-shopping-cart"></i>
                    </Link>
                  </div>

                  {/* Image Left */}
                  <div className="compact-img-box">
                    <Link href={prod.link} onClick={() => recordProductClick(prod.id)} className="d-flex align-items-center justify-content-center w-100 h-100">
                      <img src={prod.img} alt={prod.title} className="compact-onsale-img" />
                    </Link>
                  </div>

                  {/* Content Right: Clamped Title, 2-Line Paragraph, Rating, Price */}
                  <div className="compact-content-box">
                    <h4 className="compact-prod-title">
                      <Link href={prod.link} onClick={() => recordProductClick(prod.id)}>{prod.title}</Link>
                    </h4>

                    <p className="compact-prod-desc">
                      {prod.desc}
                    </p>

                    <div className="product-rate d-flex align-items-center">
                      <img src="/assets/imgs/icons/star.png" alt="star" className="star-icon" width={14} height={14} />
                      <h6 className="rating-score mb-0">{prod.rating}</h6>
                      <span className="rating-reviews font-small">({prod.reviews.split(' ')[0]} - Reviews)</span>
                    </div>

                    <div className="compact-price-row">
                      <span className="compact-current-price">{prod.price}</span>
                      {prod.oldPrice && (
                        <span className="compact-old-price">{prod.oldPrice}</span>
                      )}
                    </div>
                    <span className="compact-vat-text">Inclusive of VAT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
