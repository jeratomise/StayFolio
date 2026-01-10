export interface Stay {
  id: string;
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

export type ViewMode = 'dashboard' | 'portfolio' | 'share' | 'status';

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