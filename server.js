require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Custom rate limiter map
const ipLimits = new Map();
const LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LIMIT_LOGIN = 15; // Max 15 logins per window
const MAX_LIMIT_CONTACT = 5; // Max 5 contact submissions per window

function rateLimiter(maxRequests) {
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const now = Date.now();
        if (!ipLimits.has(ip)) {
            ipLimits.set(ip, []);
        }
        let timestamps = ipLimits.get(ip);
        timestamps = timestamps.filter(t => now - t < LIMIT_WINDOW);
        if (timestamps.length >= maxRequests) {
            return res.status(429).json({ error: 'Too many requests from this IP. Please try again in 15 minutes.' });
        }
        timestamps.push(now);
        ipLimits.set(ip, timestamps);
        next();
    };
}

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' https://commondatastorage.googleapis.com; connect-src 'self';");
    next();
});

// Middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

// Serve static frontend files

// ADMIN PROTECTION MIDDLEWARE
app.use('/admin', async (req, res, next) => {
    // Prevent browser caching for admin routes to fix back-button bypass
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.path === '/login.html' || req.path === '/login.js' || req.path === '/admin.css' || req.path.startsWith('/assets/')) {
        return next();
    }
    const token = req.cookies['session_token'];
    if (!token) return res.redirect('/admin/login.html');
    
    const sessions = await await db.getSessions();
    const session = sessions.find(s => s.token === token);
    
    if (!session || (session.expires && session.expires < Date.now())) {
        res.clearCookie('session_token');
        return res.redirect('/admin/login.html');
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Sessions are managed persistently in data/sessions.json to survive server restarts

async function requireAuth(req, res, next) {
    const token = req.cookies['session_token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const sessions = await await db.getSessions();
    const session = sessions.find(s => s.token === token);
    if (!session || (session.expires && session.expires < Date.now())) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.username = session.username;
    next();
}

// AUTH API
app.post('/api/auth/login', rateLimiter(MAX_LIMIT_LOGIN), async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await db.getUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate session token and store in DB
    const token = crypto.randomBytes(32).toString('hex');
    const sessions = await db.getSessions();
    
    // Clean up expired sessions while we are at it
    const activeSessions = sessions.filter(s => !s.expires || s.expires > Date.now());
    activeSessions.push({ token, username, expires: Date.now() + (24 * 60 * 60 * 1000) });
    await db.saveSessions(activeSessions);

    // Set cookie with strict security flags
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('session_token', token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'strict'
    });

    res.json({ success: true, username });
});

app.post('/api/auth/logout', async (req, res) => {
    const token = req.cookies['session_token'];
    if (token) {
        const sessions = await db.getSessions();
        const filtered = sessions.filter(s => s.token !== token);
        await db.saveSessions(filtered);
        res.clearCookie('session_token');
    }
    res.json({ success: true });
});

app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies['session_token'];
    const sessions = await db.getSessions();
    const session = sessions.find(s => s.token === token);
    
    // Clean up expired sessions
    if (session && session.expires && session.expires < Date.now()) {
        await db.saveSessions(sessions.filter(s => s.token !== token));
        return res.status(401).json({ authenticated: false });
    }
    
    if (!token || !session) {
        return res.status(401).json({ authenticated: false });
    }
    res.json({ authenticated: true, username: session.username });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old and new passwords required' });
    }

    const users = await db.getUsers();
    const userIndex = users.findIndex(u => u.username === req.username);

    if (userIndex === -1 || !bcrypt.compareSync(oldPassword, users[userIndex].password)) {
        return res.status(401).json({ error: 'Incorrect old password' });
    }

    const salt = bcrypt.genSaltSync(10);
    users[userIndex].password = bcrypt.hashSync(newPassword, salt);
    await db.saveUsers(users);

    res.json({ success: true });
});

// STORIES API
app.get('/api/stories', async (req, res) => {
    res.json(await db.getStories());
});

app.get('/api/stories/:id', async (req, res) => {
    const story = await db.getStory(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.json(story);
});

app.post('/api/stories', requireAuth, async (req, res) => {
    const { id, title, category, subtitle, description, mainImage, gallery } = req.body;
    if (!id || !title || !description) {
        return res.status(400).json({ error: 'ID, title and description required' });
    }

    const stories = await db.getStories();
    if (stories.some(s => s.id === id)) {
        return res.status(400).json({ error: 'Story with this ID already exists' });
    }

    const newStory = {
        id,
        title,
        category: category || 'PHOTO ESSAY',
        subtitle: subtitle || '',
        description,
        mainImage: mainImage || 'main.png',
        gallery: gallery || []
    };

    stories.push(newStory);
    await db.saveStories(stories);
    res.status(201).json(newStory);
});

app.put('/api/stories/:id', requireAuth, async (req, res) => {
    const stories = await db.getStories();
    const idx = stories.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Story not found' });

    const updated = {
        ...stories[idx],
        ...req.body,
        id: req.params.id // Prevent ID modification
    };

    stories[idx] = updated;
    await db.saveStories(stories);
    res.json(updated);
});

app.delete('/api/stories/:id', requireAuth, async (req, res) => {
    const stories = await db.getStories();
    const filtered = stories.filter(s => s.id !== req.params.id);
    if (filtered.length === stories.length) {
        return res.status(404).json({ error: 'Story not found' });
    }
    await db.saveStories(filtered);
    res.json({ success: true });
});

// FILMS API
app.get('/api/films', async (req, res) => {
    res.json(await db.getFilms());
});

app.get('/api/films/:id', async (req, res) => {
    const film = await db.getFilm(req.params.id);
    if (!film) return res.status(404).json({ error: 'Film not found' });
    res.json(film);
});

app.post('/api/films', requireAuth, async (req, res) => {
    const { title, duration, location, videoUrl, poster, description, gallery } = req.body;
    if (!title || !videoUrl) {
        return res.status(400).json({ error: 'Title and Video URL required' });
    }

    const films = await db.getFilms();
    const newFilm = {
        id: Date.now().toString(),
        title,
        duration: duration || '0m',
        location: location || 'Worldwide',
        videoUrl,
        poster: poster || 'film.png',
        description: description || '',
        gallery: gallery || []
    };

    films.push(newFilm);
    await db.saveFilms(films);
    res.status(201).json(newFilm);
});

app.put('/api/films/:id', requireAuth, async (req, res) => {
    const films = await db.getFilms();
    const idx = films.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Film not found' });

    const updated = {
        ...films[idx],
        ...req.body,
        id: req.params.id
    };

    films[idx] = updated;
    await db.saveFilms(films);
    res.json(updated);
});

app.delete('/api/films/:id', requireAuth, async (req, res) => {
    const films = await db.getFilms();
    const filtered = films.filter(f => f.id !== req.params.id);
    if (filtered.length === films.length) {
        return res.status(404).json({ error: 'Film not found' });
    }
    await db.saveFilms(filtered);
    res.json({ success: true });
});

// BLOGS API
app.get('/api/blogs', async (req, res) => {
    res.json(await db.getBlogs());
});

app.get('/api/blogs/:id', async (req, res) => {
    const blog = await db.getBlog(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
});

app.post('/api/blogs', requireAuth, async (req, res) => {
    const { id, title, category, date, image, excerpt, content, gallery } = req.body;
    if (!title || !excerpt || !content) {
        return res.status(400).json({ error: 'Title, excerpt, and content required' });
    }

    const blogs = await db.getBlogs();
    const blogId = id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (blogs.some(b => b.id === blogId)) {
        return res.status(400).json({ error: 'Blog with this ID or generated slug already exists' });
    }

    const formattedDate = date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    }).toUpperCase();

    const newBlog = {
        id: blogId,
        title,
        date: formattedDate,
        category: category || 'UNCATEGORIZED',
        image: image || 'main.png',
        excerpt,
        content,
        gallery: gallery || []
    };

    blogs.push(newBlog);
    await db.saveBlogs(blogs);
    res.status(201).json(newBlog);
});

app.put('/api/blogs/:id', requireAuth, async (req, res) => {
    const blogs = await db.getBlogs();
    const idx = blogs.findIndex(b => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Blog not found' });

    const updated = {
        ...blogs[idx],
        ...req.body,
        id: req.params.id
    };

    blogs[idx] = updated;
    await db.saveBlogs(blogs);
    res.json(updated);
});

app.delete('/api/blogs/:id', requireAuth, async (req, res) => {
    const blogs = await db.getBlogs();
    const filtered = blogs.filter(b => b.id !== req.params.id);
    if (filtered.length === blogs.length) {
        return res.status(404).json({ error: 'Blog not found' });
    }
    await db.saveBlogs(filtered);
    res.json({ success: true });
});

// CONTACT API
app.post('/api/contacts', rateLimiter(MAX_LIMIT_CONTACT), async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
    }

    const contact = await db.addContact({ name, email, subject: subject || 'No Subject', message });
    res.status(201).json({ success: true, contact });
});

app.get('/api/contacts', requireAuth, async (req, res) => {
    res.json(await db.getContacts());
});

app.delete('/api/contacts/:id', requireAuth, async (req, res) => {
    await db.deleteContact(req.params.id);
    res.json({ success: true });
});

// THEME API
app.get('/api/theme', async (req, res) => {
    res.json(await db.getActiveTheme());
});

app.get('/api/themes', async (req, res) => {
    res.json(await db.getThemes());
});

app.post('/api/theme', requireAuth, async (req, res) => {
    const { themeId } = req.body;
    if (!themeId) {
        return res.status(400).json({ error: 'Theme ID required' });
    }
    const themes = await db.getThemes();
    if (!themes.some(t => t.id === themeId)) {
        return res.status(400).json({ error: 'Invalid Theme ID' });
    }
    await db.setActiveTheme(themeId);
    res.json({ success: true, theme: await db.getActiveTheme() });
});

// HOME API
app.get('/api/home', async (req, res) => {
    res.json(await db.getHomeData());
});

app.post('/api/home', requireAuth, async (req, res) => {
    const { hero, about, storiesIntro, filmsIntro, services, contact } = req.body;
    if (!hero || !about) {
        return res.status(400).json({ error: 'Hero and About data are required' });
    }
    const updated = await db.updateHomeData({ hero, about, storiesIntro, filmsIntro, services, contact });
    res.json(updated);
});

// UPLOAD API
app.post('/api/upload-file', requireAuth, async (req, res) => {
    const { fileData, type } = req.body;
    if (!fileData || !type) {
        return res.status(400).json({ error: 'File data and type required' });
    }

    try {
        let ext = 'jpg';
        if (fileData.startsWith('data:video/')) {
            const match = fileData.match(/^data:video\/(\w+);base64,/);
            if (match) ext = match[1];
        } else if (fileData.startsWith('data:image/')) {
            const match = fileData.match(/^data:image\/(\w+);base64,/);
            if (match) ext = match[1];
        }

        const base64Data = fileData.replace(/^data:(image|video)\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        const filename = `uploaded_${type}_${Date.now()}.${ext}`;
        const fs = require('fs');
        const uploadPath = path.join(__dirname, 'public', 'assets', 'images', filename);
        
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(uploadPath, buffer);
        res.json({ success: true, filename });
    } catch (err) {
        console.error('File upload failed', err);
        res.status(500).json({ error: 'Failed to save file on server' });
    }
});

// LIST ALL UPLOADS API
app.get('/api/uploads', requireAuth, async (req, res) => {
    const fs = require('fs');
    const imagesPath = path.join(__dirname, 'public', 'assets', 'images');
    try {
        if (!fs.existsSync(imagesPath)) {
            return res.json({ filmsStories: [], backgroundAbout: [] });
        }
        const files = fs.readdirSync(imagesPath);
        
        let filmsStories = [];
        let backgroundAbout = [];
        
        files.forEach(file => {
            // Ignore hidden files
            if (file.startsWith('.')) return;
            
            const lowerFile = file.toLowerCase();
            const ext = lowerFile.split('.').pop();
            const type = ['mp4', 'webm', 'ogg', 'mov'].includes(ext) ? 'video' : 'image';
            
            const mediaItem = { url: file, title: file, type };
            
            if (lowerFile.includes('hero') || lowerFile.includes('about')) {
                backgroundAbout.push(mediaItem);
            } else {
                filmsStories.push(mediaItem);
            }
        });
        
        res.json({ filmsStories, backgroundAbout });
    } catch (err) {
        console.error('Failed to read uploads directory', err);
        res.status(500).json({ error: 'Failed to read uploads directory' });
    }
});

app.delete('/api/uploads/:filename', requireAuth, async (req, res) => {
    const fs = require('fs');
    const filename = req.params.filename;
    
    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, 'public', 'assets', 'images', filename);
    
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        console.error('Failed to delete file', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Catch-all route to serve index.html for index requests
app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
