const reporterCode = "840"; // USA
const year = "2023";
const comtradeKey = process.env.COMTRADE_API_KEY;

async function test() {
    const url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporterCode}&period=${year}&cmdCode=AG2&flowCode=X&partnerCode=0`;
    console.log(`Testing URL: ${url}`);
    const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Data count: ${data.data?.length || 0}`);
    if (data.data && data.data.length > 0) {
        console.log(`Sample:`, data.data[0]);
    }
}

test();
