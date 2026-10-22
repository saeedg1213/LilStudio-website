/*
 * LilStudio product wheel — the switcher in the bottom-right of every page.
 *
 * Include once per page:  <script src="/studio-wheel.js" defer></script>
 * To add a product: add it to PRODUCTS and give it a slot in LAYOUT
 * (and an icon in /assets/wheel/).
 *
 * - Apple Watch-style honeycomb: round icons packed in two rings around the
 *   corner.
 * - Idle drift: when nobody is pointing at the wheel, the icons float very
 *   slowly anywhere inside it, bumping gently off each other and the edges.
 *   As soon as the pointer comes near (or keyboard focus enters), they glide
 *   back to their honeycomb slots so they're easy to click.
 * - Hover: the icon under the pointer grows and its neighbours ease away.
 * - Open by default. The corner button tucks it away; that choice is kept for
 *   the rest of the visit (sessionStorage).
 * - Styling follows the page's theme variables (--border, --bg-elevated,
 *   --text, --border-width) with fallbacks, so light and dark mode match.
 */
(function () {
    'use strict';

    // Bump when an icon in /assets/wheel/ changes, so browsers don't keep the old one cached.
    const ICON_VERSION = '3';

    const PRODUCTS = [
        { id: 'studio',     name: 'LilStudio',  tag: 'All apps',                       href: '/',            color: '#FFE135', icon: null },
        { id: 'lildisplay', name: 'LilDisplay', tag: 'iPhone & iPad as a Mac display', href: '/lildisplay/', color: '#00FF88', icon: '/assets/wheel/lildisplay.png' },
        { id: 'lildock',    name: 'LilDock',    tag: 'Your Dock, in the menu bar',     href: '/lildock/',    color: '#FF6B5E', icon: '/assets/wheel/lildock.png' },
        { id: 'lilusage',   name: 'LilUsage',   tag: 'Claude usage in the menu bar',   href: '/lilusage/',   color: '#FFB020', icon: '/assets/wheel/lilusage.png' },
        { id: 'lilvibe',    name: 'LilVibe',    tag: 'Living nature wallpaper',        href: '/lilvibe/',    color: '#FF9466', icon: '/assets/wheel/lilvibe.png' },
        { id: 'lilhide',    name: 'LilHide',    tag: 'Hide desktop icons in a click',  href: '/lilhide/',    color: '#6C8CFF', icon: '/assets/wheel/lilhide.png' },
        { id: 'lilmirror',  name: 'LilMirror',  tag: 'A mirror before your call',      href: '/lilmirror/',  color: '#F7DC3C', icon: '/assets/wheel/lilmirror.png' },
        { id: 'lilstats',   name: 'LilStats',   tag: 'CPU, GPU & RAM in the menu bar', href: '/lilstats/',   color: '#7ED48A', icon: '/assets/wheel/lilstats.png' },
        { id: 'lilpad',     name: 'LilPad',     tag: 'Your iPhone as a Mac trackpad',  href: '/lilpad/',     color: '#FF7AC6', icon: '/assets/wheel/lilpad.png' },
        { id: 'lilpass',    name: 'LilPass',    tag: 'Every card, one tap away',       href: '/lilpass/',    color: '#7CC4F0', icon: '/assets/wheel/lilpass.png' },
        { id: 'lilbounce',  name: 'LilBounce',  tag: 'A cartoon ball in your phone',   href: '/lilbounce/',  color: '#FF6B35', icon: '/assets/wheel/lilbounce.png' },
    ];

    // Honeycomb slots around the corner: radius in tile widths, angle in degrees
    // (180° = left of the corner, 270° = straight up). Each ring spreads its
    // icons evenly across the quarter circle.
    const LAYOUT = {
        lildisplay: { r: 2.4,  a: 182 },   // inner ring: four slots, 28.67° apart (chord ≥ 1.19 tiles at r 2.4)
        studio:     { r: 2.4,  a: 210.67 },
        lildock:    { r: 2.4,  a: 239.33 },
        lilpass:    { r: 2.4,  a: 268 },
        lilusage:   { r: 3.85, a: 181 },   // outer ring: six slots, 17.6° apart (chord ≥ 1.17 tiles at r 3.85)
        lilvibe:    { r: 3.85, a: 198.6 },
        lilhide:    { r: 3.85, a: 216.2 },
        lilmirror:  { r: 3.85, a: 233.8 },
        lilstats:   { r: 3.85, a: 251.4 },
        lilpad:     { r: 3.85, a: 269 },
        lilbounce:  { r: 5.3,  a: 225 },   // third ring: starts in the middle; next apps go either side (≥ 12.5° apart at r 5.3)
    };
    const OUTER_R = 5.3;                   // outermost ring (the third), in tile widths
    const DIAL_R = OUTER_R + 1.1;          // dial radius, in tile widths (room for the drift)

    // Hover tuning (in tile widths, so it scales with the phone layout)
    const MAG_MAX = 1.5;      // scale of the icon right under the pointer
    const MAG_RANGE = 1.3;    // distance where magnification fades to 1×
    const SHOVE_MAX = 0.32;   // how far neighbours ease away
    const SHOVE_RANGE = 2.6;  // distance where the shove fades out

    // Idle drift tuning (px and seconds)
    const DRIFT_SPEED = 7;     // top speed while drifting, px/s — very slow
    const DRIFT_PUSH = 5;      // strength of the slow wandering, px/s²
    const DRIFT_START = 1300;  // ms after opening before drifting starts
    const HOME_SPRING = 55;    // pull back to the slot when the pointer is near
    const HOME_DAMP = 13;

    const STORAGE_KEY = 'lsw-collapsed';

    const first = location.pathname.split('/').filter(Boolean)[0] || '';
    const current = PRODUCTS.find(p => p.id === first) ? first : (first === '' || first === 'index.html' ? 'studio' : '');

    const css = `
    .lsw { --lsw-ink: var(--border, #17150F); --lsw-bg: var(--bg-elevated, #F7F1DE); --lsw-text: var(--text, #17150F);
           --lsw-bw: var(--border-width, 3px); --lsw-tile: 44px; --lsw-trigger: 46px;
           position: fixed; right: 20px; bottom: 20px; top: auto; left: auto; z-index: 1000;
           width: var(--lsw-trigger); height: var(--lsw-trigger);
           /* Pages style bare nav/ul/li/a/button — don't inherit any of it. */
           margin: 0; padding: 0; background: none; border: 0; box-shadow: none; transform: none; line-height: 1.2; text-align: left;
           font-family: 'Space Mono', ui-monospace, Menlo, monospace; }
    .lsw *, .lsw *::before, .lsw *::after { box-sizing: border-box; }

    /* Quarter dial that grows out of the corner (decorative; never blocks clicks) */
    .lsw-dial { --d: calc(var(--lsw-tile) * ${DIAL_R * 2}); position: absolute; left: 50%; top: 50%;
                width: var(--d); height: var(--d); margin: calc(var(--d) / -2) 0 0 calc(var(--d) / -2);
                border-radius: 50%; background: var(--lsw-bg); border: var(--lsw-bw) solid var(--lsw-ink);
                box-shadow: -5px -5px 0 var(--lsw-ink); transform: scale(0.15) rotate(-60deg); opacity: 0;
                transition: transform .5s cubic-bezier(.2,.9,.25,1.15), opacity .25s ease; pointer-events: none; }
    .lsw-dial::before { content: ''; position: absolute; inset: 12px; border-radius: 50%;
                        border: 2px dashed var(--lsw-ink); opacity: .28; animation: lsw-spin 28s linear infinite; }
    .lsw.open .lsw-dial { transform: scale(1) rotate(0); opacity: 1; }

    /* Toggle (tuck away / bring back) */
    .lsw-trigger { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; cursor: pointer;
                   background: #FFE135; border: var(--lsw-bw) solid var(--lsw-ink); box-shadow: 4px 4px 0 var(--lsw-ink);
                   padding: 0; margin: 0; color: #17150F; transition: transform .2s cubic-bezier(.2,.9,.25,1.3), box-shadow .15s;
                   animation: lsw-arrive .6s cubic-bezier(.2,.9,.25,1.2) .4s both; }
    .lsw-trigger:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--lsw-ink); }
    .lsw-trigger:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 var(--lsw-ink); }
    .lsw-trigger:focus-visible { outline: 3px solid var(--lsw-ink); outline-offset: 4px; }
    .lsw-icon { position: relative; width: 20px; height: 20px; display: grid; place-items: center;
                transition: transform .45s cubic-bezier(.2,.9,.25,1.3); }
    .lsw.open .lsw-icon { transform: rotate(135deg); }   /* the "+" spins into an ✕ */
    .lsw-glyph { position: absolute; width: 18px; height: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; transition: opacity .2s; }
    .lsw-glyph i { display: block; border: 2.5px solid currentColor; }
    .lsw-glyph i:nth-child(1) { background: currentColor; }
    .lsw-x { position: absolute; width: 20px; height: 20px; opacity: 0; transition: opacity .2s; }
    .lsw-x::before, .lsw-x::after { content: ''; position: absolute; left: 50%; top: 50%; width: 20px; height: 3px;
                                    margin: -1.5px 0 0 -10px; background: currentColor; }
    .lsw-x::after { transform: rotate(90deg); }
    .lsw.open .lsw-glyph { opacity: 0; }
    .lsw.open .lsw-x { opacity: 1; }

    /* Honeycomb. The grid swirls in (list rotates -40° → 0°) while each icon counter-rotates to stay
       upright and travels from the corner to its slot. Once open, the drift loop takes over the
       position (.live) and drives --px / --py every frame. */
    .lsw-list, .lsw-item { list-style: none; margin: 0; padding: 0; background: none; border: 0; }
    .lsw-list { position: absolute; left: 50%; top: 50%; width: 0; height: 0; z-index: 2;
                transform: rotate(-40deg); transition: transform .6s cubic-bezier(.2,.9,.25,1.1); }
    .lsw.open .lsw-list { transform: rotate(0); }
    .lsw-item { --x: calc(var(--ux) * var(--lsw-tile)); --y: calc(var(--uy) * var(--lsw-tile));
                position: absolute; left: 0; top: 0; width: 0; height: 0;
                transform: translate(0, 0) rotate(40deg) scale(.2); opacity: 0; visibility: hidden;
                transition: transform .55s cubic-bezier(.2,.95,.25,1.25), opacity .2s, visibility 0s .55s;
                transition-delay: calc(var(--i) * 20ms); }
    .lsw.open .lsw-item { transform: translate(var(--x), var(--y)) rotate(0) scale(1); opacity: 1; visibility: visible;
                          transition-delay: calc(var(--i) * 45ms + 100ms); }
    .lsw.open.live .lsw-item { transform: translate(var(--px), var(--py)); transition: opacity .2s; }

    .lsw-link { --m: 1; --dx: 0px; --dy: 0px;
                position: absolute; left: calc(var(--lsw-tile) / -2); top: calc(var(--lsw-tile) / -2);
                width: var(--lsw-tile); height: var(--lsw-tile); display: grid; place-items: center; text-decoration: none;
                background: var(--c); border: var(--lsw-bw) solid var(--lsw-ink); box-shadow: 3px 3px 0 var(--lsw-ink);
                border-radius: 50%; color: #17150F; outline: none; padding: 0; margin: 0;
                transform: translate(var(--dx), var(--dy)) scale(var(--m));
                transition: transform .18s cubic-bezier(.2,.9,.25,1.2), box-shadow .15s; will-change: transform; }
    .lsw.magnifying .lsw-link { transition: transform .09s ease-out, box-shadow .15s; }   /* follow the pointer */
    .lsw-link img { width: 100%; height: 100%; border-radius: 50%; display: block; object-fit: cover; pointer-events: none; }
    .lsw-letter { font: 700 19px/1 'Space Grotesk', system-ui, sans-serif; letter-spacing: -.02em; }
    .lsw-mark { width: 17px; height: 17px; background: #FFE135; border: 3px solid #17150F; box-shadow: 2px 2px 0 #17150F; }
    .lsw-link:hover, .lsw-link:focus-visible { box-shadow: 5px 5px 0 var(--lsw-ink); }
    .lsw-link:focus-visible { outline: 3px solid var(--lsw-ink); outline-offset: 3px; }
    .lsw-link[aria-current="page"]::after { content: ''; position: absolute; right: -3px; top: -3px; width: 12px; height: 12px;
                                            border-radius: 50%; background: var(--lsw-bg); border: 2.5px solid var(--lsw-ink); }

    /* Label pill (left of the icon). Counter-scaled so it stays readable when the icon grows. */
    .lsw-label { position: absolute; right: calc(100% + 10px); top: 50%; white-space: nowrap; pointer-events: none;
                 transform-origin: right center; transform: translateY(-50%) scale(calc(1 / var(--m))) translateX(6px);
                 opacity: 0; transition: opacity .15s;
                 background: var(--lsw-bg); color: var(--lsw-text); border: var(--lsw-bw) solid var(--lsw-ink);
                 box-shadow: 3px 3px 0 var(--lsw-ink); padding: 5px 9px 6px; text-align: right; }
    .lsw-label b { display: block; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .lsw-label b::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 6px;
                           background: var(--c); border: 2px solid var(--lsw-ink); }
    .lsw-label small { display: block; font-size: 10.5px; opacity: .75; margin-top: 1px; }
    .lsw-label .here { font-size: 10px; margin-left: 6px; opacity: .7; text-transform: none; letter-spacing: 0; font-weight: 400; }
    .lsw-link:hover .lsw-label, .lsw-link:focus-visible .lsw-label, .lsw-link.lsw-hovered .lsw-label { opacity: 1; transform: translateY(-50%) scale(calc(1 / var(--m))); }

    @keyframes lsw-spin { to { transform: rotate(360deg); } }
    @keyframes lsw-arrive { from { transform: translateY(160%) rotate(-25deg); } to { transform: none; } }

    @media (max-width: 600px) {
        .lsw { --lsw-tile: 36px; --lsw-trigger: 42px; right: 12px; bottom: 12px; }
        .lsw-label small { display: none; }
        .lsw-letter { font-size: 16px; }
    }
    @media (prefers-reduced-motion: reduce) {
        .lsw *, .lsw *::before, .lsw *::after { animation: none !important; transition-duration: .01ms !important; transition-delay: 0s !important; }
    }
    @media print { .lsw { display: none; } }
    `;

    function storageGet() { try { return sessionStorage.getItem(STORAGE_KEY); } catch (e) { return null; } }
    function storageSet(v) { try { sessionStorage.setItem(STORAGE_KEY, v); } catch (e) { /* private mode */ } }

    function build() {
        if (document.querySelector('.lsw')) return;

        const style = document.createElement('style');
        style.id = 'lsw-style';
        style.textContent = css;
        document.head.appendChild(style);

        const root = document.createElement('div');
        root.className = 'lsw';
        root.setAttribute('role', 'navigation');
        root.setAttribute('aria-label', 'LilStudio apps');

        const dial = document.createElement('div');
        dial.className = 'lsw-dial';
        dial.setAttribute('aria-hidden', 'true');

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'lsw-trigger';
        trigger.setAttribute('aria-controls', 'lsw-list');
        trigger.innerHTML = '<span class="lsw-icon" aria-hidden="true"><span class="lsw-glyph"><i></i><i></i><i></i><i></i></span><span class="lsw-x"></span></span>';

        const list = document.createElement('ul');
        list.className = 'lsw-list';
        list.id = 'lsw-list';

        const tiles = [];
        PRODUCTS.forEach((p, i) => {
            const slot = LAYOUT[p.id] || { r: OUTER_R, a: 225 };
            const rad = slot.a * Math.PI / 180;
            const ux = slot.r * Math.cos(rad), uy = slot.r * Math.sin(rad);   // in tile widths

            const li = document.createElement('li');
            li.className = 'lsw-item';
            li.style.setProperty('--ux', ux.toFixed(4));
            li.style.setProperty('--uy', uy.toFixed(4));
            li.style.setProperty('--i', i);

            const a = document.createElement('a');
            a.className = 'lsw-link';
            a.href = p.href;
            a.dataset.id = p.id;
            a.style.setProperty('--c', p.color);
            if (p.id === current) a.setAttribute('aria-current', 'page');

            if (p.id === 'studio') {
                a.insertAdjacentHTML('beforeend', '<span class="lsw-mark" aria-hidden="true"></span>');
            } else if (p.icon) {
                const img = document.createElement('img');
                img.src = p.icon + '?v=' + ICON_VERSION; img.alt = ''; img.decoding = 'async';
                img.onerror = () => { img.replaceWith(letter(p)); };
                a.appendChild(img);
            } else {
                a.appendChild(letter(p));
            }

            const label = document.createElement('span');
            label.className = 'lsw-label';
            label.innerHTML = '<b></b><small></small>';
            label.querySelector('b').textContent = p.name;
            if (p.id === current) label.querySelector('b').insertAdjacentHTML('beforeend', '<span class="here">· you’re here</span>');
            label.querySelector('small').textContent = p.tag;
            a.appendChild(label);
            a.setAttribute('aria-label', p.name + ' — ' + p.tag + (p.id === current ? ' (current page)' : ''));

            li.appendChild(a);
            list.appendChild(li);
            // x/y: live position relative to the corner (px); vx/vy: velocity; seed: wander phase
            tiles.push({ el: a, li, ux, uy, x: 0, y: 0, vx: 0, vy: 0, seed: Math.random() * 1000 });
        });

        root.append(dial, list, trigger);
        document.body.appendChild(root);

        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function tileSize() { return parseFloat(getComputedStyle(root).getPropertyValue('--lsw-tile')) || 44; }
        function corner() { const b = root.getBoundingClientRect(); return { ox: b.left + b.width / 2, oy: b.top + b.height / 2 }; }

        // ---- open / collapse --------------------------------------------------
        let open = false, liveTimer = 0;
        function setOpen(next, remember) {
            open = next;
            root.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', String(open));
            trigger.setAttribute('aria-label', open ? 'Hide LilStudio apps' : 'Show LilStudio apps');
            tiles.forEach(t => { t.el.tabIndex = open ? 0 : -1; });
            clearTimeout(liveTimer);
            stopLive();
            resetMagnify();
            if (open && !reduced) liveTimer = setTimeout(startLive, DRIFT_START);
            if (remember) storageSet(open ? '0' : '1');
        }
        trigger.addEventListener('click', () => setOpen(!open, true));
        root.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && open) { setOpen(false, true); trigger.focus(); return; }
            if (!open) return;
            const all = tiles.map(t => t.el);
            const idx = all.indexOf(document.activeElement);
            if (idx === -1) return;
            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); all[(idx + 1) % all.length].focus(); }
            if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); all[(idx - 1 + all.length) % all.length].focus(); }
        });

        // ---- pointer tracking ----------------------------------------------------
        let px = -1e4, py = -1e4, near = false, focusInside = false, touchHold = 0;
        function pointerNear() {
            if (!open) return false;
            const { ox, oy } = corner();
            return Math.hypot(px - ox, py - oy) < (DIAL_R + 0.6) * tileSize();
        }
        window.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch') return;
            px = e.clientX; py = e.clientY;
            near = pointerNear();
            if (!live) requestMagnify();
        }, { passive: true });
        document.addEventListener('pointerleave', () => { px = py = -1e4; near = false; if (!live) requestMagnify(); });
        // A finger on the wheel: settle for a few seconds so the tap lands.
        root.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') touchHold = performance.now() + 4000; });
        root.addEventListener('focusin', () => { focusInside = true; });
        root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) focusInside = false; });

        // ---- Watch-style hover: grow under the pointer, neighbours make room -----
        let magnifying = false, magRaf = 0;
        const falloff = (d, range) => d >= range ? 0 : (Math.cos(Math.PI * d / range) + 1) / 2;

        function resetMagnify() {
            magnifying = false;
            root.classList.remove('magnifying');
            tiles.forEach(t => {
                t.el.style.setProperty('--m', 1);
                t.el.style.setProperty('--dx', '0px');
                t.el.style.setProperty('--dy', '0px');
                t.li.style.zIndex = '';
            });
        }
        function requestMagnify() { if (!magRaf) magRaf = requestAnimationFrame(() => { magRaf = 0; magnify(); }); }

        // Uses each icon's live position (from the drift state, or its slot), never measured.
        function magnify() {
            if (!open || !canHover || reduced) return;
            const { ox, oy } = corner();
            const size = tileSize();
            let any = false;
            tiles.forEach(t => {
                const cx = ox + (live ? t.x : t.ux * size), cy = oy + (live ? t.y : t.uy * size);
                const vx = cx - px, vy = cy - py;
                const d = Math.hypot(vx, vy);
                const k = falloff(d, MAG_RANGE * size);
                const m = 1 + (MAG_MAX - 1) * k;
                const s = falloff(d, SHOVE_RANGE * size) * Math.min(1, d / (size * 0.6));
                const shove = SHOVE_MAX * size * s;
                const nx = d > 0.5 ? vx / d : 0, ny = d > 0.5 ? vy / d : 0;
                t.el.style.setProperty('--m', m.toFixed(3));
                t.el.style.setProperty('--dx', (nx * shove).toFixed(2) + 'px');
                t.el.style.setProperty('--dy', (ny * shove).toFixed(2) + 'px');
                t.li.style.zIndex = k > 0.05 ? String(10 + Math.round(k * 10)) : '';
                if (k > 0 || s > 0) any = true;
            });
            if (any && !magnifying) { magnifying = true; root.classList.add('magnifying'); }
            if (!any && magnifying) resetMagnify();
        }

        // ---- Idle drift (tiny physics loop) --------------------------------------
        let live = false, raf = 0, last = 0;
        function startLive() {
            if (!open || reduced) return;
            const size = tileSize();
            tiles.forEach(t => {
                t.x = t.ux * size; t.y = t.uy * size;
                const ang = Math.random() * Math.PI * 2;
                t.vx = Math.cos(ang) * DRIFT_SPEED * 0.5; t.vy = Math.sin(ang) * DRIFT_SPEED * 0.5;
                write(t);
            });
            live = true;
            root.classList.add('live');
            last = performance.now();
            raf = requestAnimationFrame(step);
        }
        function stopLive() {
            live = false;
            root.classList.remove('live');
            cancelAnimationFrame(raf); raf = 0;
        }
        function write(t) {
            t.li.style.setProperty('--px', t.x.toFixed(2) + 'px');
            t.li.style.setProperty('--py', t.y.toFixed(2) + 'px');
        }

        function step(now) {
            if (!live) return;
            const dt = Math.min(0.05, (now - last) / 1000); last = now;
            const size = tileSize();
            const settle = near || focusInside || now < touchHold;
            // Allowed area: inside the dial, clear of the corner button, and on the visible
            // (upper-left) side of the corner.
            const rMax = (DIAL_R - 0.6) * size, rMin = 1.27 * size, edge = 0.15 * size;
            const minGap = size * 1.12;

            tiles.forEach((t, i) => {
                let ax, ay;
                if (settle) {
                    // Glide home: damped spring to the honeycomb slot
                    ax = (t.ux * size - t.x) * HOME_SPRING - t.vx * HOME_DAMP;
                    ay = (t.uy * size - t.y) * HOME_SPRING - t.vy * HOME_DAMP;
                } else {
                    // Slow wander: a smoothly turning push, unique per icon
                    const w = t.seed + now * 0.00023 * (0.7 + (i % 3) * 0.2);
                    ax = Math.cos(w) * DRIFT_PUSH + Math.sin(w * 0.61) * DRIFT_PUSH * 0.5;
                    ay = Math.sin(w * 1.13) * DRIFT_PUSH + Math.cos(w * 0.47) * DRIFT_PUSH * 0.5;
                    ax -= t.vx * 0.35; ay -= t.vy * 0.35;
                }
                t.vx += ax * dt; t.vy += ay * dt;
                if (!settle) {
                    const sp = Math.hypot(t.vx, t.vy);
                    if (sp > DRIFT_SPEED) { t.vx *= DRIFT_SPEED / sp; t.vy *= DRIFT_SPEED / sp; }
                }
                t.x += t.vx * dt; t.y += t.vy * dt;
            });

            // Icons bump gently off each other
            for (let i = 0; i < tiles.length; i++) {
                for (let j = i + 1; j < tiles.length; j++) {
                    const a = tiles[i], b = tiles[j];
                    let dx = b.x - a.x, dy = b.y - a.y;
                    const d = Math.hypot(dx, dy) || 0.01;
                    if (d < minGap) {
                        const nx = dx / d, ny = dy / d, push = (minGap - d) / 2;
                        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
                        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                        if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny; }
                    }
                }
            }

            // ...and off the walls
            tiles.forEach(t => {
                const r = Math.hypot(t.x, t.y) || 0.01;
                const nx = t.x / r, ny = t.y / r;
                if (r > rMax || r < rMin) {
                    const target = r > rMax ? rMax : rMin;
                    t.x = nx * target; t.y = ny * target;
                    const radial = t.vx * nx + t.vy * ny;
                    if ((r > rMax && radial > 0) || (r < rMin && radial < 0)) { t.vx -= 2 * radial * nx; t.vy -= 2 * radial * ny; }
                }
                if (t.x > edge) { t.x = edge; t.vx = -Math.abs(t.vx); }
                if (t.y > edge) { t.y = edge; t.vy = -Math.abs(t.vy); }
                write(t);
            });

            if (canHover) magnify();
            raf = requestAnimationFrame(step);
        }

        window.addEventListener('resize', () => { if (live) { stopLive(); startLive(); } }, { passive: true });

        // Open by default (after the page has settled, so the swirl is visible),
        // unless the visitor tucked it away earlier in this visit.
        setOpen(false, false);
        const startOpen = /[?&]wheel=open\b/.test(location.search) || storageGet() !== '1';
        if (startOpen) setTimeout(() => setOpen(true, false), 650);

        // Test hook: ?wheelsim=<frames>[&wheelnear=1] advances the drift on a fake 60 fps clock
        // (headless browsers don't run animation frames), optionally with the pointer near.
        const sim = location.search.match(/[?&]wheelsim=(\d+)/);
        if (sim) setTimeout(() => {
            if (!live) startLive();
            cancelAnimationFrame(raf);
            let t = performance.now();
            for (let f = 0; f < +sim[1]; f++) {
                if (/[?&]wheelnear=1/.test(location.search) && f > +sim[1] / 2) { const { ox, oy } = corner(); px = ox - 60; py = oy - 60; near = true; }
                t += 1000 / 60; step(t); cancelAnimationFrame(raf);
            }
        }, 2500);

        // Test hook for screenshots: ?wheelhover=<product id> simulates the pointer on that icon.
        const hov = location.search.match(/[?&]wheelhover=([a-z]+)/);
        if (hov) setTimeout(() => {
            const t = tiles.find(x => x.el.dataset.id === hov[1]); if (!t) return;
            const { ox, oy } = corner(); const size = tileSize();
            px = ox + t.ux * size; py = oy + t.uy * size; near = true; magnify();
            t.el.classList.add('lsw-hovered');
        }, 1500);
    }

    function letter(p) {
        const s = document.createElement('span');
        s.className = 'lsw-letter';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = p.name.replace(/^Lil/, '').charAt(0);
        return s;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();
})();
