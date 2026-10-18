import { apiRequest } from './api-client';
import type { Notification } from '../types';

export const notificationsService = {
  async getAll(): Promise<Notification[]> {
    return apiRequest<Notification[]>('/notifications');
  },

  async getUnread(): Promise<Notification[]> {
    return apiRequest<Notification[]>('/notifications?unread=true');
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiRequest<{ count: number }>('/notifications/unread-count');
    return res?.count || 0;
  },

  async markAsRead(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead(): Promise<void> {
    await apiRequest('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  },

  async create(userId: string, notification: {
    type: Notification['type'];
    title: string;
    message: string;
    link?: string;
  }): Promise<Notification> {
    return apiRequest<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        ...notification,
        user_id: userId,
      }),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
