const fs = require('fs');
const path = require('path');

const stylesPath = path.join(__dirname, 'public', 'styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

if (!stylesContent.includes('.film-gallery img')) {
    stylesContent += `

/* === RESPONSIVE GALLERY FIXES === */
@media (max-width: 768px) {
    .film-gallery, .gallery-grid {
        grid-template-columns: 1fr !important;
    }
    .film-gallery img, .film-gallery video, .gallery-grid img {
        height: auto !important;
        grid-column: 1 !important;
        aspect-ratio: 4/3;
    }
}
`;
    fs.writeFileSync(stylesPath, stylesContent);
    console.log('styles.css responsive gallery updated.');
}
