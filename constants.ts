
import { Currency, ThemeColor } from './types';

// Helper to get flag URL
const getFlagUrl = (countryCode: string) => `https://flagcdn.com/w80/${countryCode}.png`;

export const POPULAR_CURRENCIES: Currency[] = [
  { code: 'CNY', name: 'Chinese Yuan', flag: getFlagUrl('cn'), locale: 'zh-CN' },
  { code: 'VND', name: 'Vietnam Dong', flag: getFlagUrl('vn'), locale: 'vi-VN' },
  { code: 'USD', name: 'US Dollar', flag: getFlagUrl('us'), locale: 'en-US' },
  { code: 'EUR', name: 'Euro', flag: getFlagUrl('eu'), locale: 'en-IE' }, 
  { code: 'JPY', name: 'Japanese Yen', flag: getFlagUrl('jp'), locale: 'ja-JP' },
  { code: 'KRW', name: 'South Korean Won', flag: getFlagUrl('kr'), locale: 'ko-KR' },
  { code: 'GBP', name: 'British Pound', flag: getFlagUrl('gb'), locale: 'en-GB' },
  { code: 'AUD', name: 'Australian Dollar', flag: getFlagUrl('au'), locale: 'en-AU' },
  { code: 'CAD', name: 'Canadian Dollar', flag: getFlagUrl('ca'), locale: 'en-CA' },
  { code: 'SGD', name: 'Singapore Dollar', flag: getFlagUrl('sg'), locale: 'en-SG' },
  { code: 'THB', name: 'Thai Baht', flag: getFlagUrl('th'), locale: 'th-TH' },
  { code: 'TWD', name: 'New Taiwan Dollar', flag: getFlagUrl('tw'), locale: 'zh-TW' },
];

export const LANGUAGE_FLAGS: Record<string, string> = {
    'vi': getFlagUrl('vn'),
    'en': getFlagUrl('us'), // or gb
    'zh-CN': getFlagUrl('cn'),
    'ja': getFlagUrl('jp'),
    'ko': getFlagUrl('kr'),
    'fr': getFlagUrl('fr'),
    'de': getFlagUrl('de'),
    'ru': getFlagUrl('ru'),
    'auto': 'https://cdn-icons-png.flaticon.com/512/5602/5602732.png' // Generic globe/detect icon
};

export const DEFAULT_SOURCE_CURRENCY = POPULAR_CURRENCIES[1]; // VND
export const DEFAULT_TARGET_CURRENCY = POPULAR_CURRENCIES[0]; // CNY

export const DENOMINATIONS: Record<string, number[]> = {
  'VND': [50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000],
  'CNY': [100, 200, 500, 1000, 2000, 5000, 10000],
  'USD': [10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
  'EUR': [10, 20, 50, 100, 200, 500, 1000],
  'JPY': [1000, 5000, 10000, 50000, 100000],
  'KRW': [10000, 50000, 100000, 500000, 1000000],
  'DEFAULT': [10, 50, 100, 500, 1000, 5000]
};

export const THEME_COLORS: { id: ThemeColor; name: string; hex: string }[] = [
  { id: 'blue', name: 'Xanh Dương', hex: '#2563eb' },
  { id: 'emerald', name: 'Xanh Ngọc', hex: '#059669' },
  { id: 'rose', name: 'Đỏ Hồng', hex: '#e11d48' },
  { id: 'violet', name: 'Tím', hex: '#7c3aed' },
  { id: 'amber', name: 'Vàng Cam', hex: '#d97706' },
  { id: 'cyan', name: 'Xanh Biển', hex: '#0891b2' },
];
