export interface MainBannerItem {
  id: string;
  image: string;
  title: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  order: number;
}

export interface PromoBannerItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  price: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  order: number;
}

export interface BannerSettingsData {
  mainBanners: MainBannerItem[];
  promoBanners: PromoBannerItem[];
}

export const DEFAULT_BANNER_SETTINGS: BannerSettingsData = {
  mainBanners: [
    {
      id: 'main-banner-1',
      image: '/assets/imgs/banner/safety-hero-1.jpg',
      title: 'Certified Industrial\nSafety & PPE Supplies',
      buttonText: 'Explore Catalog',
      link: '/products',
      isActive: true,
      order: 1,
    },
    {
      id: 'main-banner-2',
      image: '/assets/imgs/banner/safety-hero-2.jpg',
      title: 'Heavy Duty Steel Toe\nSafety Boots & Footwear',
      buttonText: 'Explore Catalog',
      link: '/products',
      isActive: true,
      order: 2,
    },
    {
      id: 'main-banner-3',
      image: '/assets/imgs/banner/safety-hero-3.jpg',
      title: 'Flame Retardant &\nHigh-Vis Workwear',
      buttonText: 'Explore Catalog',
      link: '/products',
      isActive: true,
      order: 3,
    },
  ],
  promoBanners: [
    {
      id: 'promo-banner-1',
      image: '/assets/imgs/banner/clean-side-1.jpg',
      title: 'FALL ARREST SYSTEMS',
      subtitle: 'OSHA & EN 361 CERTIFIED',
      price: 'FROM 120 SR',
      buttonText: 'Order Now',
      link: '/products',
      isActive: true,
      order: 1,
    },
    {
      id: 'promo-banner-2',
      image: '/assets/imgs/banner/clean-hero-1.jpg',
      title: 'HEAD & EYE PROTECTION',
      subtitle: 'LEVEL 5 IMPACT RESISTANT',
      price: 'FROM 45 SR',
      buttonText: 'Order Now',
      link: '/products',
      isActive: true,
      order: 2,
    },
    {
      id: 'promo-banner-3',
      image: '/assets/imgs/banner/clean-hero-2.jpg',
      title: 'CERTIFIED FOOTWEAR',
      subtitle: 'S3 STEEL TOE PROTECTION',
      price: 'SAVE UP TO 30%',
      buttonText: 'Order Now',
      link: '/products',
      isActive: true,
      order: 3,
    },
  ],
};
