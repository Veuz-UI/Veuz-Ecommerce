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
  /** Catalog product backing this menu item; used to prevent duplicate picks. */
  productId?: string;
  name: string;
  link: string;
}

export interface SubMenuColumn {
  id: string;
  /** The catalog category backing this column. Keeps product filtering stable if its name changes. */
  categoryId?: string;
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
  "categories": [
    {
      "id": "cat-1",
      "name": "Helmet",
      "link": "/products?category=Helmet",
      "image": "/assets/imgs/shop/p1.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-1",
          "name": "Vented Hard Hats",
          "link": "/products?category=Helmet"
        },
        {
          "id": "sub-2",
          "name": "Full Brim Hard Hats",
          "link": "/products?category=Helmet"
        },
        {
          "id": "sub-3",
          "name": "Ratchet Suspension Helmets",
          "link": "/products?category=Helmet"
        },
        {
          "id": "sub-4",
          "name": "Baseball Bump Caps",
          "link": "/products?category=Helmet"
        },
        {
          "id": "see-all-1790888342314",
          "name": "See All",
          "link": "/products?category=Helmet"
        }
      ]
    },
    {
      "id": "cat-2",
      "name": "Safety Shoes",
      "link": "/products?category=Safety%20Shoes",
      "image": "/assets/imgs/shop/p2.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-5",
          "name": "Steel Toe Boots",
          "link": "/products?category=Safety%20Shoes"
        },
        {
          "id": "sub-6",
          "name": "Lightweight Work Shoes",
          "link": "/products?category=Safety%20Shoes"
        },
        {
          "id": "sub-7",
          "name": "Dielectric Safety Boots",
          "link": "/products?category=Safety%20Shoes"
        },
        {
          "id": "sub-8",
          "name": "Slip-Resistant Footwear",
          "link": "/products?category=Safety%20Shoes"
        }
      ]
    },
    {
      "id": "cat-3",
      "name": "Hi-Vis Vests",
      "link": "/products?category=Hi-Vis%20Vests",
      "image": "/assets/imgs/shop/p3.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-9",
          "name": "Class 3 Reflective Vests",
          "link": "/products?category=Hi-Vis%20Vests"
        },
        {
          "id": "sub-10",
          "name": "Multi-Pocket Executive Vests",
          "link": "/products?category=Hi-Vis%20Vests"
        },
        {
          "id": "sub-11",
          "name": "Breathable Mesh Vests",
          "link": "/products?category=Hi-Vis%20Vests"
        },
        {
          "id": "sub-12",
          "name": "High-Visibility Jackets",
          "link": "/products?category=Hi-Vis%20Vests"
        }
      ]
    },
    {
      "id": "cat-4",
      "name": "Safety Goggles",
      "link": "/products?category=Safety%20Goggles",
      "image": "/assets/imgs/shop/p4.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-13",
          "name": "Anti-Fog UV400 Goggles",
          "link": "/products?category=Safety%20Goggles"
        },
        {
          "id": "sub-14",
          "name": "Anti-Glare Safety Glasses",
          "link": "/products?category=Safety%20Goggles"
        },
        {
          "id": "sub-15",
          "name": "Chemical Splash Goggles",
          "link": "/products?category=Safety%20Goggles"
        },
        {
          "id": "sub-16",
          "name": "Full Face Shields",
          "link": "/products?category=Safety%20Goggles"
        }
      ]
    },
    {
      "id": "cat-5",
      "name": "Cut Gloves",
      "link": "/products?category=Cut%20Gloves",
      "image": "/assets/imgs/shop/p5.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-17",
          "name": "Level 5 Cut Resistant Gloves",
          "link": "/products?category=Cut%20Gloves"
        },
        {
          "id": "sub-18",
          "name": "Nitrile Coated Work Gloves",
          "link": "/products?category=Cut%20Gloves"
        },
        {
          "id": "sub-19",
          "name": "Thermal Grip Insulated Gloves",
          "link": "/products?category=Cut%20Gloves"
        },
        {
          "id": "sub-20",
          "name": "Heavy Duty Impact Gloves",
          "link": "/products?category=Cut%20Gloves"
        }
      ]
    },
    {
      "id": "cat-6",
      "name": "Ear Protection",
      "link": "/products?category=Ear%20Protection",
      "image": "/assets/imgs/shop/p6.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-21",
          "name": "Sound Cancelling Ear Muffs",
          "link": "/products?category=Ear%20Protection"
        },
        {
          "id": "sub-22",
          "name": "Electronic Hearing Protection",
          "link": "/products?category=Ear%20Protection"
        },
        {
          "id": "sub-23",
          "name": "Helmet-Mounted Defenders",
          "link": "/products?category=Ear%20Protection"
        },
        {
          "id": "sub-24",
          "name": "Industrial Ear Plugs",
          "link": "/products?category=Ear%20Protection"
        }
      ]
    },
    {
      "id": "cat-7",
      "name": "Respirators",
      "link": "/products?category=Respirators",
      "image": "/assets/imgs/shop/p2.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-25",
          "name": "Dual Cartridge Respirators",
          "link": "/products?category=Respirators"
        },
        {
          "id": "sub-26",
          "name": "FFP2 Particulate Masks",
          "link": "/products?category=Respirators"
        }
      ]
    },
    {
      "id": "cat-8",
      "name": "Fall Harness",
      "link": "/products?category=Fall%20Harness",
      "image": "/assets/imgs/shop/p3.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-27",
          "name": "Full Body Safety Harness",
          "link": "/products?category=Fall%20Harness"
        },
        {
          "id": "sub-28",
          "name": "Shock Absorbing Lanyards",
          "link": "/products?category=Fall%20Harness"
        }
      ]
    },
    {
      "id": "cat-1791051887040",
      "name": "PPE KIT",
      "link": "/products?category=PPE%20KIT",
      "image": "/assets/imgs/shop/p1.jpg",
      "hasSubItems": false,
      "isActive": true,
      "subItems": []
    },
    {
      "id": "cat-1791017648820",
      "name": "Bags",
      "link": "/products?category=Bags",
      "image": "/uploads/img_1791017640365_7aa1d973042f1b674a19dcb6a3cc3390.webp",
      "isActive": true,
      "hasSubItems": false,
      "subItems": []
    }
  ],
  "mainMenu": [
    {
      "id": "menu-1",
      "name": "Nabeel Mohammed",
      "link": "/products",
      "hasMegaMenu": true,
      "isActive": true,
      "columns": [
        {
          "id": "col-1",
          "title": "Corporate Gifts",
          "link": "/products",
          "items": [
            {
              "id": "item-1",
              "name": "Custom Pens & Diaries",
              "link": "/products"
            },
            {
              "id": "item-2",
              "name": "Executive Gift Sets",
              "link": "/products"
            },
            {
              "id": "item-3",
              "name": "Thermal Flasks",
              "link": "/products"
            },
            {
              "id": "item-4",
              "name": "Leather Wallets",
              "link": "/products"
            },
            {
              "id": "item-5",
              "name": "Desk Organizers",
              "link": "/products"
            }
          ]
        },
        {
          "id": "col-2",
          "title": "Event Giveaways",
          "link": "/products",
          "items": [
            {
              "id": "item-6",
              "name": "Custom Mugs",
              "link": "/products"
            },
            {
              "id": "item-7",
              "name": "Tote Bags",
              "link": "/products"
            },
            {
              "id": "item-8",
              "name": "Keychains",
              "link": "/products"
            },
            {
              "id": "item-9",
              "name": "Badges & Pins",
              "link": "/products"
            },
            {
              "id": "item-10",
              "name": "Wristbands",
              "link": "/products"
            }
          ]
        },
        {
          "id": "col-3",
          "title": "Celebration Packs",
          "link": "/products",
          "items": [
            {
              "id": "item-11",
              "name": "VIP Hampers",
              "link": "/products"
            },
            {
              "id": "item-12",
              "name": "Sweet Gift Boxes",
              "link": "/products"
            },
            {
              "id": "item-13",
              "name": "Festival Packages",
              "link": "/products"
            },
            {
              "id": "item-14",
              "name": "Custom Trophies",
              "link": "/products"
            },
            {
              "id": "item-15",
              "name": "Award Plaques",
              "link": "/products"
            }
          ]
        }
      ],
      "banner": {
        "enabled": true,
        "image": "/uploads/banner_1791012533482_DSC00848.JPG.jpeg",
        "tag": "",
        "title": "",
        "priceNote": "",
        "discountBadge": "",
        "btnText": "Shop now",
        "btnLink": "/products",
        "showBtn": false
      }
    },
    {
      "id": "menu-2",
      "name": "Accessories",
      "link": "/products",
      "hasMegaMenu": true,
      "isActive": true,
      "columns": [
        {
          "id": "col-4",
          "title": "Wearables",
          "link": "/products",
          "items": [
            {
              "id": "item-16",
              "name": "Custom Caps",
              "link": "/products"
            },
            {
              "id": "item-17",
              "name": "Safety Helmets",
              "link": "/products"
            },
            {
              "id": "item-18",
              "name": "Reflective Vests",
              "link": "/products"
            },
            {
              "id": "item-19",
              "name": "Lanyards & ID Badges",
              "link": "/products"
            },
            {
              "id": "item-20",
              "name": "Safety Gloves",
              "link": "/products"
            }
          ]
        },
        {
          "id": "col-5",
          "title": "Bags & Pouches",
          "link": "/products",
          "items": [
            {
              "id": "item-21",
              "name": "Canvas Tote Bags",
              "link": "/products"
            },
            {
              "id": "item-22",
              "name": "Drawstring Bags",
              "link": "/products"
            },
            {
              "id": "item-23",
              "name": "Backpacks",
              "link": "/products"
            },
            {
              "id": "item-24",
              "name": "Laptop Sleeves",
              "link": "/products"
            },
            {
              "id": "item-25",
              "name": "Travel Pouches",
              "link": "/products"
            }
          ]
        },
        {
          "id": "col-6",
          "title": "Office Accessories",
          "link": "/products",
          "items": [
            {
              "id": "item-26",
              "name": "Mousepads",
              "link": "/products"
            },
            {
              "id": "item-27",
              "name": "Desk Mats",
              "link": "/products"
            },
            {
              "id": "item-28",
              "name": "USB Flash Drives",
              "link": "/products"
            },
            {
              "id": "item-29",
              "name": "Card Holders",
              "link": "/products"
            },
            {
              "id": "item-30",
              "name": "Badge Reels",
              "link": "/products"
            }
          ]
        }
      ],
      "banner": {
        "enabled": true,
        "image": "/assets/imgs/banner/banner-menu.png",
        "tag": "Accessories",
        "title": "Best Sellers 2026",
        "btnText": "Explore",
        "btnLink": "/products"
      }
    }
  ]
};
