import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching headless browser...");
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

    console.log("Temporarily disabling scroll-behavior: smooth for instant feedback...");
    await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
    });

    console.log("Attempting to scroll the page naturally by 300px...");
    await page.evaluate(() => {
        window.scrollTo(0, 300);
    });

    // Wait a brief moment for layout/paint
    await new Promise(resolve => setTimeout(resolve, 500));

    const scrollResults = await page.evaluate(() => {
        return {
            scrollY: window.scrollY,
            docScrollTop: document.documentElement.scrollTop,
            bodyScrollTop: document.body.scrollTop,
            htmlScrollHeight: document.documentElement.scrollHeight,
            bodyScrollHeight: document.body.scrollHeight,
            bodyOverflowY: window.getComputedStyle(document.body).overflowY
        };
    });

    console.log("Scroll metrics:", scrollResults);

    if (scrollResults.scrollY >= 300 || scrollResults.docScrollTop >= 300) {
        console.log("SUCCESS: Document scrolling is confirmed working perfectly!");
    } else {
        console.log("FAILURE: Page failed to scroll naturally.");
        process.exit(1);
    }

    await browser.close();
})();
