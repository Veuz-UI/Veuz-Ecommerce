export interface MainBannerItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  desc?: string;
  price?: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  order: number;
}

export interface PromoBannerItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  desc?: string;
  price?: string;
  saleBadge?: string;
  discount?: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  order: number;
}

export interface BannerSettingsData {
  mainBanners: MainBannerItem[];
  promoBanners: PromoBannerItem[];
}

export const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const DEFAULT_BANNER_SETTINGS: BannerSettingsData = {
  mainBanners: [
    {
      id: "main-banner-1",
      subtitle: "iPhone 16 Pro Max",
      price: "$ 50,769*",
      title: "From $ 50,769*",
      desc: "A18 chip. Superfast. Supersmart\nHistory, Biggest Price Drop",
      buttonText: "Shop Now",
      image: "/assets/imgs/banner/hero-iphone-16.jpg",
      link: "/products",
      isActive: true,
      order: 1
    },
    {
      id: "main-banner-2",
      subtitle: "Certified Safety Footwear",
      price: "250 SR*",
      title: "Heavy Duty Steel Toe\nSafety Boots & Footwear",
      desc: "ANSI & EN Certified. Extreme Grip\nAll-Day Anti-Fatigue Workwear",
      buttonText: "Shop Now",
      image: "/assets/imgs/banner/safety-hero-2.jpg",
      link: "/products",
      isActive: true,
      order: 2
    },
    {
      id: "main-banner-3",
      subtitle: "High-Visibility Safety",
      price: "180 SR*",
      title: "Flame Retardant &\nHigh-Vis Workwear",
      desc: "Class 3 Reflective ANSI Certified\nBreathable & Maximum Durability",
      buttonText: "Shop Now",
      image: "/assets/imgs/banner/safety-hero-3.jpg",
      link: "/products",
      isActive: true,
      order: 3
    },
    {
      id: "main-banner-4",
      subtitle: "Head & Eye Protection",
      price: "95 SR*",
      title: "Impact-Resistant Helmets\n& Safety Goggles",
      desc: "Level 5 Shock Absorption\nAnti-Fog UV400 Protective Gear",
      buttonText: "Shop Now",
      image: "/assets/imgs/banner/clean-hero-1.jpg",
      link: "/products",
      isActive: true,
      order: 4
    }
  ],
  promoBanners: [
    {
      id: "promo-banner-1",
      image: "/assets/imgs/banner/promo-shoe-sale.jpg",
      saleBadge: "SALE",
      subtitle: "UP TO",
      discount: "50%",
      price: "50% OFF",
      title: "SALE UP TO 50% OFF",
      buttonText: "Shop Now",
      link: "/products",
      isActive: true,
      order: 1
    },
    {
      id: "promo-banner-2",
      image: "/assets/imgs/banner/clean-side-1.jpg",
      saleBadge: "SALE",
      subtitle: "CERTIFIED EN & OSHA STANDARD",
      price: "99% OFF",
      discount: "99%",
      title: "FALL ARREST & SAFETY HARNESS",
      desc: "Industrial Certified Fall Protection Equipment",
      buttonText: "Order Now",
      link: "/products",
      isActive: true,
      order: 2
    }
  ]
};
