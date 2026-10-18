import { NotificationsRepository } from './notifications.repository.js';

export class NotificationsService {
  private repo = new NotificationsRepository();

  async getUserNotifications(userId: string, unreadOnly = false) {
    if (unreadOnly) {
      return this.repo.findUnreadByUser(userId);
    }
    return this.repo.findAllByUser(userId);
  }

  async getUnreadCount(userId: string) {
    return this.repo.getUnreadCount(userId);
  }

  async markAsRead(id: string, userId: string) {
    return this.repo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.repo.markAllAsRead(userId);
  }

  async createNotification(userId: string, data: any) {
    return this.repo.create(userId, data);
  }

  async deleteNotification(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }
}
