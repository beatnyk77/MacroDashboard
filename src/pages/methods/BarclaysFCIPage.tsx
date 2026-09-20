import React from 'react';
import { AuthorPersonSchema, PublisherOrganizationSchema } from '@/config/brandConfig';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { TrailLink as Link } from '@/components/TrailLink';
import { SEOManager } from '@/components/SEOManager';
import { MethodsSpokeBanner } from '@/components/seo/MethodsSpokeBanner';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';

const faqItems = [
  {
    question: 'How is the Barclays Financial Conditions Index (FCI) calculated?',
    answer:
      'The Barclays Financial Conditions Index uses an equal-weighted average of standardized rolling Z-scores of 1-year changes across 5 core pillars: Credit Spreads (US High Yield OAS), Real 10Y Yields (10Y TIPS), Yield Curve Slope (10Y-2Y), Broad Trade-Weighted Dollar, and Equity Returns (S&P 500). Directional signing ensures that higher spreads, higher yields, curve inversion, dollar strength, and equity declines produce a positive (tightening) FCI.',
  },
  {
    question: 'How does the Commodity Cycle mechanically tighten financial conditions?',
    answer:
      'Unlike the 2010–2020 QE regime, commodity upcycles generate exogenous cost-push inflation across PPI and headline CPI. This prevents central banks from easing policy, pushing real 10Y benchmark yields higher, flattening yield curves, widening corporate credit spreads, and contracting equity multiples. The commodity cycle acts as the primary transmission gear that tightens global financial conditions.',
  },
  {
    question: 'Why use 1-year changes (YoY delta) rather than raw levels?',
    answer:
      'Using 1-year changes removes structural multi-decade secular trends (such as demographic downward drift in nominal yields from 1980 to 2020) and isolates cyclical momentum. Normalizing via multi-year rolling Z-scores makes disparate asset classes (percentages, bps, and index returns) directly comparable.',
  },
];

export const BarclaysFCIPage: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': 'https://graphiquestor.com/methods/barclays-financial-conditions-index/',
    'headline': 'Barclays Financial Conditions Index & Commodity Cycle — Methodology & Formula',
    'description': 'Comprehensive mathematical formulation for the Barclays FCI model, component Z-scores, sign conventions, and mechanical commodity cycle transmission.',
    'url': 'https://graphiquestor.com/methods/barclays-financial-conditions-index/',
    'datePublished': '2026-09-20',
    'dateModified': '2026-09-20',
    'author': AuthorPersonSchema,
    'publisher': PublisherOrganizationSchema,
    'proficiencyLevel': 'Institutional',
    'keywords': ['Barclays FCI', 'Financial Conditions Index', 'Commodity Cycle', 'Credit Spreads', 'Real Yields', 'Yield Curve Slope', 'Macro Intelligence'],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(({ question, answer }) => ({
      '@type': 'Question',
      'name': question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': answer,
      },
    })),
  };

  return (
    <>
      <SEOManager
        title="Barclays Financial Conditions Index (FCI) & Commodity Cycle — Methodology"
        description="Institutional methodology and mathematical formulation for the Barclays FCI model: equal-weighted rolling Z-scores of credit spreads, real rates, curve slope, dollar FX, and equities."
        keywords={['Barclays FCI', 'Financial Conditions Index', 'Commodity Cycle', 'Macro Methodology', 'GraphiQuestor']}
        jsonLd={[jsonLd, faqJsonLd]}
      />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            component={Link}
            to="/labs/financial-conditions/"
            variant="outlined"
            size="small"
            startIcon={<ArrowLeft size={16} />}
            sx={{ textTransform: 'none', color: 'text.secondary', borderColor: 'divider' }}
          >
            Back to FCI Observatory
          </Button>

          <Chip
            icon={<CheckCircle2 size={14} />}
            label="INSTITUTIONAL METHODOLOGY"
            size="small"
            sx={{
              bgcolor: 'rgba(249, 115, 22, 0.1)',
              color: '#f97316',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              fontWeight: 800,
              fontSize: '0.65rem',
            }}
          />
        </Box>

          <MethodsSpokeBanner />

        {/* Core Formula Box */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            my: 5,
            borderRadius: 3,
            bgcolor: '#0a0f1d',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.1em' }}>
            MATHEMATICAL FORMULATION
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, mt: 1, mb: 2, color: 'text.primary' }}>
            The Barclays Equal-Weighted Z-Score Index
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            For each component pillar, we compute the 1-year change (YoY change = current value minus 1-year ago),
            normalize it via rolling multi-year standardized Z-scores (Z = (change - mean) / standard deviation),
            and sign each component such that positive values indicate restrictive conditions:
          </Typography>

          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#f97316',
              overflowX: 'auto',
              lineHeight: 1.8,
            }}
          >
            FCI_t = ⅕ · [ +Z(Δ Credit_Spread) + Z(Δ Real_10Y) − Z(Δ YC_Slope) + Z(Δ Broad_USD) − Z(Δ SP500) ]
          </Box>
        </Paper>

        {/* 5 Pillars Table */}
        <Box sx={{ my: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Pillar Decomposition &amp; Sign Conventions
          </Typography>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse border border-border">
              <thead>
                <tr className="bg-muted/60 border-b border-border text-foreground">
                  <th className="p-3">Pillar</th>
                  <th className="p-3">FRED Benchmark</th>
                  <th className="p-3">Calculation</th>
                  <th className="p-3">Sign</th>
                  <th className="p-3">Macro Transmission Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-muted-foreground">
                <tr>
                  <td className="p-3 font-bold text-foreground">Credit Spreads</td>
                  <td className="p-3 text-primary">BAMLH0A0HYM2</td>
                  <td className="p-3">YoY OAS Change (bps)</td>
                  <td className="p-3 text-rose-400 font-bold">+ Tightening</td>
                  <td className="p-3">Widening corporate default risk premium raises cost of capital.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-foreground">Real 10Y Rate</td>
                  <td className="p-3 text-primary">DFII10 (TIPS)</td>
                  <td className="p-3">YoY Real Yield Change (%)</td>
                  <td className="p-3 text-rose-400 font-bold">+ Tightening</td>
                  <td className="p-3">Higher sovereign discount rates compress capex hurdle rates.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-foreground">Yield Curve Slope</td>
                  <td className="p-3 text-primary">T10Y2Y</td>
                  <td className="p-3">YoY 10Y-2Y Change (bps)</td>
                  <td className="p-3 text-cyan-400 font-bold">− Inversion = Tightening</td>
                  <td className="p-3">Curve flattening/inversion reflects restrictive policy stance.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-foreground">Broad US Dollar</td>
                  <td className="p-3 text-primary">DTWEXBGS</td>
                  <td className="p-3">YoY % Change</td>
                  <td className="p-3 text-rose-400 font-bold">+ Tightening</td>
                  <td className="p-3">Dollar appreciation contracts global cross-border funding.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-foreground">Equities</td>
                  <td className="p-3 text-primary">SP500</td>
                  <td className="p-3">YoY % Return</td>
                  <td className="p-3 text-purple-400 font-bold">− Decline = Tightening</td>
                  <td className="p-3">Equity drawdowns contract household and corporate balance sheets.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Box>

        <Divider sx={{ my: 5 }} />

        {/* FAQ Section */}
        <Box sx={{ my: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Frequently Asked Questions
          </Typography>
          <div className="space-y-4">
            {faqItems.map((faq) => (
              <div key={faq.question} className="p-4 rounded-xl bg-card border border-border space-y-1.5">
                <h4 className="text-sm font-bold text-foreground">{faq.question}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Box>

        {/* Related Metrics and Content */}
        <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
          <RelatedMetrics />
          <RelatedContent />
        </Box>
      </Container>
    </>
  );
};
