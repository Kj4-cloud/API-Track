import { apiRequest } from './api-client';
import type { ApiService, ApiServiceFormData } from '../types';

export const apiServicesService = {
  async getAll(): Promise<ApiService[]> {
    return apiRequest<ApiService[]>('/services');
  },

  async getById(id: string): Promise<ApiService> {
    return apiRequest<ApiService>(`/services/${id}`);
  },

  async create(userId: string, formData: ApiServiceFormData): Promise<ApiService> {
    return apiRequest<ApiService>('/services', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        user_id: userId,
      }),
    });
  },

  async update(id: string, formData: Partial<ApiServiceFormData>): Promise<ApiService> {
    return apiRequest<ApiService>(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(formData),
    });
  },

  async updateUsage(id: string, tokensUsed: number): Promise<void> {
    await apiRequest(`/services/${id}/usage`, {
      method: 'PATCH',
      body: JSON.stringify({ tokens_used: tokensUsed }),
    });
  },

  async updateStatus(id: string, status: ApiService['status']): Promise<void> {
    await apiRequest(`/services/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  async search(query: string): Promise<ApiService[]> {
    return apiRequest<ApiService[]>(`/services?query=${encodeURIComponent(query)}`);
  },
};
