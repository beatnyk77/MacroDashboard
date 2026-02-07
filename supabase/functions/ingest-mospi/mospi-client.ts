
export interface MoSPIResponse {
    statusCode?: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export class MoSPIClient {
    private baseUrl: string;

    constructor(baseUrl: string = "https://api.mospi.gov.in") {
        this.baseUrl = baseUrl;
    }

    private async fetchAPI(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        // Clean params and append to URL
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });

        try {
            console.log(`Fetching: ${url.toString()}`);
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    // Add any required headers here if MoSPI requires them
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("MoSPI API Error:", error);
            throw error;
        }
    }

    // ==========================================
    // PLFS (Unemployment)
    // ==========================================
    async getPLFSData(params: {
        indicator_code?: number;
        frequency_code?: number;
        year?: string;
        month_code?: number;
        quarter_code?: number;
        state_code?: string;
        sector_code?: string;
    }) {
        // Endpoint derived from client.py: /api/plfs/getData
        return this.fetchAPI("/api/plfs/getData", params);
    }

    // ==========================================
    // CPI (Inflation)
    // ==========================================
    async getCPIData(params: {
        year: string;
        month: string;
        group_code?: string;
        sub_group_code?: string;
        state_code?: string;
        sector_code?: string;
    }) {
        // Endpoint: /api/cpi/getCPIIndex (from client.py metadata "CPI_Group")
        return this.fetchAPI("/api/cpi/getCPIIndex", params);
    }

    // ==========================================
    // IIP (Industrial Production)
    // ==========================================
    async getIIPMonthly(params: {
        year: string;
        month: string;
        nic_code?: string; // 2-digit Item code
        sector_code?: string;
    }) {
        // Endpoint: /api/iip/getIIPMonthly
        return this.fetchAPI("/api/iip/getIIPMonthly", params);
    }

    // ==========================================
    // NAS (GDP)
    // ==========================================
    async getNASData(params: {
        series: string; // "Current" or "Back"
        year: string;
        frequency_code: number; // 1=Annual, 2=Quarterly
        indicator_code: number;
        item_code?: string;
    }) {
        return this.fetchAPI("/api/nas/getNASData", params);
    }

    // ==========================================
    // Metadata Discovery
    // ==========================================
    async getPLFSIndicators(frequency_code: number = 2) { // Default Quarterly
        return this.fetchAPI("/api/plfs/getIndicatorListByFrequency", { frequency_code });
    }

    async getCPIFilters(base_year: string = "2012", level: string = "Group") {
        return this.fetchAPI("/api/cpi/getCpiFilterByLevelAndBaseYear", { base_year, level });
    }

    async getIIPFilters(base_year: string = "2011-12", frequency: string = "Monthly") {
        return this.fetchAPI("/api/iip/getIipFilter", { base_year, frequency });
    }

    async getNASIndicators() {
        return this.fetchAPI("/api/nas/getNasIndicatorList");
    }
}
