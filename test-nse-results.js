const https = require('https');

const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/'
};

async function test() {
    try {
        const fetch = (await import('node-fetch')).default || globalThis.fetch;
        if (!fetch) throw new Error("no fetch");
        
        const res = await fetch('https://www.nseindia.com', { headers: baseHeaders });
        let cookie = res.headers.get('set-cookie');
        
        if (!cookie && typeof res.headers.getSetCookie === 'function') {
            cookie = res.headers.getSetCookie().join('; ');
        }
        
        const qUrl = 'https://www.nseindia.com/api/corporates-financial-results?index=equities&symbol=RELIANCE';
        const qRes = await fetch(qUrl, { headers: { ...baseHeaders, 'Cookie': cookie } });
        if (qRes.ok) {
            const data = await qRes.json();
            console.log(data.length);
            if (data.length > 0) console.log(JSON.stringify(data[0]).substring(0, 500));
        } else {
            console.log("Status:", qRes.status);
            console.log(await qRes.text());
        }
    } catch(e) {
        console.error(e);
    }
}
test();
