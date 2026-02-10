import React from 'react';
import { Grid, Box } from '@mui/material';
import { useIndiaMacro } from '@/hooks/useIndiaMacro';
import { CompositeIndexCard } from './CompositeIndexCard';
import { Activity, TrendingUp, Factory, Zap, Users, Gauge, Leaf, Briefcase } from 'lucide-react';

export const CompositeMetricsSection: React.FC = () => {
    const { data, isLoading } = useIndiaMacro();

    // -- Data Extraction & Computation --
    const metrics = data?.metrics || [];

    const findValue = (id: string) => metrics.find(m => m.metric_id === id)?.value;

    // Metric #12: Inflation-Resilient Growth Score
    // Formula: (GDP Growth %) - [(WPI + CPI) / 2]
    const gdpGrowth = findValue('IN_GDP_GROWTH_YOY');
    const cpiInflation = findValue('IN_CPI_YOY');
    const wpiInflation = findValue('IN_WPI_YOY');

    let resilientGrowthScore: number | null = null;
    let growthScoreStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';

    if (gdpGrowth !== undefined && cpiInflation !== undefined && wpiInflation !== undefined) {
        const avgInflation = (cpiInflation + wpiInflation) / 2;
        resilientGrowthScore = gdpGrowth - avgInflation;

        if (resilientGrowthScore >= 4) growthScoreStatus = 'safe';
        else if (resilientGrowthScore >= 2) growthScoreStatus = 'warning';
        else growthScoreStatus = 'danger';
    }

    // Metric #7: Wholesale Cost Efficiency
    // Formula: IIP Growth (Output Volume) - WPI Mfg (Input Price)
    // Interpretation: Positive spread = Output growing faster than Input Costs = Margin Expansion
    const iipGrowth = findValue('IN_IIP_YOY');
    const wpiMfg = findValue('IN_WPI_MFG_YOY');

    let wholesaleEfficiency: number | null = null;
    let wholesaleStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';

    if (iipGrowth !== undefined && wpiMfg !== undefined) {
        wholesaleEfficiency = iipGrowth - wpiMfg;

        // Status: Spread > 2% is great, 0-2% is OK, < 0% (Negative spread) is bad
        if (wholesaleEfficiency >= 2) wholesaleStatus = 'safe';
        else if (wholesaleEfficiency >= 0) wholesaleStatus = 'warning';
        else wholesaleStatus = 'danger';
    }

    // Metric #2: Labor productivity (Simplified)
    // Formula: ASI GVA / ASI Employment
    const asiGva = findValue('IN_ASI_GVA_TOTAL');
    const asiEmp = findValue('IN_ASI_EMPLOYMENT_TOTAL');
    let laborProductivity: number | null = null;
    let laborStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
    if (asiGva !== undefined && asiEmp !== undefined) {
        laborProductivity = asiGva / asiEmp;
        if (laborProductivity >= 150) laborStatus = 'safe';
        else if (laborProductivity >= 100) laborStatus = 'warning';
        else laborStatus = 'danger';
    }

    // Metric #5: Renewable Transition Score
    const renewShare = findValue('IN_ENERGY_RENEWABLE_SHARE');
    let renewStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
    if (renewShare !== undefined) {
        if (renewShare >= 40) renewStatus = 'safe';
        else if (renewShare >= 30) renewStatus = 'warning';
        else renewStatus = 'danger';
    }

    // Metric #6: Sectoral Output Efficiency
    const asiCapacity = findValue('IN_ASI_CAPACITY_UTIL');
    if (asiCapacity !== undefined) {
        // capStatus removed as card was consolidated
    }

    // Metric #3: Industrial Energy Intensity
    // Formula: Industrial Energy Consumption / ASI GVA
    const indEnergy = findValue('IN_ENERGY_INDUSTRIAL');
    let energyIntensity: number | null = null;
    let intensityStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
    if (indEnergy !== undefined && asiGva !== undefined) {
        energyIntensity = (indEnergy / asiGva) * 100; // Normalized
        if (energyIntensity <= 0.5) intensityStatus = 'safe';
        else if (energyIntensity <= 1.0) intensityStatus = 'warning';
        else intensityStatus = 'danger';
    }

    // Metric #4: Inflation-Adjusted Wage Efficiency
    // Formula: (Wage Level / CPI) * (LFPR / 100)
    const lfpr = findValue('IN_LFPR');
    const wageLevel = findValue('IN_WAGE_GROWTH');
    let wageEfficiency: number | null = null;
    let wageStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
    if (wageLevel && cpiInflation && lfpr) {
        // Simple index: Wage Level relative to CPI weight and participation
        wageEfficiency = (wageLevel / (cpiInflation * 100)) * (lfpr / 100);
        if (wageEfficiency >= 10) wageStatus = 'safe';
        else if (wageEfficiency >= 5) wageStatus = 'warning';
        else wageStatus = 'danger';
    }

    // Metric #8: Urban-Rural Employment Efficiency
    // Formula: Rural UR / Urban UR (Ratio > 1 means Urban is better)
    const urbanUR = findValue('IN_PLFS_UR_URBAN');
    const ruralUR = findValue('IN_PLFS_UR_RURAL');
    let urEfficiency: number | null = null;
    let urStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
    if (urbanUR && ruralUR) {
        urEfficiency = ruralUR / urbanUR;
        if (urEfficiency >= 1.0) urStatus = 'safe';
        else if (urEfficiency >= 0.7) urStatus = 'warning';
        else urStatus = 'danger';
    }

    // Metric #9: Fuel Cost Stability
    const cpiFuel = findValue('IN_CPI_FUEL_YOY');
    let fuelStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
    if (cpiFuel !== undefined) {
        if (cpiFuel <= 5) fuelStatus = 'safe';
        else if (cpiFuel <= 8) fuelStatus = 'warning';
        else fuelStatus = 'danger';
    }

    // Metric #10: Capacity-Wage Productivity
    // Formula: Capacity Util / (Wage / 1000)
    let wageProd: number | null = null;
    let wageProdStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
    if (asiCapacity && wageLevel) {
        wageProd = asiCapacity / (wageLevel / 1000);
        if (wageProd >= 8) wageProdStatus = 'safe';
        else if (wageProd >= 5) wageProdStatus = 'warning';
        else wageProdStatus = 'danger';
    }

    return (
        <Box sx={{ mb: 6 }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-lg font-black text-white tracking-tight uppercase">
                        Composite Efficiency Indices
                    </h3>
                    <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-widest">
                        Computed Real-Time • MoSPI + FRED Sources
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[0.6rem] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
            </div>

            <Grid container spacing={3}>
                {/* #12: Inflation-Resilient Growth Score */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Inflation-Resilient Growth"
                        value={resilientGrowthScore}
                        formula="GDP - Avg(CPI, WPI)"
                        sources={['NAS', 'CPI', 'WPI']}
                        status={growthScoreStatus}
                        description="Real GDP growth adjusted for composite inflation (WPI+CPI). Higher is better, indicating growth outpacing price rises."
                        icon={<TrendingUp size={14} />}
                        suffix="%"
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #7: Wholesale Cost Efficiency */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Wholesale Cost Efficiency"
                        value={wholesaleEfficiency}
                        formula="IIP Growth - WPI Mfg"
                        sources={['IIP', 'WPI (Fred)']}
                        status={wholesaleStatus}
                        description="Spread between industrial output volume growth and manufacturing input cost inflation. Positive spread implies margin expansion."
                        icon={<Factory size={14} />}
                        suffix="%"
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #4: Wage Efficiency */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Real Wage Efficiency"
                        value={wageEfficiency}
                        formula="(Wage / CPI) * LFPR"
                        sources={['PLFS', 'CPI']}
                        status={wageStatus}
                        description="Adjusted wage quality index. Measures whether wage levels are keeping pace with inflation and labor participation."
                        icon={<Briefcase size={14} />}
                        suffix=""
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #10: Capacity-Wage Productivity */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Capital-Wage Productivity"
                        value={wageProd}
                        formula="ASI Cap / Wage Level"
                        sources={['ASI', 'PLFS']}
                        status={wageProdStatus}
                        description="Ratio of industrial capacity utilization to average wage levels. Measures capital efficiency relative to labor cost."
                        icon={<Users size={14} />}
                        suffix=""
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #3: Industrial Energy Intensity */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Energy Intensity (Ind)"
                        value={energyIntensity}
                        formula="Ind Energy / ASI GVA"
                        sources={['ENERGY', 'ASI']}
                        status={intensityStatus}
                        description="Specific energy consumption per unit of industrial GVA. Normalized index; lower values indicate higher efficiency."
                        icon={<Zap size={14} />}
                        suffix=""
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #2: Labor Productivity */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Industrial Labor Prod"
                        value={laborProductivity}
                        formula="ASI GVA / Employment"
                        sources={['ASI']}
                        status={laborStatus}
                        description="Direct industrial labor productivity. Gross Value Added per industrial worker. Measures operational efficiency."
                        icon={<Gauge size={14} />}
                        suffix=" Cr/W"
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #8: Urban-Rural UR Spread */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Urban-Rural Efficiency"
                        value={urEfficiency}
                        formula="Rural UR / Urban UR"
                        sources={['PLFS']}
                        status={urStatus}
                        description="Efficiency of labor market absorption in urban centers relative to rural areas. Values near 1.0 indicate balanced growth."
                        icon={<Activity size={14} />}
                        suffix=""
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #9: Fuel Price Regime */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Fuel Cost Stability"
                        value={cpiFuel}
                        formula="CPI Fuel & Light"
                        sources={['CPI']}
                        status={fuelStatus}
                        description="Direct measure of fuel inflation. Stability in this index is critical for maintaining industrial and logistics cost efficiencies."
                        icon={<Zap size={14} />}
                        suffix="%"
                        isLoading={isLoading}
                    />
                </Grid>

                {/* #5: Renewable Transition */}
                <Grid item xs={12} sm={6} md={3}>
                    <CompositeIndexCard
                        title="Renewable Capacity"
                        value={renewShare}
                        formula="Renewable % Total"
                        sources={['ENERGY']}
                        status={renewStatus}
                        description="Share of renewable energy in total production capacity. High scores reflect energy security and green transition."
                        icon={<Leaf size={14} />}
                        suffix="%"
                        isLoading={isLoading}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
