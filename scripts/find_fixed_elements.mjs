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

    const fixedElements = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        return els.map(el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                position: style.position,
                zIndex: style.zIndex,
                pointerEvents: style.pointerEvents,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
                opacity: style.opacity,
                display: style.display,
                visibility: style.visibility
            };
        }).filter(el => {
            return (el.position === 'fixed' || el.position === 'absolute') && 
                   el.width > 200 && el.height > 200;
        });
    });

    console.log("Fixed/Absolute screen-covering elements found:");
    console.log(JSON.stringify(fixedElements, null, 2));

    await browser.close();
})();
