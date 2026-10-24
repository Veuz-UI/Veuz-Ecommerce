import apiClient from '@/services/apiClient';
import { User } from '@/context/AuthContext';

export interface DashboardNotificationItem {
  id: string;
  type: 'CUSTOMER_JOIN' | 'ADMIN_CREATED';
  title: string;
  message: string;
  userName: string;
  userEmail: string;
  userRole: 'CUSTOMER' | 'ADMIN';
  timeAgo: string;
  createdAt: number;
  isRead: boolean;
  link: string;
}

export const DASHBOARD_NOTIFICATIONS_EVENT = 'veuz:dashboard-notifications-updated';

const getReadIdsKey = (userId: string | number) => `veuz_dash_notif_read_ids_${userId}`;
const getClearedAtKey = (userId: string | number) => `veuz_dash_notif_cleared_at_${userId}`;

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Fetches REAL system users and constructs live dashboard notifications:
 * - Admin sees: Real new customer registrations
 * - Owner (Super Admin) sees: Real new customer registrations AND admin creations
 */
export async function fetchDashboardNotifications(
  currentUser: User | null
): Promise<DashboardNotificationItem[]> {
  if (!currentUser || typeof window === 'undefined') return [];

  // Only Admin and Owner (Super Admin) are permitted to view dashboard notifications
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isSuperAdmin && !isAdmin) {
    return [];
  }

  try {
    const res = await apiClient.get('/admin/users');
    if (!res || !res.success || !Array.isArray(res.users)) {
      return [];
    }

    const clearedAt = Number(localStorage.getItem(getClearedAtKey(currentUser.id)) || 0);
    const readIds: string[] = JSON.parse(localStorage.getItem(getReadIdsKey(currentUser.id)) || '[]');

    const notifications: DashboardNotificationItem[] = [];

    for (const u of res.users) {
      // Don't create notification for the currently logged in account itself
      if (u.id === currentUser.id) continue;

      const userCreatedAt = new Date(u.createdAt).getTime();
      if (isNaN(userCreatedAt) || userCreatedAt <= clearedAt) continue;

      const timeAgo = formatRelativeTime(userCreatedAt);

      // 1. Customer Join Notification (Visible to BOTH Admin & Owner)
      if (u.role === 'CUSTOMER') {
        const notifId = `customer-join-${u.id}`;
        notifications.push({
          id: notifId,
          type: 'CUSTOMER_JOIN',
          title: 'New Customer Joined',
          message: `${u.name} (${u.email}) registered an account`,
          userName: u.name,
          userEmail: u.email,
          userRole: 'CUSTOMER',
          timeAgo,
          createdAt: userCreatedAt,
          isRead: readIds.includes(notifId),
          link: '/dashboard/users?tab=customers',
        });
      }

      // 2. Admin Created Notification (Visible ONLY to Owner / Super Admin)
      if (u.role === 'ADMIN' && isSuperAdmin) {
        const notifId = `admin-created-${u.id}`;
        notifications.push({
          id: notifId,
          type: 'ADMIN_CREATED',
          title: 'New Admin Created',
          message: `Admin ${u.name} (${u.email}) was onboarded`,
          userName: u.name,
          userEmail: u.email,
          userRole: 'ADMIN',
          timeAgo,
          createdAt: userCreatedAt,
          isRead: readIds.includes(notifId),
          link: '/dashboard/users?tab=admins',
        });
      }
    }

    // Sort newest first
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    return notifications;
  } catch (error) {
    console.error('Error fetching dashboard notifications:', error);
    return [];
  }
}

export function markDashboardNotificationAsRead(userId: string | number, notifId: string): void {
  if (typeof window === 'undefined' || !userId) return;

  try {
    const key = getReadIdsKey(userId);
    const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.includes(notifId)) {
      existing.push(notifId);
      localStorage.setItem(key, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent(DASHBOARD_NOTIFICATIONS_EVENT));
    }
  } catch (e) {
    console.error('Error marking dashboard notification as read:', e);
  }
}

export function markAllDashboardNotificationsAsRead(
  userId: string | number,
  notifications: DashboardNotificationItem[]
): void {
  if (typeof window === 'undefined' || !userId) return;

  try {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(getReadIdsKey(userId), JSON.stringify(allIds));
    window.dispatchEvent(new CustomEvent(DASHBOARD_NOTIFICATIONS_EVENT));
  } catch (e) {
    console.error('Error marking all dashboard notifications as read:', e);
  }
}

export function clearAllDashboardNotifications(userId: string | number): void {
  if (typeof window === 'undefined' || !userId) return;

  try {
    localStorage.setItem(getClearedAtKey(userId), String(Date.now()));
    window.dispatchEvent(new CustomEvent(DASHBOARD_NOTIFICATIONS_EVENT));
  } catch (e) {
    console.error('Error clearing dashboard notifications:', e);
  }
}
