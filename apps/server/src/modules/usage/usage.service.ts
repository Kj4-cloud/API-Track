import { UsageRepository } from './usage.repository.js';

export class UsageService {
  private repo = new UsageRepository();

  async getUserUsage(userId: string, startDate?: string, endDate?: string) {
    return this.repo.findAllByUser(userId, startDate, endDate);
  }

  async getUsageByApi(apiId: string, userId: string) {
    return this.repo.findByApiAndUser(apiId, userId);
  }

  async getAggregatedByApi(userId: string) {
    return this.repo.getAggregatedByApi(userId);
  }

  async recordUsage(userId: string, data: any) {
    const payload = {
      user_id: userId,
      api_id: data.api_id,
      date: data.date,
      requests: data.requests || 0,
      tokens_used: data.tokens_used || 0,
      credits_used: data.credits_used || 0,
      cost: data.cost || 0,
    };
    return this.repo.upsert(payload);
  }

  async deleteUsage(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }

  async trackTelemetry(params: {
    provider: string;
    tokens_used: number;
    requests: number;
    cost: number;
  }) {
    return this.repo.trackTelemetry(params);
  }
}
