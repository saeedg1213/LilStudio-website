/*
 * LilStudio product wheel — the switcher in the bottom-right of every page.
 *
 * Include once per page:  <script src="/studio-wheel.js" defer></script>
 * To add a product: add it to PRODUCTS (and an icon in /assets/wheel/).
 * Styling follows the page's theme variables (--border, --bg-elevated, --text,
 * --border-width) with fallbacks, so it matches light and dark mode.
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

    // Which product page are we on? (/lildisplay/privacy.html → lildisplay)
    const first = location.pathname.split('/').filter(Boolean)[0] || '';
    const current = PRODUCTS.find(p => p.id === first) ? first : (first === '' || first === 'index.html' ? 'studio' : '');

    const css = `
    .lsw { --lsw-ink: var(--border, #17150F); --lsw-bg: var(--bg-elevated, #F7F1DE); --lsw-text: var(--text, #17150F);
           --lsw-bw: var(--border-width, 3px); --lsw-r: 228px; --lsw-tile: 46px; --lsw-trigger: 58px;
           position: fixed; right: 22px; bottom: 22px; top: auto; left: auto; z-index: 1000;
           width: var(--lsw-trigger); height: var(--lsw-trigger);
           /* Pages style bare nav/ul/li/a/button — don't inherit any of it. */
           margin: 0; padding: 0; background: none; border: 0; box-shadow: none; transform: none; line-height: 1.2; text-align: left;
           font-family: 'Space Mono', ui-monospace, Menlo, monospace; }
    .lsw *, .lsw *::before, .lsw *::after { box-sizing: border-box; }

    /* Quarter dial that grows out of the corner */
    .lsw-dial { position: absolute; left: 50%; top: 50%; width: calc(var(--lsw-r) * 2 + 92px); height: calc(var(--lsw-r) * 2 + 92px);
                margin: calc((var(--lsw-r) * 2 + 92px) / -2) 0 0 calc((var(--lsw-r) * 2 + 92px) / -2);
                border-radius: 50%; background: var(--lsw-bg); border: var(--lsw-bw) solid var(--lsw-ink);
                box-shadow: -7px -7px 0 var(--lsw-ink); transform: scale(0.15) rotate(-60deg); opacity: 0;
                transition: transform .45s cubic-bezier(.2,.9,.25,1.15), opacity .25s ease; pointer-events: none; }
    .lsw-dial::before { content: ''; position: absolute; inset: 22px; border-radius: 50%;
                        border: 2px dashed var(--lsw-ink); opacity: .35; animation: lsw-spin 28s linear infinite; }
    .lsw-dial::after { content: ''; position: absolute; inset: calc(50% - var(--lsw-r) + 28px); border-radius: 50%;
                       border: 2px solid var(--lsw-ink); opacity: .12; }
    .lsw.open .lsw-dial { transform: scale(1) rotate(0); opacity: 1; pointer-events: auto; }

    /* Trigger */
    .lsw-trigger { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; cursor: pointer;
                   background: #FFE135; border: var(--lsw-bw) solid var(--lsw-ink); box-shadow: 5px 5px 0 var(--lsw-ink);
                   padding: 0; color: #17150F; transition: transform .35s cubic-bezier(.2,.9,.25,1.3), box-shadow .15s;
                   animation: lsw-arrive .6s cubic-bezier(.2,.9,.25,1.2) .9s both, lsw-bob 3.2s ease-in-out 2.2s 2; }
    .lsw-trigger:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 var(--lsw-ink); }
    .lsw-trigger:active { transform: translate(3px, 3px); box-shadow: 2px 2px 0 var(--lsw-ink); }
    .lsw-trigger:focus-visible { outline: 3px solid var(--lsw-ink); outline-offset: 4px; }
    .lsw.open .lsw-trigger { animation: none; }
    /* Only the icon spins (the button keeps its hard shadow bottom-right). The ✕ is drawn as a "+"
       and the 135° spin turns it into an ✕. */
    .lsw-icon { position: relative; width: 24px; height: 24px; display: grid; place-items: center;
                transition: transform .45s cubic-bezier(.2,.9,.25,1.3); }
    .lsw.open .lsw-icon { transform: rotate(135deg); }
    .lsw-glyph { position: absolute; width: 22px; height: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; transition: opacity .2s; }
    .lsw-glyph i { display: block; border: 2.5px solid currentColor; background: transparent; }
    .lsw-glyph i:nth-child(1) { background: currentColor; }
    .lsw-x { position: absolute; width: 24px; height: 24px; opacity: 0; transition: opacity .2s; }
    .lsw-x::before, .lsw-x::after { content: ''; position: absolute; left: 50%; top: 50%; width: 26px; height: 3.5px;
                                    margin: -1.75px 0 0 -13px; background: currentColor; }
    .lsw-x::after { transform: rotate(90deg); }
    .lsw.open .lsw-glyph { opacity: 0; }
    .lsw.open .lsw-x { opacity: 1; }

    /* Items on the arc. Each wraps: rotate(angle) → translate(radius) → rotate(-angle), so the
       transition swings them round the corner like a wheel and keeps the icons upright. */
    .lsw-list, .lsw-item { list-style: none; margin: 0; padding: 0; background: none; border: 0; }
    .lsw-list { position: absolute; left: 50%; top: 50%; width: 0; height: 0; z-index: 2; }
    .lsw-item { position: absolute; left: 0; top: 0; width: 0; height: 0;
                transform: rotate(180deg) translateX(0) rotate(-180deg) scale(.2); opacity: 0;
                transition: transform .55s cubic-bezier(.2,.95,.25,1.25), opacity .2s; transition-delay: calc(var(--i) * 28ms); }
    .lsw.open .lsw-item { transform: rotate(var(--a)) translateX(var(--lsw-r)) rotate(calc(-1 * var(--a))) scale(1); opacity: 1;
                          transition-delay: calc(var(--i) * 45ms + 60ms); }
    .lsw-link { position: absolute; left: calc(var(--lsw-tile) / -2); top: calc(var(--lsw-tile) / -2);
                width: var(--lsw-tile); height: var(--lsw-tile); display: grid; place-items: center; text-decoration: none;
                background: var(--c); border: var(--lsw-bw) solid var(--lsw-ink); box-shadow: 4px 4px 0 var(--lsw-ink);
                border-radius: 12px; overflow: visible; color: #17150F; outline: none;
                transition: transform .18s cubic-bezier(.2,.9,.25,1.4), box-shadow .18s; }
    .lsw-link img { width: 100%; height: 100%; border-radius: 9px; display: block; object-fit: cover; pointer-events: none; }
    .lsw-letter { font: 700 19px/1 'Space Grotesk', system-ui, sans-serif; letter-spacing: -.02em; }
    .lsw-mark { width: 18px; height: 18px; background: #FFE135; border: 3px solid #17150F; box-shadow: 3px 3px 0 #17150F; }
    .lsw-link[data-id="studio"] { border-radius: 4px; }
    .lsw-link:hover, .lsw-link:focus-visible { transform: translate(-4px, -4px); box-shadow: 8px 8px 0 var(--lsw-ink); z-index: 5; }
    .lsw-link img, .lsw-link .lsw-letter, .lsw-link .lsw-mark { transition: transform .25s cubic-bezier(.2,.9,.25,1.5); }
    .lsw-link:hover img, .lsw-link:focus-visible img,
    .lsw-link:hover .lsw-letter, .lsw-link:focus-visible .lsw-letter,
    .lsw-link:hover .lsw-mark, .lsw-link:focus-visible .lsw-mark { transform: rotate(-8deg) scale(1.08); }
    .lsw-link:focus-visible { outline: 3px solid var(--lsw-ink); outline-offset: 3px; }
    .lsw-link[aria-current="page"]::after { content: ''; position: absolute; right: -7px; top: -7px; width: 12px; height: 12px;
                                            border-radius: 50%; background: var(--lsw-bg); border: 3px solid var(--lsw-ink); }

    /* Label pill (left of the tile) */
    .lsw-label { position: absolute; right: calc(100% + 14px); top: 50%; transform: translate(8px, -50%); white-space: nowrap;
                 pointer-events: none; opacity: 0; transition: opacity .15s, transform .2s cubic-bezier(.2,.9,.25,1.3);
                 background: var(--lsw-bg); color: var(--lsw-text); border: var(--lsw-bw) solid var(--lsw-ink);
                 box-shadow: 4px 4px 0 var(--lsw-ink); padding: 6px 10px 7px; text-align: right; }
    .lsw-label b { display: block; font-size: 12.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .lsw-label b::before { content: ''; display: inline-block; width: 9px; height: 9px; margin-right: 7px; vertical-align: 0;
                           background: var(--c); border: 2px solid var(--lsw-ink); }
    .lsw-label small { display: block; font-size: 11px; opacity: .75; margin-top: 1px; }
    .lsw-label .here { font-size: 10px; margin-left: 6px; opacity: .7; text-transform: none; letter-spacing: 0; font-weight: 400; }
    .lsw-link:hover .lsw-label, .lsw-link:focus-visible .lsw-label { opacity: 1; transform: translate(0, -50%); }

    /* Hint label above the dial */
    .lsw-title { position: absolute; right: 0; bottom: calc(var(--lsw-trigger) + var(--lsw-r) + 34px); white-space: nowrap;
                 font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--lsw-text);
                 opacity: 0; transform: translateY(8px); transition: opacity .25s .25s, transform .35s .25s; pointer-events: none; }
    .lsw.open .lsw-title { opacity: .7; transform: none; }

    @keyframes lsw-spin { to { transform: rotate(360deg); } }
    @keyframes lsw-arrive { from { transform: translateY(140%) rotate(-25deg); } to { transform: none; } }
    @keyframes lsw-bob { 0%, 100% { transform: none; } 20% { transform: rotate(-9deg); } 40% { transform: rotate(7deg); } 60% { transform: rotate(-3deg); } }

    @media (max-width: 600px) {
        .lsw { --lsw-r: 188px; --lsw-tile: 40px; --lsw-trigger: 52px; right: 14px; bottom: 14px; }
        .lsw-label small { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
        .lsw *, .lsw *::before, .lsw *::after { animation: none !important; transition-duration: .01ms !important; transition-delay: 0s !important; }
    }
    @media print { .lsw { display: none; } }
    `;

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

        const title = document.createElement('div');
        title.className = 'lsw-title';
        title.setAttribute('aria-hidden', 'true');
        title.textContent = 'LilStudio apps';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'lsw-trigger';
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', 'lsw-list');
        trigger.setAttribute('aria-label', 'Switch LilStudio app');
        trigger.innerHTML = '<span class="lsw-icon" aria-hidden="true"><span class="lsw-glyph"><i></i><i></i><i></i><i></i></span><span class="lsw-x"></span></span>';

        const list = document.createElement('ul');
        list.className = 'lsw-list';
        list.id = 'lsw-list';

        // Spread the products over the quarter from "left" (180°) to "up" (270°).
        const n = PRODUCTS.length;
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
            a.tabIndex = -1;
            if (p.id === current) a.setAttribute('aria-current', 'page');

            if (p.id === 'studio') {
                a.insertAdjacentHTML('beforeend', '<span class="lsw-mark" aria-hidden="true"></span>');
            } else if (p.icon) {
                const img = document.createElement('img');
                img.src = p.icon; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
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
        });

        root.append(dial, title, list, trigger);
        document.body.appendChild(root);

        const links = () => Array.from(list.querySelectorAll('.lsw-link'));
        let open = false;

        function setOpen(next, focusFirst) {
            open = next;
            root.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', String(open));
            links().forEach(l => { l.tabIndex = open ? 0 : -1; });
            if (open && focusFirst) {
                const target = links().find(l => l.getAttribute('aria-current') !== 'page') || links()[0];
                setTimeout(() => target && target.focus(), 120);
            }
        }

        trigger.addEventListener('click', (e) => {
            setOpen(!open, e.detail === 0); // keyboard activation → move focus into the wheel
        });

        // Close on outside click / Esc; arrows walk around the wheel.
        document.addEventListener('pointerdown', (e) => { if (open && !root.contains(e.target)) setOpen(false); });
        root.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && open) { setOpen(false); trigger.focus(); return; }
            if (!open) return;
            const all = links();
            const idx = all.indexOf(document.activeElement);
            if (idx === -1) return;
            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); all[(idx + 1) % all.length].focus(); }
            if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); all[(idx - 1 + all.length) % all.length].focus(); }
        });
        root.addEventListener('focusout', (e) => {
            if (open && e.relatedTarget && !root.contains(e.relatedTarget)) setOpen(false);
        });

        // Open via URL for previews/screenshots: ?wheel=open
        if (/[?&]wheel=open\b/.test(location.search)) setOpen(true);
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
