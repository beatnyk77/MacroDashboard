import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SankeyNode {
    id: string;
    nodeColor?: string;
}

export interface SankeyLink {
    source: string;
    target: string;
    value: number;
}

export interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

export const useComtradeData = (category: string = 'Semiconductors', hsCode: string = '8542') => {
    const [data, setData] = useState<SankeyData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch data from Supabase
                const { data: rawData, error: dbError } = await supabase
                    .from('trade_chokepoints')
                    .select('*')
                    .eq('category', category)
                    .eq('hs_code', hsCode)
                    .eq('reporter_is_exporter', true);

                if (dbError) throw new Error(dbError.message);

                if (rawData && rawData.length > 0 && isMounted) {
                    setLastUpdated(rawData[0].as_of_date || rawData[0].period || new Date().toISOString());

                    // Format data for Nivo Sankey
                    const nodesMap = new Map<string, SankeyNode>();
                    const links: SankeyLink[] = [];

                    rawData.forEach(row => {
                        const exporter = row.reporter_name;
                        const importer = row.partner_name;

                        // Add nodes if they don't exist
                        if (!nodesMap.has(exporter)) {
                            nodesMap.set(exporter, { id: exporter, nodeColor: 'hsl(var(--chart-1))' });
                        }
                        if (!nodesMap.has(importer)) {
                            nodesMap.set(importer, { id: importer, nodeColor: 'hsl(var(--chart-2))' });
                        }

                        // Add link
                        // Trade value is in raw USD, we might want to scale it down (e.g., to billions) for the chart
                        const valueInBillions = Number(row.trade_value_usd) / 1_000_000_000;
                        if (valueInBillions > 0) {
                            links.push({
                                source: exporter,
                                target: importer,
                                value: Number(valueInBillions.toFixed(2))
                            });
                        }
                    });

                    // Ensure we don't return circular links or invalid setups
                    if (links.length > 0) {
                        setData({
                            nodes: Array.from(nodesMap.values()),
                            links: links
                        });
                    } else {
                        setData(null);
                    }
                } else if (isMounted) {
                    setData(null);
                }

            } catch (err: any) {
                console.error('Error fetching Comtrade data:', err);
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [category, hsCode]);

    return { data, loading, error, lastUpdated };
};
