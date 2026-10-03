import { supabase } from './supabase';
import type { ApiService, ApiServiceFormData } from '../types';

export const apiServicesService = {
  async getAll(): Promise<ApiService[]> {
    const { data, error } = await supabase
      .from('api_services')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ApiService> {
    const { data, error } = await supabase
      .from('api_services')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(userId: string, formData: ApiServiceFormData): Promise<ApiService> {
    const { data, error } = await supabase
      .from('api_services')
      .insert({
        user_id: userId,
        provider: formData.provider,
        name: formData.name,
        category: formData.category,
        website: formData.website || null,
        api_key_encrypted: formData.api_key || null,
        environment: formData.environment,
        token_limit: formData.token_limit || 0,
        notes: formData.notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<ApiServiceFormData>): Promise<ApiService> {
    const updateData: Record<string, unknown> = {};
    if (formData.provider !== undefined) updateData.provider = formData.provider;
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.category !== undefined) updateData.category = formData.category;
    if (formData.website !== undefined) updateData.website = formData.website || null;
    if (formData.environment !== undefined) updateData.environment = formData.environment;
    if (formData.api_key !== undefined) updateData.api_key_encrypted = formData.api_key;
    if (formData.token_limit !== undefined) updateData.token_limit = formData.token_limit;
    if (formData.notes !== undefined) updateData.notes = formData.notes || null;

    const { data, error } = await supabase
      .from('api_services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateUsage(id: string, tokensUsed: number): Promise<void> {
    const { error } = await supabase
      .from('api_services')
      .update({ tokens_used: tokensUsed })
      .eq('id', id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: ApiService['status']): Promise<void> {
    const { error } = await supabase
      .from('api_services')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_services')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async search(query: string): Promise<ApiService[]> {
    const { data, error } = await supabase
      .from('api_services')
      .select('*')
      .or(`provider.ilike.%${query}%,name.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
