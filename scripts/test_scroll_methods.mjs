import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gq_tour_seen', '1');
    });

    console.log("Navigating to http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const scrollResults = await page.evaluate(() => {
        const results = {};
        
        // Method 1: window.scrollTo
        window.scrollTo(0, 200);
        results.afterWindowScrollTo = {
            scrollY: window.scrollY,
            docScrollTop: document.documentElement.scrollTop,
            bodyScrollTop: document.body.scrollTop
        };
        
        // Method 2: document.documentElement.scrollTop
        document.documentElement.scrollTop = 250;
        results.afterDocScrollTop = {
            scrollY: window.scrollY,
            docScrollTop: document.documentElement.scrollTop,
            bodyScrollTop: document.body.scrollTop
        };

        // Method 3: document.body.scrollTop
        document.body.scrollTop = 300;
        results.afterBodyScrollTop = {
            scrollY: window.scrollY,
            docScrollTop: document.documentElement.scrollTop,
            bodyScrollTop: document.body.scrollTop
        };
        
        return results;
    });

    console.log("Scroll results across different methods:");
    console.log(JSON.stringify(scrollResults, null, 2));

    await browser.close();
})();
