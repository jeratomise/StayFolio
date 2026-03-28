export interface Stay {
  id: string;
  userId?: string;     // ID of the user who owns this stay
  userEmail?: string;  // Email of the user who owns this stay
  hotelName: string;
  brand: string;
  country: string;
  checkInDate: string; // ISO date string YYYY-MM-DD
  checkOutDate: string; // ISO date string YYYY-MM-DD
  notes?: string;
  cost?: number; // Total cost of stay in default currency
  rating?: number; // 1 to 5 stars
  createdAt: number;
}

export interface BrandGroup {
  brand: string;
  count: number;
  stays: Stay[];
}

export type ViewMode = 'dashboard' | 'portfolio' | 'share' | 'status' | 'profile' | 'admin_users' | 'concierge' | 'campaigns';

export interface StatSummary {
  totalStays: number;
  totalNights: number;
  uniqueBrands: number;
  topBrand: string;
  thisYearStays: number;
}

export interface EliteRequirement {
  nights?: number;
  stays?: number;
  spendUSD?: number;
  points?: number;
  description?: string;
}

export interface EliteTier {
  name: string;
  requirements: EliteRequirement;
  rank: number; // 1 is highest
}

export interface ProgramInfo {
  id: string;
  name: string;
  color: string;
  tiers: EliteTier[];
}

export interface UserSummary {
  userId: string;
  email: string;
  totalStays: number;
  lastActive: string;
  subscription?: Subscription;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Subscription {
  userId: string;
  status: 'free' | 'pro';
  expiresAt: string | null; // ISO Date string
  stripeCustomerId?: string;
}

export interface AppConfig {
  stripeEnabled: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  grantDays: number;
  isSingleUse: boolean;
  maxUses: number | null;
  timesUsed: number;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PromoRedemption {
  id: string;
  codeId: string;
  userId: string;
  redeemedAt: string;
  code?: string;
  userEmail?: string;
}