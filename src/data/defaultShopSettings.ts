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
      "name": "HELMET",
      "link": "/products?category=tshirts",
      "image": "/assets/imgs/shop/p1.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-1",
          "name": "Custom Tshirts 1",
          "link": "/products?category=tshirts"
        },
        {
          "id": "sub-2",
          "name": "Custom Tshirts 2",
          "link": "/products?category=tshirts"
        },
        {
          "id": "sub-3",
          "name": "Custom Tshirts 3",
          "link": "/products?category=tshirts"
        },
        {
          "id": "sub-4",
          "name": "Custom Tshirts 4",
          "link": "/products?category=tshirts"
        },
        {
          "id": "see-all-1790888342314",
          "name": "See All",
          "link": "/products?category=tshirts"
        }
      ]
    },
    {
      "id": "cat-2",
      "name": "Bag Print",
      "link": "/products?category=bags",
      "image": "/assets/imgs/shop/p2.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-5",
          "name": "Canvas Tote Bags",
          "link": "/products?category=bags"
        },
        {
          "id": "sub-6",
          "name": "Drawstring Bags",
          "link": "/products?category=bags"
        },
        {
          "id": "sub-7",
          "name": "Custom Backpacks",
          "link": "/products?category=bags"
        },
        {
          "id": "sub-8",
          "name": "Paper Shopping Bags",
          "link": "/products?category=bags"
        }
      ]
    },
    {
      "id": "cat-3",
      "name": "Gift Pack",
      "link": "/products?category=gifts",
      "image": "/assets/imgs/shop/p3.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-9",
          "name": "Executive Gift Sets",
          "link": "/products?category=gifts"
        },
        {
          "id": "sub-10",
          "name": "Corporate Hampers",
          "link": "/products?category=gifts"
        },
        {
          "id": "sub-11",
          "name": "VIP Celebration Packs",
          "link": "/products?category=gifts"
        },
        {
          "id": "sub-12",
          "name": "Sweet Gift Boxes",
          "link": "/products?category=gifts"
        }
      ]
    },
    {
      "id": "cat-4",
      "name": "Paper Cup",
      "link": "/products?category=paper-cups",
      "image": "/assets/imgs/shop/p4.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-13",
          "name": "Single Wall Cups",
          "link": "/products?category=paper-cups"
        },
        {
          "id": "sub-14",
          "name": "Double Wall Cups",
          "link": "/products?category=paper-cups"
        },
        {
          "id": "sub-15",
          "name": "Ripple Wall Cups",
          "link": "/products?category=paper-cups"
        },
        {
          "id": "sub-16",
          "name": "Custom Printed Sleeves",
          "link": "/products?category=paper-cups"
        }
      ]
    },
    {
      "id": "cat-5",
      "name": "Brochure",
      "link": "/products?category=brochures",
      "image": "/assets/imgs/shop/p5.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-17",
          "name": "Bi-Fold Brochures",
          "link": "/products?category=brochures"
        },
        {
          "id": "sub-18",
          "name": "Tri-Fold Brochures",
          "link": "/products?category=brochures"
        },
        {
          "id": "sub-19",
          "name": "Corporate Catalogs",
          "link": "/products?category=brochures"
        },
        {
          "id": "sub-20",
          "name": "Flyers & Leaflets",
          "link": "/products?category=brochures"
        }
      ]
    },
    {
      "id": "cat-6",
      "name": "Hoodies",
      "link": "/products?category=hoodies",
      "image": "/assets/imgs/shop/p6.jpg",
      "isActive": true,
      "subItems": [
        {
          "id": "sub-21",
          "name": "Pullover Hoodies",
          "link": "/products?category=hoodies"
        },
        {
          "id": "sub-22",
          "name": "Zip-up Hoodies",
          "link": "/products?category=hoodies"
        },
        {
          "id": "sub-23",
          "name": "Fleece Hoodies",
          "link": "/products?category=hoodies"
        },
        {
          "id": "sub-24",
          "name": "Custom Printed Hoodies",
          "link": "/products?category=hoodies"
        }
      ]
    },
    {
      "id": "cat-1791017648820",
      "name": "Bags",
      "link": "/products?category=",
      "image": "/uploads/img_1791017640365_7aa1d973042f1b674a19dcb6a3cc3390.webp",
      "isActive": true,
      "subItems": [
        {
          "id": "see-all-1791017798830",
          "name": "See All",
          "link": "/products?category="
        }
      ],
      "hasSubItems": false
    },
    {
      "id": "cat-1791051887040",
      "name": "PPE KIT",
      "link": "/products?category=",
      "image": "/assets/imgs/shop/p1.jpg",
      "hasSubItems": false,
      "isActive": true,
      "subItems": [
        {
          "id": "sub-1",
          "name": "Custom Sub 1",
          "link": "/products"
        },
        {
          "id": "sub-2",
          "name": "Custom Sub 2",
          "link": "/products"
        },
        {
          "id": "sub-3",
          "name": "Custom Sub 3",
          "link": "/products"
        },
        {
          "id": "sub-4",
          "name": "Custom Sub 4",
          "link": "/products"
        },
        {
          "id": "sub-see-all",
          "name": "See All",
          "link": "/products"
        }
      ]
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
