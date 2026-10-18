import { getDatabase } from '../../config/database.js';

export class AnalyticsService {
  private get db() {
    return getDatabase();
  }

  async getDashboardSummary(userId: string) {
    // 1. Fetch APIs count
    const apiCountRow: any = this.db
      .prepare('SELECT COUNT(*) as count FROM api_services WHERE user_id = ?')
      .get(userId);
    const totalApis = apiCountRow?.count || 0;

    // 2. Fetch Subscriptions
    const subs: any[] = this.db
      .prepare('SELECT * FROM subscriptions WHERE user_id = ?')
      .all(userId);

    const activeSubs = subs.filter((s) => s.status === 'active');
    const monthlySpend = activeSubs.reduce((acc, sub) => {
      const p = Number(sub.price || 0);
      if (sub.billing_cycle === 'monthly') return acc + p;
      if (sub.billing_cycle === 'yearly') return acc + p / 12;
      if (sub.billing_cycle === 'quarterly') return acc + p / 3;
      return acc;
    }, 0);

    // 3. Fetch Usage stats
    const usageStatsRow: any = this.db
      .prepare(`
        SELECT 
          COUNT(*) as log_count,
          COALESCE(SUM(tokens_used), 0) as total_tokens,
          COALESCE(SUM(requests), 0) as total_requests,
          COALESCE(SUM(cost), 0) as total_cost
        FROM usage_logs 
        WHERE user_id = ?
      `)
      .get(userId);

    // 4. Upcoming renewals in next 7 days
    const upcomingRenewalsRow: any = this.db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM subscriptions 
        WHERE user_id = ? 
          AND status = 'active'
          AND renewal_date IS NOT NULL
          AND date(renewal_date) >= date('now')
          AND date(renewal_date) <= date('now', '+7 days')
      `)
      .get(userId);

    return {
      totalApis,
      activeSubscriptions: activeSubs.length,
      monthlySpend: Math.round(monthlySpend * 100) / 100,
      totalUsageEntries: usageStatsRow?.log_count || 0,
      totalTokensUsed: Number(usageStatsRow?.total_tokens || 0),
      totalRequests: Number(usageStatsRow?.total_requests || 0),
      totalCost: Math.round(Number(usageStatsRow?.total_cost || 0) * 100) / 100,
      upcomingRenewals: upcomingRenewalsRow?.count || 0,
    };
  }
}
