import { ApiRepository } from './api.repository.js';

export class ApiService {
  private repo = new ApiRepository();

  async getUserApis(userId: string) {
    return this.repo.findAllByUser(userId);
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
      api_key_encrypted: data.api_key || null,
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
    if (data.token_limit !== undefined) updateData.token_limit = data.token_limit;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    return this.repo.update(id, userId, updateData);
  }

  async deleteApi(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }
}
