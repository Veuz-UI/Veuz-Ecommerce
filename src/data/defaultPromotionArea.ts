import promotionStore from './promotion-area-store.json';

export interface PromotionCardItem {
  id: string;
  image: string;
  title?: string;
  link?: string;
}

export interface PromotionAreaData {
  promotions: PromotionCardItem[];
}

export const DEFAULT_PROMOTION_AREA: PromotionAreaData = {
  promotions: (promotionStore && Array.isArray(promotionStore.promotions))
    ? (promotionStore.promotions as PromotionCardItem[])
    : [
        { id: 'promo-card-1', image: '', title: '', link: '/products' },
        { id: 'promo-card-2', image: '', title: '', link: '/products' },
        { id: 'promo-card-3', image: '', title: '', link: '/products' },
      ],
};
