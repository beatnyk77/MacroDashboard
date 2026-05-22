import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Navigating to local development server: http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Wait a brief moment for any tour modal timers to trigger
    console.log("Waiting 2 seconds...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify if welcome tour is open or closed
    const hasTourDialog = await page.evaluate(() => {
        return !!document.querySelector('[role="dialog"]') || !!document.querySelector('.MuiModal-root');
    });
    console.log("Welcome tour modal present in DOM:", hasTourDialog);

    // If it is present, let's dismiss it by clicking the close button
    if (hasTourDialog) {
        console.log("Tour modal is present, attempting to close it by clicking Close/Start button...");
        await page.evaluate(() => {
            // Find and click the close icon or primary action
            const closeBtn = document.querySelector('button[aria-label="Close welcome tour"]') || 
                             Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Start') || el.textContent.includes('Next'));
            if (closeBtn) closeBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Now test scrolling the page
    console.log("Attempting to scroll the document page naturally...");
    const scrollResult = await page.evaluate(() => {
        window.scrollBy(0, 300);
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
        console.log("SUCCESS: Natural document body scrolling is working perfectly!");
    } else {
        console.log("ERROR: Page did not scroll. Scroll-lock or layout lock is active.");
        process.exit(1);
    }

    await browser.close();
})();
