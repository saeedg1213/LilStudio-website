/*
 * LilStudio product wheel — the switcher in the bottom-right of every page.
 *
 * Include once per page:  <script src="/studio-wheel.js" defer></script>
 * To add a product: add it to PRODUCTS (and an icon in /assets/wheel/). Its slot
 * in the honeycomb is worked out automatically.
 *
 * - Apple Watch-style honeycomb: round icons packed tightly on a hexagonal grid
 *   up and to the left of the corner button, LilStudio in the middle.
 * - Hover: the icon under the pointer swells; every other icon keeps its size and
 *   glides out of its way by exactly the room it needs, so the honeycomb stays
 *   packed. Sizes follow the pointer continuously (gliding from one icon to the
 *   next, one eases down as the other swells) and every size and offset chases its
 *   target on a soft spring with a little overshoot, so the whole wheel moves like
 *   one fluid surface. Keyboard focus works the same.
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

    // Honeycomb (in tile widths, from the corner button's centre; screen axes, y down)
    const GAP = 1.08;                         // centre-to-centre: neighbours nearly touch
    const ANCHOR = { x: -2.05, y: -2.05 };    // the middle icon (LilStudio), up and left of the button
    // Hover. An icon swells to MAG while the pointer is within HOLD of its centre, easing back to 1×
    // by REACH (tile widths): resting on an icon, only it is big; between two, both are part-way.
    // 1.4× keeps the 128 px wheel images sharp (a 44 px icon at 1.4× is 123 device px at 2×).
    const MAG = 1.4;
    const HOLD = 0.24, REACH = 0.84;
    // Springs (per second): ~7% overshoot, settles in about 0.4 s (checked at 120, 60 and 30 fps).
    const SPRING_K = 330, SPRING_DAMP = 23;

    /** The first n slots of a hexagonal grid around ANCHOR, ring by ring, kept on screen and clear of the button. */
    function honeycomb(n) {
        const pts = [];
        const rowH = GAP * Math.sqrt(3) / 2;
        for (let j = -6; j <= 6; j++) {
            for (let i = -6; i <= 6; i++) {
                const x = ANCHOR.x + (i + j / 2) * GAP, y = ANCHOR.y + j * rowH;
                if (x > 0.35 || y > 0.35 || Math.hypot(x, y) < 1.3) continue;
                pts.push({ x, y, d: Math.hypot(x - ANCHOR.x, y - ANCHOR.y), out: Math.hypot(x, y) });
            }
        }
        // Inner rings first; within a ring, grow away from the corner.
        pts.sort((p, q) => Math.abs(p.d - q.d) > 1e-6 ? p.d - q.d : q.out - p.out);
        return pts.slice(0, n);
    }
    const SLOTS = honeycomb(PRODUCTS.length);
    // The round face hugs the honeycomb: centred on the middle icon, the corner button on its rim.
    const DIAL_R = Math.max(...SLOTS.map(p => p.d)) + 1.05;     // in tile widths

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

    /* Round face behind the honeycomb, grown out of the corner button (decorative; never blocks clicks) */
    .lsw-dial { --d: calc(var(--lsw-tile) * ${(DIAL_R * 2).toFixed(3)});
                position: absolute; left: calc(50% + var(--lsw-tile) * ${ANCHOR.x}); top: calc(50% + var(--lsw-tile) * ${ANCHOR.y});
                width: var(--d); height: var(--d); margin: calc(var(--d) / -2) 0 0 calc(var(--d) / -2);
                transform-origin: calc(50% - var(--lsw-tile) * ${ANCHOR.x}) calc(50% - var(--lsw-tile) * ${ANCHOR.y});
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
       upright and travels from the corner to its slot. The fisheye moves and scales the links
       (--dx, --dy, --m) on top of their slots. */
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

    .lsw-link { --m: 1; --dx: 0px; --dy: 0px;
                position: absolute; left: calc(var(--lsw-tile) / -2); top: calc(var(--lsw-tile) / -2);
                width: var(--lsw-tile); height: var(--lsw-tile); display: grid; place-items: center; text-decoration: none;
                background: var(--c); border: var(--lsw-bw) solid var(--lsw-ink); box-shadow: 3px 3px 0 var(--lsw-ink);
                border-radius: 50%; color: #17150F; outline: none; padding: 0; margin: 0;
                transform: translate(var(--dx), var(--dy)) scale(var(--m));
                transition: transform .18s cubic-bezier(.2,.9,.25,1.2), box-shadow .15s; will-change: transform; }
    .lsw.magnifying .lsw-link { transition: box-shadow .15s; }   /* springs drive the transform */
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
            const ux = SLOTS[i].x, uy = SLOTS[i].y;   // in tile widths

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
            tiles.push({ el: a, li, ux, uy });
        });

        root.append(dial, list, trigger);
        document.body.appendChild(root);

        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function tileSize() { return parseFloat(getComputedStyle(root).getPropertyValue('--lsw-tile')) || 44; }
        function corner() { const b = root.getBoundingClientRect(); return { ox: b.left + b.width / 2, oy: b.top + b.height / 2 }; }

        // ---- open / collapse --------------------------------------------------
        let open = false;
        function setOpen(next, remember) {
            open = next;
            root.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', String(open));
            trigger.setAttribute('aria-label', open ? 'Hide LilStudio apps' : 'Show LilStudio apps');
            tiles.forEach(t => { t.el.tabIndex = open ? 0 : -1; });
            resetMagnify();
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

        // ---- pointer and keyboard focus ------------------------------------------
        let px = -1e4, py = -1e4;
        window.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch') return;
            px = e.clientX; py = e.clientY;
            kick();
        }, { passive: true });
        document.addEventListener('pointerleave', () => { px = py = -1e4; kick(); });
        // Tabbing through the icons moves the lens with the focus.
        root.addEventListener('focusin', (e) => {
            const t = tiles.find(x => x.el === e.target);
            if (!t || !open) return;
            const { ox, oy } = corner(), size = tileSize();
            px = ox + t.ux * size; py = oy + t.uy * size;
            forced = true;
            kick();
        });
        root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) { px = py = -1e4; forced = false; kick(); } });

        // ---- Watch-style hover: one icon swells, the rest glide out of its way --------------
        // Targets follow the pointer continuously; each icon's size and offset chase their target on a
        // spring, every frame, until everything has settled (then the loop stops).
        let magnifying = false, raf = 0, last = 0, forced = false;
        const n = tiles.length;
        const cur = tiles.map(() => ({ m: 1, vm: 0, x: 0, vx: 0, y: 0, vy: 0 }));
        const goal = tiles.map(() => ({ m: 1, x: 0, y: 0 }));

        function weight(d) {
            if (d <= HOLD) return 1;
            if (d >= REACH) return 0;
            const t = (d - HOLD) / (REACH - HOLD);
            return 1 - t * t * t * (t * (t * 6 - 15) + 10);   // smootherstep down
        }

        function setGoals() {
            const size = tileSize();
            const { ox, oy } = corner();
            const fx = (px - ox) / size, fy = (py - oy) / size;   // pointer in tile widths
            const engaged = open && !reduced && (canHover || forced);
            for (let i = 0; i < n; i++) {
                goal[i].m = engaged ? 1 + (MAG - 1) * weight(Math.hypot(tiles[i].ux - fx, tiles[i].uy - fy)) : 1;
            }
            // Each icon moves straight away from every swollen one by the radius that one gained.
            for (let i = 0; i < n; i++) {
                let dx = 0, dy = 0;
                for (let j = 0; j < n; j++) {
                    const gain = (goal[j].m - 1) / 2;
                    if (j === i || gain <= 0) continue;
                    const vx = tiles[i].ux - tiles[j].ux, vy = tiles[i].uy - tiles[j].uy, d = Math.hypot(vx, vy) || 1;
                    dx += vx / d * gain; dy += vy / d * gain;
                }
                // Keep clear of the screen edges (the corner button sits ~1 tile in from both).
                const limit = 0.95 - goal[i].m / 2;
                goal[i].x = Math.min(dx, limit - tiles[i].ux) * size;
                goal[i].y = Math.min(dy, limit - tiles[i].uy) * size;
            }
        }

        function kick() {
            setGoals();
            if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
        }

        function frame(now) {
            raf = 0;
            const dt = Math.min(0.034, Math.max(0.001, (now - last) / 1000));
            last = now;
            setGoals();
            let moving = false, resting = true;
            for (let i = 0; i < n; i++) {
                const c = cur[i], g = goal[i];
                c.vm += (SPRING_K * (g.m - c.m) - SPRING_DAMP * c.vm) * dt; c.m += c.vm * dt;
                c.vx += (SPRING_K * (g.x - c.x) - SPRING_DAMP * c.vx) * dt; c.x += c.vx * dt;
                c.vy += (SPRING_K * (g.y - c.y) - SPRING_DAMP * c.vy) * dt; c.y += c.vy * dt;
                if (Math.abs(g.m - c.m) > 5e-4 || Math.abs(c.vm) > 5e-3 || Math.abs(g.x - c.x) > 0.05 || Math.abs(g.y - c.y) > 0.05
                    || Math.abs(c.vx) > 0.5 || Math.abs(c.vy) > 0.5) moving = true;
                if (g.m !== 1 || g.x !== 0 || g.y !== 0) resting = false;
            }
            if (!moving) {
                // Snap the last fraction so the CSS values end exact.
                for (let i = 0; i < n; i++) { const c = cur[i], g = goal[i]; c.m = g.m; c.x = g.x; c.y = g.y; c.vm = c.vx = c.vy = 0; }
            }
            if (!magnifying) { magnifying = true; root.classList.add('magnifying'); }
            for (let i = 0; i < n; i++) {
                const c = cur[i], el = tiles[i].el;
                el.style.setProperty('--m', c.m.toFixed(4));
                el.style.setProperty('--dx', c.x.toFixed(2) + 'px');
                el.style.setProperty('--dy', c.y.toFixed(2) + 'px');
                tiles[i].li.style.zIndex = c.m > 1.01 ? String(10 + Math.round((c.m - 1) * 100)) : '';
            }
            if (moving) raf = requestAnimationFrame(frame);
            else if (resting) { magnifying = false; root.classList.remove('magnifying'); }
        }

        // Instant reset (closing the wheel): no spring.
        function resetMagnify() {
            cancelAnimationFrame(raf); raf = 0;
            magnifying = false; forced = false;
            root.classList.remove('magnifying');
            tiles.forEach((t, i) => {
                Object.assign(cur[i], { m: 1, vm: 0, x: 0, vx: 0, y: 0, vy: 0 });
                t.el.style.setProperty('--m', 1);
                t.el.style.setProperty('--dx', '0px');
                t.el.style.setProperty('--dy', '0px');
                t.li.style.zIndex = '';
            });
        }

        // Open by default (after the page has settled, so the swirl is visible),
        // unless the visitor tucked it away earlier in this visit.
        setOpen(false, false);
        const startOpen = /[?&]wheel=open\b/.test(location.search) || storageGet() !== '1';
        if (startOpen) setTimeout(() => setOpen(true, false), 650);

        // Test hook for screenshots: ?wheelhover=<product id> simulates the pointer on that icon.
        const hov = location.search.match(/[?&]wheelhover=([a-z]+)/);
        if (hov) setTimeout(() => {
            const t = tiles.find(x => x.el.dataset.id === hov[1]); if (!t) return;
            const { ox, oy } = corner(); const size = tileSize();
            px = ox + t.ux * size; py = oy + t.uy * size; forced = true; kick();
            t.el.classList.add('lsw-hovered');
        }, 1500);

        // Test hook: ?wheelsweep=<a>,<b> glides a virtual pointer from icon a to icon b and back (4 s
        // loop), to watch the hand-over between icons where real hover isn't available.
        const sweep = location.search.match(/[?&]wheelsweep=([a-z]+),([a-z]+)/);
        if (sweep) setTimeout(() => {
            const a = tiles.find(x => x.el.dataset.id === sweep[1]), b = tiles.find(x => x.el.dataset.id === sweep[2]);
            if (!a || !b) return;
            forced = true;
            const t0 = performance.now();
            (function glide(now) {
                const { ox, oy } = corner(), size = tileSize();
                const u = (1 - Math.cos(((now - t0) / 4000) * 2 * Math.PI)) / 2;
                px = ox + (a.ux + (b.ux - a.ux) * u) * size; py = oy + (a.uy + (b.uy - a.uy) * u) * size;
                kick();
                requestAnimationFrame(glide);
            })(t0);
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
