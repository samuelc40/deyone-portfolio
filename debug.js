const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    const storiesHtml = await page.evaluate(() => document.getElementById('home-story-grid') ? document.getElementById('home-story-grid').innerHTML : 'NO GRID');
    console.log('--- STORIES GRID ---');
    console.log(storiesHtml);
    
    const filmsHtml = await page.evaluate(() => document.getElementById('home-films-grid') ? document.getElementById('home-films-grid').innerHTML : 'NO GRID');
    console.log('--- FILMS GRID ---');
    console.log(filmsHtml);
    
    await browser.close();
})();
