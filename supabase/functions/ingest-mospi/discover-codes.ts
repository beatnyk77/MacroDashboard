
import { MoSPIClient } from './mospi-client.ts';

// Run with: deno run --allow-net supabase/functions/ingest-mospi/discover-codes.ts

async function main() {
    const client = new MoSPIClient();

    console.log("--- PLFS (Unemployment) Indicators ---");
    const plfsData = await client.getPLFSIndicators(2); // Quarterly
    console.log(JSON.stringify(plfsData, null, 2));

    console.log("\n--- CPI Indicators ---");
    const cpiData = await client.getCPIFilters("2012", "Group");
    console.log(JSON.stringify(cpiData, null, 2));

    console.log("\n--- IIP Indicators ---");
    const iipData = await client.getIIPFilters("2011-12", "Monthly");
    console.log(JSON.stringify(iipData, null, 2));

    console.log("\n--- NAS (GDP) Indicators ---");
    const nasData = await client.getNASIndicators();
    console.log(JSON.stringify(nasData, null, 2));

    console.log("\n--- ENERGY Indicators ---");
    const energyData = await client.getEnergyIndicators();
    console.log(JSON.stringify(energyData, null, 2));

    console.log("\n--- ASI Indicators ---");
    const asiData = await client.getASIFilters({ classification_year: '2008' });
    console.log(JSON.stringify(asiData, null, 2));
}

main();
