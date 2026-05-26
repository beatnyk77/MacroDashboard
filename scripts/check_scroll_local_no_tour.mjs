import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Set localStorage seen flag on the domain before navigating
    await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gq_tour_seen', '1');
    });

    console.log("Navigating to local development server: http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Wait a brief moment
    console.log("Waiting 2 seconds...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify if welcome tour is open
    const hasTourDialog = await page.evaluate(() => {
        return !!document.querySelector('[role="dialog"]') || !!document.querySelector('.MuiModal-root');
    });
    console.log("Welcome tour modal present in DOM:", hasTourDialog);

    // Now test scrolling the page
    console.log("Attempting to scroll the document page naturally...");
    await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollBy(0, 300);
    });

    // Wait a brief moment for layout/paint
    await new Promise(resolve => setTimeout(resolve, 500));

    const scrollResult = await page.evaluate(() => {
        return {
            scrollY: window.scrollY,
            overflowStyle: window.getComputedStyle(document.body).overflowY,
            heightStyle: window.getComputedStyle(document.body).height
        };
    });

    console.log("Scroll test results:");
    console.log(`- Scroll Y Position: ${scrollResult.scrollY}px`);
    console.log(`- Body overflow-y: ${scrollResult.overflowStyle}`);
    console.log(`- Body height: ${scrollResult.heightStyle}`);

    if (scrollResult.scrollY > 0) {
        console.log("SUCCESS: Natural document body scrolling is working perfectly without welcome tour!");
    } else {
        console.log("ERROR: Page did not scroll. Scroll-lock or layout lock is active.");
        process.exit(1);
    }

    await browser.close();
})();
