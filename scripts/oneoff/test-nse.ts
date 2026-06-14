const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
    'Origin': 'https://www.nseindia.com',
};

async function getCookies() {
    const res = await fetch('https://www.nseindia.com', { headers: baseHeaders });
    const setCookie = res.headers.get('set-cookie');
    return setCookie;
}

async function fetchNSE(symbol) {
    const cookie = await getCookies();
    const res = await fetch(`https://www.nseindia.com/api/quote-equity?symbol=${symbol}&section=corp_info`, {
        headers: { ...baseHeaders, 'Cookie': cookie }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

fetchNSE('RELIANCE');
