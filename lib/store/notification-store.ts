import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) =>
    set((state: NotificationState) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        read: false,
      };
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),
  markAsRead: (id: string) =>
    set((state: NotificationState) => {
      const notification = state.notifications.find((n: Notification) => n.id === id);
      if (!notification || notification.read) return state;
      return {
        notifications: state.notifications.map((n: Notification) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),
  markAllAsRead: () =>
    set((state: NotificationState) => ({
      notifications: state.notifications.map((n: Notification) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id: string) =>
    set((state: NotificationState) => {
      const notification = state.notifications.find((n: Notification) => n.id === id);
      return {
        notifications: state.notifications.filter((n: Notification) => n.id !== id),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    }),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
