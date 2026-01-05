
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
  inputAmount: number; // This is the Fee when type is 'calculate'
  fromCurrency: Currency;
  toCurrency: Currency;
  convertedAmount: number;
  type: 'convert' | 'calculate'; // Distinguish between tabs
  originalSalary?: number; // Only for 'calculate' type
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ThemeColor = string;