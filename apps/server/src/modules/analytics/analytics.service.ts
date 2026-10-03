import { supabase } from '../../config/supabase.js';

export class AnalyticsService {
  async getDashboardSummary(userId: string) {
    // 1. Fetch APIs count
    const { data: apis } = await supabase
      .from('api_services')
      .select('id, provider, category, status, token_limit, tokens_used, created_at')
      .eq('user_id', userId);

    // 2. Fetch Subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    // 3. Fetch Usage logs
    const { data: logs } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    const activeSubs = (subs || []).filter((s) => s.status === 'active');
    const monthlySpend = activeSubs.reduce((acc, sub) => {
      const p = Number(sub.price);
      if (sub.billing_cycle === 'monthly') return acc + p;
      if (sub.billing_cycle === 'yearly') return acc + p / 12;
      if (sub.billing_cycle === 'quarterly') return acc + p / 3;
      return acc;
    }, 0);

    return {
      totalApis: apis?.length || 0,
      activeSubscriptions: activeSubs.length,
      monthlySpend: Math.round(monthlySpend * 100) / 100,
      totalUsageEntries: logs?.length || 0,
    };
  }
}
