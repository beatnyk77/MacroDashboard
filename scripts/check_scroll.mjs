import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log("Navigating to local dev server...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    const headStyles = await page.evaluate(() => {
        const styles = Array.from(document.querySelectorAll('style'));
        return styles.map(s => ({
            id: s.id,
            attributes: Array.from(s.attributes).map(a => `${a.name}="${a.value}"`),
            textContent: s.textContent.substring(0, 100)
        })).filter(s => s.attributes.some(a => a.includes('radix') || a.includes('scroll')));
    });
    
    console.log("Radix/Scroll prevent styles in head:", headStyles);
    
    const bodyStyles = await page.evaluate(() => {
        return document.body.style.cssText;
    });
    
    console.log("Inline styles on body:", bodyStyles);

    await browser.close();
})();
