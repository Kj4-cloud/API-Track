import { SubscriptionsRepository } from './subscriptions.repository.js';

export class SubscriptionsService {
  private repo = new SubscriptionsRepository();

  async getUserSubscriptions(userId: string) {
    return this.repo.findAllByUser(userId);
  }

  async getSubscriptionDetail(id: string, userId: string) {
    return this.repo.findByIdAndUser(id, userId);
  }

  async createSubscription(userId: string, data: any) {
    const payload = {
      user_id: userId,
      api_id: data.api_id || null,
      plan_name: data.plan_name,
      price: data.price,
      currency: data.currency || 'USD',
      billing_cycle: data.billing_cycle || 'monthly',
      start_date: data.start_date,
      renewal_date: data.renewal_date || null,
      auto_renew: data.auto_renew ?? true,
      payment_method: data.payment_method || null,
    };
    return this.repo.create(payload);
  }

  async updateSubscription(id: string, userId: string, data: any) {
    return this.repo.update(id, userId, data);
  }

  async deleteSubscription(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }
}
