import { supabase } from '../../config/supabase.js';

export class UsageRepository {
  async findAllByUser(userId: string) {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, api_service:api_services(id, provider, name, category)')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findByApiAndUser(apiId: string, userId: string) {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('api_id', apiId)
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async upsert(payload: any) {
    const { data, error } = await supabase
      .from('usage_logs')
      .upsert(payload, { onConflict: 'api_id,user_id,date' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('usage_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
