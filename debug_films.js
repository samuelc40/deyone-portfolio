const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:3000/films.html', { waitUntil: 'networkidle0' });
    
    const filmsHtml = await page.evaluate(() => document.querySelector('.films-grid') ? document.querySelector('.films-grid').innerHTML : 'NO GRID');
    console.log('--- FILMS GRID ---');
    console.log(filmsHtml);
    
    await browser.close();
})();
