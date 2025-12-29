import { Currency } from './types';

// Helper to get flag URL
const getFlagUrl = (countryCode: string) => `https://flagcdn.com/w80/${countryCode}.png`;

export const POPULAR_CURRENCIES: Currency[] = [
  { code: 'VND', name: 'Vietnam Dong', flag: getFlagUrl('vn'), locale: 'vi-VN' },
  { code: 'USD', name: 'US Dollar', flag: getFlagUrl('us'), locale: 'en-US' },
  { code: 'EUR', name: 'Euro', flag: getFlagUrl('eu'), locale: 'en-IE' }, 
  { code: 'JPY', name: 'Japanese Yen', flag: getFlagUrl('jp'), locale: 'ja-JP' },
  { code: 'KRW', name: 'South Korean Won', flag: getFlagUrl('kr'), locale: 'ko-KR' },
  { code: 'GBP', name: 'British Pound', flag: getFlagUrl('gb'), locale: 'en-GB' },
  { code: 'CNY', name: 'Chinese Yuan', flag: getFlagUrl('cn'), locale: 'zh-CN' },
  { code: 'AUD', name: 'Australian Dollar', flag: getFlagUrl('au'), locale: 'en-AU' },
  { code: 'CAD', name: 'Canadian Dollar', flag: getFlagUrl('ca'), locale: 'en-CA' },
  { code: 'SGD', name: 'Singapore Dollar', flag: getFlagUrl('sg'), locale: 'en-SG' },
  { code: 'THB', name: 'Thai Baht', flag: getFlagUrl('th'), locale: 'th-TH' },
  { code: 'TWD', name: 'New Taiwan Dollar', flag: getFlagUrl('tw'), locale: 'zh-TW' },
];

export const DEFAULT_SOURCE_CURRENCY = POPULAR_CURRENCIES[0]; // VND
export const DEFAULT_TARGET_CURRENCY = POPULAR_CURRENCIES[1]; // USD