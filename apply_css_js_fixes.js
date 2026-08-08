const fs = require('fs');
const path = require('path');

const stylesPath = path.join(__dirname, 'public', 'styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

// Add global responsive text wrapping and overflow prevention
if (!stylesContent.includes('/* === RESPONSIVE TEXT & OVERFLOW FIXES === */')) {
    stylesContent += `

/* === RESPONSIVE TEXT & OVERFLOW FIXES === */
html, body {
    max-width: 100%;
    overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6, p, span, a, div {
    overflow-wrap: anywhere;
    word-break: break-word;
}

video, iframe, img {
    max-width: 100%;
    height: auto;
}

/* Ensure video wrappers are responsive */
.video-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
}

.video-wrapper video, .video-wrapper iframe {
    width: 100%;
    height: auto;
    object-fit: cover;
}

/* Fix mobile nav overlay */
@media (max-width: 768px) {
    .nav.active {
        position: fixed;
        top: 80px;
        left: 0;
        width: 100%;
        height: calc(100vh - 80px);
        background: var(--color-bg);
        z-index: 1000;
        padding: 2rem;
        display: flex !important;
        flex-direction: column;
        align-items: center;
        overflow-y: auto;
    }
}
`;
    fs.writeFileSync(stylesPath, stylesContent);
    console.log('styles.css updated.');
}

const scriptPath = path.join(__dirname, 'public', 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

if (scriptContent.includes("navMenu.classList.toggle('active');") && !scriptContent.includes("document.body.style.overflow =")) {
    scriptContent = scriptContent.replace(
        "navMenu.classList.toggle('active');",
        `navMenu.classList.toggle('active');
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }`
    );
    fs.writeFileSync(scriptPath, scriptContent);
    console.log('script.js updated.');
}

// Fix video scaling in film.html which had height: 600px hardcoded
// Actually we need to make sure inline heights on videos don't cause overflow on mobile.
const filmHtmlPath = path.join(__dirname, 'public', 'film.html');
if (fs.existsSync(filmHtmlPath)) {
    let filmHtml = fs.readFileSync(filmHtmlPath, 'utf8');
    filmHtml = filmHtml.replace(/height:\s*600px/g, 'height: auto; aspect-ratio: 16/9');
    filmHtml = filmHtml.replace(/height:\s*400px/g, 'height: auto; aspect-ratio: 16/9');
    fs.writeFileSync(filmHtmlPath, filmHtml);
}
