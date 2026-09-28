export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  hoverImage?: string;
  badge?: {
    text: string;
    type: 'hot' | 'sale' | 'new' | 'discount';
  };
  giftText?: string;
  inStock: boolean;
  soldCount?: number;
  totalCount?: number;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  itemCount: number;
  image: string;
  bgColor: string;
}

export const CATEGORIES: Category[] = [
  { id: 1, name: 'T-Shirts & Apparel', itemCount: 78, image: '/assets/imgs/shop/tshrt.jpg', bgColor: 'bg-emerald-50 text-emerald-900 border-emerald-100' },
  { id: 2, name: 'Bag Print & Totes', itemCount: 42, image: '/assets/imgs/shop/p1.jpg', bgColor: 'bg-amber-50 text-amber-900 border-amber-100' },
  { id: 3, name: 'Gift Packs & Boxes', itemCount: 65, image: '/assets/imgs/shop/gift-big.jpg', bgColor: 'bg-rose-50 text-rose-900 border-rose-100' },
  { id: 4, name: 'Paper Cups & Drinkware', itemCount: 33, image: '/assets/imgs/shop/cup.jpg', bgColor: 'bg-blue-50 text-blue-900 border-blue-100' },
  { id: 5, name: 'Cards & Stationery', itemCount: 51, image: '/assets/imgs/shop/card.jpg', bgColor: 'bg-purple-50 text-purple-900 border-purple-100' },
  { id: 6, name: 'Custom Mugs & Gifts', itemCount: 29, image: '/assets/imgs/shop/gift1.jpg', bgColor: 'bg-orange-50 text-orange-900 border-orange-100' },
  { id: 7, name: 'Premium Hoodies', itemCount: 44, image: '/assets/imgs/shop/shirt1.jpeg', bgColor: 'bg-teal-50 text-teal-900 border-teal-100' },
  { id: 8, name: 'Accessories & Badges', itemCount: 19, image: '/assets/imgs/shop/gift3.jpg', bgColor: 'bg-indigo-50 text-indigo-900 border-indigo-100' },
];

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Trending Customized T-Shirt (Limited Edition)',
    category: 'Tshirts',
    price: 299,
    oldPrice: 349,
    rating: 4.8,
    reviewsCount: 2599,
    image: '/assets/imgs/shop/shirt1.jpeg',
    hoverImage: '/assets/imgs/shop/shirt2.jpeg',
    badge: { text: 'Hot', type: 'hot' },
    giftText: '1 Gift worth 500 SR',
    inStock: true,
    soldCount: 84,
    totalCount: 100,
    description: 'Premium heavyweight cotton with custom high-definition screen print. Soft, durable and pre-shrunk for maximum comfort.'
  },
  {
    id: 2,
    name: 'Minimalist Eco Canvas Tote Bag',
    category: 'Bag Print',
    price: 149,
    oldPrice: 199,
    rating: 4.6,
    reviewsCount: 1240,
    image: '/assets/imgs/shop/p1.jpg',
    hoverImage: '/assets/imgs/shop/p2.jpg',
    badge: { text: 'Sale', type: 'sale' },
    giftText: 'Free Custom Badge Included',
    inStock: true,
    soldCount: 45,
    totalCount: 60,
    description: 'Durable organic canvas tote featuring reinforced stitching and custom UV-resistant print.'
  },
  {
    id: 3,
    name: 'Luxury Executive Corporate Gift Box',
    category: 'Gift Pack',
    price: 499,
    oldPrice: 620,
    rating: 4.9,
    reviewsCount: 870,
    image: '/assets/imgs/shop/gift-big.jpg',
    hoverImage: '/assets/imgs/shop/gift2.jpg',
    badge: { text: '-20%', type: 'discount' },
    giftText: '2 Gifts worth 800 SR',
    inStock: true,
    soldCount: 92,
    totalCount: 120,
    description: 'Complete luxury gift hamper with personalized executive stationery, premium tumbler, and elegant packaging.'
  },
  {
    id: 4,
    name: 'Custom Insulated Ceramic Coffee Mug',
    category: 'Paper Cup',
    price: 89,
    oldPrice: 110,
    rating: 4.5,
    reviewsCount: 630,
    image: '/assets/imgs/shop/cup.jpg',
    hoverImage: '/assets/imgs/shop/p3.jpg',
    badge: { text: 'New', type: 'new' },
    giftText: 'Coaster Set Included',
    inStock: true,
    soldCount: 30,
    totalCount: 50,
    description: 'Double-walled ceramic mug with premium gloss finish and heat-retaining lid.'
  },
  {
    id: 5,
    name: 'Urban Oversized Graphic Tee - Black',
    category: 'Tshirts',
    price: 259,
    oldPrice: 299,
    rating: 4.7,
    reviewsCount: 1450,
    image: '/assets/imgs/shop/shirt3.jpeg',
    hoverImage: '/assets/imgs/shop/shirt4.jpeg',
    badge: { text: 'Hot', type: 'hot' },
    giftText: 'Sticker Pack Gift',
    inStock: true,
    soldCount: 77,
    totalCount: 90,
    description: 'Streetwear-inspired streetwear oversized tee made from 240 GSM breathable combed cotton.'
  },
  {
    id: 6,
    name: 'Personalized Business Card Collection',
    category: 'Cards & Stationery',
    price: 180,
    oldPrice: 220,
    rating: 4.8,
    reviewsCount: 512,
    image: '/assets/imgs/shop/card.jpg',
    hoverImage: '/assets/imgs/shop/p4.jpg',
    badge: { text: 'Best', type: 'sale' },
    giftText: 'Custom Holder Included',
    inStock: true,
    soldCount: 50,
    totalCount: 75,
    description: 'Matte laminated 450 GSM cards with gold foil accenting and precision cut edges.'
  },
  {
    id: 7,
    name: 'Vintage Wash Casual Pullover Hoodie',
    category: 'Tshirts',
    price: 349,
    oldPrice: 420,
    rating: 4.9,
    reviewsCount: 980,
    image: '/assets/imgs/shop/shirt5.jpeg',
    hoverImage: '/assets/imgs/shop/shirt6.jpeg',
    badge: { text: '-17%', type: 'discount' },
    giftText: '1 Gift worth 250 SR',
    inStock: true,
    soldCount: 65,
    totalCount: 80,
    description: 'Cozy fleece-lined hoodie with kangaroo pocket and adjustable drawstring hood.'
  },
  {
    id: 8,
    name: 'Celebration VIP Hamper Gift Pack',
    category: 'Gift Pack',
    price: 599,
    oldPrice: 750,
    rating: 5.0,
    reviewsCount: 320,
    image: '/assets/imgs/shop/gift4.jpg',
    hoverImage: '/assets/imgs/shop/gift5.jpg',
    badge: { text: 'New', type: 'new' },
    giftText: 'VIP Voucher Included',
    inStock: true,
    soldCount: 38,
    totalCount: 40,
    description: 'Curated premium celebration box with handpicked artisanal treats and customized keepsakes.'
  },
];

export const PROMO_BANNERS = [
  {
    id: 1,
    title: 'Everyday Fresh & Clean Designs',
    subtitle: 'Custom Apparel & Prints',
    discount: 'Up to 30% OFF',
    image: '/assets/imgs/shop/shirt1.jpeg',
    link: '#',
    bgGradient: 'from-emerald-600 via-teal-700 to-cyan-800',
    buttonColor: 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
  },
  {
    id: 2,
    title: 'Make Your Brand Stand Out',
    subtitle: 'Bespoke Corporate Gifts',
    discount: 'Free Express Delivery',
    image: '/assets/imgs/shop/gift-big.jpg',
    link: '#',
    bgGradient: 'from-amber-600 via-orange-600 to-red-700',
    buttonColor: 'bg-amber-300 text-amber-950 hover:bg-amber-200'
  },
  {
    id: 3,
    title: 'Eco-Friendly Custom Packaging',
    subtitle: 'Cups, Bags & Boxes',
    discount: 'Starting at 49 SR',
    image: '/assets/imgs/shop/cup.jpg',
    link: '#',
    bgGradient: 'from-blue-600 via-indigo-700 to-slate-900',
    buttonColor: 'bg-sky-400 text-sky-950 hover:bg-sky-300'
  }
];

export const CLIENT_LOGOS = [
  { name: 'Client 1', logo: '/assets/imgs/client/partner1.svg' },
  { name: 'Client 2', logo: '/assets/imgs/client/partner2.svg' },
  { name: 'Client 3', logo: '/assets/imgs/client/partner3.svg' },
  { name: 'Client 4', logo: '/assets/imgs/client/partner4.svg' },
  { name: 'Client 5', logo: '/assets/imgs/client/partner5.svg' },
];
