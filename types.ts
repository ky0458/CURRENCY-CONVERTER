
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
  inputAmount: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  convertedAmount: number;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ThemeColor = string;