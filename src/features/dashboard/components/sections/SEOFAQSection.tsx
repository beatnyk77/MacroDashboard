import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const SEOFAQSection: React.FC = () => {
    return (
        <Box sx={{
            mt: 8,
            mb: 4,
            px: 3,
            py: 3,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid',
            borderColor: 'divider'
        }}>
            {/* FAQ Schema for AI Extractability and Rich Snippets */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "What is a macro liquidity dashboard?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "A macro liquidity dashboard, like GraphiQuestor, tracks the availability and flow of capital within the global financial system, focusing on central bank balance sheets, RRP, and TGA levels to identify expansionary or contractionary regimes."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "How does GraphiQuestor track gold valuation vs real rates?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "We analyze gold prices against 10-year real yields to calculate z-scores that signal over or undervaluation relative to historical norms, providing a dedicated gold macro valuation lens for institutional analysis."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "How often is BRICS de-dollarization and gold accumulation data updated?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Data for BRICS+ gold reserves and USD reserve shares are updated as quarterly IMF and central bank reports are released, offering a consistent de-dollarization tracker for institutional analysis."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Who is this macro risk dashboard for?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "GraphiQuestor is built for institutional macro researchers, portfolio managers, and financial professionals who require a high-signal sovereign bond stress monitor and liquidity-driven regime tracking for global macro risk management."
                            }
                        }
                    ]
                })}
            </script>
            <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 3, color: 'text.primary' }}>
                Frequently Asked Questions
            </Typography>

            <Accordion
                sx={{
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                    sx={{ px: 0 }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        What is a macro liquidity dashboard?
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        A macro liquidity dashboard, like GraphiQuestor, tracks the availability and flow of capital within the global financial system, focusing on central bank balance sheets, RRP, and TGA levels to identify expansionary or contractionary regimes.
                    </Typography>
                </AccordionDetails>
            </Accordion>

            <Accordion
                sx={{
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                    sx={{ px: 0 }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        How does GraphiQuestor track gold valuation vs real rates?
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        We analyze gold prices against 10-year real yields to calculate z-scores that signal over or undervaluation relative to historical norms, providing a dedicated gold macro valuation lens for institutional analysis.
                    </Typography>
                </AccordionDetails>
            </Accordion>

            <Accordion
                sx={{
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                    sx={{ px: 0 }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        How often is BRICS de-dollarization and gold accumulation data updated?
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        Data for BRICS+ gold reserves and USD reserve shares are updated as quarterly IMF and central bank reports are released, offering a consistent de-dollarization tracker for institutional analysis.
                    </Typography>
                </AccordionDetails>
            </Accordion>

            <Accordion
                sx={{
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                    sx={{ px: 0 }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Who is this macro risk dashboard for?
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        GraphiQuestor is built for institutional macro researchers, portfolio managers, and financial professionals who require a high-signal sovereign bond stress monitor and liquidity-driven regime tracking for global macro risk management.
                    </Typography>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};
