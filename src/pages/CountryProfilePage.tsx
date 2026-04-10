import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Container, Typography, Box, Grid } from '@mui/material';
import { Activity, TrendingUp, Lock, AlertTriangle, Database, Globe } from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { MetricCard } from '@/components/MetricCard';
import { COUNTRY_METRIC_GROUPS } from '@/lib/macro-metrics';
import { CountryNarrativeBlock } from '@/components/CountryNarrativeBlock';
import { COUNTRY_NARRATIVES } from '@/data/countryNarratives';
import { ALL_COUNTRIES } from './CountriesIndexPage';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// High-level grouping for the country terminal layout
const TERMINAL_SECTIONS = [
  { id: 'size', title: 'Economic Size', icon: TrendingUp, metrics: COUNTRY_METRIC_GROUPS.ECONOMIC_SIZE },
  { id: 'growth', title: 'Growth & Inflation', icon: Activity, metrics: COUNTRY_METRIC_GROUPS.GROWTH_INFLATION },
  { id: 'monetary', title: 'Monetary Policy', icon: TrendingUp, metrics: COUNTRY_METRIC_GROUPS.MONETARY_POLICY },
  { id: 'external', title: 'External Sector', icon: Globe, metrics: COUNTRY_METRIC_GROUPS.EXTERNAL_SECTOR },
  { id: 'fiscal', title: 'Fiscal Health', icon: Lock, metrics: COUNTRY_METRIC_GROUPS.FISCAL_HEALTH },
];

export const CountryProfilePage: React.FC = () => {
  const { iso } = useParams<{ iso: string }>();
  const uppercaseIso = iso?.toUpperCase();

  // 1. Fetch Country Terminal Data from Supabase view
  // 1. Fetch Country Terminal Data from Supabase view
  const { data: countryData, isLoading, error } = useQuery({
    queryKey: ['country-terminal', uppercaseIso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_country_terminal')
        .select('*')
        .eq('iso', uppercaseIso)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!uppercaseIso,
  });

  if (!uppercaseIso) return <Navigate to="/" replace />;

  const countryName = useMemo(() => ALL_COUNTRIES.find(c => c.code === uppercaseIso)?.name || uppercaseIso, [uppercaseIso]);

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <SEOManager
        title={`${countryName} (${uppercaseIso}) Macro Data & Sovereign Risk Terminal`}
        description={`Institutional-grade macro-economic terminal for ${countryName}. Live tracking of GDP growth, inflation, sovereign debt maturity, and ${uppercaseIso} yield curve telemetry.`}
        keywords={[countryName, uppercaseIso, 'Macro Data', 'Sovereign Debt', 'Yield Curve', 'Institutional Terminal', 'Macro Observatory']}
        jsonLd={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": `${countryName} Macro Intelligence Profile`,
            "description": `Comprehensive macro-economic data and sovereign risk analysis for ${countryName}.`,
            "publisher": {
                "@type": "Organization",
                "name": "GraphiQuestor",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://graphiquestor.com/logo.png"
                }
            },
            "about": {
                "@type": "Country",
                "name": countryName,
                "identifier": uppercaseIso
            }
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-12">
            <Link to="/" className="hover:text-white transition-colors">Terminal</Link>
            <span>/</span>
            <Link to="/countries" className="hover:text-blue-400 transition-colors text-blue-400">Sovereign Compass</Link>
            <span>/</span>
            <span className="text-white">{uppercaseIso}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
              <span className="text-7xl md:text-8xl select-none grayscale-[0.5] opacity-80">
                {/* Fallback to code if flag emoji mapping needed, for now use standard emoji if ISO matched */}
                <Globe className="w-16 h-16 text-blue-500/50" />
              </span>
              <div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.8] mb-2 uppercase italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20">
                  {uppercaseIso}
                </h1>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 opacity-60">Sovereign Compass</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <Database size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Updates: Sun 02:00 UTC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Intelligent Analysis */}
      <Container maxWidth="xl" sx={{ mt: 8 }}>
        <CountryNarrativeBlock 
          data={countryData}
          narrativeData={COUNTRY_NARRATIVES[uppercaseIso] || null}
        />
      </Container>

      {/* Main Grid Interface */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        {error && (
          <Box mb={6} p={3} bgcolor="rgba(244, 63, 94, 0.1)" border="1px solid rgba(244, 63, 94, 0.2)" borderRadius={2} display="flex" alignItems="center" gap={2}>
            <AlertTriangle className="text-rose-500" />
            <Typography variant="body2" className="text-rose-200">
              Sync Error: Unable to fetch live macro telemetry for {uppercaseIso}. Check connectivity or terminal status.
            </Typography>
          </Box>
        )}

        {TERMINAL_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
          <Box key={section.id} mb={12}>
            <div className="flex items-center gap-3 mb-8">
              <Icon size={20} className="text-blue-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">{section.title}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <Grid container spacing={2}>
              {section.metrics.map(metric => {
                // Map macro-metric key to view column name
                const viewKey = metric.key;
                const val = countryData?.[viewKey as keyof typeof countryData];
                const asOfDate = countryData?.[`${viewKey}_date` as keyof typeof countryData];
                const numVal = typeof val === 'number' ? val : val != null ? Number(val) : null;
                const displayValue = numVal != null ? `${Math.round(numVal * 100) / 100}${metric.unit === '%' ? '%' : ''}` : 'N/A';
                const sublabel = asOfDate ? `${metric.source} • ${String(asOfDate).slice(0,10)}` : metric.source;

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={metric.key}>
                    <MetricCard
                      label={metric.label}
                      value={displayValue}
                      sublabel={sublabel}
                      status={val != null ? 'neutral' : undefined}
                      isLoading={isLoading}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );
        })}
      </Container>

      <InstitutionalFooter />
    </div>
  );
};
