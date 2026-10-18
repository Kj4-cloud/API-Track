import { apiRequest } from './api-client';
import type { UsageLog, UsageLogFormData } from '../types';

export const usageService = {
  async getAll(): Promise<UsageLog[]> {
    return apiRequest<UsageLog[]>('/usage');
  },

  async getByApiId(apiId: string): Promise<UsageLog[]> {
    return apiRequest<UsageLog[]>(`/usage/api/${apiId}`);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<UsageLog[]> {
    return apiRequest<UsageLog[]>(`/usage?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
  },

  async create(userId: string, formData: UsageLogFormData): Promise<UsageLog> {
    return apiRequest<UsageLog>('/usage', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        user_id: userId,
      }),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/usage/${id}`, {
      method: 'DELETE',
    });
  },

  async getAggregatedByApi(_userId?: string): Promise<Array<{
    api_id: string;
    provider: string;
    name: string;
    total_requests: number;
    total_tokens: number;
    total_credits: number;
    total_cost: number;
  }>> {
    return apiRequest<Array<{
      api_id: string;
      provider: string;
      name: string;
      total_requests: number;
      total_tokens: number;
      total_credits: number;
      total_cost: number;
    }>>('/usage/aggregated');
  },
};
