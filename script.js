document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ========== NAVIGATION ==========
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    function setMenu(open) {
        if (!navLinks || !navToggle) return;
        navLinks.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
        document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    }

    // ========== PROJECT FILTER (projects listing page) ==========
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectRows = document.querySelectorAll('.project-stack-row');
    if (filterTabs.length && projectRows.length) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                projectRows.forEach(row => {
                    if (filter === 'all' || row.dataset.category === filter) {
                        row.classList.remove('is-hidden');
                    } else {
                        row.classList.add('is-hidden');
                    }
                });
            });
        });
    }

    // ========== SCROLL REVEAL ==========
    // Classes (not inline styles) so hover effects keep working; they are removed once the fade-in is done.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && 'IntersectionObserver' in window) {
        const revealItems = document.querySelectorAll('.project-stack-row, .experience-item, .about-card, .contact-card, .aesthetic-form, .panel, .hero-stats, .hero-open, .tool-box, .tool-center, .m-tile, .stag-card, .tile, .bar-link');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add('rv-in');
                observer.unobserve(el);
                setTimeout(() => el.classList.remove('rv', 'rv-in'), 800);
            });
        }, { threshold: 0.08 });
        revealItems.forEach(el => { el.classList.add('rv'); observer.observe(el); });
    }

    // ========== PROJECT STACK (sticky, scaling cards) ==========
    const stackRows = document.querySelectorAll('.project-stack-row');
    if (stackRows.length) {
        const stack = Array.from(stackRows).map(row => ({
            row,
            card: row.querySelector('.project-stack-card'),
            targetScale: parseFloat(row.dataset.targetScale) || 1
        }));

        function updateProjectStack() {
            // Sticky/scale effect is desktop-only; mobile lays cards out statically.
            if (window.innerWidth <= 700) return;
            const vh = window.innerHeight;
            stack.forEach(({ row, card, targetScale }) => {
                if (!card || row.classList.contains('is-hidden')) return;
                const rect = row.getBoundingClientRect();
                const progress = Math.min(Math.max((vh - rect.top) / vh, 0), 1);
                const scale = 1 - progress * (1 - targetScale);
                card.style.transform = `scale(${scale})`;
            });
        }

        window.addEventListener('scroll', updateProjectStack, { passive: true });
        window.addEventListener('resize', updateProjectStack);
        updateProjectStack();
    }

    // ========== SCROLL TO TOP ==========
    const scrollBtn = document.getElementById('scrollTop');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            scrollBtn.classList.toggle('visible', window.pageYOffset > 400);
        }, { passive: true });
        scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // ========== JOURNEY CAROUSEL ==========
    const carousel = document.getElementById('journeyCarousel');
    if (carousel) {
        const slides = Array.from(carousel.querySelectorAll('.slide'));
        const dotsWrap = carousel.querySelector('.car-dots');
        const n = slides.length;
        let index = 0;
        const dots = slides.map((_, i) => {
            const d = document.createElement('button');
            d.type = 'button';
            d.className = 'car-dot';
            d.setAttribute('role', 'tab');
            d.setAttribute('aria-label', (i + 1) + ' / ' + n);
            d.addEventListener('click', () => show(i));
            dotsWrap.appendChild(d);
            return d;
        });
        function show(i) {
            index = (i + n) % n;
            slides.forEach((slide, k) => {
                const isActive = k === index;
                slide.classList.toggle('is-active', isActive);
                slide.classList.toggle('is-prev', k === (index - 1 + n) % n && n > 1);
                slide.classList.toggle('is-next', k === (index + 1) % n && n > 2);
                slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            });
            dots.forEach((d, k) => d.setAttribute('aria-selected', k === index ? 'true' : 'false'));
        }
        carousel.querySelectorAll('.car-btn').forEach(btn => {
            btn.addEventListener('click', () => show(index + parseInt(btn.dataset.dir, 10)));
        });
        carousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') show(index - 1);
            if (e.key === 'ArrowRight') show(index + 1);
        });
        carousel.classList.add('is-ready');
        show(0);
    }

    // ========== CONTACT FORM ==========
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const status = document.getElementById('formStatus');
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const lang = () => {
            let l = 'en';
            try { l = localStorage.getItem('site-lang') === 'fr' ? 'fr' : 'en'; } catch (e) { /* storage blocked */ }
            return (typeof translations !== 'undefined' && translations[l]) || {};
        };
        const say = (key) => { if (status) status.textContent = lang()[key] || ''; };

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = contactForm.querySelector('input[name="name"]').value.trim();
            const email = contactForm.querySelector('input[name="email"]').value.trim();
            const message = contactForm.querySelector('textarea[name="message"]').value.trim();
            if (!name || !message || !/^\S+@\S+\.\S+$/.test(email)) { say('contact.invalid'); return; }

            submitBtn.disabled = true;
            say('contact.sending');

            fetch(contactForm.action, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(contactForm)
            })
                .then((response) => {
                    if (response.ok) { say('contact.success'); contactForm.reset(); }
                    else { say('contact.error'); }
                })
                .catch(() => say('contact.error'))
                .finally(() => { submitBtn.disabled = false; });
        });
    }
});
