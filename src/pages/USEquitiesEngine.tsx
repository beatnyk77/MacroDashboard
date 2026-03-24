import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tab, Tabs } from '@mui/material';
import { Search, LayoutGrid, Activity, Users, FileText, Globe, TrendingUp } from 'lucide-react';
import { USScreener } from '@/features/USC/USScreener';
import { USSectorHeatmap } from '@/features/USC/USSectorHeatmap';
import { USInsiderActivity } from '@/features/USC/USInsiderActivity';
import { USFilingsFeed } from '@/features/USC/USFilingsFeed';
import { USWhaleTracker } from '@/features/USC/USWhaleTracker';
import { USMacroCorrelation } from '@/features/USC/USMacroCorrelation';

export const USEquitiesEngine: React.FC = () => {
    const { tool } = useParams<{ tool: string }>();
    const navigate = useNavigate();

    const activeTab = tool || 'screener';

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        navigate(`/us-equities/${newValue}`);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#020202', pt: 12, pb: 10 }}>
            <Container maxWidth="xl">
                <Box sx={{ mb: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Globe size={24} className="text-blue-400" />
                        <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                            US CORPORATE FUNDAMENTALS
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'white/40', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Institutional-Grade Research & Macro Correlations • Official SEC EDGAR Data
                    </Typography>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'white/5', mb: 6 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                color: 'white/30',
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                minWidth: 120,
                                py: 2,
                                transition: 'all 0.2s',
                                '&:hover': { color: 'white/60' },
                                '&.Mui-selected': { color: 'white' }
                            },
                            '& .MuiTabs-indicator': {
                                bgcolor: '#3b82f6',
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab
                            value="screener"
                            label="Screener"
                            icon={<Search size={14} />}
                            iconPosition="start"
                        />
                        <Tab
                            value="sectors"
                            label="Sectors"
                            icon={<LayoutGrid size={14} />}
                            iconPosition="start"
                        />
                        <Tab
                            value="insider"
                            label="Insider Ops"
                            icon={<Activity size={14} />}
                            iconPosition="start"
                        />
                        <Tab
                            value="whales"
                            label="13F Whales"
                            icon={<Users size={14} />}
                            iconPosition="start"
                        />
                        <Tab
                            value="filings"
                            label="Live Filings"
                            icon={<FileText size={14} />}
                            iconPosition="start"
                        />
                        <Tab
                            value="correlation"
                            label="Macro Pulse"
                            icon={<TrendingUp size={14} />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                <Box>
                    {activeTab === 'screener' && <USScreener />}
                    {activeTab === 'sectors' && <USSectorHeatmap />}
                    {activeTab === 'insider' && <USInsiderActivity />}
                    {activeTab === 'whales' && <USWhaleTracker />}
                    {activeTab === 'filings' && <USFilingsFeed />}
                    {activeTab === 'correlation' && <USMacroCorrelation />}
                </Box>
            </Container>
        </Box>
    );
};

export default USEquitiesEngine;
