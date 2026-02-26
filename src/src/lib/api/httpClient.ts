// HTTP API Client Implementation (placeholder for future)

import type { ApiClient } from './client';
import type { App, Screen, TaxonomyItem, TaxonomyType, Scenario, User, AuthUser } from '../types';

class HttpApiClient implements ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // TODO: Implement HTTP requests
    throw new Error('HTTP client not implemented yet');
  }

  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    // TODO: POST /auth/login
    throw new Error('Not implemented');
  }

  async logout(): Promise<void> {
    // TODO: POST /auth/logout
    throw new Error('Not implemented');
  }

  async me(): Promise<AuthUser> {
    // TODO: GET /auth/me
    throw new Error('Not implemented');
  }

  async listApps(params?: { search?: string; categoryId?: string }): Promise<App[]> {
    // TODO: GET /apps
    throw new Error('Not implemented');
  }

  async getApp(id: string): Promise<App> {
    // TODO: GET /apps/:id
    throw new Error('Not implemented');
  }

  async createApp(data: Omit<App, 'id' | 'createdAt'>): Promise<App> {
    // TODO: POST /apps
    throw new Error('Not implemented');
  }

  async updateApp(id: string, data: Partial<Omit<App, 'id' | 'createdAt'>>): Promise<App> {
    // TODO: PATCH /apps/:id
    throw new Error('Not implemented');
  }

  async deleteApp(id: string): Promise<void> {
    // TODO: DELETE /apps/:id
    throw new Error('Not implemented');
  }

  async listScreens(params: { appId: string; categoryId?: string; search?: string }): Promise<Screen[]> {
    // TODO: GET /screens
    throw new Error('Not implemented');
  }

  async listAllScreens(params?: any): Promise<Screen[]> {
    // TODO: GET /screens/all
    throw new Error('Not implemented');
  }

  async getScreen(id: string): Promise<Screen> {
    // TODO: GET /screens/:id
    throw new Error('Not implemented');
  }

  async createScreen(data: Omit<Screen, 'id' | 'createdAt'>): Promise<Screen> {
    // TODO: POST /screens
    throw new Error('Not implemented');
  }

  async updateScreen(id: string, data: Partial<Omit<Screen, 'id' | 'createdAt'>>): Promise<Screen> {
    // TODO: PATCH /screens/:id
    throw new Error('Not implemented');
  }

  async deleteScreen(id: string): Promise<void> {
    // TODO: DELETE /screens/:id
    throw new Error('Not implemented');
  }

  async listTaxonomy(type: TaxonomyType, search?: string): Promise<TaxonomyItem[]> {
    // TODO: GET /taxonomy
    throw new Error('Not implemented');
  }

  async createTaxonomy(type: TaxonomyType, name: string): Promise<TaxonomyItem> {
    // TODO: POST /taxonomy
    throw new Error('Not implemented');
  }

  async updateTaxonomy(id: string, name: string): Promise<TaxonomyItem> {
    // TODO: PATCH /taxonomy/:id
    throw new Error('Not implemented');
  }

  async deleteTaxonomy(id: string): Promise<void> {
    // TODO: DELETE /taxonomy/:id
    throw new Error('Not implemented');
  }

  async listScenarios(search?: string): Promise<Scenario[]> {
    // TODO: GET /scenarios
    throw new Error('Not implemented');
  }

  async createScenario(name: string, parentId?: string): Promise<Scenario> {
    // TODO: POST /scenarios
    throw new Error('Not implemented');
  }

  async listUsers(params?: { search?: string; status?: string }): Promise<User[]> {
    // TODO: GET /users
    throw new Error('Not implemented');
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<User> {
    // TODO: PATCH /users/:id
    throw new Error('Not implemented');
  }

  async uploadImage(file: File): Promise<string> {
    // TODO: POST /upload (get presigned URL and upload)
    throw new Error('Not implemented');
  }
}

export const httpClient = new HttpApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
