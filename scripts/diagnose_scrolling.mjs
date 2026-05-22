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

    console.log("Navigating to local development server: http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const diagnostics = await page.evaluate(() => {
        const getStyle = (el) => {
            const style = window.getComputedStyle(el);
            return {
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                height: style.height,
                minHeight: style.minHeight,
                maxHeight: style.maxHeight,
                overflowY: style.overflowY,
                position: style.position,
                pointerEvents: style.pointerEvents,
                display: style.display
            };
        };

        const hierarchy = [];
        let current = document.querySelector('#main-content') || document.body;
        while (current) {
            hierarchy.push(getStyle(current));
            current = current.parentElement;
        }
        hierarchy.push(getStyle(document.documentElement));

        return {
            hierarchy,
            windowHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight,
            bodyHeight: document.body.scrollHeight,
            windowScrollY: window.scrollY
        };
    });

    console.log("Computed Style Hierarchy (from main-content up to html):");
    console.log(JSON.stringify(diagnostics.hierarchy, null, 2));
    console.log("\nViewport and Document Metrics:");
    console.log(`- Window Inner Height: ${diagnostics.windowHeight}px`);
    console.log(`- HTML Scroll Height: ${diagnostics.documentHeight}px`);
    console.log(`- Body Scroll Height: ${diagnostics.bodyHeight}px`);
    console.log(`- Current Scroll Y: ${diagnostics.windowScrollY}px`);

    await browser.close();
})();
