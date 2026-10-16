export interface MainBannerItem {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  desc?: string;
  price?: string;
  buttonText?: string;
  showButton?: boolean;
  link?: string;
  isActive: boolean;
  order: number;
}

export interface PromoBannerItem {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  desc?: string;
  price?: string;
  saleBadge?: string;
  discount?: string;
  buttonText?: string;
  showButton?: boolean;
  link?: string;
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
      image: "/assets/imgs/banner/hero-iphone-16.jpg",
      title: "",
      subtitle: "",
      desc: "",
      price: "",
      buttonText: "",
      showButton: false,
      link: "/products",
      isActive: true,
      order: 1
    },
    {
      id: "main-banner-4",
      image: "/assets/imgs/banner/clean-hero-1.jpg",
      title: "",
      subtitle: "",
      desc: "",
      price: "",
      buttonText: "",
      showButton: false,
      link: "/products",
      isActive: true,
      order: 2
    }
  ],
  promoBanners: [
    {
      id: "promo-banner-1",
      image: "/assets/imgs/banner/promo-shoe-sale.jpg",
      title: "",
      subtitle: "",
      desc: "",
      price: "",
      saleBadge: "",
      discount: "",
      buttonText: "",
      showButton: false,
      link: "/products",
      isActive: true,
      order: 1
    },
    {
      id: "promo-banner-1792059520031",
      image: "/assets/imgs/banner/clean-side-1.jpg",
      title: "",
      subtitle: "",
      desc: "",
      price: "",
      saleBadge: "",
      discount: "",
      buttonText: "",
      showButton: false,
      link: "/products",
      isActive: true,
      order: 2
    }
  ]
};
