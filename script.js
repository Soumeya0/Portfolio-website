document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ========== CURSOR ==========
    const cursor = document.querySelector('.cursor');
    const cursorTrail = document.querySelector('.cursor-trail');
    let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    function animateTrail() {
        trailX += (mouseX - trailX) * 0.08;
        trailY += (mouseY - trailY) * 0.08;
        cursorTrail.style.left = trailX + 'px';
        cursorTrail.style.top = trailY + 'px';
        requestAnimationFrame(animateTrail);
    }
    animateTrail();

    document.querySelectorAll('a, button, .project-card').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); cursorTrail.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); cursorTrail.classList.remove('hover'); });
    });

    // ========== NAVIGATION ==========
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
        });
    });

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
    const revealItems = document.querySelectorAll('.project-card, .project-stack-row, .experience-item, .about-card, .contact-card, .aesthetic-form');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    revealItems.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        observer.observe(el);
    });

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
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 400) scrollBtn.classList.add('visible');
        else scrollBtn.classList.remove('visible');
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ========== CONTACT FORM ==========
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const nameInput = contactForm.querySelector('input[name="name"]');
            const emailInput = contactForm.querySelector('input[name="email"]');
            const messageInput = contactForm.querySelector('textarea[name="message"]');

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            if (!name || !email || !message) {
                alert('Please fill in your name, email, and message ✿');
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address.');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending... ✉️';

            fetch(contactForm.action, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(contactForm)
            })
                .then((response) => {
                    if (response.ok) {
                        alert(`Thanks for reaching out, ${name}! I'll get back to you soon ✿`);
                        contactForm.reset();
                    } else {
                        alert("Hmm, something went wrong sending that. Mind trying again, or emailing me directly?");
                    }
                })
                .catch(() => {
                    alert("Hmm, something went wrong sending that. Mind trying again, or emailing me directly?");
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                });
        });
    }
});