
function setMobileMenu(open) {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.toggle('hidden', !open);
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function navigateTo(viewId) {
    const views = document.querySelectorAll('.view-section');
    views.forEach(el => el.classList.remove('active'));

    const target = document.getElementById(viewId);
    if (!target) {
        // Hard fallback to home
        window.location.hash = '#home';
        return;
    }
    target.classList.add('active');
    window.scrollTo(0, 0);
    setMobileMenu(false);
}

function currentHash() {
    return (window.location.hash || '#home').replace('#', '');
}

window.addEventListener('DOMContentLoaded', () => {
    // Ensure aria is correct at start
    setMobileMenu(false);
    navigateTo(currentHash());
});

window.addEventListener('hashchange', () => {
    navigateTo(currentHash());
});

// Optional: contact form prevent refresh for now
window.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#contact form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Message handler not wired yet.');
        });
    }
});
