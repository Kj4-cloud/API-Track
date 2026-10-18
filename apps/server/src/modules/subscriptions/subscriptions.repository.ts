import { getDatabase } from '../../config/database.js';
import crypto from 'crypto';

export class SubscriptionsRepository {
  private get db() {
    return getDatabase();
  }

  private mapRow(row: any) {
    if (!row) return null;
    const {
      api_service_id, api_provider, api_name, api_category, api_website, api_status, api_environment,
      ...sub
    } = row;

    return {
      ...sub,
      auto_renew: Boolean(sub.auto_renew),
      price: Number(sub.price),
      api_service: api_service_id ? {
        id: api_service_id,
        provider: api_provider,
        name: api_name,
        category: api_category,
        website: api_website,
        status: api_status,
        environment: api_environment,
      } : undefined,
    };
  }

  async findAllByUser(userId: string, query?: string) {
    let sql = `
      SELECT 
        s.*,
        a.id as api_service_id,
        a.provider as api_provider,
        a.name as api_name,
        a.category as api_category,
        a.website as api_website,
        a.status as api_status,
        a.environment as api_environment
      FROM subscriptions s
      LEFT JOIN api_services a ON s.api_id = a.id
      WHERE s.user_id = ?
    `;
    const params: any[] = [userId];

    if (query && query.trim()) {
      sql += ' AND s.plan_name LIKE ?';
      params.push(`%${query.trim()}%`);
    }

    sql += ' ORDER BY s.renewal_date ASC';

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((r) => this.mapRow(r));
  }

  async findByIdAndUser(id: string, userId: string) {
    const row = this.db.prepare(`
      SELECT 
        s.*,
        a.id as api_service_id,
        a.provider as api_provider,
        a.name as api_name,
        a.category as api_category,
        a.website as api_website,
        a.status as api_status,
        a.environment as api_environment
      FROM subscriptions s
      LEFT JOIN api_services a ON s.api_id = a.id
      WHERE s.id = ? AND s.user_id = ?
    `).get(id, userId);

    return this.mapRow(row);
  }

  async getUpcoming(userId: string, days = 30) {
    const rows = this.db.prepare(`
      SELECT 
        s.*,
        a.id as api_service_id,
        a.provider as api_provider,
        a.name as api_name,
        a.category as api_category,
        a.website as api_website,
        a.status as api_status,
        a.environment as api_environment
      FROM subscriptions s
      LEFT JOIN api_services a ON s.api_id = a.id
      WHERE s.user_id = ?
        AND s.status = 'active'
        AND s.renewal_date IS NOT NULL
        AND date(s.renewal_date) >= date('now')
        AND date(s.renewal_date) <= date('now', '+' || ? || ' days')
      ORDER BY s.renewal_date ASC
    `).all(userId, days);

    return rows.map((r) => this.mapRow(r));
  }

  async create(payload: any) {
    const id = payload.id || crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, api_id, plan_name, price, currency, billing_cycle,
        start_date, renewal_date, auto_renew, status, payment_method,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      payload.user_id,
      payload.api_id || null,
      payload.plan_name,
      Number(payload.price || 0),
      payload.currency || 'INR',
      payload.billing_cycle || 'monthly',
      payload.start_date,
      payload.renewal_date || null,
      payload.auto_renew === false || payload.auto_renew === 0 ? 0 : 1,
      payload.status || 'active',
      payload.payment_method || null,
      now,
      now
    );

    return this.findByIdAndUser(id, payload.user_id);
  }

  async update(id: string, userId: string, payload: any) {
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      'api_id', 'plan_name', 'price', 'currency', 'billing_cycle',
      'start_date', 'renewal_date', 'auto_renew', 'status', 'payment_method'
    ];

    for (const key of allowed) {
      if (payload[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'auto_renew') {
          values.push(payload[key] ? 1 : 0);
        } else if (key === 'price') {
          values.push(Number(payload[key]));
        } else {
          values.push(payload[key]);
        }
      }
    }

    if (fields.length === 0) {
      return this.findByIdAndUser(id, userId);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id, userId);

    this.db.prepare(`
      UPDATE subscriptions 
      SET ${fields.join(', ')} 
      WHERE id = ? AND user_id = ?
    `).run(...values);

    return this.findByIdAndUser(id, userId);
  }

  async delete(id: string, userId: string) {
    this.db.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').run(id, userId);
  }
}
