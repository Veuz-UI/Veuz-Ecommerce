import bannerSettingsStoreJson from './banner-settings-store.json';

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

export const DEFAULT_BANNER_SETTINGS: BannerSettingsData = bannerSettingsStoreJson as unknown as BannerSettingsData;
