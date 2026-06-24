const USERS_KEY = 'ecoxplore_users';
const SESSION_KEY = 'ecoxplore_session';
const THEME_KEY = 'ecoxplore_theme';



function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        const isDark = theme === 'dark';
        toggle.setAttribute('aria-pressed', String(isDark));
        toggle.querySelector('.theme-toggle-icon').textContent = isDark ? 'L' : 'D';
        toggle.querySelector('.theme-toggle-text').textContent = isDark ? 'Light' : 'Dark';
        toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function getStoredList(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

function saveToDatabase(collection, data) {
    const items = getStoredList(collection);
    items.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem(collection, JSON.stringify(items));
    return { success: true };
}

function signup(name, email, password) {
    const users = getStoredList(USERS_KEY);
    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: 'An account already exists for this email.' };
    }
    users.push({ name, email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true };
}

function login(email, password) {
    const users = getStoredList(USERS_KEY);
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!user) return { success: false, message: 'Please check your email and password.' };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
    return { success: true };
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
}

function updateNav() {
    const navContent = document.getElementById('navbarNav');
    if (!navContent) return;

    const navLinksContainer = navContent.querySelector('.navbar-nav');
    const session = getSession();
    const accountMarkup = session
        ? `<li class="nav-item ms-lg-2"><span class="badge bg-success py-2 px-3 rounded-pill">${session.name.split(' ')[0]}</span></li><li class="nav-item"><a class="nav-link text-danger" href="#" id="logoutLink">Logout</a></li>`
        : `<li class="nav-item ms-lg-2"><a class="btn btn-primary" href="signup.html">Explore Now</a></li>`;

    navLinksContainer.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="about.html">About Us</a></li>
        <li class="nav-item"><a class="nav-link" href="tours.html">Tours</a></li>
        <li class="nav-item"><a class="nav-link" href="gallery.html">Gallery</a></li>
        <li class="nav-item"><a class="nav-link" href="booking.html">Booking</a></li>
        <li class="nav-item"><a class="nav-link" href="contact.html">Contact</a></li>
        ${accountMarkup}
        <li class="nav-item ms-lg-2"><button class="theme-toggle" id="themeToggle" type="button" aria-pressed="false"><span class="theme-toggle-icon">D</span><span class="theme-toggle-text">Dark</span></button></li>
    `;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) logoutLink.addEventListener('click', (event) => { event.preventDefault(); logout(); });

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        applyTheme(document.documentElement.getAttribute('data-theme') || getPreferredTheme());
    }
}

function setMessage(form, message, type = 'success') {
    const box = form.querySelector('.form-message');
    if (!box) return;
    box.textContent = message;
    box.className = `form-message show ${type}`;
}

function validateRequired(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
        const empty = !String(field.value).trim();
        const badEmail = field.type === 'email' && field.value && !field.checkValidity();
        const badNumber = field.type === 'number' && field.value && !field.checkValidity();
        const bad = empty || badEmail || badNumber;
        field.classList.toggle('is-invalid', bad);
        if (bad) valid = false;
    });
    return valid;
}

function initForms() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!validateRequired(signupForm)) return setMessage(signupForm, 'Please complete every required field correctly.', 'error');
            const password = document.getElementById('regPassword').value;
            if (password.length < 6) return setMessage(signupForm, 'Password must contain at least 6 characters.', 'error');
            const result = signup(document.getElementById('regName').value.trim(), document.getElementById('regEmail').value.trim(), password);
            if (!result.success) return setMessage(signupForm, result.message, 'error');
            setMessage(signupForm, 'Account created. You can now log in.', 'success');
            if (window.toggleAuth) window.toggleAuth('login');
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!validateRequired(loginForm)) return setMessage(loginForm, 'Enter your email and password.', 'error');
            const result = login(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value);
            if (!result.success) return setMessage(loginForm, result.message, 'error');
            window.location.href = 'index.html';
        });
    }

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!validateRequired(bookingForm)) return setMessage(bookingForm, 'Please complete the booking details correctly.', 'error');
            const selectedDate = new Date(document.getElementById('preferredDate').value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) return setMessage(bookingForm, 'Preferred date must be today or a future date.', 'error');
            saveToDatabase('bookings', {
                name: document.getElementById('bookName').value.trim(),
                email: document.getElementById('bookEmail').value.trim(),
                phone: document.getElementById('bookPhone').value.trim(),
                tour: document.getElementById('tourSelect').value,
                preferredDate: document.getElementById('preferredDate').value,
                travelers: document.getElementById('travelers').value,
                notes: document.getElementById('specialReq').value.trim()
            });
            bookingForm.reset();
            setMessage(bookingForm, 'Booking inquiry sent. Our team will contact you soon.', 'success');
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!validateRequired(contactForm)) return setMessage(contactForm, 'Please fill in the contact form correctly.', 'error');
            saveToDatabase('messages', {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim()
            });
            contactForm.reset();
            setMessage(contactForm, 'Message sent. Thank you for contacting EcoXplore.', 'success');
        });
    }
}

function initReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        revealElements.forEach((el) => el.classList.add('active'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    revealElements.forEach((el) => observer.observe(el));
}

function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const image = document.getElementById('lightbox-img');
    if (!lightbox || !image) return;
    image.src = src;
    lightbox.style.display = 'flex';
    lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme());
    updateNav();
    initForms();
    initReveal();
});
