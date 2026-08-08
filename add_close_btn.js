const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'public', 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

const targetStr = `    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }
        });
    }`;

const replacementStr = `    if (mobileMenuBtn && navMenu) {
        const closeMenu = () => {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };

        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        });

        // Add a close button dynamically
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'mobile-menu-close-btn';
        navMenu.prepend(closeBtn);

        closeBtn.addEventListener('click', closeMenu);

        // Close menu when a link is clicked
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }`;

if (scriptContent.includes(targetStr)) {
    scriptContent = scriptContent.replace(targetStr, replacementStr);
    fs.writeFileSync(scriptPath, scriptContent);
    console.log('script.js updated.');
} else {
    console.log('Target string not found in script.js');
}

const stylesPath = path.join(__dirname, 'public', 'styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

if (!stylesContent.includes('.mobile-menu-close-btn')) {
    stylesContent += `

/* Mobile menu close button */
.mobile-menu-close-btn {
    display: none;
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    color: white;
    font-size: 3rem;
    cursor: pointer;
    line-height: 1;
    z-index: 1001;
    padding: 0;
}
@media (max-width: 768px) {
    .nav.active .mobile-menu-close-btn {
        display: block;
    }
}
`;
    fs.writeFileSync(stylesPath, stylesContent);
    console.log('styles.css updated.');
}
