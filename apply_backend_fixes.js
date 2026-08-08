const fs = require('fs');
const path = require('path');

const serverJsPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverJsPath, 'utf8');

// Add dotenv
if (!serverContent.includes('require(\'dotenv\')')) {
    serverContent = "require('dotenv').config();\n" + serverContent;
}

// Update admin protection
if (!serverContent.includes('app.use(\'/admin\'')) {
    const staticIndex = serverContent.indexOf('app.use(express.static');
    const adminMiddleware = `
// ADMIN PROTECTION MIDDLEWARE
app.use('/admin', async (req, res, next) => {
    if (req.path === '/login.html' || req.path === '/login.js' || req.path === '/admin.css' || req.path.startsWith('/assets/')) {
        return next();
    }
    const token = req.cookies['session_token'];
    if (!token) return res.redirect('/admin/login.html');
    
    const sessions = await db.getSessions();
    const session = sessions.find(s => s.token === token);
    
    if (!session || (session.expires && session.expires < Date.now())) {
        res.clearCookie('session_token');
        return res.redirect('/admin/login.html');
    }
    next();
});

`;
    serverContent = serverContent.slice(0, staticIndex) + adminMiddleware + serverContent.slice(staticIndex);
}

// Convert requireAuth to async
serverContent = serverContent.replace(/function requireAuth\(req, res, next\) \{[\s\S]*?next\(\);\n\}/, `async function requireAuth(req, res, next) {
    const token = req.cookies['session_token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const sessions = await db.getSessions();
    const session = sessions.find(s => s.token === token);
    if (!session || (session.expires && session.expires < Date.now())) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.username = session.username;
    next();
}`);

// Convert all db.* calls to await db.* and make handlers async
const dbMethods = [
    'getSessions', 'saveSessions', 'getUserByUsername', 'getUsers', 'saveUsers',
    'getStories', 'getStory', 'saveStories',
    'getFilms', 'getFilm', 'saveFilms',
    'getBlogs', 'getBlog', 'saveBlogs',
    'getContacts', 'saveContacts', 'addContact', 'deleteContact',
    'getActiveTheme', 'getThemes', 'setActiveTheme',
    'getHomeData', 'updateHomeData'
];

serverContent = serverContent.replace(/app\.(get|post|put|delete)\('([^']+)',\s*(requireAuth,\s*)?(?:rateLimiter\([^)]+\),\s*)?\(req, res\) => \{/g, (match) => {
    return match.replace('(req, res) => {', 'async (req, res) => {');
});

// Also replace in rateLimiter cases properly if missed
serverContent = serverContent.replace(/rateLimiter\([^)]+\),\s*\(req,\s*res\)\s*=>/g, (match) => {
    return match.replace('(req, res) =>', 'async (req, res) =>');
});

// Add awaits to db calls
dbMethods.forEach(method => {
    const regex = new RegExp(`db\\.${method}\\(`, 'g');
    serverContent = serverContent.replace(regex, `await db.${method}(`);
});

fs.writeFileSync(serverJsPath, serverContent);
console.log('server.js updated successfully.');

// Now rewrite db.js to handle both MongoDB and Local JSON (asynchronously)
const newDbJs = `require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const useMongo = !!process.env.MONGODB_URI;

// Initialise DB directory
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

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

const DEFAULT_HOME_DATA = {
    hero: {
        eyebrow: "CAPTURING REAL STORIES. HONESTLY.",
        title: "Every Frame\\nHas a Story",
        description: "Photojournalism and documentary films\\nfrom the streets and spaces that\\nshape our world.",
        image: "hero.png"
    },
    about: {
        eyebrow: "ABOUT THE ARTIST",
        title: "Dion Dominic",
        description1: "I am a photojournalist and documentary filmmaker dedicated to capturing raw, unfiltered human experiences.",
        description2: "My work has been featured in leading editorial publications globally.",
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
        service1Desc: "High-impact imagery for magazines, news outlets, and digital publications.",
        service2Title: "Documentary Films",
        service2Desc: "Full-scale video production for short and feature-length documentaries.",
        service3Title: "Commercial Campaigns",
        service3Desc: "Bringing a photojournalistic, raw aesthetic to brand campaigns."
    },
    contact: {
        eyebrow: "LATEST UPDATES",
        title: "Let's Tell a Story",
        description: "Available for assignments worldwide.",
        email: "hello@diondominic.com",
        location: "London, UK & Worldwide",
        phone: "+44 (0) 20 7946 0192",
        syndication: "contact@syndicate-agency.com",
        profile: "Dion Dominic is a member of the Association of Photojournalists.",
        socialInstagram: "#",
        socialTwitter: "#",
        socialFacebook: "#",
        socialLinkedin: "#"
    }
};

let dbMethods = {};

if (useMongo) {
    const mongoose = require('mongoose');
    let isConnected = false;
    
    async function connectDB() {
        if (isConnected) return;
        try {
            await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
            isConnected = true;
            console.log('Connected to MongoDB');
            await initMongoDefaults();
        } catch (e) {
            console.error('MongoDB connection error:', e);
        }
    }

    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ username: { type: String, unique: true }, password: String }));
    const Session = mongoose.models.Session || mongoose.model('Session', new mongoose.Schema({ token: { type: String, unique: true }, username: String, expires: Number }));
    const Story = mongoose.models.Story || mongoose.model('Story', new mongoose.Schema({ id: { type: String, unique: true }, title: String, category: String, subtitle: String, description: String, mainImage: String, gallery: Array }));
    const Film = mongoose.models.Film || mongoose.model('Film', new mongoose.Schema({ id: { type: String, unique: true }, title: String, duration: String, location: String, videoUrl: String, poster: String, description: String, gallery: Array }));
    const Blog = mongoose.models.Blog || mongoose.model('Blog', new mongoose.Schema({ id: { type: String, unique: true }, title: String, date: String, category: String, image: String, excerpt: String, content: String, gallery: Array }));
    const Contact = mongoose.models.Contact || mongoose.model('Contact', new mongoose.Schema({ id: { type: String, unique: true }, name: String, email: String, subject: String, message: String, date: String }));
    const Theme = mongoose.models.Theme || mongoose.model('Theme', new mongoose.Schema({ activeTheme: String }));
    const Home = mongoose.models.Home || mongoose.model('Home', new mongoose.Schema({ data: Object }));

    async function initMongoDefaults() {
        if (!(await User.findOne({ username: 'shutterbug' }))) {
            const salt = bcrypt.genSaltSync(10);
            await User.create({ username: 'shutterbug', password: bcrypt.hashSync('m9803fdss@@#08', salt) });
        }
        if (!(await Theme.findOne())) await Theme.create({ activeTheme: 'classic-copper' });
        if (!(await Home.findOne())) await Home.create({ data: DEFAULT_HOME_DATA });
    }

    dbMethods = {
        getUsers: async () => { await connectDB(); return await User.find().lean(); },
        saveUsers: async (users) => { 
            await connectDB();
            for (const u of users) await User.updateOne({ username: u.username }, { password: u.password }, { upsert: true });
        },
        getUserByUsername: async (username) => { await connectDB(); return await User.findOne({ username }).lean(); },
        
        getStories: async () => { await connectDB(); return await Story.find().lean(); },
        saveStories: async (stories) => { 
            await connectDB();
            await Story.deleteMany({});
            if (stories.length > 0) await Story.insertMany(stories);
        },
        getStory: async (id) => { await connectDB(); return await Story.findOne({ id }).lean(); },
        
        getFilms: async () => { await connectDB(); return await Film.find().lean(); },
        saveFilms: async (films) => { 
            await connectDB();
            await Film.deleteMany({});
            if (films.length > 0) await Film.insertMany(films);
        },
        getFilm: async (id) => { await connectDB(); return await Film.findOne({ id }).lean(); },
        
        getBlogs: async () => { await connectDB(); return await Blog.find().lean(); },
        saveBlogs: async (blogs) => { 
            await connectDB();
            await Blog.deleteMany({});
            if (blogs.length > 0) await Blog.insertMany(blogs);
        },
        getBlog: async (id) => { await connectDB(); return await Blog.findOne({ id }).lean(); },
        
        getContacts: async () => { await connectDB(); return await Contact.find().lean(); },
        saveContacts: async (contacts) => { 
            await connectDB();
            await Contact.deleteMany({});
            if (contacts.length > 0) await Contact.insertMany(contacts);
        },
        addContact: async (contact) => { 
            await connectDB();
            const newContact = { id: Date.now().toString(), date: new Date().toISOString(), ...contact };
            await Contact.create(newContact);
            return newContact;
        },
        deleteContact: async (id) => { await connectDB(); await Contact.deleteOne({ id }); return true; },
        
        getThemes: async () => THEMES,
        getActiveTheme: async () => { 
            await connectDB(); 
            const theme = await Theme.findOne().lean();
            const activeId = theme ? theme.activeTheme : 'classic-copper';
            return THEMES.find(t => t.id === activeId) || THEMES[0];
        },
        setActiveTheme: async (themeId) => { 
            await connectDB();
            await Theme.updateOne({}, { activeTheme: themeId }, { upsert: true });
            return true;
        },
        
        getHomeData: async () => { 
            await connectDB();
            const home = await Home.findOne().lean();
            return home ? home.data : DEFAULT_HOME_DATA;
        },
        updateHomeData: async (data) => { 
            await connectDB();
            await Home.updateOne({}, { data }, { upsert: true });
            return data;
        },
        
        getSessions: async () => { await connectDB(); return await Session.find().lean(); },
        saveSessions: async (sessions) => { 
            await connectDB();
            await Session.deleteMany({});
            if (sessions.length > 0) await Session.insertMany(sessions);
        }
    };
} else {
    // Local JSON implementation
    function readData(fileName) {
        try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8')); } 
        catch (e) { return []; }
    }
    function writeData(fileName, data) { fs.writeFileSync(path.join(DATA_DIR, fileName), JSON.stringify(data, null, 4), 'utf8'); }

    // Init Defaults
    if (!fs.existsSync(path.join(DATA_DIR, 'users.json'))) {
        const salt = bcrypt.genSaltSync(10);
        writeData('users.json', [{ id: '1', username: 'shutterbug', password: bcrypt.hashSync('m9803fdss@@#08', salt) }]);
    }
    if (!fs.existsSync(path.join(DATA_DIR, 'stories.json'))) writeData('stories.json', []);
    if (!fs.existsSync(path.join(DATA_DIR, 'films.json'))) writeData('films.json', []);
    if (!fs.existsSync(path.join(DATA_DIR, 'blogs.json'))) writeData('blogs.json', []);
    if (!fs.existsSync(path.join(DATA_DIR, 'contacts.json'))) writeData('contacts.json', []);
    if (!fs.existsSync(path.join(DATA_DIR, 'sessions.json'))) writeData('sessions.json', []);
    if (!fs.existsSync(path.join(DATA_DIR, 'theme.json'))) writeData('theme.json', { activeTheme: 'classic-copper' });
    if (!fs.existsSync(path.join(DATA_DIR, 'home.json'))) writeData('home.json', DEFAULT_HOME_DATA);

    dbMethods = {
        getUsers: async () => readData('users.json'),
        saveUsers: async (users) => writeData('users.json', users),
        getUserByUsername: async (username) => readData('users.json').find(u => u.username === username),
        getStories: async () => readData('stories.json'),
        saveStories: async (stories) => writeData('stories.json', stories),
        getStory: async (id) => readData('stories.json').find(s => s.id === id),
        getFilms: async () => readData('films.json'),
        saveFilms: async (films) => writeData('films.json', films),
        getFilm: async (id) => readData('films.json').find(f => f.id === id),
        getBlogs: async () => readData('blogs.json'),
        saveBlogs: async (blogs) => writeData('blogs.json', blogs),
        getBlog: async (id) => readData('blogs.json').find(b => b.id === id),
        getContacts: async () => readData('contacts.json'),
        saveContacts: async (contacts) => writeData('contacts.json', contacts),
        addContact: async (contact) => {
            const contacts = readData('contacts.json');
            const newContact = { id: Date.now().toString(), date: new Date().toISOString(), ...contact };
            contacts.push(newContact);
            writeData('contacts.json', contacts);
            return newContact;
        },
        deleteContact: async (id) => {
            const contacts = readData('contacts.json');
            writeData('contacts.json', contacts.filter(c => c.id !== id));
            return true;
        },
        getThemes: async () => THEMES,
        getActiveTheme: async () => {
            const data = readData('theme.json');
            const activeId = (data && data.activeTheme) || 'classic-copper';
            return THEMES.find(t => t.id === activeId) || THEMES[0];
        },
        setActiveTheme: async (themeId) => { writeData('theme.json', { activeTheme: themeId }); return true; },
        getHomeData: async () => { const data = readData('home.json'); return Array.isArray(data) ? DEFAULT_HOME_DATA : data; },
        updateHomeData: async (data) => { writeData('home.json', data); return data; },
        getSessions: async () => { const raw = readData('sessions.json'); return Array.isArray(raw) ? raw : []; },
        saveSessions: async (sessions) => writeData('sessions.json', sessions)
    };
}

module.exports = dbMethods;
`;

fs.writeFileSync(path.join(__dirname, 'db.js'), newDbJs);
console.log('db.js rewritten for async MongoDB/Local support.');
