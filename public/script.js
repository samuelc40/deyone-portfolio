// Force browser to always start at the top of the page on load
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

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
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav');
    if (mobileMenuBtn && navMenu) {
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
    }

    // Global handler for broken images (e.g. if user deleted placeholder files)
    window.addEventListener('error', function(e) {
        if (e.target && e.target.tagName) {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'img' || tag === 'video' || tag === 'source') {
                const wrapper = e.target.closest('.image-wrapper') || e.target.closest('.video-wrapper');
                if (wrapper) {
                    wrapper.style.backgroundColor = '#111';
                    wrapper.style.display = 'flex';
                    wrapper.style.alignItems = 'center';
                    wrapper.style.justifyContent = 'center';
                    wrapper.style.border = '1px solid #333';
                    wrapper.innerHTML = '<span style="color: #fff; font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase; text-align: center; padding: 1rem;">Coming Soon</span>';
                } else {
                    e.target.style.display = 'none';
                }
            }
        }
    }, true);

    // Fetch and sync active theme variables from backend
    fetch('/api/theme')
        .then(res => res.json())
        .then(theme => {
            localStorage.setItem('deyone_portfolio_theme', JSON.stringify(theme));
            const root = document.documentElement;
            for (const [key, value] of Object.entries(theme.variables)) {
                root.style.setProperty(key, value);
            }
            root.className = 'theme-' + theme.id;
        })
        .catch(err => console.error('Failed to sync theme from backend', err));
    // Fetch and render dynamic home page data
    fetch('/api/home')
        .then(res => res.json())
        .then(data => {
            // Hero section elements
            const heroBg = document.getElementById('hero-bg');
            const heroEyebrow = document.getElementById('hero-eyebrow');
            const heroTitle = document.getElementById('hero-title');
            const heroDesc = document.getElementById('hero-desc');

            if (heroBg && data.hero.image) {
                heroBg.style.backgroundImage = `url('assets/images/${data.hero.image}')`;
            }
            if (heroEyebrow) heroEyebrow.textContent = data.hero.eyebrow;
            if (heroTitle) heroTitle.innerHTML = data.hero.title.replace(/\n/g, '<br>');
            if (heroDesc) heroDesc.innerHTML = data.hero.description.replace(/\n/g, '<br>');

            // About section elements
            const aboutImage = document.getElementById('about-image');
            const aboutEyebrow = document.getElementById('about-eyebrow');
            const aboutTitle = document.getElementById('about-title');
            const aboutDesc1 = document.getElementById('about-desc1');
            const aboutDesc2 = document.getElementById('about-desc2');

            if (aboutImage && data.about.image) {
                aboutImage.src = `assets/images/${data.about.image}`;
            }
            if (aboutEyebrow) aboutEyebrow.textContent = data.about.eyebrow;
            if (aboutTitle) aboutTitle.textContent = data.about.title;
            if (aboutDesc1) aboutDesc1.textContent = data.about.description1;
            if (aboutDesc2) aboutDesc2.textContent = data.about.description2;

            // Stories Intro
            if (data.storiesIntro) {
                const sie = document.getElementById('stories-intro-eyebrow');
                const sit = document.getElementById('stories-intro-title');
                const sid = document.getElementById('stories-intro-description');
                if (sie) sie.textContent = data.storiesIntro.eyebrow;
                if (sit) sit.textContent = data.storiesIntro.title;
                if (sid) sid.textContent = data.storiesIntro.description;
            }

            // Films Intro
            if (data.filmsIntro) {
                const fie = document.getElementById('films-intro-eyebrow');
                const fit = document.getElementById('films-intro-title');
                const fid = document.getElementById('films-intro-description');
                if (fie) fie.textContent = data.filmsIntro.eyebrow;
                if (fit) fit.textContent = data.filmsIntro.title;
                if (fid) fid.textContent = data.filmsIntro.description;
            }

            // Services
            if (data.services) {
                const se = document.getElementById('services-eyebrow');
                const st = document.getElementById('services-title');
                if (se) se.textContent = data.services.eyebrow;
                if (st) st.textContent = data.services.title;

                const s1t = document.getElementById('services-1-title');
                const s1d = document.getElementById('services-1-desc');
                if (s1t) s1t.textContent = data.services.service1Title;
                if (s1d) s1d.textContent = data.services.service1Desc;

                const s2t = document.getElementById('services-2-title');
                const s2d = document.getElementById('services-2-desc');
                if (s2t) s2t.textContent = data.services.service2Title;
                if (s2d) s2d.textContent = data.services.service2Desc;

                const s3t = document.getElementById('services-3-title');
                const s3d = document.getElementById('services-3-desc');
                if (s3t) s3t.textContent = data.services.service3Title;
                if (s3d) s3d.textContent = data.services.service3Desc;
            }

            // Contact & Footer
            if (data.contact) {
                const ct = document.getElementById('contact-title');
                const cd = document.getElementById('contact-description');
                const cel = document.getElementById('contact-email-link');
                if (ct) ct.textContent = data.contact.title;
                if (cd) cd.textContent = data.contact.description;
                if (cel) {
                    cel.textContent = data.contact.email;
                    cel.href = `mailto:${data.contact.email}`;
                }

                const loc = document.getElementById('contact-location-text');
                const ph = document.getElementById('contact-phone-text');
                const syn = document.getElementById('contact-syndication-text');
                if (loc) loc.textContent = data.contact.location;
                if (ph) ph.textContent = data.contact.phone;
                if (syn) syn.textContent = data.contact.syndication;

                const prof = document.getElementById('contact-profile-text');
                if (prof) prof.textContent = data.contact.profile;

                const ig = document.getElementById('contact-social-instagram-link');
                const tw = document.getElementById('contact-social-twitter-link');
                const fb = document.getElementById('contact-social-facebook-link');
                const li = document.getElementById('contact-social-linkedin-link');

                const formatUrl = (url) => {
                    if (!url || url === '#') return '#';
                    if (!url.startsWith('http://') && !url.startsWith('https://')) return `https://${url}`;
                    return url;
                };

                if (ig) ig.href = formatUrl(data.contact.socialInstagram);
                if (tw) tw.href = formatUrl(data.contact.socialTwitter);
                if (fb) fb.href = formatUrl(data.contact.socialFacebook);
                if (li) li.href = formatUrl(data.contact.socialLinkedin);
            }
        })
        .catch(err => console.error('Failed to load home page content', err));

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    window.setupAnimations = function() {
        const animatedElements = document.querySelectorAll('.fade-in-up:not(.visible)');
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    };

    // Initial run of observer setup
    window.setupAnimations();

    // Lightbox Modal logic
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const closeBtn = document.querySelector('.lightbox-close');

        // Event delegation to capture dynamically loaded gallery images
        document.body.addEventListener('click', (e) => {
            const img = e.target.closest('.gallery-grid img');
            if (img) {
                lightbox.style.display = 'block';
                lightboxImg.src = img.src;
                lightboxCaption.textContent = img.alt || '';
                document.body.style.overflow = 'hidden'; // Disable page scrolling
            }
        });

        const closeLightbox = () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto'; // Enable page scrolling
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === closeBtn) {
                closeLightbox();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.style.display === 'block') {
                closeLightbox();
            }
        });
    }

    // ==========================================
    // DYNAMIC FRONTEND LOADERS
    // ==========================================

    // 1. Load Homepage Stories
    const homeStoryInfo = document.getElementById('home-story-info');
    const homeStoryGrid = document.getElementById('home-story-grid');
    if (homeStoryInfo && homeStoryGrid) {
        fetch('/api/stories')
            .then(res => res.json())
            .then(stories => {
                if (stories.length > 0) {
                    // Reverse the array to show the newest uploads first
                    stories.reverse();

                    const displayStories = stories.slice(0, 4);
                    let gridHtml = '';
                    
                    if (displayStories.length > 0) {
                        const s1 = displayStories[0];
                        gridHtml += `
                            <div class="grid-main">
                                <div class="image-wrapper hover-title" onclick="window.location.href='story.html?id=${s1.id}'" style="cursor: pointer; position: relative; height: 100%;">
                                    <img src="assets/images/${s1.mainImage}" alt="${escapeHTML(s1.title)}" style="height: 100%; width: 100%; object-fit: cover;">
                                    <div class="hover-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; color: white; font-family: var(--font-heading); font-size: 2rem; text-align: center; padding: 1rem;">${escapeHTML(s1.title)}</div>
                                </div>
                            </div>
                            <div class="grid-sub">
                        `;
                    } else {
                        // 0 stories, render main placeholder
                        gridHtml += `
                            <div class="grid-main">
                                <div class="image-wrapper" style="height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                    <span style="color: #fff; font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                                </div>
                            </div>
                            <div class="grid-sub">
                        `;
                    }
                    
                    for (let i = 1; i < 4; i++) {
                            const s = displayStories[i];
                            const spanClass = i === 3 ? ' span-2' : '';
                            if (s) {
                                gridHtml += `
                                <div class="image-wrapper${spanClass} hover-title" onclick="window.location.href='story.html?id=${s.id}'" style="cursor: pointer; position: relative; height: 100%;">
                                    <img src="assets/images/${s.mainImage}" alt="${escapeHTML(s.title)}" style="height: 100%; object-fit: cover; width: 100%;">
                                    <div class="hover-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; color: white; font-family: var(--font-heading); font-size: 1.5rem; text-align: center; padding: 1rem;">${escapeHTML(s.title)}</div>
                                </div>
                                `;
                            } else {
                                gridHtml += `
                                <div class="image-wrapper${spanClass}" style="height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                    <span style="color: #fff; font-size: 1rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                                </div>
                                `;
                            }
                        }
                        gridHtml += `</div>`;
                    
                    homeStoryGrid.innerHTML = gridHtml;

                    document.querySelectorAll('#home-story-grid .hover-title').forEach(el => {
                        el.addEventListener('mouseenter', () => el.querySelector('.hover-overlay').style.opacity = '1');
                        el.addEventListener('mouseleave', () => el.querySelector('.hover-overlay').style.opacity = '0');
                    });
                    
                    window.setupAnimations();
                } else {
                    let gridHtml = `
                        <div class="grid-main">
                            <div class="image-wrapper hover-title" style="cursor: default; position: relative; height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                <span style="color: #fff; font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                            </div>
                        </div>
                        <div class="grid-sub">
                    `;
                    for (let i = 1; i < 4; i++) {
                        const spanClass = i === 3 ? ' span-2' : '';
                        gridHtml += `
                            <div class="image-wrapper${spanClass}" style="height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                <span style="color: #fff; font-size: 1rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                            </div>
                        `;
                    }
                    gridHtml += `</div>`;
                    homeStoryGrid.innerHTML = gridHtml;
                }
            })
            .catch(err => console.error('Failed to load homepage story', err));
    }

    // 2. Load Homepage Films
    const homeFilmsGrid = document.getElementById('home-films-grid');
    const homeFilmsInfo = document.getElementById('home-films-info');
    if (homeFilmsGrid) {
        fetch('/api/films')
            .then(res => res.json())
            .then(films => {
                if (films.length > 0) {
                    // Reverse the array to show the newest uploads first
                    films.reverse();

                    const displayFilms = films.slice(0, 4);
                    let gridHtml = '';
                    
                    if (displayFilms.length > 0) {
                        const f1 = displayFilms[0];
                        gridHtml += `
                            <div class="grid-main">
                                <div class="image-wrapper hover-title" onclick="window.location.href='film.html?id=${f1.id}'" style="cursor: pointer; position: relative; height: 100%;">
                                    <video class="film-hover-video" loop muted autoplay playsinline poster="/assets/images/${f1.poster}" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 0;">
                                        <source src="${getMediaUrl(f1.videoUrl)}" type="video/mp4">
                                    </video>
                                    <div class="hover-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; color: white; font-family: var(--font-heading); font-size: 2rem; text-align: center; padding: 1rem; z-index: 10;">${escapeHTML(f1.title)}</div>
                                </div>
                            </div>
                            <div class="grid-sub">
                        `;
                    } else {
                        // 0 films, render main placeholder
                        gridHtml += `
                            <div class="grid-main">
                                <div class="image-wrapper" style="height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                    <span style="color: #fff; font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                                </div>
                            </div>
                            <div class="grid-sub">
                        `;
                    }
                    
                    for (let i = 1; i < 4; i++) {
                            const f = displayFilms[i];
                            const spanClass = i === 3 ? ' span-2' : '';
                            if (f) {
                                gridHtml += `
                                <div class="image-wrapper${spanClass} hover-title" onclick="window.location.href='film.html?id=${f.id}'" style="cursor: pointer; position: relative; height: 100%;">
                                    <video class="film-hover-video" loop muted autoplay playsinline poster="/assets/images/${f.poster}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0; display: block;">
                                        <source src="${getMediaUrl(f.videoUrl)}" type="video/mp4">
                                    </video>
                                    <div class="hover-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; color: white; font-family: var(--font-heading); font-size: 1.5rem; text-align: center; padding: 1rem; z-index: 10;">${escapeHTML(f.title)}</div>
                                </div>
                                `;
                            } else {
                                gridHtml += `
                                <div class="image-wrapper${spanClass}" style="height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                    <span style="color: #fff; font-size: 1rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                                </div>
                                `;
                            }
                        }
                        gridHtml += `</div>`;
                    
                    homeFilmsGrid.innerHTML = gridHtml;

                    document.querySelectorAll('#home-films-grid .hover-title').forEach(el => {
                        el.addEventListener('mouseenter', () => {
                            el.querySelector('.hover-overlay').style.opacity = '1';
                            const video = el.querySelector('video.film-hover-video');
                            if (video) video.play().catch(e => console.log('Autoplay prevented'));
                        });
                        el.addEventListener('mouseleave', () => {
                            el.querySelector('.hover-overlay').style.opacity = '0';
                            const video = el.querySelector('video.film-hover-video');
                            if (video) {
                                video.pause();
                                video.currentTime = 0; // Reset video to start
                            }
                        });
                    });
                    
                    window.setupAnimations();
                } else {
                    if (homeFilmsInfo) {
                    }
                    let gridHtml = `
                        <div class="grid-main">
                            <div class="image-wrapper hover-title" style="cursor: default; position: relative; height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                <span style="color: #fff; font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                            </div>
                        </div>
                        <div class="grid-sub">
                    `;
                    for (let i = 1; i < 4; i++) {
                        const spanClass = i === 3 ? ' span-2' : '';
                        gridHtml += `
                            <div class="image-wrapper${spanClass}" style="height: 100%; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                                <span style="color: #fff; font-size: 1rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                            </div>
                        `;
                    }
                    gridHtml += `</div>`;
                    homeFilmsGrid.innerHTML = gridHtml;
                }
            })
            .catch(err => console.error('Failed to load homepage films', err));
    }

    // 3. Load Homepage Blog Posts
    const homeBlogList = document.getElementById('home-blog-list');
    if (homeBlogList) {
        fetch('/api/blogs')
            .then(res => res.json())
            .then(blogs => {
                if (blogs.length > 0) {
                    blogs.reverse(); // Show newest first
                    homeBlogList.innerHTML = '';
                    // Display latest 2 posts
                    blogs.slice(0, 2).forEach(blog => {
                        const article = document.createElement('article');
                        article.style.cssText = 'padding: 2rem 0; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center;';
                        article.innerHTML = `
                            <div>
                                <span style="color: var(--color-accent); font-size: 0.75rem; letter-spacing: 2px;">${blog.date}</span>
                                <h4 style="font-family: var(--font-heading); font-size: 1.5rem; color: #fff; margin: 0.5rem 0;">${blog.title}</h4>
                            </div>
                            <a href="blog-post.html?id=${blog.id}" class="link-arrow">READ <span>&rarr;</span></a>
                        `;
                        homeBlogList.appendChild(article);
                    });
                    window.setupAnimations();
                } else {
                    const blogSection = document.getElementById('blog');
                    if (blogSection) blogSection.style.display = 'none';
                }
            })
            .catch(err => console.error('Failed to load homepage blogs', err));
    }

    // 4. Contact Form Submission Handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusDiv = document.getElementById('contact-status');
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            statusDiv.style.display = 'block';
            statusDiv.style.color = '#ccc';
            statusDiv.style.borderLeftColor = '#ccc';
            statusDiv.textContent = 'Sending message...';

            try {
                const res = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });

                if (res.ok) {
                    statusDiv.style.color = '#81c784';
                    statusDiv.style.borderLeftColor = '#81c784';
                    statusDiv.textContent = 'Thank you! Your message has been sent successfully.';
                    contactForm.reset();
                } else {
                    const data = await res.json();
                    statusDiv.style.color = '#e57373';
                    statusDiv.style.borderLeftColor = '#e57373';
                    statusDiv.textContent = data.error || 'Failed to send message. Please check input.';
                }
            } catch (err) {
                statusDiv.style.color = '#e57373';
                statusDiv.style.borderLeftColor = '#e57373';
                statusDiv.textContent = 'Error connecting to the server. Please try again later.';
            }
        });
    }

    // 5. Load Stories Feed Page
    const storiesFeedGrid = document.querySelector('.stories-grid');
    if (storiesFeedGrid && window.location.pathname.includes('stories.html')) {
        fetch('/api/stories')
            .then(res => res.json())
            .then(stories => {
                if (stories.length > 0) {
                    stories.reverse();
                    storiesFeedGrid.innerHTML = '';
                    stories.forEach(story => {
                        const card = document.createElement('div');
                        card.className = 'film-card fade-in-up';
                        card.style.cursor = 'pointer';
                        card.onclick = () => window.location.href = `story.html?id=${story.id}`;
                        card.innerHTML = `
                            <div class="video-wrapper">
                                <img src="assets/images/${story.mainImage}" alt="${escapeHTML(story.title)}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; pointer-events: none;">
                            </div>
                            <div>
                                <div class="film-meta">
                                    <span>${escapeHTML(story.category)}</span>
                                </div>
                                <h3 class="film-title">${escapeHTML(story.title)}</h3>
                                <p class="film-description">${escapeHTML(story.subtitle || story.description.substring(0,100)+'...')}</p>
                            </div>
                        `;
                        storiesFeedGrid.appendChild(card);
                    });
                    window.setupAnimations();
                } else {
                    storiesFeedGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; height: 300px; display: flex; align-items: center; justify-content: center;">
                        </div>
                    `;
                }
            })
            .catch(err => console.error('Failed to load stories grid', err));
    }

    // 6. Load Blog Feed Page
    const blogFeedGrid = document.querySelector('.blog-grid');
    if (blogFeedGrid && window.location.pathname.includes('blog.html')) {
        fetch('/api/blogs')
            .then(res => res.json())
            .then(blogs => {
                if (blogs.length > 0) {
                    blogFeedGrid.innerHTML = '';
                    blogs.forEach(blog => {
                        const article = document.createElement('article');
                        article.className = 'blog-card fade-in-up';
                        
                        const hasExcerptHTML = /<\/?[a-z][\s\S]*>/i.test(blog.excerpt);
                        const formattedExcerpt = hasExcerptHTML ? blog.excerpt : blog.excerpt.replace(/\n/g, '<br>');

                        article.innerHTML = `
                            <div class="blog-card-left">
                                <span class="blog-card-meta">${blog.date} &bull; ${blog.category}</span>
                                <h3 class="blog-card-title"><a href="blog-post.html?id=${blog.id}">${blog.title}</a></h3>
                                <p class="blog-card-excerpt" style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${formattedExcerpt}</p>
                                <a href="blog-post.html?id=${blog.id}" class="link-arrow">READ STORY <span>&rarr;</span></a>
                            </div>
                            <div class="blog-card-right">
                                ${renderCoverMedia(blog.image, blog.title)}
                            </div>
                        `;
                        blogFeedGrid.appendChild(article);
                    });
                    window.setupAnimations();
                } else {
                    const blogSection = document.getElementById('blog');
                    if (blogSection) {
                        blogSection.style.display = 'none'; // Hide on homepage
                    } else if (window.location.pathname.includes('blog.html')) {
                        // Show coming soon on dedicated blog page
                        blogFeedGrid.innerHTML = `
                            <div style="width: 100%; height: 200px; display: flex; align-items: center; justify-content: center;">
                            </div>
                        `;
                    }
                }
            })
            .catch(err => console.error('Failed to load blog feed', err));
    }

    // 6. Load Films Page Grid
    const filmsGrid = document.querySelector('.films-grid');
    if (filmsGrid && window.location.pathname.includes('films.html')) {
        fetch('/api/films')
            .then(res => res.json())
            .then(films => {
                if (films.length > 0) {
                    films.reverse();
                    filmsGrid.innerHTML = '';
                    films.forEach(film => {
                        const card = document.createElement('div');
                        card.className = 'film-card fade-in-up';
                        card.style.cursor = 'pointer';
                        card.onclick = () => window.location.href = `film.html?id=${film.id}`;
                        
                        card.innerHTML = `
                            <div class="video-wrapper">
                                <video loop muted autoplay playsinline poster="assets/images/${film.poster || 'main.png'}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; pointer-events: none;">
                                    <source src="${getMediaUrl(film.videoUrl)}" type="video/mp4">
                                </video>
                            </div>
                            <div>
                                <div class="film-meta">
                                    <span>Duration: ${escapeHTML(film.duration)}</span>
                                    <span>&bull;</span>
                                    <span>Location: ${escapeHTML(film.location)}</span>
                                </div>
                                <h3 class="film-title">${escapeHTML(film.title)}</h3>
                                <p class="film-description">${escapeHTML(film.description.substring(0, 150) + '...')}</p>
                            </div>
                        `;
                        filmsGrid.appendChild(card);
                    });
                    window.setupAnimations();
                } else {
                    filmsGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; height: 300px; display: flex; align-items: center; justify-content: center;">
                        </div>
                    `;
                }
            })
            .catch(err => console.error('Failed to load films grid', err));
    }

    // 6.5 Load Dynamic Film Detail Template Page
    const filmDetailContainer = document.getElementById('film-detail-container');
    if (filmDetailContainer && window.location.pathname.includes('film.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const filmId = urlParams.get('id');

        fetch(`/api/films/${filmId}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(film => {
                let galleryHtml = '';
                if (film.gallery && film.gallery.length > 0) {
                    galleryHtml = '<div class="film-gallery" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 3rem;">';
                    film.gallery.forEach((media, idx) => {
                        const url = getMediaUrl(media.src);
                        const isWide = (idx % 3 === 2);
                        const span = isWide ? 'grid-column: span 2;' : '';
                        const height = isWide ? '600px' : '400px';
                        
                        if (media.type === 'video' || (media.src && media.src.match(/\.(mp4|webm|ogg|mov)$/i))) {
                            galleryHtml += `<video autoplay loop muted playsinline style="width: 100%; height: ${height}; ${span} object-fit: cover; border-radius: 4px;" class="fade-in-up"><source src="${url}" type="video/mp4"></video>`;
                        } else {
                            galleryHtml += `<img src="${url}" class="fade-in-up" style="width: 100%; height: ${height}; ${span} object-fit: cover; border-radius: 4px; cursor: pointer;" onclick="openLightbox('${url}', 'Gallery Image')">`;
                        }
                    });
                    galleryHtml += '</div>';
                }

                const descHTML = film.description
                    .split('\n')
                    .filter(p => p.trim() !== '')
                    .map(p => `<p class="fade-in-up" style="margin-bottom: 1.5rem; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;">${escapeHTML(p)}</p>`)
                    .join('');

                filmDetailContainer.innerHTML = `
                    <div style="padding-top: 120px; max-width: 1200px; margin: 0 auto; padding-left: 4rem; padding-right: 4rem;">
                        <div class="fade-in-up" style="text-align: center; margin-bottom: 3rem;">
                            <span class="eyebrow" style="color: var(--color-accent); margin-bottom: 1rem; display: block; text-transform: uppercase; letter-spacing: 2px;">DOCUMENTARY FILM</span>
                            <h1 style="font-family: var(--font-heading); font-size: 3.5rem; color: #fff; margin-bottom: 1.5rem; line-height: 1.2; word-wrap: break-word; overflow-wrap: break-word;">${escapeHTML(film.title)}</h1>
                            <div class="film-meta" style="color: var(--color-text-muted); display: flex; gap: 1rem; justify-content: center; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
                                <span>Duration: ${escapeHTML(film.duration)}</span>
                                <span>&bull;</span>
                                <span>Location: ${escapeHTML(film.location)}</span>
                            </div>
                        </div>

                        <div class="fade-in-up" style="margin-bottom: 4rem;">
                            <video controls style="width: 100%; height: auto; display: block; border-radius: 4px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); background: #000;">
                                <source src="${getMediaUrl(film.videoUrl)}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>

                        <section class="story-content fade-in-up" style="max-width: 900px; margin: 0 auto 4rem auto; line-height: 1.8; color: #ddd; font-size: 1.1rem; text-align: center;">
                            ${descHTML}
                        </section>

                        ${galleryHtml}
                        
                        <div style="text-align: center; margin-top: 4rem; padding-top: 4rem; border-top: 1px solid var(--border-color);">
                            <a href="films.html" class="btn btn-outline" style="text-decoration: none; padding: 1rem 2rem; border: 1px solid var(--border-color); color: var(--color-text); text-transform: uppercase; letter-spacing: 2px;">BACK TO FILMS</a>
                        </div>
                    </div>
                `;
                
                window.setupAnimations();
            })
            .catch(err => {
                filmDetailContainer.innerHTML = '<div style="text-align: center; padding: 4rem; color: #fff;">Film not found or failed to load.</div>';
                console.error(err);
            });
    }

    // 7. Load Dynamic Story Detail Template Page
    const storyHeroSection = document.querySelector('.story-hero');
    if (storyHeroSection && window.location.pathname.includes('story.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = urlParams.get('id') || 'life-along-backwaters';

        fetch(`/api/stories/${storyId}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(story => {
                // Populate Hero
                storyHeroSection.querySelector('.eyebrow').textContent = story.category;
                storyHeroSection.querySelector('h1').textContent = story.title;
                storyHeroSection.querySelector('p').textContent = story.subtitle;
                const heroBg = document.getElementById('story-hero-bg');
                if (heroBg) {
                    heroBg.style.backgroundImage = `url('assets/images/${story.mainImage}')`;
                }

                // Populate Content Description
                const descSection = document.querySelector('.story-content');
                if (descSection) {
                    const hasHTML = /<\/?[a-z][\s\S]*>/i.test(story.description);
                    if (hasHTML) {
                        descSection.innerHTML = story.description;
                    } else {
                        descSection.innerHTML = '';
                        const paragraphs = story.description.split('\n\n');
                        paragraphs.forEach(pText => {
                            const p = document.createElement('p');
                            p.className = 'fade-in-up';
                            p.textContent = pText;
                            p.style.marginBottom = '2rem';
                            descSection.appendChild(p);
                        });
                    }
                }

                // Populate Gallery Grid
                const galleryGrid = document.querySelector('.gallery-grid');
                if (galleryGrid) {
                    galleryGrid.innerHTML = '';
                    if (story.gallery && story.gallery.length > 0) {
                        story.gallery.forEach((item, idx) => {
                            const img = document.createElement('img');
                            img.src = `assets/images/${item.src}`;
                            img.alt = item.alt;
                            img.className = 'fade-in-up';
                            img.style.cssText = 'width: 100%; object-fit: cover; border-radius: 4px;';
                            
                            if (idx % 3 === 2) {
                                img.style.height = '600px';
                                img.style.gridColumn = 'span 2';
                            } else {
                                img.style.height = '400px';
                            }
                            galleryGrid.appendChild(img);
                        });
                    } else {
                        // Empty gallery state
                        galleryGrid.innerHTML = `
                            <div style="grid-column: 1 / -1; height: 300px; background-color: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333; border-radius: 4px;">
                                <span style="color: #fff; font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase;">Coming Soon</span>
                            </div>
                        `;
                    }
                }
                window.setupAnimations();
            })
            .catch(err => {
                console.error('Failed to load story details', err);
                // Fallback details if story.json loading fails
            });
    }
});

function getMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url;
    }
    return `assets/images/${url}`;
}

function renderCoverMedia(filename, altText) {
    if (!filename) return '';
    const ext = filename.split('.').pop().toLowerCase();
    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
    const mediaUrl = getMediaUrl(filename);
    
    if (isVideo) {
        return `
            <video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 0;">
                <source src="${mediaUrl}" type="video/mp4">
            </video>
        `;
    } else {
        return `<img src="${mediaUrl}" alt="${altText}">`;
    }
}
