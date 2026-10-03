import { supabase } from '../../config/supabase.js';

export class ApiRepository {
  async findAllByUser(userId: string) {
    const { data, error } = await supabase
      .from('api_services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findByIdAndUser(id: string, userId: string) {
    const { data, error } = await supabase
      .from('api_services')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async create(payload: any) {
    const { data, error } = await supabase
      .from('api_services')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, payload: any) {
    const { data, error } = await supabase
      .from('api_services')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('api_services')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
