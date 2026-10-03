import { supabase } from './supabase';
import type { UsageLog, UsageLogFormData } from '../types';

export const usageService = {
  async getAll(): Promise<UsageLog[]> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, api_service:api_services(id, provider, name, category)')
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByApiId(apiId: string): Promise<UsageLog[]> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('api_id', apiId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByDateRange(startDate: string, endDate: string): Promise<UsageLog[]> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, api_service:api_services(id, provider, name, category)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(userId: string, formData: UsageLogFormData): Promise<UsageLog> {
    const { data, error } = await supabase
      .from('usage_logs')
      .upsert({
        user_id: userId,
        api_id: formData.api_id,
        date: formData.date,
        requests: formData.requests || 0,
        tokens_used: formData.tokens_used || 0,
        credits_used: formData.credits_used || 0,
        cost: formData.cost || 0,
      }, { onConflict: 'api_id,user_id,date' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('usage_logs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getAggregatedByApi(userId: string): Promise<Array<{
    api_id: string;
    provider: string;
    name: string;
    total_requests: number;
    total_tokens: number;
    total_credits: number;
    total_cost: number;
  }>> {
    const { data, error } = await supabase
      .rpc('get_usage_summary_by_api', { p_user_id: userId });
    
    // If RPC doesn't exist, fallback to client-side aggregation
    if (error) {
      const logs = await this.getAll();
      const grouped = new Map<string, {
        api_id: string;
        provider: string;
        name: string;
        total_requests: number;
        total_tokens: number;
        total_credits: number;
        total_cost: number;
      }>();

      for (const log of logs) {
        const existing = grouped.get(log.api_id);
        if (existing) {
          existing.total_requests += log.requests;
          existing.total_tokens += log.tokens_used;
          existing.total_credits += log.credits_used;
          existing.total_cost += log.cost;
        } else {
          grouped.set(log.api_id, {
            api_id: log.api_id,
            provider: log.api_service?.provider || 'Unknown',
            name: log.api_service?.name || 'Unknown',
            total_requests: log.requests,
            total_tokens: log.tokens_used,
            total_credits: log.credits_used,
            total_cost: log.cost,
          });
        }
      }

      return Array.from(grouped.values());
    }
    return data || [];
  },
};
