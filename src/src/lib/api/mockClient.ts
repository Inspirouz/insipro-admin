// Mock API Client Implementation

import type { ApiClient } from './client';
import type { App, Screen, TaxonomyItem, TaxonomyType, Scenario, User, AuthUser } from '../types';

class MockApiClient implements ApiClient {
  private apps: App[] = [];
  private screens: Screen[] = [];
  private taxonomy: TaxonomyItem[] = [];
  private scenarios: Scenario[] = [];
  private users: User[] = [];
  private currentUser: AuthUser | null = null;

  constructor() {
    this.initMockData();
  }

  private initMockData() {
    // App Categories
    const appCategories: TaxonomyItem[] = [
      { id: 'cat-1', name: 'Финансы', type: 'appCategory', screens_count:0 },
      { id: 'cat-2', name: 'Социальные сети', type: 'appCategory',screens_count:0 },
      { id: 'cat-3', name: 'E-commerce', type: 'appCategory', screens_count:0 },
      { id: 'cat-4', name: 'Продуктивность', type: 'appCategory', screens_count:0 },
    ];

    // Screen Categories
    const screenCategories: TaxonomyItem[] = [
      { id: 'scat-1', name: 'Онбординг', type: 'screenCategory' },
      { id: 'scat-2', name: 'Авторизация', type: 'screenCategory' },
      { id: 'scat-3', name: 'Главная', type: 'screenCategory' },
      { id: 'scat-4', name: 'Профиль', type: 'screenCategory' },
      { id: 'scat-5', name: 'Настройки', type: 'screenCategory' },
    ];

    // UI Elements
    const uiElements: TaxonomyItem[] = [
      { id: 'ui-1', name: 'Кнопки', type: 'uiElement' },
      { id: 'ui-2', name: 'Формы', type: 'uiElement' },
      { id: 'ui-3', name: 'Карточки', type: 'uiElement' },
      { id: 'ui-4', name: 'Навигация', type: 'uiElement' },
      { id: 'ui-5', name: 'Модальные окна', type: 'uiElement' },
    ];

    // Patterns
    const patterns: TaxonomyItem[] = [
      { id: 'pat-1', name: 'Пустое состояние', type: 'pattern' },
      { id: 'pat-2', name: 'Загрузка', type: 'pattern' },
      { id: 'pat-3', name: 'Поиск', type: 'pattern' },
      { id: 'pat-4', name: 'Фильтры', type: 'pattern' },
    ];

    this.taxonomy = [...appCategories, ...screenCategories, ...uiElements, ...patterns];

    // Scenarios (tree)
    this.scenarios = [
      { id: 'sc-1', name: 'Регистрация' },
      { id: 'sc-1-1', name: 'Email регистрация', parentId: 'sc-1' },
      { id: 'sc-1-2', name: 'Social регистрация', parentId: 'sc-1' },
      { id: 'sc-2', name: 'Авторизация' },
      { id: 'sc-2-1', name: 'Email вход', parentId: 'sc-2' },
      { id: 'sc-2-2', name: 'Восстановление пароля', parentId: 'sc-2' },
      { id: 'sc-3', name: 'Профиль пользователя' },
      { id: 'sc-3-1', name: 'Редактирование профиля', parentId: 'sc-3' },
      { id: 'sc-3-2', name: 'Настройки приватности', parentId: 'sc-3' },
    ];

    // Mock Apps
    this.apps = [
      {
        id: 'app-1',
        name: 'Uzum bank',
        description: 'Современное банковское приложение с удобным интерфейсом',
        iconUrl: 'https://via.placeholder.com/80/7c3aed/ffffff?text=U',
        previewUrls: [
          'https://via.placeholder.com/300x600/1e293b/ffffff?text=Screen+1',
          'https://via.placeholder.com/300x600/1e293b/ffffff?text=Screen+2',
          'https://via.placeholder.com/300x600/1e293b/ffffff?text=Screen+3',
        ],
        categoryId: 'cat-1',
        platforms: ['ios', 'android'],
        createdAt: new Date('2024-01-15'),
      },
      {
        id: 'app-2',
        name: 'Uniapp',
        description: 'Универсальное приложение для повседневных задач',
        iconUrl: 'https://via.placeholder.com/80/3b82f6/ffffff?text=Un',
        previewUrls: [
          'https://via.placeholder.com/300x600/1e293b/ffffff?text=Preview+1',
          'https://via.placeholder.com/300x600/1e293b/ffffff?text=Preview+2',
        ],
        categoryId: 'cat-2',
        platforms: ['ios', 'android', 'web'],
        createdAt: new Date('2024-02-01'),
      },
    ];

    // Mock Screens
    this.screens = [
      {
        id: 'scr-1',
        appId: 'app-1',
        imageUrl: 'https://via.placeholder.com/300x600/1e293b/ffffff?text=Onboarding',
        categoryId: 'scat-1',
        scenarioIds: ['sc-1-1'],
        uiElementIds: ['ui-1', 'ui-3'],
        patternIds: ['pat-1'],
        createdAt: new Date('2024-01-16'),
      },
      {
        id: 'scr-2',
        appId: 'app-1',
        imageUrl: 'https://via.placeholder.com/300x600/1e293b/ffffff?text=Login',
        categoryId: 'scat-2',
        scenarioIds: ['sc-2-1'],
        uiElementIds: ['ui-1', 'ui-2'],
        patternIds: [],
        createdAt: new Date('2024-01-17'),
      },
      {
        id: 'scr-3',
        appId: 'app-1',
        imageUrl: 'https://via.placeholder.com/300x600/1e293b/ffffff?text=Home',
        categoryId: 'scat-3',
        scenarioIds: [],
        uiElementIds: ['ui-3', 'ui-4'],
        patternIds: ['pat-3'],
        createdAt: new Date('2024-01-18'),
      },
    ];

    // Mock Users
    this.users = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        subscriptionStatus: 'active',
        plan: 'Pro',
        periodEnd: new Date('2025-01-15'),
        createdAt: new Date('2023-06-01'),
      },
      {
        id: 'user-2',
        email: 'user@example.com',
        name: 'Regular User',
        subscriptionStatus: 'trial',
        plan: 'Trial',
        periodEnd: new Date('2024-02-15'),
        createdAt: new Date('2024-01-15'),
      },
      {
        id: 'user-3',
        email: 'expired@example.com',
        subscriptionStatus: 'expired',
        createdAt: new Date('2023-01-01'),
      },
    ];
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    await this.delay(300);
    if (!email || !password) {
      throw new Error('Invalid credentials');
    }
    const user: AuthUser = { id: 'auth-1', email, name: 'Admin User' };
    this.currentUser = user;
    return { token: 'mock-token-' + Date.now(), user };
  }

  async logout(): Promise<void> {
    await this.delay(100);
    this.currentUser = null;
  }

  async me(): Promise<AuthUser> {
    await this.delay(100);
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }
    return this.currentUser;
  }

  // Apps
  async listApps(params?: { search?: string; categoryId?: string }): Promise<App[]> {
    await this.delay(200);
    let result = [...this.apps];
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(app => 
        app.name.toLowerCase().includes(search) ||
        app.description.toLowerCase().includes(search)
      );
    }
    
    if (params?.categoryId) {
      result = result.filter(app => app.categoryId === params.categoryId);
    }
    
    return result;
  }

  async getApp(id: string): Promise<App> {
    await this.delay(100);
    const app = this.apps.find(a => a.id === id);
    if (!app) throw new Error('App not found');
    return app;
  }

  async createApp(data: Omit<App, 'id' | 'createdAt'>): Promise<App> {
    await this.delay(300);
    const app: App = {
      ...data,
      id: 'app-' + Date.now(),
      createdAt: new Date(),
    };
    this.apps.push(app);
    return app;
  }

  async updateApp(id: string, data: Partial<Omit<App, 'id' | 'createdAt'>>): Promise<App> {
    await this.delay(300);
    const index = this.apps.findIndex(a => a.id === id);
    if (index === -1) throw new Error('App not found');
    this.apps[index] = { ...this.apps[index], ...data };
    return this.apps[index];
  }

  async deleteApp(id: string): Promise<void> {
    await this.delay(200);
    this.apps = this.apps.filter(a => a.id !== id);
    this.screens = this.screens.filter(s => s.appId !== id);
  }

  // Screens
  async listScreens(params: { appId: string; categoryId?: string; search?: string }): Promise<Screen[]> {
    await this.delay(200);
    let result = this.screens.filter(s => s.appId === params.appId);
    
    if (params.categoryId) {
      result = result.filter(s => s.categoryId === params.categoryId);
    }
    
    return result;
  }

  async listAllScreens(params?: { 
    appId?: string; 
    categoryId?: string; 
    scenarioId?: string;
    uiElementId?: string;
    patternId?: string;
    search?: string 
  }): Promise<Screen[]> {
    await this.delay(200);
    let result = [...this.screens];
    
    if (params?.appId) {
      result = result.filter(s => s.appId === params.appId);
    }
    
    if (params?.categoryId) {
      result = result.filter(s => s.categoryId === params.categoryId);
    }
    
    if (params?.scenarioId) {
      result = result.filter(s => s.scenarioIds.includes(params.scenarioId!));
    }
    
    if (params?.uiElementId) {
      result = result.filter(s => s.uiElementIds.includes(params.uiElementId!));
    }
    
    if (params?.patternId) {
      result = result.filter(s => s.patternIds.includes(params.patternId!));
    }
    
    return result;
  }

  async getScreen(id: string): Promise<Screen> {
    await this.delay(100);
    const screen = this.screens.find(s => s.id === id);
    if (!screen) throw new Error('Screen not found');
    return screen;
  }

  async createScreen(data: Omit<Screen, 'id' | 'createdAt'>): Promise<Screen> {
    await this.delay(300);
    const screen: Screen = {
      ...data,
      id: 'scr-' + Date.now(),
      createdAt: new Date(),
    };
    this.screens.push(screen);
    return screen;
  }

  async updateScreen(id: string, data: Partial<Omit<Screen, 'id' | 'createdAt'>>): Promise<Screen> {
    await this.delay(300);
    const index = this.screens.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Screen not found');
    this.screens[index] = { ...this.screens[index], ...data };
    return this.screens[index];
  }

  async deleteScreen(id: string): Promise<void> {
    await this.delay(200);
    this.screens = this.screens.filter(s => s.id !== id);
  }

  // Taxonomy
  async listTaxonomy(type: TaxonomyType, search?: string): Promise<TaxonomyItem[]> {
    await this.delay(100);
    let result = this.taxonomy.filter(t => t.type === type);
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(searchLower));
    }
    
    return result;
  }

  async createTaxonomy(type: TaxonomyType, name: string): Promise<TaxonomyItem> {
    await this.delay(200);
    const item: TaxonomyItem = {
      id: type + '-' + Date.now(),
      name,
      type,
    };
    this.taxonomy.push(item);
    return item;
  }

  async updateTaxonomy(id: string, name: string): Promise<TaxonomyItem> {
    await this.delay(200);
    const index = this.taxonomy.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Taxonomy item not found');
    this.taxonomy[index].name = name;
    return this.taxonomy[index];
  }

  async deleteTaxonomy(id: string): Promise<void> {
    await this.delay(200);
    this.taxonomy = this.taxonomy.filter(t => t.id !== id);
  }

  // Scenarios
  async listScenarios(search?: string): Promise<Scenario[]> {
    await this.delay(100);
    let result = [...this.scenarios];
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(searchLower));
    }
    
    return result;
  }

  async createScenario(name: string, parentId?: string): Promise<Scenario> {
    await this.delay(200);
    const scenario: Scenario = {
      id: 'sc-' + Date.now(),
      name,
      parentId,
    };
    this.scenarios.push(scenario);
    return scenario;
  }

  // Users
  async listUsers(params?: { search?: string; status?: string }): Promise<User[]> {
    await this.delay(200);
    let result = [...this.users];
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(u => 
        u.email.toLowerCase().includes(search) ||
        u.name?.toLowerCase().includes(search)
      );
    }
    
    if (params?.status) {
      result = result.filter(u => u.subscriptionStatus === params.status);
    }
    
    return result;
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<User> {
    await this.delay(300);
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    this.users[index] = { ...this.users[index], ...data };
    return this.users[index];
  }

  // Upload
  async uploadImage(file: File): Promise<string> {
    await this.delay(500);
    // TODO: Replace with presigned URL upload to S3/R2/MinIO
    return URL.createObjectURL(file);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockClient = new MockApiClient();
