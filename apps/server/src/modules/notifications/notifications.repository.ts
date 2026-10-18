import { getDatabase } from '../../config/database.js';
import crypto from 'crypto';

export class NotificationsRepository {
  private get db() {
    return getDatabase();
  }

  private mapRow(row: any) {
    if (!row) return null;
    return {
      ...row,
      is_read: Boolean(row.is_read),
    };
  }

  async findAllByUser(userId: string) {
    const rows = this.db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
    return rows.map((r) => this.mapRow(r));
  }

  async findUnreadByUser(userId: string) {
    const rows = this.db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? AND is_read = 0 
      ORDER BY created_at DESC
    `).all(userId);
    return rows.map((r) => this.mapRow(r));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const row: any = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId);
    return row?.count || 0;
  }

  async markAsRead(id: string, userId: string) {
    this.db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ? AND user_id = ?
    `).run(id, userId);
  }

  async markAllAsRead(userId: string) {
    this.db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ? AND is_read = 0
    `).run(userId);
  }

  async create(userId: string, data: {
    type: string;
    title: string;
    message: string;
    link?: string | null;
  }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read, link, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, userId, data.type || 'system', data.title, data.message, data.link || null, now);

    const row = this.db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    return this.mapRow(row);
  }

  async delete(id: string, userId: string) {
    this.db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(id, userId);
  }
}
