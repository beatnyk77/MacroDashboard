import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log("Navigating to https://graphiquestor.com...");
    await page.goto('https://graphiquestor.com', { waitUntil: 'networkidle2' });
    
    // Test if we can scroll the body
    const initialScroll = await page.evaluate(() => {
        window.scrollBy(0, 100);
        return {
            windowScrollY: window.scrollY,
            bodyScrollTop: document.body.scrollTop,
            htmlScrollTop: document.documentElement.scrollTop
        };
    });
    console.log("Initial Scroll test:", initialScroll);

    console.log("Executing user diagnostics script...");
    const diagnostics = await page.evaluate(() => {
        let removedElements = [];
        
        // Remove blocking overlays
        const blockers = ['dialog', '.modal', '.modal-backdrop', '.overlay', '.welcome-tour', '.tour', '.popup', '.lightbox', '[role="dialog"]', '[role="alertdialog"]'];
        blockers.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                removedElements.push(el.className || el.tagName);
                el.remove();
            });
        });
        
        // Ensure body scrollable
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        
        // Remove fixed full-screen overlays
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' && 
                style.top === '0px' && style.left === '0px' &&
                style.width === '100%' && style.height === '100%' &&
                parseInt(style.zIndex) > 9999) {
                removedElements.push(el.className || el.tagName);
                el.remove();
            }
        });
        
        window.scrollBy(0, 100);
        
        return {
            removedElements,
            windowScrollYAfter: window.scrollY
        };
    });

    console.log("Diagnostics results:", JSON.stringify(diagnostics, null, 2));
    
    await browser.close();
})();
