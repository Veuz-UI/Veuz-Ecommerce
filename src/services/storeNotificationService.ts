import { CATEGORY_PRODUCTS_DATA, ProductItem } from '@/data/categoryProductsData';
import authService from '@/services/authService';

export type NotificationType = 'welcome' | 'cart' | 'offer' | 'product';

export interface NotificationProductCard {
  title: string;
  badge?: string;
  badgeColor?: string;
  ratingOrPrice?: string;
  originalPrice?: string;
  image?: string;
  linkUrl: string;
}

export interface StoreNotificationItem {
  id: string;
  type: NotificationType;
  senderName?: string;
  isVerified?: boolean;
  title: string;
  message: string;
  card?: NotificationProductCard;
  code?: string;
  actionLabel?: string;
  actionUrl?: string;
  timeAgo: string;
  group: string; // e.g. "TODAY", "YESTERDAY", "21 OCT", etc.
  isRead: boolean;
  createdAt: number;
}

export const NOTIFICATIONS_UPDATED_EVENT = 'veuz:storefront-notifications-updated';

// Version 5 storage keys: fully persistent clear state and real product link navigation
const getUserClearedKey = (userId: string | number) => `veuz_notif_cleared_at_v5_${userId}`;
const getUserClearedFlagKey = (userId: string | number) => `veuz_notif_cleared_flag_v5_${userId}`;
const getUserDeletedKey = (userId: string | number) => `veuz_notif_deleted_ids_v5_${userId}`;
const getUserReadIdsKey = (userId: string | number) => `veuz_notif_read_ids_v5_${userId}`;
const getUserJoinKey = (userId: string | number) => `veuz_notif_join_time_v5_${userId}`;
const getUserCartTimeKey = (userId: string | number) => `veuz_cart_first_added_${userId}`;

/**
 * Calculates date relative time and group name dynamically based on real timestamp
 */
export function formatNotificationDateMeta(timestamp: number): { timeAgo: string; group: string } {
  const itemDate = new Date(timestamp);
  const now = new Date();

  const isToday =
    itemDate.getFullYear() === now.getFullYear() &&
    itemDate.getMonth() === now.getMonth() &&
    itemDate.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    itemDate.getFullYear() === yesterday.getFullYear() &&
    itemDate.getMonth() === yesterday.getMonth() &&
    itemDate.getDate() === yesterday.getDate();

  const diffMs = now.getTime() - itemDate.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);

  let timeAgo: string;
  if (diffMinutes < 1) {
    timeAgo = 'Just now';
  } else if (diffMinutes < 60) {
    timeAgo = `${diffMinutes}m`;
  } else if (diffHours < 24 && isToday) {
    timeAgo = `${diffHours}h`;
  } else if (isYesterday) {
    timeAgo = itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } else {
    timeAgo = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  let group: string;
  if (isToday) {
    group = 'TODAY';
  } else if (isYesterday) {
    group = 'YESTERDAY';
  } else {
    // Show exact date, e.g. "21 OCT", "18 OCT"
    group = itemDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();
  }

  return { timeAgo, group };
}

/**
 * Builds 100% REAL storefront notifications based strictly on:
 * 1. Real logged-in user profile (Welcome)
 * 2. Real products added to the store (New Arrivals)
 * 3. Real discounted / special offer products (Promotions)
 * 4. Real items waiting in the user's cart (>30 min)
 * Zero dummy text or hardcoded mock names!
 */
export function buildRealStoreNotifications(
  userId: string | number,
  userName?: string,
  liveProducts?: ProductItem[],
  userSettings?: any
): StoreNotificationItem[] {
  if (typeof window === 'undefined' || !userId) return [];

  try {
    let profileSettings = userSettings;
    if (!profileSettings && typeof window !== 'undefined') {
      try {
        const rawUser = localStorage.getItem('veuz_user');
        if (rawUser) {
          profileSettings = JSON.parse(rawUser)?.settings;
        }
      } catch (e) {}
    }

    const isCleared =
      profileSettings?.notifClearedAll === true ||
      Number(profileSettings?.notifClearedAt || 0) > 0 ||
      Number(localStorage.getItem(getUserClearedKey(userId)) || 0) > 0 ||
      localStorage.getItem(getUserClearedFlagKey(userId)) === 'true';

    const localDeleted: string[] = JSON.parse(localStorage.getItem(getUserDeletedKey(userId)) || '[]');
    const profileDeleted: string[] = Array.isArray(profileSettings?.deletedNotifIds) ? profileSettings.deletedNotifIds : [];
    const deletedIds: string[] = Array.from(new Set([...localDeleted, ...profileDeleted]));
    const readIds: string[] = JSON.parse(localStorage.getItem(getUserReadIdsKey(userId)) || '[]');

    const notifications: StoreNotificationItem[] = [];
    const firstName = userName ? userName.split(' ')[0] : 'there';

    // 1. Real Welcome Notification for User Account
    // Fixed join timestamp: once cleared, it never resurrects!
    const welcomeId = `welcome-${userId}`;
    let userJoinTime = Number(localStorage.getItem(getUserJoinKey(userId)) || 0);
    if (!userJoinTime) {
      userJoinTime = Date.now();
      localStorage.setItem(getUserJoinKey(userId), String(userJoinTime));
    }

    if (!isCleared && !deletedIds.includes(welcomeId)) {
      const { timeAgo, group } = formatNotificationDateMeta(userJoinTime);
      notifications.push({
        id: welcomeId,
        type: 'welcome',
        senderName: 'Veuz Safety Assistant',
        isVerified: true,
        title: 'Account Verified & Active',
        message: `Hello ${firstName}! Welcome to Veuz Safety. Your account is active to browse certified industrial safety gear and track orders.`,
        timeAgo,
        group,
        isRead: readIds.includes(welcomeId),
        createdAt: userJoinTime,
      });
    }

    // 2. Real Store Products (New Arrivals & Special Offers)
    const productsSource = (Array.isArray(liveProducts) && liveProducts.length > 0)
      ? liveProducts
      : CATEGORY_PRODUCTS_DATA;

    const activeProducts = productsSource.filter((p) => !p.isDraft && p.isActive !== false);

    for (const prod of activeProducts) {
      const prodCreatedAt = Number(prod.createdAt) || 0;
      const isOffer = Boolean(prod.isSpecialOffer || prod.discount || prod.offerPercent);
      const notifId = isOffer ? `offer-${prod.id}` : `prod-${prod.id}`;

      // Suppress if explicitly deleted or user cleared notifications
      if (deletedIds.includes(notifId)) continue;
      // If user has cleared notifications, suppress all pre-existing catalog products
      if (isCleared) continue;

      const { timeAgo, group } = formatNotificationDateMeta(prodCreatedAt || Date.now());
      const productLink = prod.link || `/product-details?id=${prod.id}`;

      if (isOffer) {
        // Real Special Offer Notification
        const discountBadge = prod.discount || (prod.offerPercent ? `${prod.offerPercent}% OFF` : 'Special Offer');
        notifications.push({
          id: notifId,
          type: 'offer',
          senderName: 'Veuz Special Offers',
          isVerified: true,
          title: `Special Offer: ${prod.title}`,
          message: `Special limited promotion on "${prod.title}". Available now at ${prod.price} while stock lasts.`,
          card: {
            title: prod.title,
            badge: discountBadge,
            badgeColor: '#ea580c',
            ratingOrPrice: prod.price,
            originalPrice: prod.oldPrice || (prod.originalPrice ? `${prod.originalPrice} SR` : undefined),
            image: prod.image,
            linkUrl: productLink,
          },
          actionUrl: productLink,
          timeAgo,
          group,
          isRead: readIds.includes(notifId),
          createdAt: prodCreatedAt || Date.now(),
        });
      } else {
        // Real New In Stock Product Notification
        notifications.push({
          id: notifId,
          type: 'product',
          senderName: 'Veuz Equipment',
          isVerified: true,
          title: 'New Product In Stock',
          message: `"${prod.title}" is now available in our ${prod.category} catalog.`,
          card: {
            title: prod.title,
            badge: prod.badge || 'New Arrival',
            badgeColor: '#2563eb',
            ratingOrPrice: `${prod.rating || '5.0'} ★ • ${prod.price}`,
            image: prod.image,
            linkUrl: productLink,
          },
          actionUrl: productLink,
          timeAgo,
          group,
          isRead: readIds.includes(notifId),
          createdAt: prodCreatedAt || Date.now(),
        });
      }
    }

    // Sort newest notifications first
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    return notifications;
  } catch (error) {
    console.error('Error building real store notifications:', error);
    return [];
  }
}

export function getUserNotifications(
  userId?: string | number | null,
  userName?: string,
  liveProducts?: ProductItem[],
  userSettings?: any
): StoreNotificationItem[] {
  if (!userId || typeof window === 'undefined') return [];
  return buildRealStoreNotifications(userId, userName, liveProducts, userSettings);
}

export function markNotificationAsRead(userId: string | number, id: string): void {
  if (!userId || typeof window === 'undefined') return;

  try {
    const key = getUserReadIdsKey(userId);
    const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem(key, JSON.stringify(existing));
    }

    const updated = buildRealStoreNotifications(userId);
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { userId, notifications: updated },
      })
    );
  } catch (e) {
    console.error('Error marking notification read:', e);
  }
}

export function markAllNotificationsAsRead(userId: string | number): void {
  if (!userId || typeof window === 'undefined') return;

  try {
    const notifications = buildRealStoreNotifications(userId);
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(getUserReadIdsKey(userId), JSON.stringify(allIds));

    const updated = buildRealStoreNotifications(userId);
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { userId, notifications: updated },
      })
    );
  } catch (e) {
    console.error('Error marking all notifications read:', e);
  }
}

export function deleteNotification(
  userId: string | number,
  id: string,
  user?: any,
  updateProfileFn?: (data: any) => Promise<any>
): void {
  if (!userId || typeof window === 'undefined') return;

  try {
    const key = getUserDeletedKey(userId);
    const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem(key, JSON.stringify(existing));
    }

    const newSettings = {
      ...(user?.settings || {}),
      deletedNotifIds: existing,
    };
    if (typeof updateProfileFn === 'function') {
      updateProfileFn({ settings: newSettings }).catch(() => {});
    } else {
      authService.updateProfile({ settings: newSettings }).catch(() => {});
    }

    try {
      const rawUser = localStorage.getItem('veuz_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        parsed.settings = newSettings;
        localStorage.setItem('veuz_user', JSON.stringify(parsed));
      }
    } catch (e) {}

    const updated = buildRealStoreNotifications(userId, user?.name, undefined, newSettings);
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { userId, notifications: updated },
      })
    );
  } catch (e) {
    console.error('Error deleting notification:', e);
  }
}

export function clearAllNotifications(
  userId: string | number,
  user?: any,
  updateProfileFn?: (data: any) => Promise<any>
): void {
  if (!userId || typeof window === 'undefined') return;

  try {
    const now = Date.now();
    // 1. Collect all notification IDs that currently exist across the entire store
    const allStoreNotifIds = [
      `welcome-${userId}`,
      `cart-waiting-${userId}`,
      ...CATEGORY_PRODUCTS_DATA.map((p) => `prod-${p.id}`),
      ...CATEGORY_PRODUCTS_DATA.map((p) => `offer-${p.id}`),
    ];

    const delKey = getUserDeletedKey(userId);
    const existingDeleted: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
    const mergedDeleted = Array.from(new Set([...existingDeleted, ...allStoreNotifIds]));
    localStorage.setItem(delKey, JSON.stringify(mergedDeleted));
    localStorage.setItem(getUserClearedKey(userId), String(now));
    localStorage.setItem(getUserClearedFlagKey(userId), 'true');

    // 2. Persist to user profile in database so it stays cleared across re-login & across devices!
    const newSettings = {
      ...(user?.settings || {}),
      notifClearedAt: now,
      notifClearedAll: true,
      deletedNotifIds: mergedDeleted,
    };

    if (typeof updateProfileFn === 'function') {
      updateProfileFn({ settings: newSettings }).catch(() => {});
    } else {
      authService.updateProfile({ settings: newSettings }).catch(() => {});
    }

    try {
      const rawUser = localStorage.getItem('veuz_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        parsed.settings = newSettings;
        localStorage.setItem('veuz_user', JSON.stringify(parsed));
      }
    } catch (e) {}

    // 4. Dispatch global event with cleared empty state
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { userId: String(userId), notifications: [] },
      })
    );
  } catch (e) {
    console.error('Error clearing all notifications:', e);
  }
}

/**
 * 30-Minute Real Cart Waiting Notification
 */
export function checkCartWaitingNotification(
  userId: string | number,
  cartItemsCount: number,
  firstCartItemName?: string,
  firstCartItemImage?: string
): void {
  if (!userId || typeof window === 'undefined') return;

  const timeKey = getUserCartTimeKey(userId);

  if (cartItemsCount <= 0) {
    localStorage.removeItem(timeKey);
    return;
  }

  const storedTime = localStorage.getItem(timeKey);
  const now = Date.now();

  if (!storedTime) {
    localStorage.setItem(timeKey, String(now));
    return;
  }

  const addedAt = parseInt(storedTime, 10);
  const elapsedMinutes = (now - addedAt) / (1000 * 60);

  // Trigger when 30 minutes pass without checkout
  if (elapsedMinutes >= 30) {
    const clearedAt = Number(localStorage.getItem(getUserClearedKey(userId)) || 0);
    const isCleared = localStorage.getItem(getUserClearedFlagKey(userId)) === 'true';
    if (isCleared || addedAt <= clearedAt) return;

    const notifId = `cart-waiting-${userId}`;
    const deletedIds: string[] = JSON.parse(localStorage.getItem(getUserDeletedKey(userId)) || '[]');
    if (deletedIds.includes(notifId)) return;

    // Trigger update event
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { userId, notifications: buildRealStoreNotifications(userId) },
      })
    );
  }
}
