import { ApiRepository } from './api.repository.js';

export class ApiService {
  private repo = new ApiRepository();

  async getUserApis(userId: string, query?: string) {
    return this.repo.findAllByUser(userId, query);
  }

  async getApiDetail(id: string, userId: string) {
    return this.repo.findByIdAndUser(id, userId);
  }

  async createApi(userId: string, data: any) {
    const payload = {
      user_id: userId,
      provider: data.provider,
      name: data.name,
      category: data.category,
      website: data.website || null,
      api_key_encrypted: data.api_key || data.api_key_encrypted || null,
      environment: data.environment || 'development',
      token_limit: data.token_limit || 0,
      notes: data.notes || null,
    };
    return this.repo.create(payload);
  }

  async updateApi(id: string, userId: string, data: any) {
    const updateData: Record<string, unknown> = {};
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.environment !== undefined) updateData.environment = data.environment;
    if (data.api_key !== undefined) updateData.api_key_encrypted = data.api_key;
    if (data.api_key_encrypted !== undefined) updateData.api_key_encrypted = data.api_key_encrypted;
    if (data.token_limit !== undefined) updateData.token_limit = data.token_limit;
    if (data.tokens_used !== undefined) updateData.tokens_used = data.tokens_used;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    return this.repo.update(id, userId, updateData);
  }

  async updateUsage(id: string, userId: string, tokensUsed: number) {
    return this.repo.updateUsage(id, userId, tokensUsed);
  }

  async updateStatus(id: string, userId: string, status: string) {
    return this.repo.updateStatus(id, userId, status);
  }

  async deleteApi(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }
}
