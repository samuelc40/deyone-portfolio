const fs = require('fs');
const file = '/home/kali/krampus/vscode/Deyone_Portfolio/public/script.js';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('function escapeHTML')) {
    const escapeFunc = `
// Helper to escape HTML and prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
`;
    content = escapeFunc + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed escapeHTML');
} else {
    console.log('escapeHTML already exists');
}
