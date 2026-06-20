// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeU4_xP528Cxe6x5w5e3vqspSh0BbCL9o",
  authDomain: "ecoxplore-70a42.firebaseapp.com",
  projectId: "ecoxplore-70a42",
  storageBucket: "ecoxplore-70a42.firebasestorage.app",
  messagingSenderId: "822551001338",
  appId: "1:822551001338:web:9471a68830fbc1ab607143",
  measurementId: "G-E2MLEFQSD8"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

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

async function saveToDatabase(collection, data) {
    try {
        data.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection(collection).add(data);
        return { success: true };
    } catch (error) {
        console.error("Error saving document: ", error);
        return { success: false, message: error.message };
    }
}

async function signup(name, email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: name
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function login(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Please check your email and password. ' + error.message };
    }
}

async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout error", error);
    }
}

function renderNavLinks(user) {
    const navContent = document.getElementById('navbarNav');
    if (!navContent) return;

    const navLinksContainer = navContent.querySelector('.navbar-nav');
    
    const accountMarkup = user
        ? `<li class="nav-item ms-lg-2"><span class="badge bg-success py-2 px-3 rounded-pill">${(user.displayName || user.email || 'Explorer').split(' ')[0]}</span></li><li class="nav-item"><a class="nav-link text-danger" href="#" id="logoutLink">Logout</a></li>`
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
        // Replace node to clear existing listeners
        const newThemeToggle = themeToggle.cloneNode(true);
        themeToggle.replaceWith(newThemeToggle);
        newThemeToggle.addEventListener('click', toggleTheme);
        applyTheme(document.documentElement.getAttribute('data-theme') || getPreferredTheme());
    }
}

function updateNav() {
    auth.onAuthStateChanged((user) => {
        renderNavLinks(user);
    });
}

function setMessage(form, message, type = 'success') {
    const box = form.querySelector('.form-message');
    if (!box) return;
    box.textContent = message;
    box.className = \`form-message show \${type}\`;
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
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateRequired(signupForm)) return setMessage(signupForm, 'Please complete every required field correctly.', 'error');
            const password = document.getElementById('regPassword').value;
            if (password.length < 6) return setMessage(signupForm, 'Password must contain at least 6 characters.', 'error');
            
            const btn = signupForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Creating Account...';
            btn.disabled = true;

            const result = await signup(document.getElementById('regName').value.trim(), document.getElementById('regEmail').value.trim(), password);
            
            btn.textContent = originalText;
            btn.disabled = false;

            if (!result.success) return setMessage(signupForm, result.message, 'error');
            setMessage(signupForm, 'Account created successfully! You are now logged in.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateRequired(loginForm)) return setMessage(loginForm, 'Enter your email and password.', 'error');
            
            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Logging In...';
            btn.disabled = true;

            const result = await login(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value);
            
            btn.textContent = originalText;
            btn.disabled = false;

            if (!result.success) return setMessage(loginForm, result.message, 'error');
            window.location.href = 'index.html';
        });
    }

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateRequired(bookingForm)) return setMessage(bookingForm, 'Please complete the booking details correctly.', 'error');
            const selectedDate = new Date(document.getElementById('preferredDate').value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) return setMessage(bookingForm, 'Preferred date must be today or a future date.', 'error');
            
            const btn = bookingForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Submitting...';
            btn.disabled = true;

            const result = await saveToDatabase('bookings', {
                name: document.getElementById('bookName').value.trim(),
                email: document.getElementById('bookEmail').value.trim(),
                phone: document.getElementById('bookPhone').value.trim(),
                tour: document.getElementById('tourSelect').value,
                preferredDate: document.getElementById('preferredDate').value,
                travelers: document.getElementById('travelers').value,
                notes: document.getElementById('specialReq').value.trim()
            });

            btn.textContent = originalText;
            btn.disabled = false;

            if (!result.success) return setMessage(bookingForm, result.message, 'error');

            bookingForm.reset();
            setMessage(bookingForm, 'Booking inquiry sent. Our team will contact you soon.', 'success');
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateRequired(contactForm)) return setMessage(contactForm, 'Please fill in the contact form correctly.', 'error');
            
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            const result = await saveToDatabase('messages', {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim()
            });

            btn.textContent = originalText;
            btn.disabled = false;

            if (!result.success) return setMessage(contactForm, result.message, 'error');

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
