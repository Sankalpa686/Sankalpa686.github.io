document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
        });

        // Close on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-active');
            });
        });
    }

    // 2. Initialize Arrow Escape Simulator
    let simInstance = null;
    const canvas = document.getElementById('arrowCanvas');
    if (canvas && window.ArrowPuzzleSimulator) {
        simInstance = new window.ArrowPuzzleSimulator('arrowCanvas');

        // Level selection
        document.querySelectorAll('.level-btn').forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('btn-primary'));
                btn.classList.add('btn-primary');
                simInstance.loadLevel(idx);
                const winBanner = document.getElementById('simWinBanner');
                if (winBanner) winBanner.style.display = 'none';
            });
        });

        // Hint Button
        const hintBtn = document.getElementById('btnSimHint');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                simInstance.getHint();
            });
        }

        // Reset Button
        const resetBtn = document.getElementById('btnSimReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                simInstance.resetLevel();
                const winBanner = document.getElementById('simWinBanner');
                if (winBanner) winBanner.style.display = 'none';
            });
        }

        // Projection Line Toggle
        const projBtn = document.getElementById('btnSimProjection');
        if (projBtn) {
            projBtn.addEventListener('click', () => {
                const active = simInstance.toggleProjection();
                projBtn.style.color = active ? 'var(--accent-cyan)' : 'var(--text-muted)';
                projBtn.style.borderColor = active ? 'var(--accent-cyan)' : 'var(--border-color)';
            });
        }

        // Sound Toggle
        const soundBtn = document.getElementById('btnSimSound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const active = simInstance.toggleSound();
                soundBtn.textContent = active ? '🔊 Audio ON' : '🔇 Audio OFF';
            });
        }

        // Win Banner Next Level
        const winNextBtn = document.getElementById('btnSimWinNext');
        if (winNextBtn) {
            winNextBtn.addEventListener('click', () => {
                simInstance.nextLevel();
                const winBanner = document.getElementById('simWinBanner');
                if (winBanner) winBanner.style.display = 'none';

                // update level buttons active state
                document.querySelectorAll('.level-btn').forEach((b, idx) => {
                    if (idx === simInstance.currentLevelIndex) b.classList.add('btn-primary');
                    else b.classList.remove('btn-primary');
                });
            });
        }
    }

    // 3. Screenshot Lightbox
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalClose = document.querySelector('.modal-close');

    if (modal && modalImg) {
        document.querySelectorAll('.gallery-item img').forEach(img => {
            img.parentElement.addEventListener('click', () => {
                modalImg.src = img.src;
                modal.classList.add('active');
            });
        });

        const closeModal = () => modal.classList.remove('active');
        if (modalClose) modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });
    }

    // 4. Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');

    if (contactForm && formFeedback) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('formName').value.trim();
            const email = document.getElementById('formEmail').value.trim();
            const message = document.getElementById('formMessage').value.trim();

            if (!name || !email || !message) {
                formFeedback.textContent = 'Please fill out all fields before sending.';
                formFeedback.style.color = '#ef4444';
                formFeedback.style.display = 'block';
                return;
            }

            // Open mailto link as direct action
            const subject = encodeURIComponent(`Inquiry from ${name} via Sankalpa AppWorks`);
            const body = encodeURIComponent(`From: ${name} (${email})\n\nMessage:\n${message}`);
            window.location.href = `mailto:azadmahapatra674@gmail.com?subject=${subject}&body=${body}`;

            formFeedback.textContent = 'Opening your email client... You can also write directly to azadmahapatra674@gmail.com!';
            formFeedback.style.color = 'var(--accent-cyan)';
            formFeedback.style.display = 'block';
            contactForm.reset();
        });
    }

    // 5. Copy Email Helper
    const copyEmailBtn = document.getElementById('copyEmailBtn');
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('azadmahapatra674@gmail.com').then(() => {
                const originalText = copyEmailBtn.textContent;
                copyEmailBtn.textContent = 'Copied to Clipboard!';
                setTimeout(() => {
                    copyEmailBtn.textContent = originalText;
                }, 2000);
            });
        });
    }
});
