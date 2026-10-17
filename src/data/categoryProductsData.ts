import productsStoreJson from './products-store.json';

export interface ProductDetailPoint {
  id: string;
  heading?: string; // Optional heading of point (e.g. "Outer Shell", "Impact Protection")
  text: string;     // Description or detail of point
}

export interface TechnicalSpecification {
  id: string;
  label: string;
  value: string;
}

export interface ProductDetailSection {
  id: string;
  heading: string;                // Section heading (e.g. "Product Specifications", "Key Features")
  type: 'description' | 'points'; // Paragraph description OR point-by-point details
  description?: string;          // Paragraph text when type is 'description'
  points?: ProductDetailPoint[]; // List of points when type is 'points'
}

export interface SystemColor {
  name: string;
  hex: string;
  border?: string;
}

export const SYSTEM_COLORS: SystemColor[] = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'White', hex: '#ffffff', border: '#cbd5e1' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
];

export const PRESET_SIZES = [
  'S', 'M', 'L', 'XL', '2XL', '3XL',
  '39', '40', '41', '42', '43', '44', '45',
  'Free Size'
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Unisex'] as const;
export type ProductGender = typeof GENDER_OPTIONS[number];

export interface ProductItem {
  id: string;
  title: string;
  desc?: string;
  gender?: 'Male' | 'Female' | 'Unisex' | string;
  category: string;
  categoryId?: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  rating: string;
  reviews: string;
  image: string;
  images?: string[]; // Multiple angle gallery images (Side, Back, Top, Detail)
  badge?: string;
  badgeClass?: 'new' | 'hot' | 'sale' | 'featured' | 'draft';
  location?: string;
  standard?: string;
  inStock?: boolean;
  link: string;
  isNewArrival?: boolean;
  isSpecialOffer?: boolean;
  isMostSearched?: boolean;
  offerPercent?: number;
  offerEndDate?: string;
  originalPrice?: number;
  currentPrice?: number;
  views?: number;
  clicks?: number;
  createdAt?: number;
  isActive?: boolean;
  isDraft?: boolean;
  specifications?: ProductDetailSection[];
  technicalSpecs?: TechnicalSpecification[];
  specificationsOverview?: string;
  sizes?: string[];
  colors?: string[];
  colorImages?: Record<string, string[]>; // Each color mapped to up to 5 photos: [Front, Side, Top, Back, Detail]
  colorSizes?: Record<string, string[]>; // Sizes available for each individual color variant
  deliveryOptionId?: string;
  deliveryOptionName?: string;
  deliveryCharge?: number;
  deliveryEstimatedDays?: string;
}

export const CATEGORY_PRODUCTS_DATA: ProductItem[] = productsStoreJson as unknown as ProductItem[];
