document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════════
    // LIQUID GLASS THEME SWITCHER
    // ═══════════════════════════════════════
    const html = document.documentElement;
    const themeInputs = document.querySelectorAll('.switcher__input');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    html.setAttribute('data-theme', savedTheme);
    
    themeInputs.forEach(input => {
        // Init state
        if(input.value === savedTheme) {
            input.checked = true;
        }

        // Update theme
        input.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    });

    // ═══════════════════════════════════════
    // SMOOTH SCROLLING
    // ═══════════════════════════════════════
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ═══════════════════════════════════════
    // SCROLL REVEAL
    // ═══════════════════════════════════════
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // ═══════════════════════════════════════
    // NAVBAR & FAB SCROLL OBSERVER
    // ═══════════════════════════════════════
    const navbar = document.querySelector('.navbar');
    const resumeFab = document.getElementById('resume-fab');
    const fabOriginalParent = resumeFab ? resumeFab.parentElement : null;
    let fabIsSticky = false;

    const FAB_TARGET_BOTTOM = 32;
    const FAB_TARGET_RIGHT = 32;

    window.addEventListener('scroll', () => {
        if(window.scrollY > 10) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');

        if(resumeFab && fabOriginalParent) {
            if (window.scrollY > 500 && !fabIsSticky) {
                fabIsSticky = true;

                // 1. Capture current position on screen
                const rect = resumeFab.getBoundingClientRect();
                const startX = rect.left;
                const startY = rect.top;

                // 2. Move to body and position fixed at its current location (no visual jump)
                resumeFab.style.transition = 'none';
                resumeFab.style.position = 'fixed';
                resumeFab.style.left = startX + 'px';
                resumeFab.style.top = startY + 'px';
                resumeFab.style.right = 'auto';
                resumeFab.style.bottom = 'auto';
                document.body.appendChild(resumeFab);

                // 3. Force reflow, then animate to bottom-right corner
                resumeFab.offsetHeight;
                resumeFab.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                resumeFab.style.left = (window.innerWidth - resumeFab.offsetWidth - FAB_TARGET_RIGHT) + 'px';
                resumeFab.style.top = (window.innerHeight - resumeFab.offsetHeight - FAB_TARGET_BOTTOM) + 'px';

                resumeFab.classList.add('is-sticky');

            } else if (window.scrollY <= 500 && fabIsSticky) {
                fabIsSticky = false;

                // Calculate where the button needs to fly back to
                // Temporarily put a ghost in the original parent to measure
                const ghost = document.createElement('span');
                ghost.style.display = 'inline-flex';
                ghost.style.visibility = 'hidden';
                ghost.style.width = resumeFab.offsetWidth + 'px';
                ghost.style.height = resumeFab.offsetHeight + 'px';
                fabOriginalParent.appendChild(ghost);
                const targetRect = ghost.getBoundingClientRect();
                ghost.remove();

                // Animate back to the original position
                resumeFab.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                resumeFab.style.left = targetRect.left + 'px';
                resumeFab.style.top = targetRect.top + 'px';

                resumeFab.classList.remove('is-sticky');

                // After animation completes, return to DOM flow
                setTimeout(() => {
                    if (!fabIsSticky) {
                        resumeFab.style.transition = '';
                        resumeFab.style.position = '';
                        resumeFab.style.left = '';
                        resumeFab.style.top = '';
                        resumeFab.style.right = '';
                        resumeFab.style.bottom = '';
                        fabOriginalParent.appendChild(resumeFab);
                    }
                }, 500);
            }
        }
    }, { passive: true });

    // ═══════════════════════════════════════
    // SCROLL-SYNCED FRAME ANIMATION
    // with 3-phase overlays:
    //   Phase 1: Hero text (0-25% visible, fades 25-35%)
    //   Phase 2: Stats from sides (30-55% visible, fades 55-65%)
    //   Phase 3: Tool logos explode (65-90% pop in, hold to 100%)
    // ═══════════════════════════════════════

    const FRAME_COUNT = 241;
    const FRAME_DIR = 'videotojpg.com_download__1__jpg_20260405_165835';
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    const heroSection = document.getElementById('hero-sequence');
    const heroOverlay = document.getElementById('hero-overlay');
    const midStats = document.getElementById('mid-stats');
    const toolLogos = document.getElementById('tool-logos');
    const toolBubbles = document.querySelectorAll('.tool-bubble');
    const loader = document.getElementById('seq-loader');

    // Dynamic loader style
    const loaderStyle = document.createElement('style');
    loaderStyle.id = 'seq-loader-style';
    document.head.appendChild(loaderStyle);

    const frames = new Array(FRAME_COUNT);
    let loaded = 0;
    let ready = false;
    let lastFrame = -1;

    function src(i) {
        return `${FRAME_DIR}/img_${String(i).padStart(5, '0')}.jpg`;
    }

    // Preload
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = src(i);
        img.onload = () => {
            loaded++;
            loaderStyle.textContent = `.seq-loader-bar::after{width:${(loaded / FRAME_COUNT * 100).toFixed(1)}%!important}`;
            if (loaded === FRAME_COUNT) {
                ready = true;
                loader.classList.add('hidden');
                resizeCanvas();
                onScroll();
            }
        };
        frames[i - 1] = img;
    }

    // Canvas setup
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (ready && lastFrame >= 0) drawFrame(lastFrame);
    }

    function drawFrame(idx) {
        const img = frames[idx];
        if (!img || !img.complete) return;

        const cw = canvas.width, ch = canvas.height;
        const iA = img.naturalWidth / img.naturalHeight;
        const cA = cw / ch;
        let dw, dh, dx, dy;

        if (cA > iA) { dw = cw; dh = cw / iA; dx = 0; dy = (ch - dh) / 2; }
        else          { dh = ch; dw = ch * iA; dy = 0; dx = (cw - dw) / 2; }

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    // ── Easing helpers ──
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); }

    // ── 3-Phase Scroll Handler ──
    function onScroll() {
        if (!ready) return;

        const rect = heroSection.getBoundingClientRect();
        const scrollable = heroSection.offsetHeight - window.innerHeight;
        const scrolled = Math.max(0, -rect.top);
        const p = clamp01(scrolled / scrollable); // 0 → 1 scroll progress

        // ── Frame Index ──
        const idx = Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT));
        if (idx !== lastFrame) { drawFrame(idx); lastFrame = idx; }

        // ── Navbar shadow ──
        navbar.style.boxShadow = scrolled > 50 ? 'var(--glass-shadow-lg)' : 'var(--glass-shadow)';

        // ═══ PHASE 1: Hero text (visible 0→0.20, fades 0.20→0.30) ═══
        const textOpacity = 1 - smoothstep(0.18, 0.30, p);
        heroOverlay.style.opacity = textOpacity;
        heroOverlay.style.transform = `translateY(${p * -100}px)`;

        // Only show hero overlay when the section is visible
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            heroOverlay.style.opacity = 0;
        }

        // ═══ PHASE 2: Mid-scroll stats (appear 0.25→0.40, hold, fade 0.55→0.65) ═══
        const statsIn = smoothstep(0.25, 0.38, p);
        const statsOut = 1 - smoothstep(0.55, 0.65, p);
        const statsOpacity = Math.min(statsIn, statsOut);

        midStats.style.opacity = statsOpacity;

        // Slide stats in from sides
        const midStatElements = midStats.querySelectorAll('.mid-stat');
        midStatElements.forEach(stat => {
            const isLeft = stat.classList.contains('mid-stat--left');
            const slideOffset = (1 - statsIn) * (isLeft ? -60 : 60);
            stat.style.transform = `translateX(${slideOffset}px)`;
        });

        // Scale center orb in
        const midCenter = document.getElementById('mid-stat-center');
        if (midCenter) {
            midCenter.style.transform = `translate(-50%, -50%) scale(${0.85 + (statsIn * 0.15)})`;
        }

        // ═══ PHASE 3: Tool logos pop from center (0.65→0.90) ═══
        const logosVisible = p >= 0.60;
        toolLogos.style.opacity = logosVisible ? 1 : 0;
        toolLogos.style.pointerEvents = logosVisible ? 'auto' : 'none';

        toolBubbles.forEach((bubble, i) => {
            // Stagger: each bubble pops slightly after the previous
            const bubbleStart = 0.62 + (i * 0.03); // 0.62, 0.65, 0.68...
            const bubbleProgress = clamp01((p - bubbleStart) / 0.08);

            if (bubbleProgress > 0) {
                bubble.classList.add('popped');
                bubble.style.transitionDelay = `${i * 30}ms`;
            } else {
                bubble.classList.remove('popped');
                bubble.style.transitionDelay = '0ms';
            }
        });
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    resizeCanvas();

    // ═══════════════════════════════════════
    // DRAGGABLE TOOL BUBBLES
    // ═══════════════════════════════════════
    let draggedBubble = null;
    let startX, startY;
    let initialTransformX, initialTransformY;

    toolBubbles.forEach(bubble => {
        bubble.addEventListener('mousedown', (e) => {
            draggedBubble = bubble;
            bubble.classList.add('dragging');
            
            const style = window.getComputedStyle(bubble);
            const matrix = new WebKitCSSMatrix(style.transform);
            initialTransformX = matrix.m41;
            initialTransformY = matrix.m42;
            
            startX = e.clientX;
            startY = e.clientY;
            
            e.preventDefault(); // prevent text selection
        });
    });

    window.addEventListener('mousemove', (e) => {
        if (!draggedBubble) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        draggedBubble.style.transform = `translate(${initialTransformX + dx}px, ${initialTransformY + dy}px)`;
    });

    window.addEventListener('mouseup', () => {
        if (!draggedBubble) return;
        const bubble = draggedBubble;
        bubble.classList.remove('dragging');
        bubble.style.transform = ''; // clears inline style, snaps back via CSS transition
        draggedBubble = null;
    });

    // ═══════════════════════════════════════
    // EXPERIENCE COUNTER HOVER
    // ═══════════════════════════════════════
    const expTexts = document.querySelectorAll('.exp-text');
    expTexts.forEach(el => {
        const targetVal = parseFloat(el.getAttribute('data-num'));
        let animId = null;

        el.closest('.tool-bubble').addEventListener('mouseenter', () => {
            if (isNaN(targetVal)) return;
            if (animId) cancelAnimationFrame(animId);
            
            const duration = 900; // ms
            const startTime = performance.now();
            
            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                
                const currentVal = targetVal * eased;
                // Format: show 1 decimal for non-integers, whole number for integers
                if (Number.isInteger(targetVal)) {
                    el.textContent = Math.round(currentVal);
                } else {
                    el.textContent = currentVal.toFixed(1);
                }
                
                if (progress < 1) {
                    animId = requestAnimationFrame(update);
                } else {
                    el.textContent = targetVal;
                    animId = null;
                }
            }
            animId = requestAnimationFrame(update);
        });

        el.closest('.tool-bubble').addEventListener('mouseleave', () => {
            if (animId) { cancelAnimationFrame(animId); animId = null; }
            el.textContent = '0';
        });
    });

});
