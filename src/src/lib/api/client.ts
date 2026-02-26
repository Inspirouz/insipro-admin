// API Client Interface

import type { App, Screen, TaxonomyItem, TaxonomyType, Scenario, User, AuthUser } from '../types';

export interface ApiClient {
  // Auth
  login(email: string, password: string): Promise<{ token: string; user: AuthUser }>;
  logout(): Promise<void>;
  me(): Promise<AuthUser>;

  // Apps
  listApps(params?: { search?: string; categoryId?: string }): Promise<App[]>;
  getApp(id: string): Promise<App>;
  createApp(data: Omit<App, 'id' | 'createdAt'>): Promise<App>;
  updateApp(id: string, data: Partial<Omit<App, 'id' | 'createdAt'>>): Promise<App>;
  deleteApp(id: string): Promise<void>;

  // Screens
  listScreens(params: { appId: string; categoryId?: string; search?: string }): Promise<Screen[]>;
  listAllScreens(params?: { 
    appId?: string; 
    categoryId?: string; 
    scenarioId?: string;
    uiElementId?: string;
    patternId?: string;
    search?: string 
  }): Promise<Screen[]>;
  getScreen(id: string): Promise<Screen>;
  createScreen(data: Omit<Screen, 'id' | 'createdAt'>): Promise<Screen>;
  updateScreen(id: string, data: Partial<Omit<Screen, 'id' | 'createdAt'>>): Promise<Screen>;
  deleteScreen(id: string): Promise<void>;

  // Taxonomy
  listTaxonomy(type: TaxonomyType, search?: string): Promise<TaxonomyItem[]>;
  createTaxonomy(type: TaxonomyType, name: string): Promise<TaxonomyItem>;
  updateTaxonomy(id: string, name: string): Promise<TaxonomyItem>;
  deleteTaxonomy(id: string): Promise<void>;

  // Scenarios
  listScenarios(search?: string): Promise<Scenario[]>;
  createScenario(name: string, parentId?: string): Promise<Scenario>;

  // Users
  listUsers(params?: { search?: string; status?: string }): Promise<User[]>;
  updateUser(id: string, data: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<User>;

  // Upload
  uploadImage(file: File): Promise<string>;
}
