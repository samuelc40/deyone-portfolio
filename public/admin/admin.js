window.showToast = function(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        // Fallback to default if container not found
        console.log(msg);
        return;
    }
    const toast = document.createElement('div');
    toast.style.background = type === 'success' ? '#4CAF50' : '#f44336';
    toast.style.color = '#fff';
    toast.style.padding = '15px 25px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    toast.style.fontFamily = 'var(--font-body), sans-serif';
    toast.style.fontSize = '0.9rem';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'all 0.3s ease';
    toast.textContent = msg;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.showConfirm = function(msg, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';

    const box = document.createElement('div');
    box.style.background = 'var(--color-bg)';
    box.style.border = '1px solid var(--border-color)';
    box.style.padding = '2rem';
    box.style.borderRadius = '8px';
    box.style.textAlign = 'center';
    box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    box.style.transform = 'translateY(20px)';
    box.style.transition = 'all 0.3s ease';

    const text = document.createElement('p');
    text.style.fontFamily = 'var(--font-body), sans-serif';
    text.style.fontSize = '1.1rem';
    text.style.marginBottom = '2rem';
    text.style.color = 'var(--color-text)';
    text.textContent = msg;

    const btnWrapper = document.createElement('div');
    btnWrapper.style.display = 'flex';
    btnWrapper.style.gap = '1rem';
    btnWrapper.style.justifyContent = 'center';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-outline';
    btnCancel.textContent = 'CANCEL';
    btnCancel.onclick = () => close();

    const btnOk = document.createElement('button');
    btnOk.className = 'btn btn-primary';
    btnOk.style.background = '#f44336';
    btnOk.style.borderColor = '#f44336';
    btnOk.style.color = '#fff';
    btnOk.textContent = 'DELETE';
    btnOk.onclick = () => {
        close();
        onConfirm();
    };

    btnWrapper.appendChild(btnCancel);
    btnWrapper.appendChild(btnOk);
    box.appendChild(text);
    box.appendChild(btnWrapper);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // animate in
    setTimeout(() => {
        overlay.style.opacity = '1';
        box.style.transform = 'translateY(0)';
    }, 10);

    function close() {
        overlay.style.opacity = '0';
        box.style.transform = 'translateY(20px)';
        setTimeout(() => overlay.remove(), 300);
    }
};

// Override default window.alert
const originalAlert = window.alert;
window.alert = function(msg) {
    if (typeof msg !== 'string') msg = String(msg);
    const isError = msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('error');
    window.showToast(msg, isError ? 'error' : 'success');
};

function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
    // Handle Browser Back/Forward Cache (bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            checkAuth();
        }
    });

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

    // Authenticate Admin
    checkAuth();

    // Tab Navigation
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const tabs = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTabId = item.getAttribute('data-tab');

            menuItems.forEach(mi => mi.classList.remove('active'));
            tabs.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) {
                targetTab.classList.add('active');
                loadTabContent(targetTabId);
            }
        });
    });

    // Logout Handler
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = './login.html';
        } catch (e) {
            console.error('Logout failed', e);
        }
    });

    // Password Change Handler
    const pwdForm = document.getElementById('changePasswordForm');
    const pwdSuccess = document.getElementById('settingsBox');
    const pwdError = document.getElementById('settingsErrorBox');
    pwdSuccess.style.display = 'none';
    pwdError.style.display = 'none';

    pwdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        pwdSuccess.style.display = 'none';
        pwdError.style.display = 'none';

        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                pwdSuccess.style.display = 'block';
                pwdForm.reset();
            } else {
                pwdError.textContent = data.error || 'Password update failed';
                pwdError.style.display = 'block';
            }
        } catch (err) {
            pwdError.textContent = 'Connection error';
            pwdError.style.display = 'block';
        }
    });

    // Form Submissions
    document.getElementById('blogForm').addEventListener('submit', handleBlogSubmit);
    document.getElementById('filmForm').addEventListener('submit', handleFilmSubmit);
    document.getElementById('storyForm').addEventListener('submit', handleStorySubmit);
    document.getElementById('homeSettingsForm').addEventListener('submit', handleHomeSettingsSubmit);

    // Maximum Security: Logout on tab close or refresh
    window.addEventListener('beforeunload', () => {
        sessionStorage.removeItem('admin_secure_session');
        fetch('/api/auth/logout', { method: 'POST', keepalive: true });
    });

    // Initial Load
    loadTabContent('tab-dashboard');
});

// Auth Verification
async function checkAuth() {
    if (!sessionStorage.getItem('admin_secure_session')) {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = './login.html';
        return;
    }
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
            window.location.href = './login.html';
        }
    } catch (e) {
        window.location.href = './login.html';
    }
}

// Router for Tab Loading
function loadTabContent(tabId) {
    switch (tabId) {
        case 'tab-dashboard':
            loadStats();
            break;
        case 'tab-home':
            loadHomeSettings();
            break;
        case 'tab-blogs':
            loadBlogs();
            break;
        case 'tab-films':
            loadFilms();
            break;
        case 'tab-stories':
            loadStories();
            break;
        case 'tab-uploaded':
            loadUploadedMedia();
            break;
        case 'tab-contacts':
            loadContacts();
            break;
        case 'tab-themes':
            loadThemes();
            break;
    }
}

// Load statistics
async function loadStats() {
    try {
        const [stories, films, blogs, contacts] = await Promise.all([
            fetch('/api/stories').then(r => r.json()),
            fetch('/api/films').then(r => r.json()),
            fetch('/api/blogs').then(r => r.json()),
            fetch('/api/contacts').then(r => r.json())
        ]);

        document.getElementById('count-stories').textContent = stories.length;
        document.getElementById('count-films').textContent = films.length;
        document.getElementById('count-blogs').textContent = blogs.length;
        document.getElementById('count-messages').textContent = contacts.length;
    } catch (e) {
        console.error('Stats loading failed', e);
    }
}

// ==========================================
// BLOGS CRUD
// ==========================================
async function loadBlogs() {
    const tbody = document.getElementById('blogs-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading blogs...</td></tr>';
    try {
        const blogs = await fetch('/api/blogs').then(r => r.json());
        tbody.innerHTML = '';
        if (blogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No blog posts found.</td></tr>';
            return;
        }
        blogs.forEach(blog => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHTML(blog.date)}</td>
                <td><strong>${escapeHTML(blog.title)}</strong></td>
                <td>${escapeHTML(blog.category)}</td>
                <td>${escapeHTML(blog.excerpt.substring(0, 50))}...</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editBlog('${escapeHTML(blog.id)}')">Edit</button>
                        <button class="action-btn delete" onclick="deleteBlog('${escapeHTML(blog.id)}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5">Error loading blogs.</td></tr>';
    }
}

function openBlogModal(blogData = null) {
    const modal = document.getElementById('blogModal');
    const form = document.getElementById('blogForm');
    form.reset();

    if (blogData) {
        document.getElementById('blog-modal-title').textContent = 'Edit Blog Post';
        document.getElementById('blog-edit-id').value = blogData.id;
        document.getElementById('blog-title').value = blogData.title;
        document.getElementById('blog-category').value = blogData.category;
        document.getElementById('blog-date').value = blogData.date;
        document.getElementById('blog-image').value = blogData.image;
        updateMediaPreview(blogData.image, 'blog-image-preview', 'blog-video-preview', 'blog-preview-placeholder');
        document.getElementById('blog-excerpt').value = blogData.excerpt;
        document.getElementById('blog-content').value = blogData.content;
        
        // Load existing gallery
        uploadedGalleryImages = blogData.gallery ? [...blogData.gallery] : [];
    } else {
        document.getElementById('blog-modal-title').textContent = 'Add New Blog Post';
        document.getElementById('blog-edit-id').value = '';
        updateMediaPreview('', 'blog-image-preview', 'blog-video-preview', 'blog-preview-placeholder');
        
        // Reset gallery
        uploadedGalleryImages = [];
    }
    
    // Update gallery UI
    document.getElementById('blog-gallery').value = uploadedGalleryImages.length > 0 ? uploadedGalleryImages.length + ' media ready' : '';
    renderGalleryPreviews('blog-gallery-preview-container');
    
    modal.style.display = 'flex';
}

function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
}

async function handleBlogSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('blog-edit-id').value;
    const title = document.getElementById('blog-title').value;
    const category = document.getElementById('blog-category').value;
    const date = document.getElementById('blog-date').value;
    const image = document.getElementById('blog-image').value;
    const excerpt = document.getElementById('blog-excerpt').value;
    const content = document.getElementById('blog-content').value;

    // Add gallery
    const gallery = [...uploadedGalleryImages];

    const payload = { title, category, date, image, excerpt, content, gallery };

    const url = id ? `/api/blogs/${id}` : '/api/blogs';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeBlogModal();
            loadBlogs();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to save blog post');
        }
    } catch (e) {
        alert('Server connection failed');
    }
}

async function editBlog(id) {
    try {
        const blog = await fetch(`/api/blogs/${id}`).then(r => r.json());
        openBlogModal(blog);
    } catch (e) {
        alert('Failed to retrieve blog details');
    }
}

async function deleteBlog(id) {
    window.showConfirm('Are you sure you want to delete this blog post?', async () => {
        try {
            const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
            if (res.ok) loadBlogs();
            else alert('Failed to delete blog post');
        } catch (e) {
            alert('Server error');
        }
    });
}

// ==========================================
// FILMS CRUD
// ==========================================
async function loadFilms() {
    const tbody = document.getElementById('films-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading films...</td></tr>';
    try {
        const films = await fetch('/api/films').then(r => r.json());
        tbody.innerHTML = '';
        if (films.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No films found.</td></tr>';
            return;
        }
        films.forEach(film => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHTML(film.duration)}</td>
                <td><strong>${escapeHTML(film.title)}</strong></td>
                <td>${escapeHTML(film.location)}</td>
                <td><a href="${escapeHTML(film.videoUrl)}" target="_blank" style="color: var(--color-accent); font-size: 0.8rem; word-break: break-all;">${escapeHTML(film.videoUrl)}</a></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editFilm('${escapeHTML(film.id)}')">Edit</button>
                        <button class="action-btn delete" onclick="deleteFilm('${escapeHTML(film.id)}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5">Error loading films.</td></tr>';
    }
}

function openFilmModal(filmData = null) {
    const modal = document.getElementById('filmModal');
    const form = document.getElementById('filmForm');
    form.reset();

    if (filmData) {
        document.getElementById('film-modal-title').textContent = 'Edit Film';
        document.getElementById('film-edit-id').value = filmData.id;
        document.getElementById('film-title').value = filmData.title;
        document.getElementById('film-duration').value = filmData.duration;
        document.getElementById('film-location').value = filmData.location;
        document.getElementById('film-videourl').value = filmData.videoUrl;
        document.getElementById('film-description').value = filmData.description;
        updateMediaPreview(filmData.videoUrl, null, 'film-video-preview', 'film-video-placeholder');
        
        // Load existing gallery
        uploadedGalleryImages = filmData.gallery ? [...filmData.gallery] : [];
    } else {
        document.getElementById('film-modal-title').textContent = 'Add New Film';
        document.getElementById('film-edit-id').value = '';
        updateMediaPreview('', null, 'film-video-preview', 'film-video-placeholder');
        
        // Reset gallery
        uploadedGalleryImages = [];
    }
    
    // Update gallery UI
    document.getElementById('film-gallery').value = uploadedGalleryImages.length > 0 ? uploadedGalleryImages.length + ' files ready' : '';
    renderGalleryPreviews('film-gallery-preview-container');

    modal.style.display = 'flex';
}

function closeFilmModal() {
    document.getElementById('filmModal').style.display = 'none';
}

async function handleFilmSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('film-edit-id').value;
    const title = document.getElementById('film-title').value;
    const duration = document.getElementById('film-duration').value;
    const location = document.getElementById('film-location').value;
    const videoUrl = document.getElementById('film-videourl').value;
    const description = document.getElementById('film-description').value;
    const poster = 'main.png'; // Fallback since poster upload is removed
    
    // Add gallery (clone array to prevent reference issues)
    const gallery = [...uploadedGalleryImages];

    const payload = { title, duration, location, videoUrl, description, poster, gallery };

    const url = id ? `/api/films/${id}` : '/api/films';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeFilmModal();
            loadFilms();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to save film');
        }
    } catch (e) {
        alert('Server connection failed');
    }
}

async function editFilm(id) {
    try {
        const film = await fetch(`/api/films/${id}`).then(r => r.json());
        openFilmModal(film);
    } catch (e) {
        alert('Failed to retrieve film details');
    }
}

async function deleteFilm(id) {
    window.showConfirm('Are you sure you want to delete this film?', async () => {
        try {
            const res = await fetch(`/api/films/${id}`, { method: 'DELETE' });
            if (res.ok) loadFilms();
            else alert('Failed to delete film');
        } catch (e) {
            alert('Server error');
        }
    });
}

// ==========================================
// STORIES CRUD
// ==========================================
async function loadStories() {
    const tbody = document.getElementById('stories-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading stories...</td></tr>';
    try {
        const stories = await fetch('/api/stories').then(r => r.json());
        tbody.innerHTML = '';
        if (stories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No stories found.</td></tr>';
            return;
        }
        stories.forEach(story => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${escapeHTML(story.id)}</code></td>
                <td><strong>${escapeHTML(story.title)}</strong></td>
                <td>${escapeHTML(story.category)}</td>
                <td>${story.gallery ? story.gallery.length : 0} items</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editStory('${escapeHTML(story.id)}')">Edit</button>
                        <button class="action-btn delete" onclick="deleteStory('${escapeHTML(story.id)}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5">Error loading stories.</td></tr>';
    }
}

function openStoryModal(storyData = null) {
    const modal = document.getElementById('storyModal');
    const form = document.getElementById('storyForm');
    const idField = document.getElementById('story-id');
    form.reset();

    if (storyData) {
        document.getElementById('story-modal-title').textContent = 'Edit Story Essay';
        document.getElementById('story-edit-mode').value = 'edit';
        idField.value = storyData.id;
        idField.disabled = true; // Lock ID editing

        document.getElementById('story-title').value = storyData.title;
        document.getElementById('story-category').value = storyData.category;
        document.getElementById('story-subtitle').value = storyData.subtitle || '';
        document.getElementById('story-mainimage').value = storyData.mainImage;
        document.getElementById('story-description').value = storyData.description;
        updateMediaPreview(storyData.mainImage, 'story-image-preview', null, 'story-preview-placeholder');

        // Load existing gallery
        uploadedGalleryImages = storyData.gallery ? [...storyData.gallery] : [];
    } else {
        document.getElementById('story-modal-title').textContent = 'Add New Story Essay';
        document.getElementById('story-edit-mode').value = 'add';
        idField.disabled = false;
        updateMediaPreview('', 'story-image-preview', null, 'story-preview-placeholder');
        
        // Reset gallery
        uploadedGalleryImages = [];
    }
    
    // Update gallery UI
    document.getElementById('story-gallery').value = uploadedGalleryImages.length > 0 ? uploadedGalleryImages.length + ' images ready' : '';
    renderGalleryPreviews('story-gallery-preview-container');

    modal.style.display = 'flex';
}

function closeStoryModal() {
    document.getElementById('storyModal').style.display = 'none';
}

async function handleStorySubmit(e) {
    e.preventDefault();
    const mode = document.getElementById('story-edit-mode').value;
    const id = document.getElementById('story-id').value;
    const title = document.getElementById('story-title').value;
    const category = document.getElementById('story-category').value;
    const subtitle = document.getElementById('story-subtitle').value;
    const mainImage = document.getElementById('story-mainimage').value;
    const description = document.getElementById('story-description').value;
    
    // Add gallery images (clone array to prevent reference issues)
    const gallery = [...uploadedGalleryImages];

    const payload = { id, title, category, subtitle, mainImage, description, gallery };

    const url = mode === 'edit' ? `/api/stories/${id}` : '/api/stories';
    const method = mode === 'edit' ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeStoryModal();
            loadStories();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to save story');
        }
    } catch (e) {
        alert('Server connection failed');
    }
}

async function editStory(id) {
    try {
        const story = await fetch(`/api/stories/${id}`).then(r => r.json());
        openStoryModal(story);
    } catch (e) {
        alert('Failed to retrieve story details');
    }
}

async function deleteStory(id) {
    window.showConfirm('Are you sure you want to delete this story essay?', async () => {
        try {
            const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
            if (res.ok) loadStories();
            else alert('Failed to delete story');
        } catch (e) {
            alert('Server error');
        }
    });
}

// ==========================================
// MESSAGES (CONTACTS)
// ==========================================
async function loadContacts() {
    const list = document.getElementById('contacts-list');
    list.innerHTML = '<p>Loading messages...</p>';
    try {
        const contacts = await fetch('/api/contacts').then(r => r.json());
        list.innerHTML = '';
        if (contacts.length === 0) {
            list.innerHTML = '<p>No messages received yet.</p>';
            return;
        }
        // Show newest messages first
        contacts.reverse().forEach(msg => {
            const dateObj = new Date(msg.date);
            const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const div = document.createElement('div');
            div.className = 'message-card';
            div.innerHTML = `
                <div class="message-header">
                    <div class="message-meta">
                        From: <strong>${escapeHTML(msg.name)}</strong> (&nbsp;<a href="mailto:${escapeHTML(msg.email)}" style="color: var(--color-accent); text-decoration: none;">${escapeHTML(msg.email)}</a>&nbsp;)
                        <br>
                        Subject: <strong>${escapeHTML(msg.subject)}</strong>
                    </div>
                    <div>
                        <span style="font-size: 0.75rem; color: #777; margin-right: 1.5rem;">${escapeHTML(dateStr)}</span>
                        <button class="action-btn delete" onclick="deleteContactMessage('${escapeHTML(msg.id)}')">Delete</button>
                    </div>
                </div>
                <div class="message-body">${escapeHTML(msg.message)}</div>
            `;
            list.appendChild(div);
        });
    } catch (e) {
        list.innerHTML = '<p>Error loading messages.</p>';
    }
}

async function deleteContactMessage(id) {
    window.showConfirm('Are you sure you want to delete this message?', async () => {
        try {
            const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
            if (res.ok) loadContacts();
            else alert('Failed to delete message');
        } catch (e) {
            alert('Server error');
        }
    });
}

// ==========================================
// THEMES CRUD & SWITCHING
// ==========================================
// ==========================================
// UPLOADED MEDIA
// ==========================================
function showUploadedSection(section) {
    const btnFilms = document.getElementById('btn-uploaded-films-stories');
    const btnBg = document.getElementById('btn-uploaded-background-about');
    const secFilms = document.getElementById('uploaded-films-stories');
    const secBg = document.getElementById('uploaded-background-about');

    if (section === 'films-stories') {
        btnFilms.style.borderColor = 'var(--color-accent)';
        btnFilms.style.color = 'var(--color-accent)';
        btnBg.style.borderColor = '#333';
        btnBg.style.color = '#fff';
        secFilms.style.display = 'block';
        secBg.style.display = 'none';
    } else {
        btnBg.style.borderColor = 'var(--color-accent)';
        btnBg.style.color = 'var(--color-accent)';
        btnFilms.style.borderColor = '#333';
        btnFilms.style.color = '#fff';
        secBg.style.display = 'block';
        secFilms.style.display = 'none';
    }
}

function openDeleteMediaModal(filename, type) {
    const modal = document.getElementById('deleteMediaModal');
    const imgPreview = document.getElementById('delete-media-preview-img');
    const vidPreview = document.getElementById('delete-media-preview-vid');
    
    document.getElementById('delete-media-filename').value = filename;
    
    const url = filename.startsWith('http') || filename.startsWith('/') ? filename : `../assets/images/${filename}`;
    
    if (type === 'video') {
        vidPreview.src = url;
        vidPreview.style.display = 'block';
        imgPreview.style.display = 'none';
    } else {
        imgPreview.src = url;
        imgPreview.style.display = 'block';
        vidPreview.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

function closeDeleteMediaModal() {
    document.getElementById('deleteMediaModal').style.display = 'none';
    document.getElementById('delete-media-preview-vid').src = '';
    document.getElementById('delete-media-preview-img').src = '';
}

async function confirmDeleteMedia() {
    const filename = document.getElementById('delete-media-filename').value;
    if (!filename) return;
    
    try {
        const res = await fetch(`/api/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        if (res.ok) {
            closeDeleteMediaModal();
            loadUploadedMedia();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to delete media');
        }
    } catch (e) {
        alert('Server error');
    }
}

async function loadUploadedMedia() {
    const gridFilms = document.getElementById('grid-uploaded-films-stories');
    const gridBg = document.getElementById('grid-uploaded-background-about');
    
    gridFilms.innerHTML = '<p>Loading media...</p>';
    gridBg.innerHTML = '<p>Loading media...</p>';

    try {
        const res = await fetch('/api/uploads');
        if (!res.ok) throw new Error('Failed to load uploads');
        const data = await res.json();

        const renderMedia = (mediaItem) => {
            const url = mediaItem.url.startsWith('http') || mediaItem.url.startsWith('/') ? mediaItem.url : `../assets/images/${mediaItem.url}`;
            const isVideo = mediaItem.type === 'video' || url.endsWith('.mp4') || url.endsWith('.webm');
            const mediaTypeStr = isVideo ? 'video' : 'image';
            
            if (isVideo) {
                return `<div style="border: 1px solid var(--border-color); border-radius: var(--border-radius); overflow: hidden; background: #000; padding-bottom: 5px; cursor: pointer; transition: border-color 0.3s;" onmouseover="this.style.borderColor='var(--color-accent)'" onmouseout="this.style.borderColor='var(--border-color)'" onclick="openDeleteMediaModal('${escapeHTML(mediaItem.url)}', '${mediaTypeStr}')">
                    <video src="${escapeHTML(url)}" style="width: 100%; height: 150px; object-fit: cover;" muted></video>
                    <div style="font-size: 0.75rem; padding: 0.5rem; text-align: center; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(mediaItem.title)}">${escapeHTML(mediaItem.title)}</div>
                </div>`;
            } else {
                return `<div style="border: 1px solid var(--border-color); border-radius: var(--border-radius); overflow: hidden; background: #000; padding-bottom: 5px; cursor: pointer; transition: border-color 0.3s;" onmouseover="this.style.borderColor='var(--color-accent)'" onmouseout="this.style.borderColor='var(--border-color)'" onclick="openDeleteMediaModal('${escapeHTML(mediaItem.url)}', '${mediaTypeStr}')">
                    <img src="${escapeHTML(url)}" style="width: 100%; height: 150px; object-fit: cover;">
                    <div style="font-size: 0.75rem; padding: 0.5rem; text-align: center; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(mediaItem.title)}">${escapeHTML(mediaItem.title)}</div>
                </div>`;
            }
        };

        gridFilms.innerHTML = data.filmsStories && data.filmsStories.length > 0 
            ? data.filmsStories.map(renderMedia).join('') 
            : '<p>No media found.</p>';
            
        gridBg.innerHTML = data.backgroundAbout && data.backgroundAbout.length > 0 
            ? data.backgroundAbout.map(renderMedia).join('') 
            : '<p>No media found.</p>';

    } catch (e) {
        gridFilms.innerHTML = '<p>Error loading media.</p>';
        gridBg.innerHTML = '<p>Error loading media.</p>';
        console.error('Failed to load uploaded media', e);
    }
}

async function loadThemes() {
    const grid = document.getElementById('themes-grid');
    grid.innerHTML = '<p>Loading themes...</p>';
    try {
        const [themes, activeTheme] = await Promise.all([
            fetch('/api/themes').then(r => r.json()),
            fetch('/api/theme').then(r => r.json())
        ]);

        grid.innerHTML = '';
        themes.forEach(theme => {
            const isActive = theme.id === activeTheme.id;
            const card = document.createElement('div');
            card.className = 'theme-card';
            card.style.cssText = `
                background: ${theme.variables['--card-bg']};
                border: 1px solid ${isActive ? 'var(--color-accent)' : theme.variables['--border-color']};
                padding: 2rem;
                border-radius: ${theme.variables['--border-radius']};
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                gap: 1.5rem;
                transition: all 0.3s ease;
                box-shadow: ${isActive ? '0 0 15px var(--color-accent)' : 'none'};
            `;

            // Color Palette blocks to preview colors
            const colorsHtml = `
                <div style="display: flex; gap: 0.8rem; margin: 1rem 0;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${theme.variables['--color-bg']}; border: 1px solid #333;" title="Background Color"></div>
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${theme.variables['--color-text']}; border: 1px solid #333;" title="Text Color"></div>
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${theme.variables['--color-accent']}; border: 1px solid #333;" title="Accent Color"></div>
                </div>
            `;

            // Fonts description block to preview fonts
            const fontHeadingName = theme.variables['--font-heading'].replace(/'/g, '');
            const fontsHtml = `
                <div style="border-top: 1px solid ${theme.variables['--border-color']}; padding-top: 1rem; margin-top: 1rem;">
                    <span style="font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 1px;">Heading Font Preview</span>
                    <h4 style="font-family: ${theme.variables['--font-heading']}; font-size: 1.5rem; color: ${theme.variables['--color-text']}; margin: 0.5rem 0 0.8rem 0; font-weight: 400;">
                        ${fontHeadingName.split(',')[0]}
                    </h4>
                </div>
            `;

            const layoutHtml = `
                <div style="border-top: 1px solid ${theme.variables['--border-color']}; padding-top: 1rem; margin-top: 1rem; font-size: 0.75rem; color: ${theme.variables['--color-text-muted']};">
                    <span style="font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 0.4rem;">Design Parameters</span>
                    <div>Layout corners: <strong>${theme.variables['--border-radius']}</strong></div>
                    <div>Image spacing: <strong>${theme.variables['--grid-gap']}</strong></div>
                </div>
            `;

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 style="font-family: var(--font-heading); font-size: 1.3rem; color: #fff; margin: 0;">${escapeHTML(theme.name)}</h3>
                        ${isActive ? '<span style="background: rgba(176, 141, 92, 0.2); color: var(--color-accent); font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Active</span>' : ''}
                    </div>
                    <p style="color: var(--color-text-muted); font-size: 0.85rem; line-height: 1.5; margin: 1rem 0 0 0;">${escapeHTML(theme.description)}</p>
                    ${colorsHtml}
                    ${fontsHtml}
                    ${layoutHtml}
                </div>
                <button class="btn btn-outline" style="width: 100%; border-color: ${isActive ? 'var(--color-accent)' : '#333'}; color: ${isActive ? '#000' : '#fff'}; background: ${isActive ? 'var(--color-accent)' : 'transparent'}; pointer-events: ${isActive ? 'none' : 'auto'}; cursor: ${isActive ? 'default' : 'pointer'}; border-radius: ${theme.variables['--border-radius']};" onclick="applyTheme('${escapeHTML(theme.id)}')">
                    ${isActive ? 'Active Theme' : 'Apply Theme'}
                </button>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<p>Error loading themes list.</p>';
    }
}

async function applyTheme(themeId) {
    try {
        const res = await fetch('/api/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ themeId })
        });
        if (res.ok) {
            const data = await res.json();
            // Cache active theme in localStorage immediately for local fast rendering
            localStorage.setItem('deyone_portfolio_theme', JSON.stringify(data.theme));
            
            // Set variables dynamically on the page
            const root = document.documentElement;
            for (const [key, value] of Object.entries(data.theme.variables)) {
                root.style.setProperty(key, value);
            }
            root.className = 'theme-' + data.theme.id;
            
            // Reload themes tab to reflect the active selection status
            loadThemes();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to apply theme');
        }
    } catch (err) {
        alert('Connection error. Failed to apply theme.');
    }
}

// ==========================================
// HOME SETTINGS CRUD
// ==========================================
async function loadHomeSettings() {
    try {
        const res = await fetch('/api/home');
        if (!res.ok) throw new Error('Failed to load home data');
        const data = await res.json();
        
        // Populate inputs
        document.getElementById('home-hero-eyebrow').value = data.hero.eyebrow || '';
        document.getElementById('home-hero-title').value = data.hero.title || '';
        document.getElementById('home-hero-desc').value = data.hero.description || '';
        document.getElementById('home-hero-image').value = data.hero.image || '';
        
        document.getElementById('home-about-eyebrow').value = data.about?.eyebrow || '';
        document.getElementById('home-about-title').value = data.about?.title || '';
        document.getElementById('home-about-desc1').value = data.about?.description1 || '';
        document.getElementById('home-about-desc2').value = data.about?.description2 || '';
        document.getElementById('home-about-image').value = data.about?.image || '';

        // Stories Intro
        document.getElementById('stories-intro-eyebrow').value = data.storiesIntro?.eyebrow || '';
        document.getElementById('stories-intro-title').value = data.storiesIntro?.title || '';
        document.getElementById('stories-intro-description').value = data.storiesIntro?.description || '';

        // Films Intro
        document.getElementById('films-intro-eyebrow').value = data.filmsIntro?.eyebrow || '';
        document.getElementById('films-intro-title').value = data.filmsIntro?.title || '';
        document.getElementById('films-intro-description').value = data.filmsIntro?.description || '';

        // Services
        document.getElementById('services-eyebrow').value = data.services?.eyebrow || '';
        document.getElementById('services-title').value = data.services?.title || '';
        document.getElementById('services-1-title').value = data.services?.service1Title || '';
        document.getElementById('services-1-desc').value = data.services?.service1Desc || '';
        document.getElementById('services-2-title').value = data.services?.service2Title || '';
        document.getElementById('services-2-desc').value = data.services?.service2Desc || '';
        document.getElementById('services-3-title').value = data.services?.service3Title || '';
        document.getElementById('services-3-desc').value = data.services?.service3Desc || '';

        // Contact & Footer
        document.getElementById('contact-eyebrow').value = data.contact?.eyebrow || '';
        document.getElementById('contact-title').value = data.contact?.title || '';
        document.getElementById('contact-description').value = data.contact?.description || '';
        document.getElementById('contact-email').value = data.contact?.email || '';
        document.getElementById('contact-phone').value = data.contact?.phone || '';
        document.getElementById('contact-location').value = data.contact?.location || '';
        document.getElementById('contact-syndication').value = data.contact?.syndication || '';
        document.getElementById('contact-profile').value = data.contact?.profile || '';
        document.getElementById('contact-social-instagram').value = data.contact?.socialInstagram || '';
        document.getElementById('contact-social-twitter').value = data.contact?.socialTwitter || '';
        document.getElementById('contact-social-facebook').value = data.contact?.socialFacebook || '';
        document.getElementById('contact-social-linkedin').value = data.contact?.socialLinkedin || '';

        // Update previews
        const heroImgName = data.hero.image;
        if (heroImgName) {
            document.getElementById('hero-image-preview').src = `../assets/images/${heroImgName}`;
            document.getElementById('hero-image-preview').style.display = 'block';
            document.getElementById('hero-preview-placeholder').style.display = 'none';
        } else {
            document.getElementById('hero-image-preview').style.display = 'none';
            document.getElementById('hero-preview-placeholder').style.display = 'block';
        }
        
        const aboutImgName = data.about.image;
        if (aboutImgName) {
            document.getElementById('about-image-preview').src = `../assets/images/${aboutImgName}`;
            document.getElementById('about-image-preview').style.display = 'block';
            document.getElementById('about-preview-placeholder').style.display = 'none';
        } else {
            document.getElementById('about-image-preview').style.display = 'none';
            document.getElementById('about-preview-placeholder').style.display = 'block';
        }
    } catch (e) {
        console.error('Home settings loading failed', e);
        alert('Failed to load home page settings content');
    }
}

async function handleHomeSettingsSubmit(e) {
    e.preventDefault();
    const hero = {
        eyebrow: document.getElementById('home-hero-eyebrow').value,
        title: document.getElementById('home-hero-title').value,
        description: document.getElementById('home-hero-desc').value,
        image: document.getElementById('home-hero-image').value
    };
    const about = {
        eyebrow: document.getElementById('home-about-eyebrow').value,
        title: document.getElementById('home-about-title').value,
        description1: document.getElementById('home-about-desc1').value,
        description2: document.getElementById('home-about-desc2').value,
        image: document.getElementById('home-about-image').value
    };
    const storiesIntro = {
        eyebrow: document.getElementById('stories-intro-eyebrow').value,
        title: document.getElementById('stories-intro-title').value,
        description: document.getElementById('stories-intro-description').value
    };
    const filmsIntro = {
        eyebrow: document.getElementById('films-intro-eyebrow').value,
        title: document.getElementById('films-intro-title').value,
        description: document.getElementById('films-intro-description').value
    };
    const services = {
        eyebrow: document.getElementById('services-eyebrow').value,
        title: document.getElementById('services-title').value,
        service1Title: document.getElementById('services-1-title').value,
        service1Desc: document.getElementById('services-1-desc').value,
        service2Title: document.getElementById('services-2-title').value,
        service2Desc: document.getElementById('services-2-desc').value,
        service3Title: document.getElementById('services-3-title').value,
        service3Desc: document.getElementById('services-3-desc').value
    };
    const contact = {
        eyebrow: document.getElementById('contact-eyebrow').value,
        title: document.getElementById('contact-title').value,
        description: document.getElementById('contact-description').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        location: document.getElementById('contact-location').value,
        syndication: document.getElementById('contact-syndication').value,
        profile: document.getElementById('contact-profile').value,
        socialInstagram: document.getElementById('contact-social-instagram').value,
        socialTwitter: document.getElementById('contact-social-twitter').value,
        socialFacebook: document.getElementById('contact-social-facebook').value,
        socialLinkedin: document.getElementById('contact-social-linkedin').value
    };
    
    try {
        const res = await fetch('/api/home', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hero, about, storiesIntro, filmsIntro, services, contact })
        });
        if (res.ok) {
            alert('Home settings saved successfully!');
            loadHomeSettings();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to save settings');
        }
    } catch (err) {
        alert('Connection error. Failed to save settings.');
    }
}

// Client-side Image Cropping & Upload Handling
function handleImageFileChange(input, type, targetWidth, targetHeight) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Scale to 4K max dimension for clarity preservation
            const maxDimension = 3840;
            if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight / targetWidth) * maxDimension);
                targetWidth = maxDimension;
            } else {
                targetWidth = Math.round((targetWidth / targetHeight) * maxDimension);
                targetHeight = maxDimension;
            }

            // Create canvas for cropping and scaling
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            // Calculate cropping metrics to center-crop the selected image
            const imageRatio = img.width / img.height;
            const targetRatio = targetWidth / targetHeight;
            let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

            if (imageRatio > targetRatio) {
                // Image is wider than target ratio
                sourceWidth = img.height * targetRatio;
                sourceX = (img.width - sourceWidth) / 2;
            } else if (imageRatio < targetRatio) {
                // Image is taller than target ratio
                sourceHeight = img.width / targetRatio;
                sourceY = (img.height - sourceHeight) / 2;
            }

            // Draw cropped image onto the canvas
            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

            // Export canvas as JPEG (quality 1.0 for maximum clarity)
            const base64Data = canvas.toDataURL('image/jpeg', 1.0);

            // Upload to server
            uploadAdminFile(base64Data, type, `home-${type}-image`, `${type}-image-preview`, null, `${type}-preview-placeholder`);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Global Media Preview Utility
function updateMediaPreview(filename, imgElementId, videoElementId, placeholderId) {
    const imgEl = imgElementId ? document.getElementById(imgElementId) : null;
    const videoEl = videoElementId ? document.getElementById(videoElementId) : null;
    const placeholderEl = document.getElementById(placeholderId);

    if (imgEl) {
        imgEl.style.display = 'none';
        imgEl.src = '';
    }
    if (videoEl) {
        videoEl.style.display = 'none';
        videoEl.src = '';
    }
    placeholderEl.style.display = 'block';

    if (!filename) return;

    const ext = filename.split('.').pop().toLowerCase();
    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);

    if (isVideo && videoEl) {
        videoEl.src = filename.startsWith('http') || filename.startsWith('/') ? filename : `../assets/images/${filename}`;
        videoEl.style.display = 'block';
        placeholderEl.style.display = 'none';
    } else if (!isVideo && imgEl) {
        imgEl.src = filename.startsWith('http') || filename.startsWith('/') ? filename : `../assets/images/${filename}`;
        imgEl.style.display = 'block';
        placeholderEl.style.display = 'none';
    }
}

function clearMediaUpload(inputId, imgPreviewId, videoPreviewId, placeholderId) {
    document.getElementById(inputId).value = '';
    updateMediaPreview('', imgPreviewId, videoPreviewId, placeholderId);
}

function renderGalleryPreviews(containerId) {
    const previewContainer = document.getElementById(containerId);
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    uploadedGalleryImages.forEach((img, i) => {
        const previewWrapper = document.createElement('div');
        previewWrapper.style.cssText = 'position: relative; width: 80px; height: 80px; flex-shrink: 0; border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden;';
        
        if (img.src.match(/\.(mp4|webm|ogg|mov)$/i)) {
            previewWrapper.innerHTML = `<video src="/assets/images/${img.src}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
        } else {
            previewWrapper.innerHTML = `<img src="/assets/images/${img.src}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }

        const removeBtn = document.createElement('div');
        removeBtn.innerHTML = '×';
        removeBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; background: rgba(200,0,0,0.8); color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; font-weight: bold; line-height: 1;';
        removeBtn.onclick = function() {
            uploadedGalleryImages.splice(i, 1);
            renderGalleryPreviews(containerId);
        };
        previewWrapper.appendChild(removeBtn);
        previewContainer.appendChild(previewWrapper);
    });
}

// Global File Handler (includes client-side center-cropping for photos)
function handleAdminFileChange(input, type, inputId, imgPreviewId, videoPreviewId, placeholderId) {
    const file = input.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadAdminFile(e.target.result, type, inputId, imgPreviewId, videoPreviewId, placeholderId);
        };
        reader.readAsDataURL(file);
    } else {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let targetWidth = 3840;
                let targetHeight = 2560;

                if (type === 'film_poster') {
                    targetWidth = 2560;
                    targetHeight = 3840;
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');

                const imageRatio = img.width / img.height;
                const targetRatio = targetWidth / targetHeight;
                let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

                if (imageRatio > targetRatio) {
                    sourceWidth = img.height * targetRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                } else if (imageRatio < targetRatio) {
                    sourceHeight = img.width / targetRatio;
                    sourceY = (img.height - sourceHeight) / 2;
                }

                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
                const base64Data = canvas.toDataURL('image/jpeg', 1.0);

                uploadAdminFile(base64Data, type, inputId, imgPreviewId, videoPreviewId, placeholderId);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadAdminFile(fileData, type, inputId, imgPreviewId, videoPreviewId, placeholderId) {
    try {
        const res = await fetch('/api/upload-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData, type })
        });

        if (res.ok) {
            const data = await res.json();
            const filename = data.filename;

            document.getElementById(inputId).value = filename;
            updateMediaPreview(filename, imgPreviewId, videoPreviewId, placeholderId);
            alert('Media uploaded successfully!');
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to upload media.');
        }
    } catch (err) {
        console.error('File upload failed', err);
        alert('Connection error. Failed to upload media.');
    }
}

let uploadedGalleryImages = [];

async function handleAdminGalleryChange(input, inputId) {
    const files = input.files;
    if (!files || files.length === 0) return;

    document.getElementById(inputId).value = 'Uploading ' + files.length + ' files...';
    const previewContainer = document.getElementById(inputId + '-preview-container');
    
    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isImage && !isVideo) continue;
        
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(file);
            });

            let finalBase64 = base64;

            if (isImage) {
                // Crop to center square for gallery preview
                const img = new Image();
                img.src = base64;
                await new Promise(r => img.onload = r);
                
                const canvas = document.createElement('canvas');
                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, (img.width - size)/2, (img.height - size)/2, size, size, 0, 0, size, size);
                
                finalBase64 = canvas.toDataURL('image/jpeg', 0.85);
            }

            const uploadType = inputId.includes('film') ? 'film_gallery' : 'story_gallery';
            const res = await fetch('/api/upload-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileData: finalBase64, type: uploadType })
            });
            const data = await res.json();
            if (data.success) {
                uploadedGalleryImages.push({ src: data.filename, alt: 'Gallery Media', type: isVideo ? 'video' : 'image' });
                renderGalleryPreviews(inputId + '-preview-container');
            }
        } catch (err) {
            console.error('Failed to upload gallery media', err);
        }
    }
    
    document.getElementById(inputId).value = uploadedGalleryImages.length + ' files ready';
}
