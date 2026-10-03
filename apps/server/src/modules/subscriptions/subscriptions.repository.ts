import { supabase } from '../../config/supabase.js';

export class SubscriptionsRepository {
  async findAllByUser(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, api_service:api_services(*)')
      .eq('user_id', userId)
      .order('renewal_date', { ascending: true });
    if (error) throw error;
    return data;
  }

  async findByIdAndUser(id: string, userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, api_service:api_services(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async create(payload: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(payload)
      .select('*, api_service:api_services(*)')
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, payload: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, api_service:api_services(*)')
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
