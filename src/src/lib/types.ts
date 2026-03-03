// Core Types

export interface App {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  previewUrls: string[];
  categoryId: string;
  platforms: ('ios' | 'android' | 'web')[];
  createdAt: Date;
}

export interface Screen {
  id: string;
  appId: string;
  imageUrl: string;
  categoryId: string;
  scenarioIds: string[];
  uiElementIds: string[];
  patternIds: string[];
  createdAt: Date;
}

export type TaxonomyType = 'uiElement' | 'pattern' | 'appCategory' | 'screenCategory' | 'scenarioCategory';

export interface TaxonomyItem {
  id: string;
  name: string;
  screens_count?:number;
  type: TaxonomyType;
}

export interface Scenario {
  id: string;
  name: string;
  parentId?: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface User {
  id: string;
  email: string;
  name?: string;
  subscriptionStatus: SubscriptionStatus;
  plan?: string;
  periodEnd?: Date;
  createdAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}
