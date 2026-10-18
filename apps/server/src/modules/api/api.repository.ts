import { getDatabase } from '../../config/database.js';
import crypto from 'crypto';

export class ApiRepository {
  private get db() {
    return getDatabase();
  }

  async findAllByUser(userId: string, query?: string) {
    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      return this.db
        .prepare(`
          SELECT * FROM api_services 
          WHERE user_id = ? 
            AND (provider LIKE ? OR name LIKE ? OR category LIKE ?)
          ORDER BY created_at DESC
        `)
        .all(userId, q, q, q);
    }

    return this.db
      .prepare('SELECT * FROM api_services WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId);
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.db
      .prepare('SELECT * FROM api_services WHERE id = ? AND user_id = ?')
      .get(id, userId);
  }

  async create(payload: any) {
    const id = payload.id || crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO api_services (
        id, user_id, provider, name, category, website, api_key_encrypted, 
        environment, status, token_limit, tokens_used, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      payload.user_id,
      payload.provider,
      payload.name,
      payload.category,
      payload.website || null,
      payload.api_key_encrypted || null,
      payload.environment || 'development',
      payload.status || 'active',
      payload.token_limit || 0,
      payload.tokens_used || 0,
      payload.notes || null,
      now,
      now
    );

    return this.findByIdAndUser(id, payload.user_id);
  }

  async update(id: string, userId: string, payload: any) {
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      'provider', 'name', 'category', 'website', 'api_key_encrypted',
      'environment', 'status', 'token_limit', 'tokens_used', 'notes'
    ];

    for (const key of allowed) {
      if (payload[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(payload[key]);
      }
    }

    if (fields.length === 0) {
      return this.findByIdAndUser(id, userId);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id, userId);

    this.db.prepare(`
      UPDATE api_services 
      SET ${fields.join(', ')} 
      WHERE id = ? AND user_id = ?
    `).run(...values);

    return this.findByIdAndUser(id, userId);
  }

  async updateUsage(id: string, userId: string, tokensUsed: number) {
    this.db.prepare(`
      UPDATE api_services 
      SET tokens_used = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(tokensUsed, id, userId);
  }

  async updateStatus(id: string, userId: string, status: string) {
    this.db.prepare(`
      UPDATE api_services 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(status, id, userId);
  }

  async delete(id: string, userId: string) {
    this.db.prepare('DELETE FROM api_services WHERE id = ? AND user_id = ?').run(id, userId);
  }
}
