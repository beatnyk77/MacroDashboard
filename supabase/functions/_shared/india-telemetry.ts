import { MoSPIClient } from '../ingest-mospi/mospi-client.ts';

export interface TelemetryResult {
    metric_id: string;
    as_of_date: string;
    value: number;
    provenance: 'api_live' | 'fallback_snapshot' | 'manual_seed' | 'verified_historical';
    metadata?: any;
}

export class IndiaTelemetry {
    private mospi: MoSPIClient;
    private fredApiKey: string;

    constructor(fredApiKey: string = "") {
        this.mospi = new MoSPIClient();
        this.fredApiKey = fredApiKey;
    }

    /**
     * Fetches CPI Inflation from MoSPI
     */
    async getInflationCPI(year: string, month: string): Promise<TelemetryResult[]> {
        try {
            const res = await this.mospi.getCPIData({ year, month });
            if (res?.data && Array.isArray(res.data)) {
                return res.data.map((d: any) => ({
                    metric_id: 'IN_CPI_HEADLINE',
                    as_of_date: `${year}-${month.padStart(2, '0')}-01`,
                    value: parseFloat(d.index_value),
                    provenance: 'api_live'
                }));
            }
            return [];
        } catch (e) {
            console.error('IndiaTelemetry: MoSPI CPI failed', e);
            throw e;
        }
    }

    /**
     * Fetches Energy Generation from MoSPI
     */
    async getEnergyGeneration(year: string): Promise<TelemetryResult[]> {
        try {
            // Indicator 1: Total Electricity Generation (example code)
            const res = await this.mospi.getEnergyData({ indicator_code: 1, use_of_energy_balance_code: 1, year });
            if (res?.data && Array.isArray(res.data)) {
                return res.data.map((d: any) => ({
                    metric_id: 'IN_ENERGY_GEN_TOTAL',
                    as_of_date: `${year}-12-31`,
                    value: parseFloat(d.value),
                    provenance: 'api_live',
                    metadata: { state: d.state_name }
                }));
            }
            return [];
        } catch (e) {
            console.error('IndiaTelemetry: MoSPI Energy failed', e);
            throw e;
        }
    }

    /**
     * Fetches Bank Credit from FRED (Proxy for RBI)
     */
    async getBankCredit(): Promise<TelemetryResult[]> {
        if (!this.fredApiKey) throw new Error("FRED_API_KEY required for Credit proxy");
        try {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DDSI04INA156NWDB&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=12`;
            const resp = await fetch(url);
            const data = await resp.json() as any;
            if (data.observations) {
                return data.observations.map((o: any) => ({
                    metric_id: 'IN_BANK_CREDIT_GROWTH',
                    as_of_date: o.date,
                    value: parseFloat(o.value),
                    provenance: 'api_live'
                }));
            }
            return [];
        } catch (e) {
            console.error('IndiaTelemetry: FRED Credit failed', e);
            throw e;
        }
    }

    /**
     * Fetches Net Liquidity (M3) from FRED
     */
    async getNetLiquidity(): Promise<TelemetryResult[]> {
        if (!this.fredApiKey) throw new Error("FRED_API_KEY required for Liquidity proxy");
        try {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=MABMM3INM189S&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=12`;
            const resp = await fetch(url);
            const data = await resp.json() as any;
            if (data.observations) {
                return data.observations.map((o: any) => ({
                    metric_id: 'IN_NET_LIQUIDITY_M3',
                    as_of_date: o.date,
                    value: parseFloat(o.value),
                    provenance: 'api_live'
                }));
            }
            return [];
        } catch (e) {
            console.error('IndiaTelemetry: FRED Liquidity failed', e);
            throw e;
        }
    }

    /**
     * Fetches Call Money Rate from FRED
     */
    async getCallMoneyRate(): Promise<TelemetryResult[]> {
        if (!this.fredApiKey) throw new Error("FRED_API_KEY required for Call Rate proxy");
        try {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=STLPIR01INM661N&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=12`;
            const resp = await fetch(url);
            const data = await resp.json() as any;
            if (data.observations) {
                return data.observations.map((o: any) => ({
                    metric_id: 'IN_CALL_MONEY_RATE',
                    as_of_date: o.date,
                    value: parseFloat(o.value),
                    provenance: 'api_live'
                }));
            }
            return [];
        } catch (e) {
            console.error('IndiaTelemetry: FRED Call Rate failed', e);
            throw e;
        }
    }

    /**
     * Fetches ASI (Annual Survey of Industries) data from MoSPI
     */
    async getASIStatistics(year: string, state_code: string): Promise<TelemetryResult[]> {
        try {
            // Indicator 101: GVA (example)
            const res = await this.mospi.getASIData({ year, state_code, indicator_code: 101, classification_year: '2011-12' });
            if (res?.data && Array.isArray(res.data)) {
                return res.data.map((d: any) => ({
                    metric_id: 'IN_ASI_GVA',
                    as_of_date: `${year}-03-31`,
                    value: parseFloat(d.value),
                    provenance: 'api_live',
                    metadata: { state_code, state_name: d.state_name }
                }));
            }
            return [];
        } catch (e) {
            console.error('IndiaTelemetry: MoSPI ASI failed', e);
            throw e;
        }
    }

    /**
     * Fetches FX Reserves from FRED
     */
    async getFXReserves(): Promise<TelemetryResult[]> {
        if (!this.fredApiKey) throw new Error("FRED_API_KEY required for FX Reserves");
        try {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=TRESEGIDA188NFRE&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=12`;
            const resp = await fetch(url);
            const data = await resp.json() as any;
            if (data.observations) {
                return data.observations.map((o: any) => ({
                    metric_id: 'IN_FX_RESERVES',
                    as_of_date: o.date,
                    value: parseFloat(o.value) / 1000, // Convert to Billion USD if needed (FRED is usually Millions)
                    provenance: 'api_live'
                }));
            }
            return [];
        } catch (e: any) {
            console.error('IndiaTelemetry: FRED FX Reserves failed', e);
            throw e;
        }
    }
}
