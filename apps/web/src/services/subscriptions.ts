import { supabase } from './supabase';
import type { Subscription, SubscriptionFormData } from '../types';

export const subscriptionsService = {
  async getAll(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, api_service:api_services(*)')
      .order('renewal_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, api_service:api_services(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getUpcoming(days = 30): Promise<Subscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, api_service:api_services(*)')
      .eq('status', 'active')
      .not('renewal_date', 'is', null)
      .lte('renewal_date', futureDate.toISOString().split('T')[0])
      .gte('renewal_date', new Date().toISOString().split('T')[0])
      .order('renewal_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(userId: string, formData: SubscriptionFormData): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        api_id: formData.api_id || null,
        plan_name: formData.plan_name,
        price: formData.price,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        start_date: formData.start_date,
        renewal_date: formData.renewal_date || null,
        auto_renew: formData.auto_renew,
        payment_method: formData.payment_method || null,
      })
      .select('*, api_service:api_services(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<SubscriptionFormData>): Promise<Subscription> {
    const updateData: Record<string, unknown> = {};
    if (formData.api_id !== undefined) updateData.api_id = formData.api_id || null;
    if (formData.plan_name !== undefined) updateData.plan_name = formData.plan_name;
    if (formData.price !== undefined) updateData.price = formData.price;
    if (formData.currency !== undefined) updateData.currency = formData.currency;
    if (formData.billing_cycle !== undefined) updateData.billing_cycle = formData.billing_cycle;
    if (formData.start_date !== undefined) updateData.start_date = formData.start_date;
    if (formData.renewal_date !== undefined) updateData.renewal_date = formData.renewal_date || null;
    if (formData.auto_renew !== undefined) updateData.auto_renew = formData.auto_renew;
    if (formData.payment_method !== undefined) updateData.payment_method = formData.payment_method || null;

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select('*, api_service:api_services(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async search(query: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, api_service:api_services(*)')
      .or(`plan_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
