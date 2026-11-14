#!/usr/bin/env python3
"""Turn an app page's hero into the "big Mac" layout (2026-11-14):
a compact header row, a MacBook that fills the rest of the first screen, a guide bar
under it that walks through the page's quests, and a glow on the thing to use next.

Usage: docs/tools/bigmac/bigmac.py <appid> [...]     (re-running replaces a previous conversion)
The per-page glow targets are in TARGETS below. Everything else is shared.
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
MARK = '/* ===== Big Mac hero'

# For each quest id: (label, [candidate targets]). A candidate is a CSS selector, or
# [selector, text] = the first match whose text contains `text`. The first visible one glows.
TARGETS = {
    'lilstats': {
        'open': ('Click here', ['#lsItem']),
        'build': ('Click Run', ['#tRun']),
        'gpu': ('Click Export', ['#expBtn']),
        'ram': ('Click + a few times', ['#newTab']),
        'style': ('Click here', ['#setRows .ls-lt[data-l="perCore"]', '#setRows [data-kind="cpu"] [data-act="expand"]', '#pSettings', '#lsItem']),
        'color': ('Click here', ['#setLook [data-v="colored"]', '#pSettings', '#lsItem']),
        'arrange': ('Click ▲ or a checkbox', ['#setRows [data-kind="ram"] [data-act="up"]', '#pSettings', '#lsItem']),
        'calm': ('Click 5 s', ['#setRate [data-v="5"]', '#pSettings', '#lsItem']),
    },
    'lildock': {
        'magnify': ('Glide over these', ['#strip']),
        'open': ('Click an app', ['#strip .ld-t[data-app]:not(.run):not([data-app="downloads"])', '#strip .ld-t']),
        'downloads': ('Click Downloads', ['#strip .ld-t[data-app="downloads"]', '[data-do="settings"]']),
        'add': ('Click + Add', ['#ldSet [data-act="add"]', '[data-do="settings"]']),
        'arrange': ('Drag a row', ['#ldApps .ld-app', '[data-do="settings"]']),
        'hide': ('Click here', ['#ldAct [data-k]', '#ldDockBox [data-act="hide"]', '[data-do="hide"]']),
        'full': ('Click the green button', ['[data-win="safari"]:not([hidden]) .mk-bar i[data-a="zoom"]', '.mk-win.focus .mk-bar i[data-a="zoom"]']),
    },
    'lilhide': {
        'hide': ('Click here', ['#lhItem']),
        'shortcut': ('Press ⌃⌥⌘H or click', ['[data-do="key"]']),
        'menu': ('Right-click here', ['#lhItem']),
        'bg': ('Pick one', ['.lh-bgsub [data-bg]', '.mk-ui > .mk-menu .lh-bg', '#lhItem']),
        'reveal': ('Click here', [['.mk-ui > .mk-menu .mk-mi', 'Double-Click'], '#lhItem']),
        'share': ('Start a call', ['[data-dk="meet"]', '#chipShare']),
        'launch': ('Click here', [['.mk-ui > .mk-menu .mk-mi', 'Hide at Launch'], ['.mk-ui > .mk-menu .mk-mi', 'Quit'], '#lhItem']),
    },
    'lilvibe': {
        'sound': ('Click for sound', ['#lvSound']),
        'scene': ('Pick a scene', [['.mk-ui > .mk-menu .mk-mi', 'Café'], '#lvItem']),
        'volume': ('Drag the slider', ['.lv-vol input', '#lvItem']),
        'video': ('Click Video', [['.mk-ui > .mk-menu .mk-mi', 'Video'], '#lvItem']),
        'cover': ('Click the green button', ['[data-win="notes"]:not([hidden]) .mk-bar i[data-a="zoom"]', '[data-do="cover"]']),
        'match': ('Click here', [['.mk-ui > .mk-menu .mk-mi', 'Match'], '#lvItem']),
    },
    'lilsnap': {
        'half': ('Press ⌃⌥← or click', ['#snKeys [data-a="left"]']),
        'cycle': ('Once more', ['#snKeys [data-a="left"]']),
        'quarter': ('Press ⌃⌥→↑ or click', ['#snKeys [data-a="tr"]']),
        'drag': ('Drag to an edge', ['.mk-win.focus .mk-bar', '.mk-win .mk-bar']),
        'snapbar': ('Drag to the top middle', ['.mk-win.focus .mk-bar', '.mk-win .mk-bar']),
        'tile': ('Press ⌃⌥⌘3 or click', ['#snKeys [data-a="tile3"]']),
        'menu': ('Click here', ['#snItem']),
        'undo': ('Press ⌃⌥⌫ or click', ['#snKeys [data-a="restore"]']),
    },
    'lildim': {
        'focus': ('Click this window', ['.mk-win:not(.focus)[data-win="notes"] .mk-bar', '.mk-win:not(.focus)[data-win="mail"] .mk-bar', '[data-win="mail"] .mk-bar']),
        'intensity': ('Drag the slider', ['#dmInt', '#dmItem']),
        'blur': ('Click Blur', ['.dm-seg[data-k="style"] [data-v="blur"]', '#dmItem']),
        'app': ('Click App, then Mail', ['.dm-seg[data-k="highlight"] [data-v="app"]', '#dmItem']),
        'ring': ('Click here', ['#dmSB [data-t="ring"]', '#dmTabs [data-tab="look"]', '#dmGear', '#dmItem']),
        'peek': ('Press and hold', ['#peek']),
        'pause': ('Click here', [['.mk-ui > .mk-menu .mk-mi', '15'], '#dmPause', '#dmItem']),
        'theme': ('Click here', ['.theme-toggle']),
    },
}

CSS = MARK + r''' (2026-11-14): the Mac fills the first screen; the details are below ===== */
        .hero.big { min-height: 100svh; padding: calc(var(--nav-h, 76px) + 14px) clamp(10px, 2vw, 32px) 1.4rem; }
        .hero.big .hero-grid { display: flex; flex-direction: column; gap: 14px; max-width: none; margin: 0; align-items: stretch; }
        .hero.big .hero-copy { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(0, 470px) auto; grid-template-areas: "id h1 guide btn" "id sub guide btn"; column-gap: 1.2rem; row-gap: 0.2rem; align-items: center; text-align: left; width: 100%; max-width: 1560px; margin: 0 auto; }
        .hero.big .hero-id { grid-area: id; margin: 0; }
        .hero.big .hero-id .badge { display: none; }
        .hero.big .hero-appicon-sm { width: 58px; height: 58px; }
        .hero.big .hero-copy h1 { grid-area: h1; font-size: clamp(1.35rem, 2vw, 2.2rem); margin: 0; line-height: 1.06; }
        .hero.big .hero-copy .hero-subtitle { grid-area: sub; font-size: clamp(0.82rem, 0.9vw, 0.95rem); line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .hero.big .hero-copy .hero-buttons { grid-area: btn; margin: 0; gap: 0.4rem; flex-direction: column; align-items: flex-end; }
        .hero.big .hero-copy .hero-buttons-row { justify-content: flex-end; }
        .hero.big .hero-copy .download-btn-wrapper { align-items: flex-end; }
        .hero.big .hero-copy .system-req { text-align: right; }
        .hero.big .hero-copy .privacy-notice, .hero.big .hero-copy .live-line { display: none; }
        .hero.big .hero-stage { padding: 0; display: flex; flex-direction: column; align-items: center; min-width: 0; }
        .hero.big .mk-mac { width: var(--mac-w, 100%); max-width: 100%; }
        .hero.big .mk-base { margin: 0 -2.5%; height: clamp(18px, calc(var(--mac-w, 900px) * 0.03), 46px); border-radius: 0 0 clamp(14px, calc(var(--mac-w, 900px) * 0.022), 30px) clamp(14px, calc(var(--mac-w, 900px) * 0.022), 30px); }
        .hero.big .mk-base::before { height: 38%; border-radius: 0 0 10px 10px; }
        .hero.big .desk-bar { margin-top: 0.9rem; }
        @media (max-width: 1180px) {
            .hero.big .hero-copy { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "id h1 btn" "id sub btn" "guide guide guide"; row-gap: 0.5rem; }
        }
        @media (max-width: 820px) {
            .hero.big .hero-copy { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "id h1" "sub sub" "btn btn" "guide guide"; row-gap: 0.6rem; }
            .hero.big .hero-copy .hero-buttons, .hero.big .hero-copy .download-btn-wrapper { align-items: flex-start; }
            .hero.big .hero-copy .system-req { text-align: left; }
            .hero.big .hero-appicon-sm { width: 46px; height: 46px; }
        }

        /* Wide windows: the Mac takes the full height, the copy sits in a column beside it */
        .hero.big.side .hero-grid { flex-direction: row; align-items: flex-start; justify-content: center; gap: 30px; }
        .hero.big.side .hero-copy { display: flex; flex-direction: column; align-items: stretch; gap: 0.95rem; flex: 0 0 300px; width: 300px; max-width: none; margin: 0; }
        .hero.big.side .hero-appicon-sm { width: 52px; height: 52px; }
        .hero.big.side .hero-copy h1 { font-size: clamp(1.7rem, 2.1vw, 2.35rem); }
        .hero.big.side .hero-copy .hero-subtitle { -webkit-line-clamp: 4; font-size: 0.92rem; }
        .hero.big.side .hero-copy .hero-buttons, .hero.big.side .hero-copy .download-btn-wrapper { align-items: flex-start; }
        .hero.big.side .hero-copy .hero-buttons-row { justify-content: flex-start; }
        .hero.big.side .hero-copy .system-req { text-align: left; }
        .hero.big.side .guide { flex-wrap: wrap; row-gap: 0.55rem; }
        .hero.big.side .g-txt { flex: 1 1 calc(100% - 70px); }
        .hero.big.side .g-txt b { white-space: normal; }
        .hero.big.side .g-txt span { -webkit-line-clamp: 3; font-size: 0.82rem; }
        .hero.big.side .desk-bar { justify-content: flex-start; margin: 0.2rem 0 0; }
        .hero.big.side .hero-stage { flex: 0 1 auto; }
        @media (max-height: 780px) {
            .hero.big.side .hero-copy { gap: 0.6rem; }
            .hero.big.side .hero-appicon-sm { width: 48px; height: 48px; }
            .hero.big.side .hero-copy h1 { font-size: 1.55rem; }
            .hero.big.side .hero-copy .hero-subtitle { -webkit-line-clamp: 3; font-size: 0.86rem; }
            .hero.big.side .g-txt span { -webkit-line-clamp: 2; }
            .hero.big.side .desk-bar .chip { padding: 0.3rem 0.55rem; font-size: 0.68rem; }
        }

        /* The guide under the Mac: one step at a time */
        .guide { grid-area: guide; display: flex; align-items: center; gap: 0.7rem; min-width: 0; padding: 0.5rem 0.6rem 0.5rem 0.5rem; background: var(--bg-elevated, var(--bg)); border: var(--border-width, 3px) solid var(--border); box-shadow: 5px 5px 0 var(--border); }
        .g-step { flex-shrink: 0; font: 700 0.78rem 'Space Mono', monospace; padding: 0.35rem 0.55rem; background: var(--primary); color: #000; border: 2px solid var(--border); }
        .g-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
        .g-txt b { font-size: 0.95rem; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .g-txt span { font-size: 0.78rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .guide .chip { padding: 0.4rem 0.6rem; font-size: 0.7rem; }
        .guide .chip { flex-shrink: 0; }
        .g-skip { flex-shrink: 0; background: none; border: 0; font: 600 0.8rem 'Space Grotesk', sans-serif; color: var(--text-muted); text-decoration: underline; cursor: pointer; }
        .guide.all .g-step { background: var(--yellow); }
        .guide.all .g-skip { display: none; }
        .hero.big .desk-bar { margin-top: 0.8rem; }
        @media (max-width: 640px) { .guide { flex-wrap: wrap; } .g-txt { flex-basis: calc(100% - 4rem); } }

        /* The glow on the thing to use next */
        .mk-glow { position: fixed; left: 0; top: 0; width: 10px; height: 10px; z-index: 90; pointer-events: none; border-radius: 10px; border: 3px solid var(--primary); box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 35%, transparent), 0 0 26px 6px color-mix(in srgb, var(--primary) 70%, transparent); opacity: 0; transition: opacity 0.25s, transform 0.28s cubic-bezier(0.3, 1.3, 0.5, 1), width 0.28s cubic-bezier(0.3, 1.3, 0.5, 1), height 0.28s cubic-bezier(0.3, 1.3, 0.5, 1); animation: glowPulse 1.3s ease-in-out infinite; }
        .mk-glow.on { opacity: 1; }
        .mk-glow span { position: absolute; left: 50%; top: 100%; transform: translate(-50%, 10px); white-space: nowrap; font: 700 11px/1.2 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 0.03em; background: var(--yellow); color: #000; border: 2px solid var(--border); box-shadow: 2px 2px 0 var(--border); padding: 3px 8px; }
        .mk-glow.up span { top: auto; bottom: 100%; transform: translate(-50%, -10px); }
        @keyframes glowPulse { 50% { box-shadow: 0 0 0 10px color-mix(in srgb, var(--primary) 0%, transparent), 0 0 42px 12px color-mix(in srgb, var(--primary) 45%, transparent); } }
        @media (prefers-reduced-motion: reduce) { .mk-glow { animation: none; transition: opacity 0.2s; } }
'''

GUIDE_HTML = '''                <div class="guide" id="guide" aria-live="polite">
                    <span class="g-step" id="gStep">1 / 1</span>
                    <div class="g-txt"><b id="gTitle"></b><span id="gDesc"></span></div>
                    <button class="chip g" type="button" id="gShow">▶ Show me</button>
                    <button class="g-skip" type="button" id="gSkip">Skip</button>
                </div>
'''

JS = r'''
    <!-- Big Mac hero: size the Mac to the first screen, guide through the quests, glow on the next target -->
    <div class="mk-glow" id="mkGlow" aria-hidden="true"><span id="mkGlowL"></span></div>
    <script>
    (function () {
        'use strict';
        const TARGETS = __TARGETS__;
        const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hero = document.querySelector('.hero.big'), mac = document.getElementById('mac'), stage = document.getElementById('stage');
        const list = document.getElementById('quests'), guide = document.getElementById('guide');
        const glow = document.getElementById('mkGlow'), glowL = document.getElementById('mkGlowL');
        if (!hero || !mac || !list || !guide) return;
        const nav = document.querySelector('nav');
        hero.querySelector('.hero-copy').appendChild(guide);   // the guide lives in the header row

        // ---- The Mac fills what's left of the first screen ----
        // Two layouts: stacked (copy above the Mac) or side (copy in a column beside it, wide windows).
        const copy = hero.querySelector('.hero-copy');
        const bar = stage.querySelector('.desk-bar'), barNext = bar ? bar.nextSibling : null;
        // lid: 14 px padding + a 16:10 screen; base: 3% of the width (18–46 px)
        const fromH = h => { const w = (h - 14 + 28 / 1.6) / (1 / 1.6 + 0.03); return Math.min(w, (h - 14 - 18) * 1.6 + 28 > w ? w : (h - 14 - 18) * 1.6 + 28); };
        function layout(side) {
            hero.classList.toggle('side', side);
            if (bar) { if (side) copy.appendChild(bar); else stage.insertBefore(bar, barNext); }
            const navH = nav ? nav.offsetHeight : 70, padX = Math.max(10, Math.min(32, innerWidth * 0.02));
            hero.style.setProperty('--nav-h', navH + 'px');
            const below = stage.offsetHeight - mac.offsetHeight;   // what sits under the Mac (chips, keys)
            const availW = hero.clientWidth - 2 * padX - (side ? copy.offsetWidth + 30 : 0);
            const availH = innerHeight - navH - 14 - (side ? 0 : copy.offsetHeight + 14) - below - 24;
            return Math.round(Math.max(300, Math.min(availW / 1.055, fromH(availH), 2400)));   // the base is 5% wider than the lid
        }
        function fit() {
            // Wide windows put the copy beside the Mac; tall or narrow ones stack it above.
            // Decided by the window's shape only, so it never flips while fonts load.
            const side = innerWidth >= 1000 && innerWidth / innerHeight >= 1.42;
            hero.style.setProperty('--mac-w', layout(side) + 'px');
            if (ready) track();
        }
        let ready = false;
        fit();
        addEventListener('resize', fit);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

        // ---- Guide: the first quest not done (or skipped) ----
        const skipped = new Set();
        const items = () => Array.from(list.querySelectorAll('.quest'));
        let cur = null;
        function render() {
            const all = items(), open = all.filter(li => !li.classList.contains('done'));
            const next = open.find(li => !skipped.has(li.dataset.q)) || open[0] || null;
            cur = next ? next.dataset.q : null;
            guide.classList.toggle('all', !next);
            if (next) {
                document.getElementById('gStep').textContent = `${all.indexOf(next) + 1} / ${all.length}`;
                document.getElementById('gTitle').textContent = next.querySelector('b').textContent;
                document.getElementById('gDesc').textContent = next.querySelector('p').textContent;
                document.getElementById('gShow').hidden = false;
            } else {
                const btn = document.querySelector('.hero-copy .btn');
                document.getElementById('gStep').textContent = 'DONE';
                document.getElementById('gTitle').textContent = 'That’s the whole app. Now get it for real.';
                document.getElementById('gDesc').innerHTML = btn ? `<a href="${btn.getAttribute('href')}"${btn.hasAttribute('download') ? ' download' : ''} style="color:inherit;font-weight:700">${btn.textContent.trim()} →</a> · or scroll down for the details` : 'Scroll down for the details.';
                document.getElementById('gShow').hidden = true;
            }
            track();
        }
        new MutationObserver(render).observe(list, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
        document.getElementById('gShow').addEventListener('click', () => { const b = cur && list.querySelector(`[data-show="${cur}"]`); if (b) b.click(); });
        document.getElementById('gSkip').addEventListener('click', () => { if (cur) { skipped.add(cur); render(); } });
        const reset = document.getElementById('qReset');
        if (reset) reset.addEventListener('click', () => { skipped.clear(); setTimeout(render, 0); });

        // ---- Glow: follows the element to use next ----
        function visible(el) {
            if (!el || !el.getClientRects().length) return false;
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return false;
            for (let n = el; n && n !== document.body; n = n.parentElement) { if (n.hidden) return false; const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; }
            return true;
        }
        function find(spec) {
            if (typeof spec === 'string') return Array.from(document.querySelectorAll(spec)).find(visible) || null;
            return Array.from(document.querySelectorAll(spec[0])).find(el => el.textContent.includes(spec[1]) && visible(el)) || null;
        }
        let timer = 0;
        function track() {
            clearTimeout(timer);
            const t = cur && TARGETS[cur];
            const busy = document.querySelector('.mk-ghost.on');
            let el = null;
            if (t && !busy) for (const spec of t[1]) { el = find(spec); if (el) break; }
            if (el) {
                const r = el.getBoundingClientRect(), pad = 5;
                glow.style.width = (r.width + pad * 2) + 'px'; glow.style.height = (r.height + pad * 2) + 'px';
                glow.style.transform = `translate(${(r.left - pad).toFixed(1)}px, ${(r.top - pad).toFixed(1)}px)`;
                glow.classList.toggle('up', r.top > innerHeight * 0.62);
                glowL.textContent = t[0];
                glow.classList.add('on');
            } else glow.classList.remove('on');
            if (!document.hidden) timer = setTimeout(track, 140);
        }
        addEventListener('scroll', () => track(), { passive: true });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) track(); });
        render();
        ready = true;
        window.__guide = { render, get cur() { return cur; }, fit };
    })();
    </script>
'''

def convert(appid):
    path = os.path.join(ROOT, appid, 'index.html')
    s = open(path).read()
    if MARK in s:   # strip the previous conversion (exactly what was inserted), then apply the current one
        a = s.index('        ' + MARK); b = s.index('</style>', a); s = s[:a] + s[b:]
        assert s.count(GUIDE_HTML) == 1, 'guide'; s = s.replace(GUIDE_HTML, '')
        a = s.index('\n    <!-- Big Mac hero:'); b = s.index('    </script>\n', a) + len('    </script>\n'); s = s[:a] + s[b:]
        s = s.replace('<section class="hero big" id="try"', '<section class="hero" id="try"', 1)
    targets = TARGETS[appid]
    # 1. CSS: at the end of the head's style block
    i = s.index('</style>', s.index('/* ========== MacKit'))
    s = s[:i] + '        ' + CSS + '    ' + s[i:]
    # 2. The hero gets the "big" class
    s, n = re.subn(r'<section class="hero" id="try"', '<section class="hero big" id="try"', s, count=1)
    assert n == 1, 'hero'
    # 3. Guide bar right under the Mac (before the chips)
    hs = s.index('<section class="hero big"')
    j = min(x for x in (s.find('<div class="desk-bar">', hs), s.find('<div class="sn-keys"', hs)) if x > 0)
    line = s.rfind('\n', 0, j) + 1
    s = s[:line] + GUIDE_HTML + s[line:]
    # 4. Glow + script before the product wheel
    k = s.index('<script src="/studio-wheel.js')
    line = s.rfind('\n', 0, k) + 1
    s = s[:line] + JS.replace('__TARGETS__', json.dumps(targets, ensure_ascii=False)) + s[line:]
    open(path, 'w').write(s)
    print(appid, 'converted')

if __name__ == '__main__':
    for a in sys.argv[1:] or TARGETS:
        convert(a)
