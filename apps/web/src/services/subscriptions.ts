import { apiRequest } from './api-client';
import type { Subscription, SubscriptionFormData } from '../types';

export const subscriptionsService = {
  async getAll(): Promise<Subscription[]> {
    return apiRequest<Subscription[]>('/subscriptions');
  },

  async getById(id: string): Promise<Subscription> {
    return apiRequest<Subscription>(`/subscriptions/${id}`);
  },

  async getUpcoming(days = 30): Promise<Subscription[]> {
    return apiRequest<Subscription[]>(`/subscriptions/upcoming?days=${days}`);
  },

  async create(userId: string, formData: SubscriptionFormData): Promise<Subscription> {
    return apiRequest<Subscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        user_id: userId,
      }),
    });
  },

  async update(id: string, formData: Partial<SubscriptionFormData>): Promise<Subscription> {
    return apiRequest<Subscription>(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(formData),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/subscriptions/${id}`, {
      method: 'DELETE',
    });
  },

  async search(query: string): Promise<Subscription[]> {
    return apiRequest<Subscription[]>(`/subscriptions?query=${encodeURIComponent(query)}`);
  },
};
