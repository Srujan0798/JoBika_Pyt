const puppeteer = require('puppeteer');

async function testPuppeteer() {
    console.log('🚀 Starting Puppeteer Test...');
    let browser;
    try {
        console.log('launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        console.log('✅ Browser launched successfully');

        const page = await browser.newPage();
        console.log('📄 New page created');

        await page.goto('https://example.com');
        console.log('🌐 Navigated to example.com');

        const title = await page.title();
        console.log(`📌 Page Title: ${title}`);

        if (title === 'Example Domain') {
            console.log('✅ Test PASSED: Title matches');
        } else {
            console.error('❌ Test FAILED: Title mismatch');
        }

    } catch (error) {
        console.error('❌ Puppeteer Test FAILED:', error);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

testPuppeteer();
