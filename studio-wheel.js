/*
 * LilStudio product wheel — the switcher in the bottom-right of every page.
 *
 * Include once per page:  <script src="/studio-wheel.js" defer></script>
 * To add a product: add it to PRODUCTS (and an icon in /assets/wheel/).
 *
 * - Open by default. The corner button tucks it away; that choice is kept
 *   for the rest of the visit (sessionStorage), so it doesn't pop back open
 *   on every page.
 * - Dock-style magnification: tiles grow as the pointer gets close and are
 *   nudged outward along the arc so neighbours don't collide.
 * - Styling follows the page's theme variables (--border, --bg-elevated,
 *   --text, --border-width) with fallbacks, so light and dark mode match.
 */
(function () {
    'use strict';

    const PRODUCTS = [
        { id: 'studio',     name: 'LilStudio',  tag: 'All apps',                       href: '/',            color: '#FFE135', icon: null },
        { id: 'lildisplay', name: 'LilDisplay', tag: 'iPhone & iPad as a Mac display', href: '/lildisplay/', color: '#00FF88', icon: '/assets/wheel/lildisplay.png' },
        { id: 'lildock',    name: 'LilDock',    tag: 'Your Dock, in the menu bar',     href: '/lildock/',    color: '#FF6B5E', icon: '/assets/wheel/lildock.png' },
        { id: 'lilusage',   name: 'LilUsage',   tag: 'Claude usage in the menu bar',   href: '/lilusage/',   color: '#FFB020', icon: '/assets/wheel/lilusage.png' },
        { id: 'lilvibe',    name: 'LilVibe',    tag: 'Living nature wallpaper',        href: '/lilvibe/',    color: '#FF9466', icon: '/assets/wheel/lilvibe.png' },
        { id: 'lilhide',    name: 'LilHide',    tag: 'Hide desktop icons in a click',  href: '/lilhide/',    color: '#6C8CFF', icon: '/assets/wheel/lilhide.png' },
        { id: 'lilmirror',  name: 'LilMirror',  tag: 'A mirror before your call',      href: '/lilmirror/',  color: '#F7DC3C', icon: null },
    ];

    // Magnification tuning (Dock-like)
    const MAG_MAX = 1.8;     // scale of the tile right under the pointer
    const MAG_RANGE = 78;    // px from a tile's centre where magnification fades to 1×
    const MAG_PUSH = 0.55;   // how far a magnified tile moves outward (× its extra size)

    const STORAGE_KEY = 'lsw-collapsed';

    const first = location.pathname.split('/').filter(Boolean)[0] || '';
    const current = PRODUCTS.find(p => p.id === first) ? first : (first === '' || first === 'index.html' ? 'studio' : '');

    const css = `
    .lsw { --lsw-ink: var(--border, #17150F); --lsw-bg: var(--bg-elevated, #F7F1DE); --lsw-text: var(--text, #17150F);
           --lsw-bw: var(--border-width, 3px); --lsw-r: 150px; --lsw-tile: 32px; --lsw-trigger: 48px;
           position: fixed; right: 20px; bottom: 20px; top: auto; left: auto; z-index: 1000;
           width: var(--lsw-trigger); height: var(--lsw-trigger);
           /* Pages style bare nav/ul/li/a/button — don't inherit any of it. */
           margin: 0; padding: 0; background: none; border: 0; box-shadow: none; transform: none; line-height: 1.2; text-align: left;
           font-family: 'Space Mono', ui-monospace, Menlo, monospace; }
    .lsw *, .lsw *::before, .lsw *::after { box-sizing: border-box; }

    /* Quarter dial that grows out of the corner (decorative; never blocks clicks) */
    .lsw-dial { --d: calc(var(--lsw-r) * 2 + 64px); position: absolute; left: 50%; top: 50%;
                width: var(--d); height: var(--d); margin: calc(var(--d) / -2) 0 0 calc(var(--d) / -2);
                border-radius: 50%; background: var(--lsw-bg); border: var(--lsw-bw) solid var(--lsw-ink);
                box-shadow: -5px -5px 0 var(--lsw-ink); transform: scale(0.15) rotate(-60deg); opacity: 0;
                transition: transform .5s cubic-bezier(.2,.9,.25,1.15), opacity .25s ease; pointer-events: none; }
    .lsw-dial::before { content: ''; position: absolute; inset: 14px; border-radius: 50%;
                        border: 2px dashed var(--lsw-ink); opacity: .3; animation: lsw-spin 28s linear infinite; }
    .lsw.open .lsw-dial { transform: scale(1) rotate(0); opacity: 1; }

    /* Toggle (tuck away / bring back) */
    .lsw-trigger { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; cursor: pointer;
                   background: #FFE135; border: var(--lsw-bw) solid var(--lsw-ink); box-shadow: 4px 4px 0 var(--lsw-ink);
                   padding: 0; margin: 0; color: #17150F; transition: transform .2s cubic-bezier(.2,.9,.25,1.3), box-shadow .15s;
                   animation: lsw-arrive .6s cubic-bezier(.2,.9,.25,1.2) .5s both; }
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

    /* Items on the arc: rotate(angle) → translate(radius) → rotate(-angle) swings them round the
       corner like a wheel and keeps the icons upright. */
    .lsw-list, .lsw-item { list-style: none; margin: 0; padding: 0; background: none; border: 0; }
    .lsw-list { position: absolute; left: 50%; top: 50%; width: 0; height: 0; z-index: 2; }
    .lsw-item { position: absolute; left: 0; top: 0; width: 0; height: 0;
                transform: rotate(180deg) translateX(0) rotate(-180deg) scale(.2); opacity: 0; visibility: hidden;
                transition: transform .5s cubic-bezier(.2,.95,.25,1.25), opacity .2s, visibility 0s .5s;
                transition-delay: calc(var(--i) * 25ms); }
    .lsw.open .lsw-item { transform: rotate(var(--a)) translateX(var(--lsw-r)) rotate(calc(-1 * var(--a))) scale(1);
                          opacity: 1; visibility: visible; transition-delay: calc(var(--i) * 45ms + 120ms); }

    .lsw-link { --m: 1; --dx: 0px; --dy: 0px;
                position: absolute; left: calc(var(--lsw-tile) / -2); top: calc(var(--lsw-tile) / -2);
                width: var(--lsw-tile); height: var(--lsw-tile); display: grid; place-items: center; text-decoration: none;
                background: var(--c); border: var(--lsw-bw) solid var(--lsw-ink); box-shadow: 3px 3px 0 var(--lsw-ink);
                border-radius: 10px; color: #17150F; outline: none; padding: 0; margin: 0;
                transform: translate(var(--dx), var(--dy)) scale(var(--m));
                transition: transform .12s ease-out, box-shadow .15s; will-change: transform; }
    .lsw.magnifying .lsw-link { transition: transform .06s linear, box-shadow .15s; }   /* follow the pointer tightly */
    .lsw-link img { width: 100%; height: 100%; border-radius: 7px; display: block; object-fit: cover; pointer-events: none; }
    .lsw-letter { font: 700 15px/1 'Space Grotesk', system-ui, sans-serif; letter-spacing: -.02em; }
    .lsw-mark { width: 14px; height: 14px; background: #FFE135; border: 2.5px solid #17150F; box-shadow: 2px 2px 0 #17150F; }
    .lsw-link[data-id="studio"] { border-radius: 3px; }
    .lsw-link:hover, .lsw-link:focus-visible { box-shadow: 5px 5px 0 var(--lsw-ink); z-index: 5; }
    .lsw-link:focus-visible { outline: 3px solid var(--lsw-ink); outline-offset: 3px; }
    .lsw-link[aria-current="page"]::after { content: ''; position: absolute; right: -6px; top: -6px; width: 10px; height: 10px;
                                            border-radius: 50%; background: var(--lsw-bg); border: 2.5px solid var(--lsw-ink); }

    /* Label pill (left of the tile). Counter-scaled so it stays readable when the tile is magnified. */
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
    .lsw-link:hover .lsw-label, .lsw-link:focus-visible .lsw-label { opacity: 1; transform: translateY(-50%) scale(calc(1 / var(--m))); }

    @keyframes lsw-spin { to { transform: rotate(360deg); } }
    @keyframes lsw-arrive { from { transform: translateY(160%) rotate(-25deg); } to { transform: none; } }

    @media (max-width: 600px) {
        .lsw { --lsw-r: 124px; --lsw-tile: 28px; --lsw-trigger: 44px; right: 12px; bottom: 12px; }
        .lsw-label small { display: none; }
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

        // Spread the products over the quarter from "left" (180°) to "up" (270°).
        const n = PRODUCTS.length;
        const tiles = [];
        PRODUCTS.forEach((p, i) => {
            const angle = 180 + (n === 1 ? 45 : (90 * i) / (n - 1));
            const li = document.createElement('li');
            li.className = 'lsw-item';
            li.style.setProperty('--a', angle + 'deg');
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
                img.src = p.icon; img.alt = ''; img.decoding = 'async';
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
            tiles.push({ el: a, rad: angle * Math.PI / 180 });
        });

        root.append(dial, list, trigger);
        document.body.appendChild(root);

        // ---- open / collapse --------------------------------------------------
        let open = false;
        function setOpen(next, remember) {
            open = next;
            root.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', String(open));
            trigger.setAttribute('aria-label', open ? 'Hide LilStudio apps' : 'Show LilStudio apps');
            tiles.forEach(t => { t.el.tabIndex = open ? 0 : -1; });
            if (!open) resetMagnify();
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

        // ---- Dock-style magnification -----------------------------------------
        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0, px = 0, py = 0, active = false;

        function resetMagnify() {
            active = false;
            root.classList.remove('magnifying');
            tiles.forEach(t => {
                t.el.style.setProperty('--m', 1);
                t.el.style.setProperty('--dx', '0px');
                t.el.style.setProperty('--dy', '0px');
                t.el.style.zIndex = '';
            });
        }

        // Resting tile centres, computed from the arc (not measured), so they're right even
        // while the wheel is still sweeping open. Recomputed on resize.
        let centres = [], tileSize = 32;
        function measure() {
            const b = root.getBoundingClientRect();
            const ox = b.left + b.width / 2, oy = b.top + b.height / 2;
            const cs = getComputedStyle(root);
            const R = parseFloat(cs.getPropertyValue('--lsw-r')) || 150;
            tileSize = parseFloat(cs.getPropertyValue('--lsw-tile')) || 32;
            centres = tiles.map(t => ({ x: ox + R * Math.cos(t.rad), y: oy + R * Math.sin(t.rad) }));
            return { ox, oy, R };
        }
        window.addEventListener('resize', () => { centres = []; }, { passive: true });

        function magnify() {
            raf = 0;
            if (!open) return;
            if (!centres.length) measure();
            const size = tileSize;
            let any = false;
            tiles.forEach((t, i) => {
                const d = Math.hypot(px - centres[i].x, py - centres[i].y);
                // Smooth cosine falloff, like the Dock
                const k = d >= MAG_RANGE ? 0 : (Math.cos(Math.PI * d / MAG_RANGE) + 1) / 2;
                const m = 1 + (MAG_MAX - 1) * k;
                const push = (m - 1) * size * MAG_PUSH;
                t.el.style.setProperty('--m', m.toFixed(3));
                t.el.style.setProperty('--dx', (Math.cos(t.rad) * push).toFixed(2) + 'px');
                t.el.style.setProperty('--dy', (Math.sin(t.rad) * push).toFixed(2) + 'px');
                t.el.style.zIndex = k > 0.05 ? String(10 + Math.round(k * 10)) : '';
                if (k > 0) any = true;
            });
            if (any && !active) { active = true; root.classList.add('magnifying'); }
            if (!any && active) resetMagnify();
        }

        if (canHover && !reduced) {
            window.addEventListener('pointermove', (e) => {
                if (!open || e.pointerType === 'touch') return;
                px = e.clientX; py = e.clientY;
                // Only bother when the pointer is near the wheel's corner
                const g = measure();
                if (Math.hypot(px - g.ox, py - g.oy) > g.R + MAG_RANGE + 20) { if (active) resetMagnify(); return; }
                if (!raf) raf = requestAnimationFrame(magnify);
            }, { passive: true });
            document.addEventListener('pointerleave', () => { if (active) resetMagnify(); });
        }

        // Open by default (after the page has settled, so the sweep is visible),
        // unless the visitor tucked it away earlier in this visit.
        setOpen(false, false);
        const startOpen = /[?&]wheel=open\b/.test(location.search) || storageGet() !== '1';
        if (startOpen) setTimeout(() => setOpen(true, false), 700);

        // Test hook for screenshots: ?wheelmag=<x>,<y> simulates the pointer.
        const mag = location.search.match(/[?&]wheelmag=(\d+),(\d+)/);
        if (mag) setTimeout(() => { px = +mag[1]; py = +mag[2]; magnify(); }, 2000);
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
