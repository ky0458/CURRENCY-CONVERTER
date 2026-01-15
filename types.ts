
export interface Currency {
  code: string;
  name: string;
  flag: string; // Emoji flag or image url
  locale: string; // e.g., 'vi-VN', 'en-US'
}

export interface ConversionResult {
  convertedAmount: number;
  exchangeRate: number;
  textSource: string; // Text representation in source language
  textTarget: string; // Text representation in target language
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: number;
  inputAmount: number; // This is Fee/Salary depending on type
  fromCurrency: Currency;
  toCurrency: Currency;
  convertedAmount: number; // This is Result/Net Income
  type: 'convert' | 'calculate' | 'revenue'; 
  originalSalary?: number; // Only for 'calculate' type
  revenueDetails?: {
      shareType: 'all' | 'cv' | 'job';
      stageRevenue: number;
      totalRevenue: number;
  };
}

export interface RevenueRecord {
  id: string;
  timestamp: number;
  inputSalary: number;
  shareType: 'all' | 'cv' | 'job';
  totalRevenue: number;
  netIncome: number;
  tagId?: string | null; // Deprecated but kept for backward compatibility
  badgeColor?: string; // New field for custom badge color
  note?: string; // Short note text
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ThemeColor = string;

// --- NOTES SYSTEM TYPES ---

export type NoteStatus = 'incomplete' | 'completed' | 'attention' | 'skipped';

export interface NoteTag {
  id: string;
  name: string;
  color: string; // hex string
  isPinned?: boolean; // New property for pinning
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
  status: NoteStatus;
  tagId: string | null; // One tag per note for simplicity in filtering
  reminderTime?: number;
}
