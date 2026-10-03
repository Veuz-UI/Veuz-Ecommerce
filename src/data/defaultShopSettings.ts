export interface CategorySubItem {
  id: string;
  name: string;
  link: string;
}

export interface ShopCategory {
  id: string;
  name: string;
  link: string;
  image?: string;
  hasSubItems?: boolean;
  subItems?: CategorySubItem[];
  isActive: boolean;
}

export interface SubMenuColumnItem {
  id: string;
  name: string;
  link: string;
}

export interface SubMenuColumn {
  id: string;
  title: string;
  link: string;
  items: SubMenuColumnItem[];
}

export interface MenuBanner {
  enabled: boolean;
  image: string;
  tag: string;
  title: string;
  priceNote?: string;
  discountBadge?: string;
  btnText: string;
  btnLink: string;
  showBtn?: boolean;
}

export interface MainMenuItem {
  id: string;
  name: string;
  link: string;
  isHotDeal?: boolean;
  badge?: string;
  hasMegaMenu: boolean;
  columns?: SubMenuColumn[];
  banner?: MenuBanner;
  isActive: boolean;
}

export interface ShopSettingsData {
  categories: ShopCategory[];
  mainMenu: MainMenuItem[];
}

export const DEFAULT_SHOP_SETTINGS: ShopSettingsData = {
  categories: [
    {
      id: 'cat-1',
      name: 'Safety Helmets',
      link: '/products',
      image: '/assets/imgs/shop/p1.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-1', name: 'Vented Hard Hats', link: '/products' },
        { id: 'sub-2', name: 'Full Brim Helmets', link: '/products' },
        { id: 'sub-3', name: 'Electrical Safety Helmets', link: '/products' },
        { id: 'sub-4', name: 'Chin Straps & Accessories', link: '/products' },
        { id: 'sub-see-all-1', name: 'See All', link: '/products' },
      ],
    },
    {
      id: 'cat-2',
      name: 'Safety Shoes',
      link: '/products',
      image: '/assets/imgs/shop/p2.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-5', name: 'Steel Toe Boots', link: '/products' },
        { id: 'sub-6', name: 'Composite Safety Sneakers', link: '/products' },
        { id: 'sub-7', name: 'Dielectric High Voltage Boots', link: '/products' },
        { id: 'sub-8', name: 'Waterproof Work Boots', link: '/products' },
        { id: 'sub-see-all-2', name: 'See All', link: '/products' },
      ],
    },
    {
      id: 'cat-3',
      name: 'Hi-Vis Vests',
      link: '/products',
      image: '/assets/imgs/shop/p3.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-9', name: 'Class 2 Reflective Vests', link: '/products' },
        { id: 'sub-10', name: 'Class 3 Executive Vests', link: '/products' },
        { id: 'sub-11', name: 'Flame Retardant Vests', link: '/products' },
        { id: 'sub-12', name: 'Mesh Breathable Vests', link: '/products' },
        { id: 'sub-see-all-3', name: 'See All', link: '/products' },
      ],
    },
    {
      id: 'cat-4',
      name: 'Safety Goggles',
      link: '/products',
      image: '/assets/imgs/shop/p4.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-13', name: 'Anti-Fog Eye Shields', link: '/products' },
        { id: 'sub-14', name: 'UV400 Industrial Eyewear', link: '/products' },
        { id: 'sub-15', name: 'Chemical Splash Goggles', link: '/products' },
        { id: 'sub-16', name: 'Welding Face Shields', link: '/products' },
        { id: 'sub-see-all-4', name: 'See All', link: '/products' },
      ],
    },
    {
      id: 'cat-5',
      name: 'Cut Gloves',
      link: '/products',
      image: '/assets/imgs/shop/p5.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-17', name: 'Level 5 Cut Gloves', link: '/products' },
        { id: 'sub-18', name: 'Nitrile Foam Work Gloves', link: '/products' },
        { id: 'sub-19', name: 'Chemical Resistant Gauntlets', link: '/products' },
        { id: 'sub-20', name: 'Heavy Impact Mechanics Gloves', link: '/products' },
        { id: 'sub-see-all-5', name: 'See All', link: '/products' },
      ],
    },
    {
      id: 'cat-6',
      name: 'Ear Protection',
      link: '/products',
      image: '/assets/imgs/shop/p6.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-21', name: 'Industrial Ear Defenders', link: '/products' },
        { id: 'sub-22', name: 'Helmet Mounted Ear Muffs', link: '/products' },
        { id: 'sub-23', name: 'Silicone Corded Earplugs', link: '/products' },
        { id: 'sub-24', name: 'Disposable Foam Plugs', link: '/products' },
        { id: 'sub-see-all-6', name: 'See All', link: '/products' },
      ],
    },
    {
      id: 'cat-7',
      name: 'Respirators',
      link: '/products',
      image: '/assets/imgs/shop/card.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-25', name: 'FFP2 & N95 Particulate Masks', link: '/products' },
        { id: 'sub-26', name: 'Dual Cartridge Half Masks', link: '/products' },
        { id: 'sub-27', name: 'Full Face Chemical Respirators', link: '/products' },
        { id: 'sub-28', name: 'Replacement Cartridge Filters', link: '/products' },
        { id: 'sub-see-all-7', name: 'See All', link: '/products' },
      ],
    },
    {
      id: 'cat-8',
      name: 'Fall Harness',
      link: '/products',
      image: '/assets/imgs/shop/cup.jpg',
      isActive: true,
      subItems: [
        { id: 'sub-29', name: 'Full Body Fall Arrest Harness', link: '/products' },
        { id: 'sub-30', name: 'Shock Absorbing Lanyards', link: '/products' },
        { id: 'sub-31', name: 'Self-Retracting Lifelines', link: '/products' },
        { id: 'sub-32', name: 'Carabiners & Anchorage Points', link: '/products' },
        { id: 'sub-see-all-8', name: 'See All', link: '/products' },
      ],
    },
  ],
  mainMenu: [
    {
      id: 'menu-1',
      name: 'Gift Products',
      link: '/products',
      isHotDeal: true,
      hasMegaMenu: true,
      isActive: true,
      columns: [
        {
          id: 'col-1',
          title: 'Corporate Gifts',
          link: '/products',
          items: [
            { id: 'item-1', name: 'Custom Pens & Diaries', link: '/products' },
            { id: 'item-2', name: 'Executive Gift Sets', link: '/products' },
            { id: 'item-3', name: 'Thermal Flasks', link: '/products' },
            { id: 'item-4', name: 'Leather Wallets', link: '/products' },
            { id: 'item-5', name: 'Desk Organizers', link: '/products' },
          ],
        },
        {
          id: 'col-2',
          title: 'Event Giveaways',
          link: '/products',
          items: [
            { id: 'item-6', name: 'Custom Mugs', link: '/products' },
            { id: 'item-7', name: 'Tote Bags', link: '/products' },
            { id: 'item-8', name: 'Keychains', link: '/products' },
            { id: 'item-9', name: 'Badges & Pins', link: '/products' },
            { id: 'item-10', name: 'Wristbands', link: '/products' },
          ],
        },
        {
          id: 'col-3',
          title: 'Celebration Packs',
          link: '/products',
          items: [
            { id: 'item-11', name: 'VIP Hampers', link: '/products' },
            { id: 'item-12', name: 'Sweet Gift Boxes', link: '/products' },
            { id: 'item-13', name: 'Festival Packages', link: '/products' },
            { id: 'item-14', name: 'Custom Trophies', link: '/products' },
            { id: 'item-15', name: 'Award Plaques', link: '/products' },
          ],
        },
      ],
      banner: {
        enabled: true,
        image: '/assets/imgs/banner/banner-menu.png',
        tag: 'Hot deals',
        title: "Don't miss Trending",
        priceNote: 'Save up to 50%',
        discountBadge: '25% off',
        btnText: 'Shop now',
        btnLink: '/products',
      },
    },
    {
      id: 'menu-2',
      name: 'Accessories',
      link: '/products',
      hasMegaMenu: true,
      isActive: true,
      columns: [
        {
          id: 'col-4',
          title: 'Wearables',
          link: '/products',
          items: [
            { id: 'item-16', name: 'Custom Caps', link: '/products' },
            { id: 'item-17', name: 'Safety Helmets', link: '/products' },
            { id: 'item-18', name: 'Reflective Vests', link: '/products' },
            { id: 'item-19', name: 'Lanyards & ID Badges', link: '/products' },
            { id: 'item-20', name: 'Safety Gloves', link: '/products' },
          ],
        },
        {
          id: 'col-5',
          title: 'Bags & Pouches',
          link: '/products',
          items: [
            { id: 'item-21', name: 'Canvas Tote Bags', link: '/products' },
            { id: 'item-22', name: 'Drawstring Bags', link: '/products' },
            { id: 'item-23', name: 'Backpacks', link: '/products' },
            { id: 'item-24', name: 'Laptop Sleeves', link: '/products' },
            { id: 'item-25', name: 'Travel Pouches', link: '/products' },
          ],
        },
        {
          id: 'col-6',
          title: 'Office Accessories',
          link: '/products',
          items: [
            { id: 'item-26', name: 'Mousepads', link: '/products' },
            { id: 'item-27', name: 'Desk Mats', link: '/products' },
            { id: 'item-28', name: 'USB Flash Drives', link: '/products' },
            { id: 'item-29', name: 'Card Holders', link: '/products' },
            { id: 'item-30', name: 'Badge Reels', link: '/products' },
          ],
        },
      ],
      banner: {
        enabled: true,
        image: '/assets/imgs/banner/banner-menu.png',
        tag: 'Accessories',
        title: 'Best Sellers 2026',
        btnText: 'Explore',
        btnLink: '/products',
      },
    },
    {
      id: 'menu-3',
      name: 'Printing Product',
      link: '/products',
      hasMegaMenu: true,
      isActive: true,
      columns: [
        {
          id: 'col-7',
          title: 'Stationery',
          link: '/products',
          items: [
            { id: 'item-31', name: 'Business Cards', link: '/products' },
            { id: 'item-32', name: 'Letterheads', link: '/products' },
            { id: 'item-33', name: 'Envelopes', link: '/products' },
            { id: 'item-34', name: 'Invoices & Receipts', link: '/products' },
            { id: 'item-35', name: 'Notepads & Bill Books', link: '/products' },
          ],
        },
        {
          id: 'col-8',
          title: 'Marketing Material',
          link: '/products',
          items: [
            { id: 'item-36', name: 'Flyers & Leaflets', link: '/products' },
            { id: 'item-37', name: 'Brochures & Catalogs', link: '/products' },
            { id: 'item-38', name: 'Roll-up Banners', link: '/products' },
            { id: 'item-39', name: 'Posters & Signage', link: '/products' },
            { id: 'item-40', name: 'Table Tents', link: '/products' },
          ],
        },
        {
          id: 'col-9',
          title: 'Packaging',
          link: '/products',
          items: [
            { id: 'item-41', name: 'Product Boxes', link: '/products' },
            { id: 'item-42', name: 'Custom Stickers', link: '/products' },
            { id: 'item-43', name: 'Paper Bags', link: '/products' },
            { id: 'item-44', name: 'Hang Tags', link: '/products' },
            { id: 'item-45', name: 'Shipping Tape', link: '/products' },
          ],
        },
      ],
      banner: {
        enabled: true,
        image: '/assets/imgs/banner/banner-menu.png',
        tag: 'Printing',
        title: 'Custom Bulk Deals',
        btnText: 'Order Now',
        btnLink: '/products',
      },
    },
    {
      id: 'menu-4',
      name: 'Digital Cards',
      link: '/products',
      hasMegaMenu: true,
      isActive: true,
      columns: [
        {
          id: 'col-10',
          title: 'Smart NFC Cards',
          link: '/products',
          items: [
            { id: 'item-46', name: 'Metallic NFC Business Cards', link: '/products' },
            { id: 'item-47', name: 'Bamboo & Wooden Cards', link: '/products' },
            { id: 'item-48', name: 'Matte Black PVC Cards', link: '/products' },
            { id: 'item-49', name: 'Frosted Translucent Cards', link: '/products' },
            { id: 'item-50', name: 'Custom Epoxy NFC Tags', link: '/products' },
          ],
        },
        {
          id: 'col-11',
          title: 'Digital Profiles',
          link: '/products',
          items: [
            { id: 'item-51', name: 'Dynamic QR Cards', link: '/products' },
            { id: 'item-52', name: 'Enterprise Team Portals', link: '/products' },
            { id: 'item-53', name: 'Contactless Tap & Share', link: '/products' },
            { id: 'item-54', name: 'Lead Capture Profiles', link: '/products' },
            { id: 'item-55', name: 'Analytics & Click Tracking', link: '/products' },
          ],
        },
        {
          id: 'col-12',
          title: 'Identity & Access',
          link: '/products',
          items: [
            { id: 'item-56', name: 'RFID Key Fobs', link: '/products' },
            { id: 'item-57', name: 'Smart Event Badges', link: '/products' },
            { id: 'item-58', name: 'Access Control Cards', link: '/products' },
            { id: 'item-59', name: 'Membership VIP Cards', link: '/products' },
            { id: 'item-60', name: 'Digital Loyalty Cards', link: '/products' },
          ],
        },
      ],
      banner: {
        enabled: true,
        image: '/assets/imgs/banner/banner-menu.png',
        tag: 'Digital Cards',
        title: 'Next-Gen Networking',
        btnText: 'Discover',
        btnLink: '/products',
      },
    },
    {
      id: 'menu-5',
      name: 'Special Offers',
      link: '/offer',
      badge: 'HOT',
      hasMegaMenu: false,
      isActive: true,
    },
  ],
};
