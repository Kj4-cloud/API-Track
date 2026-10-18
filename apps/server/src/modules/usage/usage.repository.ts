import { getDatabase } from '../../config/database.js';
import crypto from 'crypto';

export class UsageRepository {
  private get db() {
    return getDatabase();
  }

  private mapRow(row: any) {
    if (!row) return null;
    const {
      api_service_id, api_provider, api_name, api_category,
      ...log
    } = row;

    return {
      ...log,
      requests: Number(log.requests || 0),
      tokens_used: Number(log.tokens_used || 0),
      credits_used: Number(log.credits_used || 0),
      cost: Number(log.cost || 0),
      api_service: api_service_id ? {
        id: api_service_id,
        provider: api_provider,
        name: api_name,
        category: api_category,
      } : undefined,
    };
  }

  async findAllByUser(userId: string, startDate?: string, endDate?: string) {
    let sql = `
      SELECT 
        u.*,
        a.id as api_service_id,
        a.provider as api_provider,
        a.name as api_name,
        a.category as api_category
      FROM usage_logs u
      LEFT JOIN api_services a ON u.api_id = a.id
      WHERE u.user_id = ?
    `;
    const params: any[] = [userId];

    if (startDate) {
      sql += ' AND u.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND u.date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY u.date DESC';

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((r) => this.mapRow(r));
  }

  async findByApiAndUser(apiId: string, userId: string) {
    const rows = this.db.prepare(`
      SELECT * FROM usage_logs 
      WHERE api_id = ? AND user_id = ? 
      ORDER BY date DESC
    `).all(apiId, userId);

    return rows.map((r: any) => ({
      ...r,
      requests: Number(r.requests || 0),
      tokens_used: Number(r.tokens_used || 0),
      credits_used: Number(r.credits_used || 0),
      cost: Number(r.cost || 0),
    }));
  }

  async upsert(payload: any) {
    const id = payload.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const requests = Number(payload.requests || 0);
    const tokens = Number(payload.tokens_used || 0);
    const credits = Number(payload.credits_used || 0);
    const cost = Number(payload.cost || 0);

    const stmt = this.db.prepare(`
      INSERT INTO usage_logs (
        id, api_id, user_id, date, requests, tokens_used, credits_used, cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(api_id, user_id, date) DO UPDATE SET
        requests = excluded.requests,
        tokens_used = excluded.tokens_used,
        credits_used = excluded.credits_used,
        cost = excluded.cost
    `);

    stmt.run(id, payload.api_id, payload.user_id, payload.date, requests, tokens, credits, cost, now);

    // Update tokens_used on the parent api_services record
    this.db.prepare(`
      UPDATE api_services 
      SET tokens_used = (
        SELECT COALESCE(SUM(tokens_used), 0) FROM usage_logs WHERE api_id = ?
      ), updated_at = datetime('now')
      WHERE id = ?
    `).run(payload.api_id, payload.api_id);

    const result = this.db.prepare(`
      SELECT * FROM usage_logs 
      WHERE api_id = ? AND user_id = ? AND date = ?
    `).get(payload.api_id, payload.user_id, payload.date);

    return result;
  }

  async delete(id: string, userId: string) {
    // Get api_id before delete to recalculate tokens
    const log: any = this.db.prepare('SELECT api_id FROM usage_logs WHERE id = ? AND user_id = ?').get(id, userId);
    this.db.prepare('DELETE FROM usage_logs WHERE id = ? AND user_id = ?').run(id, userId);

    if (log && log.api_id) {
      this.db.prepare(`
        UPDATE api_services 
        SET tokens_used = (
          SELECT COALESCE(SUM(tokens_used), 0) FROM usage_logs WHERE api_id = ?
        ), updated_at = datetime('now')
        WHERE id = ?
      `).run(log.api_id, log.api_id);
    }
  }

  async getAggregatedByApi(userId: string) {
    const rows = this.db.prepare(`
      SELECT 
        u.api_id,
        COALESCE(a.provider, 'Unknown') as provider,
        COALESCE(a.name, 'Unknown API') as name,
        COALESCE(SUM(u.requests), 0) as total_requests,
        COALESCE(SUM(u.tokens_used), 0) as total_tokens,
        COALESCE(SUM(u.credits_used), 0) as total_credits,
        COALESCE(SUM(u.cost), 0) as total_cost
      FROM usage_logs u
      LEFT JOIN api_services a ON u.api_id = a.id
      WHERE u.user_id = ?
      GROUP BY u.api_id
    `).all(userId);

    return rows.map((r: any) => ({
      api_id: r.api_id,
      provider: r.provider,
      name: r.name,
      total_requests: Number(r.total_requests),
      total_tokens: Number(r.total_tokens),
      total_credits: Number(r.total_credits),
      total_cost: Number(r.total_cost),
    }));
  }

  async trackTelemetry(params: {
    provider: string;
    tokens_used: number;
    requests: number;
    cost: number;
    user_id?: string | null;
  }) {
    // Find or fallback to the first active user
    let userId = params.user_id;
    if (!userId) {
      const u: any = this.db.prepare('SELECT id FROM users LIMIT 1').get();
      userId = u?.id;
    }
    if (!userId) throw new Error('No user available for telemetry recording');

    // Find or create API service for provider
    let api: any = this.db.prepare(`
      SELECT id FROM api_services 
      WHERE user_id = ? AND LOWER(provider) = LOWER(?) 
      LIMIT 1
    `).get(userId, params.provider);

    if (!api) {
      const apiId = crypto.randomUUID();
      const now = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO api_services (id, user_id, provider, name, category, environment, status, token_limit, tokens_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'AI', 'development', 'active', 1000000, 0, ?, ?)
      `).run(apiId, userId, params.provider, `${params.provider} Telemetry Service`, now, now);
      api = { id: apiId };
    }

    const today = new Date().toISOString().split('T')[0];
    return this.upsert({
      user_id: userId,
      api_id: api.id,
      date: today,
      requests: params.requests,
      tokens_used: params.tokens_used,
      credits_used: params.cost,
      cost: params.cost,
    });
  }
}
