import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { SEOManager } from '@/components/SEOManager';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, TrendingUp, Activity } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// All countries we track
const ALL_COUNTRIES = [
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

export const CountriesIndexPage: React.FC = () => {
  // Fetch which countries actually have data
  const { data: metricRows } = useQuery({
    queryKey: ['country-metrics-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_metrics')
        .select('iso');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const availableCountries = useMemo(() => {
    const isos = new Set(metricRows?.map(r => r.iso));
    return Array.from(isos);
  }, [metricRows]);

  const countriesWithStatus = useMemo(() => {
    return ALL_COUNTRIES.map(c => ({
      ...c,
      hasData: availableCountries?.includes(c.code) || false,
    }));
  }, [availableCountries]);

  // Group by region
  const grouped = useMemo(() => {
    const groups: Record<string, typeof countriesWithStatus> = {};
    countriesWithStatus.forEach(c => {
      if (!groups[c.region]) groups[c.region] = [];
      groups[c.region].push(c);
    });
    return groups;
  }, [countriesWithStatus]);

  const totalWithData = countriesWithStatus.filter(c => c.hasData).length;

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <SEOManager
        title="Sovereign Compass — Country Intelligence Directory"
        description="Access institutional-grade macro intelligence for 40+ countries. Real-time GDP, inflation, debt, yield curve, and sovereign stress metrics."
        keywords={['country intelligence', 'sovereign risk', 'macro data', 'FX reserves', 'yield curve', 'institutional terminal']}
      />

      <section className="relative pt-24 pb-16 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Terminal</Link>
            <span>/</span>
            <span className="text-blue-400">Sovereign Compass</span>
          </nav>

          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.8] mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20">
                Sovereign Compass
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground/70 leading-relaxed mb-8">
              Institutional-grade macro intelligence for {ALL_COUNTRIES.length} countries.
              Track GDP growth, inflation, sovereign debt, FX reserves, yield curves, and sovereign stress indicators.
              All data updated automatically via live APIs — no manual intervention.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <span>{ALL_COUNTRIES.length} Countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>{totalWithData} with Live Data</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>15+ Indicators per Country</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        {Object.entries(grouped).map(([region, countries]) => (
          <div key={region} className="mb-16">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-blue-400">►</span> {region}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {countries.map(country => (
                <Link
                  key={country.code}
                  to={`/countries/${country.code}`}
                  className={`block p-4 rounded-xl border transition-all duration-200 ${
                    country.hasData
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/50 hover:scale-[1.02]'
                      : 'bg-white/5 border-white/5 opacity-40 hover:opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl mb-2">{country.flag}</div>
                  <div className="font-bold text-sm">{country.name}</div>
                  <div className="text-xs text-muted-foreground/50 mt-1">
                    {country.hasData ? (
                      <span className="text-emerald-400">Live Data</span>
                    ) : (
                      <span>Coming Soon</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 border-t border-white/5 mb-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Real-Time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground/70">
                Data refreshed weekly via automated ingestion from FRED, IMF, World Bank, and other authoritative sources.
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Institutional Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground/70">
                Same data quality and methodology as the rest of GraphiQuestor — no approximations, no noise.
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">API Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground/70">
                Need programmatic access? Contact us for API licensing and institutional data feeds.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <InstitutionalFooter />
    </div>
  );
};
