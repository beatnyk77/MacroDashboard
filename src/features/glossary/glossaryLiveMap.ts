import { LiveMetricColor } from './LiveIntelligenceBox';

export interface GlossaryLiveConfig {
    faqQuestion: string;
    linkTo: string;
    unit?: string;
    interpret: (data: any) => { label: string; color: LiveMetricColor; text: string; displayValue: string };
}

export const GLOSSARY_LIVE_CONFIG: Record<string, GlossaryLiveConfig> = {
    'net-liquidity-z-score': {
        faqQuestion: 'What is the current Net Liquidity Z-Score reading?',
        linkTo: '/',
        unit: 'σ',
        interpret: (data) => {
            const z = data?.z_score || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (z > 1.5) {
                label = 'Expansion'; color = 'emerald';
                text = "Structural Liquidity Expansion. Historically bullish for risk assets as the 'shadow system' provides a tailwind.";
            } else if (z < -1.5) {
                label = 'Contraction'; color = 'rose';
                text = "Structural Liquidity Contraction. Tightening impulse suggests high risk for market corrections.";
            } else {
                label = 'Neutral'; color = 'blue';
                text = "Neutral Liquidity Regime. Market returns likely driven by earnings rather than monetary plumbing.";
            }
            return { label, color, text, displayValue: z.toFixed(2) };
        }
    },
    'tga': {
        faqQuestion: 'What is the current US Treasury General Account (TGA) balance?',
        linkTo: '/',
        unit: '$Bn',
        interpret: (data) => {
            const val = data?.tga_balance || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 800) { label = 'Rebuilding'; color = 'rose'; text = "TGA Rebuild: Draining market liquidity (~QT equivalent). Usually precedes local volatility."; }
            else if (val < 300) { label = 'Drawdown'; color = 'emerald'; text = "TGA Drawdown: Injecting reserves into the system (~Stealth QE equivalent). Bullish for liquidity."; }
            else { label = 'Normal'; color = 'blue'; text = "Standard operating range. No significant liquidity drain or injection from the Treasury currently."; }
            return { label, color, text, displayValue: val.toFixed(0) };
        }
    },
    'reverse-repo-facility-rrp': {
        faqQuestion: 'What is the current Overnight Reverse Repo (RRP) balance?',
        linkTo: '/',
        unit: '$Bn',
        interpret: (data) => {
            const val = data?.rrp_balance || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 500) { label = 'Elevated'; color = 'amber'; text = "Excess cash parked at Fed. Represents potential liquidity 'dry powder' if the facility continues to drain."; }
            else if (val < 100) { label = 'Near-Zero'; color = 'blue'; text = "RRP drain is essentially complete. The 'extra' liquidity buffer from the pandemic era has been re-absorbed."; }
            else { label = 'Draining'; color = 'emerald'; text = "RRP is actively draining, providing a passive offset to the Fed's QT program."; }
            return { label, color, text, displayValue: val.toFixed(0) };
        }
    },
    'sofr': {
        faqQuestion: 'What is the current SOFR-EFFR funding stress spread?',
        linkTo: '/',
        unit: 'bps',
        interpret: (data) => {
            const val = data?.sofr_effr_spread || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 5) { label = 'Stress'; color = 'rose'; text = "Repo market volatility. High SOFR-EFFR spread indicates primary dealers are constrained and funding is tightening."; }
            else if (val < -2) { label = 'Abundant'; color = 'emerald'; text = "Funding is abundant. Banks have significant excess reserves, keeping short-term rates soft."; }
            else { label = 'Stable'; color = 'blue'; text = "Funding markets are operating smoothly with no immediate signs of collateral or cash shortage."; }
            return { label, color, text, displayValue: val.toFixed(1) };
        }
    },
    'm2-gold-ratio': {
        faqQuestion: 'What is the current M2/Gold Ratio Z-Score?',
        linkTo: '/labs',
        unit: 'σ',
        interpret: (data) => {
            const z = data?.z_score || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (z > 2) { label = 'Overvalued'; color = 'rose'; text = "M2 supply is extremely high relative to gold reserves. Suggests currency debasement risk is high."; }
            else if (z < -1) { label = 'Undervalued'; color = 'emerald'; text = "Gold is trading at a premium relative to historical monetary supply. Bullish for hard asset backing."; }
            else { label = 'Neutral'; color = 'blue'; text = "The relationship between paper money and gold is within normal historical bounds."; }
            return { label, color, text, displayValue: z.toFixed(2) };
        }
    },
    'debt-gold-z-score': {
        faqQuestion: 'What is the current US Debt-to-Gold coverage ratio?',
        linkTo: '/labs',
        unit: 'ratio',
        interpret: (data) => {
            const val = data?.debt_to_gold_coverage_ratio || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 100) { label = 'Uncovered'; color = 'rose'; text = "Sovereign debt exceeds gold value by over 100x. Indicates extreme fiscal vulnerability without growth."; }
            else { label = 'Standard'; color = 'amber'; text = "Maintaining standard debt-to-gold coverage levels. Still high by pre-1971 standards."; }
            return { label, color, text, displayValue: val.toFixed(1) };
        }
    },
    'gold-silver-ratio': {
        faqQuestion: 'What is the current Gold/Silver Ratio?',
        linkTo: '/labs',
        unit: 'x',
        interpret: (data) => {
            const val = data?.current_value || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 90) { label = 'Silver Low'; color = 'emerald'; text = "Silver is historically cheap relative to gold. Mean-reversion favors a silver rally or gold consolidation."; }
            else if (val < 55) { label = 'Silver High'; color = 'rose'; text = "Silver is historically expensive relative to gold. Risk of a sharp correction in silver prices."; }
            else { label = 'Normal'; color = 'blue'; text = "Ratio is within the standard 60-80x range typical of modern fiat regimes."; }
            return { label, color, text, displayValue: val.toFixed(1) };
        }
    },
    'fiscal-dominance': {
        faqQuestion: 'What is the current US Fiscal Dominance ratio?',
        linkTo: '/',
        unit: '%',
        interpret: (data) => {
            const val = data?.fiscal_dominance_ratio || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 100) { label = 'Dominant'; color = 'rose'; text = "Interest + Entitlements exceed tax receipts. Monetary policy is now a passenger to fiscal requirements."; }
            else if (val > 80) { label = 'Extreme'; color = 'amber'; text = "Fiscal stress is approaching critical levels. Very little room for higher rates without fiscal ruin."; }
            else { label = 'Elevated'; color = 'blue'; text = "Fiscal burden is high but technically manageable under current GDP growth projections."; }
            return { label, color, text, displayValue: val.toFixed(1) };
        }
    },
    'de-dollarization': {
        faqQuestion: 'What is the current USD share of global FX reserves?',
        linkTo: '/',
        unit: '%',
        interpret: (data) => {
            const val = data?.usdShare?.value || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val < 58) { label = 'Eroding'; color = 'amber'; text = "USD global share is hitting multi-decade lows. Gradual diversification into gold and RMB is evident."; }
            else { label = 'Dominant'; color = 'blue'; text = "The Dollar maintains its 'exorbitant privilege' despite geopolitical shifts."; }
            return { label, color, text, displayValue: val.toFixed(1) };
        }
    },
    'macro-regime-classification': {
        faqQuestion: 'What is the current global macro regime classification?',
        linkTo: '/',
        interpret: (data) => {
            const label = data?.regimeLabel || 'Neutral';
            let color: LiveMetricColor;
            if (label.includes('Expansion')) color = 'emerald';
            else if (label.includes('Tightening')) color = 'rose';
            else color = 'blue';
            return { label, color, text: `Current Market Regime: ${label}. Positioning should favor ${color === 'emerald' ? 'risk-on assets' : color === 'rose' ? 'defensive assets' : 'selective alpha'}.`, displayValue: label };
        }
    },
    'standing-repo-facility-srf': {
        faqQuestion: 'What is the current usage of the Fed\'s Standing Repo Facility (SRF)?',
        linkTo: '/',
        unit: '$Mn',
        interpret: (data) => {
            const val = data?.value || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 1000) { label = 'Stress'; color = 'rose'; text = "SRF usage has spiked. Signals that repo market participants are unable to find private funding and are resorting to the Fed's backstop."; }
            else { label = 'Dormant'; color = 'blue'; text = "SRF usage is minimal. Private repo markets are functioning normally with sufficient interbank liquidity."; }
            return { label, color, text, displayValue: val.toLocaleString() };
        }
    },
    'bank-term-funding-program-btfp': {
        faqQuestion: 'What is the current outstanding balance of the BTFP facility?',
        linkTo: '/',
        unit: '$Bn',
        interpret: (data) => {
            const val = data?.value || 0;
            let label: string, color: LiveMetricColor, text: string;
            if (val > 100) { label = 'Supportive'; color = 'amber'; text = "Large outstanding BTFP balance indicates banks are still reliant on emergency par-value collateral support."; }
            else { label = 'Normalizing'; color = 'blue'; text = "BTFP balance is low or zero. The regional banking stress of 2023 has likely been absorbed or refinanced."; }
            return { label, color, text, displayValue: val.toFixed(1) };
        }
    },
    'excess-reserves': {
        faqQuestion: 'What are the current Reserve Balances with Federal Reserve Banks?',
        linkTo: '/',
        unit: '$Bn',
        interpret: (data) => {
            const val = (data?.value || 0) / 1000; // Convert to $Bn if data is in $Mn
            let label: string, color: LiveMetricColor, text: string;
            if (val > 3500) { label = 'Abundant'; color = 'emerald'; text = "Reserve levels are high. The banking system has significant liquidity to facilitate lending and settlement."; }
            else if (val < 3000) { label = 'Scarcity Risk'; color = 'rose'; text = "Reserves are approaching levels where repo market volatility typically increases. Liquidity conditions are tightening."; }
            else { label = 'Adequate'; color = 'blue'; text = "Reserves are within the Fed's target 'ample' range. Sufficient for system stability."; }
            return { label, color, text, displayValue: val.toFixed(0) };
        }
    }
};
