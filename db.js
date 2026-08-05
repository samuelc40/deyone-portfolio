const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');

// Helper to ensure files and directories exist
function initDB() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }

    const files = {
        'users.json': () => {
            // Default user: shutterbug / m9803fdss@@#08
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync('m9803fdss@@#08', salt);
            return [{ id: '1', username: 'shutterbug', password: hashedPassword }];
        },
        'stories.json': () => [
            {
                id: 'life-along-backwaters',
                title: 'Life Along the Backwaters',
                category: 'PHOTO ESSAY',
                subtitle: 'A visual journey through the lives of people who live, work and dream along the backwaters of Kerala.',
                description: 'The backwaters of Kerala form an intricate network of interconnected canals, rivers, lakes, and inlets. For centuries, they have been the lifeblood of the communities that reside along their banks. This photo essay documents the daily rhythms of these communities—from the elderly fishermen mending their traditional Chinese fishing nets before dawn, to the families whose entire livelihoods depend on the gentle ebb and flow of the tide.',
                mainImage: 'main.png',
                gallery: [
                    { src: 'grid1.png', alt: 'Mending nets before sunrise - Kerala Backwaters' },
                    { src: 'grid2.png', alt: 'Serene sunset over the waters' },
                    { src: 'main.png', alt: 'Life along the winding river canals' },
                    { src: 'about.png', alt: 'Local communities moving along the river banks' },
                    { src: 'film.png', alt: 'Boat passing through the misty morning fog' },
                    { src: 'hero.png', alt: 'Deep connection between nature and the local way of life' },
                    { src: 'grid3.png', alt: 'Wooden traditional house sitting at the edge of the canal' }
                ]
            }
        ],
        'films.json': () => [
            {
                id: '1',
                title: 'The Monsoon Project',
                duration: '12m',
                location: 'Western India',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                poster: 'main.png',
                description: 'A deep visual study on the impact of torrential monsoon seasons on local fishermen and rural coastal communities, highlighting their endurance and changing ways of life.'
            },
            {
                id: '2',
                title: 'Echoes of the Coast',
                duration: '8m',
                location: 'Norway Coast',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                poster: 'hero.png',
                description: 'An artistic and documentary portrait of traditional wooden boatbuilders keeping ancient Norse maritime crafts alive in the modern industrial era.'
            },
            {
                id: '3',
                title: 'Whispers of the Forest',
                duration: '15m',
                location: 'Western Ghats',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                poster: 'film.png',
                description: 'A close observation of the ancient sacred groves preserved by indigenous tribes, exploring the spiritual connection between their community and the local ecology.'
            },
            {
                id: '4',
                title: 'Rhythms of the Street',
                duration: '10m',
                location: 'Metropolitan Tokyo',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                poster: 'about.png',
                description: "An exploration of urban isolation and social persistence, capturing the quiet spaces and vibrant communities coexisting in Japan's major metropolitan centers."
            }
        ],
        'blogs.json': () => [
            {
                id: 'behind-lens-monsoon',
                title: 'Behind the lens: The Monsoon Project',
                date: 'OCT 24, 2026',
                category: 'BEHIND THE SCENES',
                image: 'main.png',
                excerpt: 'Reflections on shooting in extreme tropical rainfall along the coast of Kerala, capturing the resilience of local backwater communities, and keeping gear functioning in 98% humidity.',
                content: `
                    <p>The monsoon season along the southwestern coast of India is not just a weather pattern; it is a life-altering force that dictates every facet of existence. When we set out to capture "Life Along the Backwaters" during the monsoon, we knew the physical obstacles would be immense, but we did not fully anticipate the profound human stories that would unfold in the rain.</p>
                    <p>For three weeks, we lived among the fishing families of Alappuzha. Each morning began at 4:00 AM, in absolute darkness, under torrential downpours that felt like a solid sheet of water. The fishermen, wrapped in simple plastic sheets or traditional woven leaf garments, launched their wooden canoes into waters that had swollen beyond their natural boundaries.</p>
                    <blockquote>"The water gives us life, and the water takes it away. The monsoon is when we feel both truths most deeply."</blockquote>
                    <p>Photographing in these conditions is a constant battle against moisture. Despite weather-sealed camera bodies, water creeps into every seam. We utilized a combination of specialized dry bags, custom plastic wraps, and a relentless rotation of silica gel packs. Lenses were dried every few minutes, and changing a lens was an operation planned with military precision to prevent moisture from entering the sensor chamber.</p>
                    <p>But the technical challenges fade compared to the narratives. Our focus shifted from the landscape to the faces. The lines etched by decades of ocean spray and heavy rain tell a story of resilience that no text description can match. It is a testament to the human spirit's capacity to adjust, persist, and find quiet beauty amidst the storm.</p>
                    <p>As the project comes to a close, we hope these images convey not just the wetness of the rain, but the warmth of the hearth fire inside the wooden homes by the canal edges, and the deep, enduring dignity of the backwater community.</p>
                `
            },
            {
                id: 'exhibition-london',
                title: 'Exhibition opening in London',
                date: 'SEP 12, 2026',
                category: 'EXHIBITIONS',
                image: 'about.png',
                excerpt: 'A look into the curation process and opening night of "Silent Waters" at the London Fine Art Gallery, presenting ten years of documentary work in single frames.',
                content: `
                    <p>After months of preparation, curation, and printing, "Silent Waters" has officially opened at the London Fine Art Gallery. Presenting a decade of work in a single space is both an exhilarating and humbling experience. It forces you to look back at the thread that connects your very first documentary assignments with your current perspective.</p>
                    <p>The curation team spent weeks narrowing down a collection of over 10,000 frames to a cohesive set of 30 physical prints. We wanted the space to evoke the silence and mist of the waterways, allowing visitors to experience the slow passage of time captured in the photographs.</p>
                    <blockquote>"A photograph is a silent pause in a loud world. In this gallery, we wanted that silence to be heavy, real, and immersive."</blockquote>
                    <p>We selected traditional silver-gelatin printing on heavy baryta fiber paper to bring out the deepest tones of the black and white prints, and high-fidelity Giclée printing on archival matte cotton paper for the color works. Every lighting element in the gallery was adjusted to highlight the micro-details of the print textures without producing glare on the custom anti-reflective glass frames.</p>
                    <p>Opening night brought a wonderful mix of colleagues, photojournalism students, and art collectors. Hearing the discussions, interpretations, and immediate emotional responses to the work was deeply rewarding. For a photographer accustomed to seeing their work printed in fast-moving editorial publications or glowing on mobile screens, seeing physical prints framed on a wall is a reminder of the enduring nature of printed imagery.</p>
                    <p>The exhibition will run until November 15th, 2026. If you find yourself in London, please drop in. We hope the work gives you a quiet space to reflect on the stories behind the frames.</p>
                `
            },
            {
                id: 'ethics-documentary',
                title: 'The Ethics of Documentary Photography',
                date: 'AUG 05, 2026',
                category: 'PHOTO ETHICS',
                image: 'hero.png',
                excerpt: "An essay discussing the boundary between observation and intrusion, and the profound responsibility photojournalists bear when telling other people's stories.",
                content: `
                    <p>Documentary photography exists at the intersection of journalism, fine art, and human observation. It is a powerful tool for visual storytelling that can sway public opinion, generate aid, and document historic change. However, it also presents complex ethical questions that every photojournalist must navigate daily.</p>
                    <p>When entering a vulnerable community or a conflict zone with a camera, the power dynamic is instantly skewed. As photographers, we hold the lens, choose the framing, select the exposure, and decide which moments are shared and which are forgotten. With this power comes a profound ethical responsibility to maintain the dignity and truth of our subjects.</p>
                    <blockquote>"The camera is a passport into people's lives, but it is not a permit to exploit them. Trust is the most important element of any lens kit."</blockquote>
                    <p>One of the primary guidelines we follow is the principle of informed representation. It is not always possible to obtain formal consent in fast-moving editorial situations, but we strive to establish a connection with the people we document. This means explaining what the project is about, where the images will be published, and ensuring that our presence does not place anyone in danger or compromise their safety.</p>
                    <p>Furthermore, the digital era has introduced new challenges regarding truth in image processing. In documentary work and photojournalism, we strictly adhere to standard editorial guidelines: no adding or removing objects, no altering colors to distort the reality of the scene, and no stage-directing interactions to create false drama. The image must remain a faithful record of what occurred in front of the lens.</p>
                    <p>As we continue to tell stories, we must constantly question our motives, our perspective, and our impact. Ethical photojournalism is not about taking pictures; it is about listening to our subjects and translating their stories with truth, humility, and deep respect.</p>
                `
            },
            {
                id: 'gear-remote-assignments',
                title: 'Gear and Setup for Remote Assignments',
                date: 'JUL 18, 2026',
                category: 'GEAR & SETUP',
                image: 'film.png',
                excerpt: 'A comprehensive breakdown of the minimalist gear kit I pack for month-long remote documentary assignments, where space is tight and reliability is everything.',
                content: `
                    <p>When preparing for a month-long documentary assignment in a remote location where power is scarce and public transport is unpredictable, every ounce of weight in your backpack counts. Over a decade of field experience has taught me that packing less is always better than packing more. A light load means mobility, speed, and less fatigue on long field treks.</p>
                    <p>Our gear philosophy centers around simplicity and redundancy. I carry two identical camera bodies, so that in the event of a critical body failure, I can keep shooting without altering my muscle memory or workflow. My primary lenses are two fast, weather-sealed primes (35mm and 50mm) and a single versatile zoom for wide-angle environments.</p>
                    <blockquote>"The best gear is the gear you forget you're holding. It should become a seamless extension of your hand and eye."</blockquote>
                    <p>Power management is another critical factor. We carry four high-capacity batteries per camera body, along with a dual USB-C charger that can run off portable solar panels or a high-capacity power bank. A rugged, waterproof memory card wallet holds our archival-grade high-speed cards, which are backed up every night onto two separate rugged SSD drives stored in different compartments of our backpack.</p>
                    <p>Equally important is safety and support gear: a compact first-aid kit, a lightweight multi-tool, high-durability gaffer tape, lens cleaning materials, and a lightweight carbon-fiber travel tripod that fits inside our main backpack. Carrying this minimalist setup ensures that we remain discreet, blend in with the surroundings, and can react instantly to spontaneous moments.</p>
                    <p>Ultimately, gear is just a tool. The most expensive camera setup will not create a meaningful story if you do not have the patience to sit, look, and listen to the world around you. Pack light, plan ahead, and let the story guide your frame.</p>
                `
            }
        ],
        'contacts.json': () => [],
        'theme.json': () => ({ activeTheme: 'classic-copper' }),
        'home.json': () => ({
            hero: {
                eyebrow: "CAPTURING REAL STORIES. HONESTLY.",
                title: "Every Frame\nHas a Story",
                description: "Photojournalism and documentary films\nfrom the streets and spaces that\nshape our world.",
                image: "hero.png"
            },
            about: {
                eyebrow: "ABOUT THE ARTIST",
                title: "Dion Dominic",
                description1: "I am a photojournalist and documentary filmmaker dedicated to capturing raw, unfiltered human experiences. For over a decade, I have traveled to the margins of society to document stories that challenge our perspectives and unite our shared humanity.",
                description2: "My work has been featured in leading editorial publications globally, focusing on environmental change, cultural preservation, and resilience.",
                image: "about.png"
            },
            storiesIntro: {
                eyebrow: "PHOTO ESSAYS",
                title: "Visual Narratives",
                description: "Explore a collection of photo essays and visual narratives documenting unique moments and perspectives."
            },
            filmsIntro: {
                eyebrow: "DOCUMENTARY",
                title: "Cinematic Explorations",
                description: "Award-winning short films that dive deep into the cultural heartbeats of remote communities."
            },
            services: {
                eyebrow: "WHAT I DO",
                title: "Services & Expertise",
                service1Title: "Editorial Photography",
                service1Desc: "High-impact imagery for magazines, news outlets, and digital publications. Focusing on narrative depth and visual storytelling.",
                service2Title: "Documentary Films",
                service2Desc: "Full-scale video production for short and feature-length documentaries, capturing cinematic visuals with authentic audio.",
                service3Title: "Commercial Campaigns",
                service3Desc: "Bringing a photojournalistic, raw aesthetic to brand campaigns and commercial projects that demand authenticity."
            },
            contact: {
                eyebrow: "LATEST UPDATES",
                title: "Let's Tell a Story",
                description: "Available for assignments worldwide. For print sales, licensing, or commissions, please get in touch.",
                email: "hello@diondominic.com",
                location: "London, UK & Worldwide",
                phone: "+44 (0) 20 7946 0192",
                syndication: "contact@syndicate-agency.com",
                profile: "Dion Dominic is a member of the Association of Photojournalists. Over the last decade, his lens has captured stories of environmental resilience and human perseverance across five continents.",
                socialInstagram: "#",
                socialTwitter: "#",
                socialFacebook: "#",
                socialLinkedin: "#"
            }
        })
    };

    Object.keys(files).forEach(fileName => {
        const filePath = path.join(DATA_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(files[fileName](), null, 4));
        }
    });
}

// Initialise DB
initDB();

// Available Themes List
const THEMES = [
    {
        id: 'classic-copper',
        name: 'Classic Copper (Editorial)',
        description: 'Traditional editorial newsprint style layout. Sharp edges, tight grids, and warm copper highlights.',
        variables: {
            '--color-bg': '#0a0a0a',
            '--color-text': '#f5f5f5',
            '--color-text-muted': '#888888',
            '--color-accent': '#b08d5c',
            '--font-heading': "'Cinzel', serif",
            '--font-body': "'Inter', sans-serif",
            '--border-radius': '0px',
            '--grid-gap': '5px',
            '--card-bg': 'rgba(18, 18, 18, 0.5)',
            '--border-color': '#151515'
        }
    },
    {
        id: 'slate-monochrome',
        name: 'Slate Monochrome (Minimalist)',
        description: 'High-contrast editorial layout. Clean angles, solid dark cards, and a striking monochrome color system.',
        variables: {
            '--color-bg': '#0b0b0c',
            '--color-text': '#ffffff',
            '--color-text-muted': '#94a3b8',
            '--color-accent': '#ffffff',
            '--font-heading': "'Outfit', sans-serif",
            '--font-body': "'Inter', sans-serif",
            '--border-radius': '2px',
            '--grid-gap': '10px',
            '--card-bg': 'rgba(20, 20, 22, 0.6)',
            '--border-color': 'rgba(255, 255, 255, 0.1)'
        }
    },
    {
        id: 'emerald-forest',
        name: 'Emerald Forest (Sage)',
        description: 'Cinematic nature layout. Soft corners, airy spacious grids, and elegant sage green highlights.',
        variables: {
            '--color-bg': '#090e0b',
            '--color-text': '#ecfdf5',
            '--color-text-muted': '#6b7280',
            '--color-accent': '#8dd3b7',
            '--font-heading': "'Playfair Display', serif",
            '--font-body': "'Lora', serif",
            '--border-radius': '4px',
            '--grid-gap': '30px',
            '--card-bg': 'rgba(12, 18, 15, 0.6)',
            '--border-color': '#1a241f'
        }
    },
    {
        id: 'midnight-space',
        name: 'Midnight Space (Azure Glass)',
        description: 'Ultra-premium art gallery layout. Circular borders, translucent glassmorphic panels, and glowing cyan accents.',
        variables: {
            '--color-bg': '#06080f',
            '--color-text': '#f1f5f9',
            '--color-text-muted': '#64748b',
            '--color-accent': '#00d2ff',
            '--font-heading': "'Outfit', sans-serif",
            '--font-body': "'Plus Jakarta Sans', sans-serif",
            '--border-radius': '16px',
            '--grid-gap': '15px',
            '--card-bg': 'rgba(15, 23, 42, 0.45)',
            '--border-color': 'rgba(255, 255, 255, 0.08)'
        }
    }
];

// DB utility functions
function readData(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function writeData(fileName, data) {
    const filePath = path.join(DATA_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
}

module.exports = {
    // Auth users CRUD
    getUsers: () => readData('users.json'),
    saveUsers: (users) => writeData('users.json', users),
    getUserByUsername: (username) => {
        const users = readData('users.json');
        return users.find(u => u.username === username);
    },

    // Stories CRUD
    getStories: () => readData('stories.json'),
    saveStories: (stories) => writeData('stories.json', stories),
    getStory: (id) => {
        const stories = readData('stories.json');
        return stories.find(s => s.id === id);
    },

    // Films CRUD
    getFilms: () => readData('films.json'),
    saveFilms: (films) => writeData('films.json', films),
    getFilm: (id) => {
        const films = readData('films.json');
        return films.find(f => f.id === id);
    },

    // Blogs CRUD
    getBlogs: () => readData('blogs.json'),
    saveBlogs: (blogs) => writeData('blogs.json', blogs),
    getBlog: (id) => {
        const blogs = readData('blogs.json');
        return blogs.find(b => b.id === id);
    },

    // Contacts CRUD
    getContacts: () => readData('contacts.json'),
    saveContacts: (contacts) => writeData('contacts.json', contacts),
    addContact: (contact) => {
        const contacts = readData('contacts.json');
        const newContact = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...contact
        };
        contacts.push(newContact);
        writeData('contacts.json', contacts);
        return newContact;
    },
    deleteContact: (id) => {
        const contacts = readData('contacts.json');
        const filtered = contacts.filter(c => c.id !== id);
        writeData('contacts.json', filtered);
        return true;
    },

    // Themes CRUD
    getThemes: () => THEMES,
    getActiveTheme: () => {
        const data = readData('theme.json');
        const activeId = (data && data.activeTheme) || 'classic-copper';
        return THEMES.find(t => t.id === activeId) || THEMES[0];
    },
    setActiveTheme: (themeId) => {
        writeData('theme.json', { activeTheme: themeId });
        return true;
    },

    // Home CRUD
    getHomeData: () => {
        return readData('home.json');
    },
    updateHomeData: (data) => {
        writeData('home.json', data);
        return data;
    },

    // Sessions
    getSessions: () => {
        const raw = readData('sessions.json');
        return Array.isArray(raw) ? raw : [];
    },
    saveSessions: (sessions) => writeData('sessions.json', sessions)
};
