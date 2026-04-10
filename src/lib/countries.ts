// All countries we track in the MacroDashboard
export interface Country {
  code: string;
  name: string;
  region: string;
  flag: string;
}

export const ALL_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', region: 'Europe', flag: '🇩🇪' },
  { code: 'FR', name: 'France', region: 'Europe', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', region: 'Europe', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', region: 'Asia', flag: '🇯🇵' },
  { code: 'CA', name: 'Canada', region: 'North America', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', region: 'Oceania', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', region: 'South America', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', region: 'South America', flag: '🇦🇷' },
  { code: 'MX', name: 'Mexico', region: 'North America', flag: '🇲🇽' },
  { code: 'CN', name: 'China', region: 'Asia', flag: '🇨🇳' },
  { code: 'IN', name: 'India', region: 'Asia', flag: '🇮🇳' },
  { code: 'KR', name: 'South Korea', region: 'Asia', flag: '🇰🇷' },
  { code: 'ID', name: 'Indonesia', region: 'Asia', flag: '🇮🇩' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East', flag: '🇸🇦' },
  { code: 'TR', name: 'Turkey', region: 'Middle East', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', region: 'Europe/Asia', flag: '🇷🇺' },
  { code: 'ZA', name: 'South Africa', region: 'Africa', flag: '🇿🇦' },
  { code: 'SG', name: 'Singapore', region: 'Asia', flag: '🇸🇬' },
  { code: 'CH', name: 'Switzerland', region: 'Europe', flag: '🇨🇭' },
  { code: 'TH', name: 'Thailand', region: 'Asia', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', region: 'Asia', flag: '🇲🇾' },
  { code: 'AE', name: 'UAE', region: 'Middle East', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', region: 'Middle East', flag: '🇶🇦' },
  { code: 'IL', name: 'Israel', region: 'Middle East', flag: '🇮🇱' },
  { code: 'CL', name: 'Chile', region: 'South America', flag: '🇨🇱' },
  { code: 'NL', name: 'Netherlands', region: 'Europe', flag: '🇳🇱' },
  { code: 'ES', name: 'Spain', region: 'Europe', flag: '🇪🇸' },
  { code: 'VN', name: 'Vietnam', region: 'Asia', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', region: 'Asia', flag: '🇵🇭' },
  { code: 'EG', name: 'Egypt', region: 'Africa', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', region: 'Africa', flag: '🇳🇬' },
  { code: 'KW', name: 'Kuwait', region: 'Middle East', flag: '🇰🇼' },
  { code: 'NO', name: 'Norway', region: 'Europe', flag: '🇳🇴' },
  { code: 'SE', name: 'Sweden', region: 'Europe', flag: '🇸🇪' },
  { code: 'PL', name: 'Poland', region: 'Europe', flag: '🇵🇱' },
  { code: 'GR', name: 'Greece', region: 'Europe', flag: '🇬🇷' },
  { code: 'IE', name: 'Ireland', region: 'Europe', flag: '🇮🇪' },
];
