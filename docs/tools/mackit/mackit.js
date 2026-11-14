        // ---------- MacKit: a small working macOS desktop (shared by the app pages; copied, no build step) ----------
        // The desktop lives in points (1024 × 640, or 760 × 475 when the screen is narrow) and is scaled to fit.
        // Windows drag by their title bar, the traffic lights close / minimise / zoom, menus slide along the
        // menu bar like macOS, and a ghost pointer drives the "Show me" demos.
        function MacKit(root, opt = {}) {
            const screen = root.querySelector('.mk-screen'), world = root.querySelector('.mk-world');
            const winsEl = world.querySelector('.mk-wins'), ui = world.querySelector('.mk-ui');
            const M = { W: 0, H: 0, s: 1, MB: 26, DOCK: 60, wins: new Map(), z: 1, root, screen, world, ui, focus: null, visible: true, busy: false };
            const listeners = {};
            M.on = (ev, fn) => (listeners[ev] = listeners[ev] || []).push(fn);
            const emit = (ev, ...a) => (listeners[ev] || []).forEach(f => f(...a));
            const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

            function fit() {
                const cw = screen.clientWidth;
                if (!cw) return;
                const W = cw < (opt.narrowAt || 620) ? (opt.narrowW || 760) : 1024, H = Math.round(W / 1.6);
                const changed = W !== M.W;
                M.W = W; M.H = H; M.s = cw / W;
                world.style.width = W + 'px'; world.style.height = H + 'px';
                world.style.transform = `scale(${M.s})`;
                emit('layout', changed);
                if (changed) M.wins.forEach(w => { clampWin(w); place(w); });
            }
            new ResizeObserver(fit).observe(screen);

            // Pointer → desktop points; element → its box in desktop points (from layout, not animation)
            M.pt = e => { const r = screen.getBoundingClientRect(); return { x: (e.clientX - r.left) / M.s, y: (e.clientY - r.top) / M.s }; };
            M.box = el => {
                const r = el.getBoundingClientRect(), s = screen.getBoundingClientRect();
                return { x: (r.left - s.left) / M.s, y: (r.top - s.top) / M.s, w: r.width / M.s, h: r.height / M.s };
            };

            // ---- Visibility: loops run only while the Mac is on screen and the tab is shown ----
            new IntersectionObserver(es => { M.visible = es[0].isIntersecting && !document.hidden; emit('visible', M.visible); }).observe(root);
            document.addEventListener('visibilitychange', () => { M.visible = !document.hidden; emit('visible', M.visible); });

            // ---- Windows ----
            function place(w) {
                const s = w.el.style;
                s.left = w.x + 'px'; s.top = w.y + 'px'; s.width = w.w + 'px'; s.height = w.h + 'px'; s.zIndex = w.z;
            }
            function clampWin(w) {
                w.w = Math.min(w.w, M.W); w.h = Math.min(w.h, M.H - M.MB);
                w.x = clampN(w.x, 60 - w.w, M.W - 60);
                w.y = clampN(w.y, M.MB, M.H - 40);
            }
            M.place = place;
            M.win = o => {
                const el = document.createElement('div');
                el.className = 'mk-win ' + (o.cls || '');
                el.dataset.win = o.id;
                el.innerHTML = (o.noBar ? '' : `<div class="mk-bar"><i data-a="close"></i><i data-a="min"></i><i data-a="zoom"></i><span>${o.title || ''}</span></div>`) + `<div class="mk-body">${o.html || ''}</div>`;
                winsEl.appendChild(el);
                const w = { id: o.id, el, body: el.querySelector('.mk-body'), x: o.x, y: o.y, w: o.w, h: o.h, z: ++M.z, open: o.open !== false, min: false, saved: null, dockId: o.dock || o.id };
                M.wins.set(o.id, w);
                el.hidden = !w.open;
                place(w);
                el.addEventListener('pointerdown', () => M.focusWin(w.id), true);
                const bar = el.querySelector('.mk-bar');
                if (bar) {
                    bar.addEventListener('click', e => {
                        const a = e.target.dataset && e.target.dataset.a;
                        if (a === 'close') M.closeWin(w.id);
                        else if (a === 'min') M.minWin(w.id);
                        else if (a === 'zoom') M.zoomWin(w.id);
                    });
                    bar.addEventListener('dblclick', e => { if (!e.target.dataset.a) M.zoomWin(w.id); });
                    let drag = null;
                    bar.addEventListener('pointerdown', e => {
                        if (e.target.dataset.a || e.button > 0) return;
                        if (e.pointerType === 'mouse') e.preventDefault();
                        const p = M.pt(e);
                        drag = { ox: p.x - w.x, oy: p.y - w.y, id: e.pointerId, moved: false };
                        bar.setPointerCapture(e.pointerId);
                        el.classList.add('drag');
                    });
                    bar.addEventListener('pointermove', e => {
                        if (!drag || e.pointerId !== drag.id) return;
                        const p = M.pt(e);
                        w.x = p.x - drag.ox; w.y = p.y - drag.oy; drag.moved = true;
                        clampWin(w); place(w);
                        emit('move', w);
                    });
                    const end = e => {
                        if (!drag || e.pointerId !== drag.id) return;
                        const moved = drag.moved;
                        drag = null; el.classList.remove('drag');
                        if (moved) emit('drop', w);
                    };
                    bar.addEventListener('pointerup', end);
                    bar.addEventListener('pointercancel', end);
                }
                return w;
            };
            M.focusWin = id => {
                const w = M.wins.get(id);
                if (!w) return;
                if (M.focus !== id) { w.z = ++M.z; place(w); }
                M.focus = id;
                M.wins.forEach(x => x.el.classList.toggle('focus', x === w));
                emit('focus', w);
            };
            M.openWin = id => {
                const w = M.wins.get(id);
                if (!w) return;
                const was = w.open && !w.min;
                w.open = true; w.min = false; w.el.hidden = false;
                requestAnimationFrame(() => w.el.classList.remove('gone'));
                M.focusWin(id); M.updateDock();
                if (!was) emit('win', w, 'open');
            };
            M.closeWin = id => {
                const w = M.wins.get(id);
                if (!w || !w.open) return;
                w.open = false; w.min = false; w.el.hidden = true; w.el.classList.remove('gone');
                if (M.focus === id) M.focus = null;
                M.updateDock(); emit('win', w, 'close');
            };
            M.minWin = id => {
                const w = M.wins.get(id);
                if (!w || !w.open) return;
                w.min = true;
                const d = M.dockEl && M.dockEl.querySelector(`[data-dk="${w.dockId}"]`);
                if (d) { const b = M.box(d); w.el.style.transformOrigin = `${b.x + b.w / 2 - w.x}px ${b.y - w.y}px`; }
                w.el.classList.add('gone');
                setTimeout(() => { if (w.min) w.el.hidden = true; }, 320);
                if (M.focus === id) M.focus = null;
                emit('win', w, 'min');
            };
            M.zoomWin = id => {
                const w = M.wins.get(id);
                if (!w) return;
                if (w.saved) { Object.assign(w, w.saved); w.saved = null; }
                else { w.saved = { x: w.x, y: w.y, w: w.w, h: w.h }; Object.assign(w, { x: 0, y: M.MB, w: M.W, h: M.H - M.MB - (M.DOCK ? M.DOCK + 4 : 0) }); }
                place(w); emit('win', w, 'zoom');
            };

            // ---- Menus (menu bar and status items) ----
            let openMenu = null;
            M.closeMenus = () => {
                if (!openMenu) return;
                openMenu.el.remove();
                openMenu.anchor.classList.remove('open');
                const was = openMenu; openMenu = null;
                emit('menu', was.anchor, false);
            };
            function buildMenu(items) {
                const m = document.createElement('div');
                m.className = 'mk-menu';
                items.forEach(it => {
                    if (it === '-') { m.insertAdjacentHTML('beforeend', '<div class="mk-sep"></div>'); return; }
                    if (it.h) { m.insertAdjacentHTML('beforeend', `<div class="mk-mh">${it.h}</div>`); return; }
                    const d = document.createElement('div');
                    d.className = 'mk-mi' + (it.dis ? ' dis' : '') + (it.sub ? ' has-sub' : '') + (it.cls ? ' ' + it.cls : '');
                    d.innerHTML = `<span class="ck">${it.on ? '✓' : (it.ic || '')}</span><span>${it.t}</span>${it.k ? `<span class="k">${it.k}</span>` : ''}`;
                    if (it.id) d.dataset.mi = it.id;
                    if (it.sub) {
                        const sub = d.appendChild(typeof it.sub === 'function' ? it.sub() : buildMenu(it.sub));
                        sub.classList.add('mk-sub', 'mk-menu');
                        // Like macOS: a submenu that would run off the bottom slides up
                        const fitSub = () => { sub.style.top = '-5px'; requestAnimationFrame(() => { const b = M.box(sub); if (b.y + b.h > M.H - 4) sub.style.top = (-5 - (b.y + b.h - (M.H - 4))) + 'px'; }); };
                        d.addEventListener('pointerenter', fitSub);
                        d.addEventListener('click', fitSub);
                    }
                    d.addEventListener('click', e => {
                        e.stopPropagation();
                        if (it.sub) { if (e.target.closest('.mk-sub') === null) d.classList.toggle('open'); return; }
                        if (it.dis) return;
                        if (!it.keep) M.closeMenus();
                        if (it.act) it.act(d);
                    });
                    m.appendChild(d);
                });
                return m;
            }
            M.openMenu = (anchor, build, align) => {
                M.closeMenus(); M.closePops();
                const items = build();
                const el = items instanceof HTMLElement ? items : buildMenu(items);
                ui.appendChild(el);
                const b = M.box(anchor);
                const w = el.offsetWidth;
                const x = align === 'right' ? b.x + b.w - w : b.x;
                const left = clampN(x, 4, M.W - w - 4);
                el.style.left = left + 'px';
                el.classList.toggle('flip', left + w * 2 > M.W);
                anchor.classList.add('open');
                openMenu = { el, anchor, build, align };
                emit('menu', anchor, true);
                return el;
            };
            M.menuItem = (anchor, build, align) => {
                anchor.addEventListener('pointerdown', e => {
                    e.stopPropagation();
                    if (e.pointerType === 'mouse') e.preventDefault();
                    if (openMenu && openMenu.anchor === anchor) M.closeMenus(); else M.openMenu(anchor, build, align);
                });
                anchor.addEventListener('pointerenter', () => { if (openMenu && openMenu.anchor !== anchor && openMenu.anchor.parentElement && anchor.closest('.mk-menubar')) M.openMenu(anchor, build, align); });
            };
            M.refreshMenu = () => { if (openMenu) { const { anchor, build, align } = openMenu; M.openMenu(anchor, build, align); } };

            // Popovers (status item panels): a prebuilt element in .mk-ui
            let openPop = null;
            M.closePops = () => {
                if (!openPop) return;
                openPop.pop.hidden = true; openPop.anchor.classList.remove('open');
                const was = openPop; openPop = null;
                emit('pop', was.pop, false);
            };
            M.openPop = (anchor, pop) => {
                M.closeMenus();
                if (openPop && openPop.pop === pop) return;
                M.closePops();
                pop.hidden = false;
                const b = M.box(anchor), w = pop.offsetWidth;
                const x = clampN(b.x + b.w / 2 - w / 2, 6, M.W - w - 6);
                pop.style.left = x + 'px';
                pop.style.setProperty('--arrow', (b.x + b.w / 2 - x) + 'px');
                anchor.classList.add('open');
                openPop = { anchor, pop };
                emit('pop', pop, true);
            };
            M.popItem = (anchor, pop) => {
                anchor.addEventListener('pointerdown', e => {
                    e.stopPropagation();
                    if (e.pointerType === 'mouse') e.preventDefault();
                    if (openPop && openPop.pop === pop) M.closePops(); else M.openPop(anchor, pop);
                });
                pop.addEventListener('pointerdown', e => e.stopPropagation());
            };
            M.popOpen = pop => !!openPop && openPop.pop === pop;
            screen.addEventListener('pointerdown', e => {
                if (e.target.closest('.mk-menu, .mk-pop')) return;
                M.closeMenus(); M.closePops();
            });

            // ---- Dock ----
            M.dock = items => {
                const d = document.createElement('div');
                d.className = 'mk-dock';
                items.forEach(it => {
                    if (it === '|') { d.insertAdjacentHTML('beforeend', '<div class="mk-dsep"></div>'); return; }
                    const b = document.createElement('div');
                    b.className = 'mk-dk';
                    b.dataset.dk = it.id;
                    b.style.background = it.bg || '';
                    b.innerHTML = (it.img ? `<img src="${it.img}" alt="" width="42" height="42">` : (it.icon || '')) + `<span class="tip">${it.name}</span>`;
                    b.addEventListener('click', () => {
                        if (it.act) it.act(b);
                        else if (M.wins.has(it.id)) M.openWin(it.id);
                    });
                    d.appendChild(b);
                });
                ui.appendChild(d);
                M.dockEl = d;
                M.updateDock();
                return d;
            };
            M.updateDock = () => {
                if (!M.dockEl) return;
                M.dockEl.querySelectorAll('.mk-dk').forEach(b => {
                    const w = M.wins.get(b.dataset.dk);
                    if (w) b.classList.toggle('run', w.open);
                });
            };

            // ---- HUD + clock ----
            const hud = document.createElement('div');
            hud.className = 'mk-hud';
            ui.appendChild(hud);
            let hudT = 0;
            M.hud = (html, ms = 1400) => {
                hud.innerHTML = html; hud.classList.add('show');
                clearTimeout(hudT); hudT = setTimeout(() => hud.classList.remove('show'), ms);
            };
            M.clock = el => {
                const set = () => {
                    const d = new Date();
                    const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    el.textContent = M.W < 1000 ? t : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '') + '  ' + t;
                };
                set(); setInterval(set, 15000); M.on('layout', set);
            };

            // ---- Ghost pointer for "Show me" ----
            const ghost = document.createElement('div');
            ghost.className = 'mk-ghost';
            ghost.innerHTML = '<svg viewBox="0 0 18 26" width="18" height="26" aria-hidden="true"><path d="M1.5 1.5v19.5l5-4.6 3.4 7.4 3.2-1.5-3.3-7.2h6.7z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
            ui.appendChild(ghost);
            const G = { x: 0, y: 0 };
            const moveGhost = () => { ghost.style.transform = `translate(${G.x}px, ${G.y}px)`; };
            M.tween = (ms, fn) => new Promise(res => {
                if (REDUCED || ms <= 0) { fn(1); res(); return; }
                const t0 = performance.now();
                const step = now => {
                    const t = Math.min(1, (now - t0) / ms), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                    fn(e);
                    if (t < 1) requestAnimationFrame(step); else res();
                };
                requestAnimationFrame(step);
            });
            M.ghostTo = async (target, ms = 520) => {
                let p = target;
                if (target instanceof Element) { const b = M.box(target); p = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; }
                if (!ghost.classList.contains('on')) { G.x = M.W * 0.62; G.y = M.H * 0.6; moveGhost(); ghost.classList.add('on'); }
                const a = { ...G };
                await M.tween(ms, t => { G.x = a.x + (p.x - a.x) * t; G.y = a.y + (p.y - a.y) * t; moveGhost(); });
                return p;
            };
            M.ghostTap = async () => {
                ghost.classList.remove('tap'); void ghost.offsetWidth; ghost.classList.add('tap');
                await new Promise(r => setTimeout(r, REDUCED ? 30 : 180));
            };
            // Glide to an element and press it (fires the same handlers a person would)
            M.press = async (el, ms) => {
                if (!el) return;
                await M.ghostTo(el, ms);
                await M.ghostTap();
                const b = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2, pointerId: 99, pointerType: 'mouse', isPrimary: true, button: 0 };
                el.dispatchEvent(new PointerEvent('pointerdown', o));
                el.dispatchEvent(new PointerEvent('pointerup', o));
                el.dispatchEvent(new MouseEvent('click', o));
            };
            M.ghostHide = () => ghost.classList.remove('on');

            return M;
        }

        // ---------- Quests: "things to try", each with a Show me autopilot ----------
        function Quests(o) {
            const list = document.getElementById('quests');
            let done = new Set(store.get(o.key, []).filter(id => o.items.some(q => q.id === id)));
            list.innerHTML = o.items.map((q, i) => `<li class="quest" data-q="${q.id}"><span class="stamp">DONE ✓</span><span class="qn">${String(i + 1).padStart(2, '0')}</span><b>${q.t}</b><p>${q.d}</p><button class="chip" type="button" data-show="${q.id}">▶ Show me</button></li>`).join('');
            function render() {
                const next = o.items.find(q => !done.has(q.id));
                list.querySelectorAll('.quest').forEach(li => {
                    li.classList.toggle('done', done.has(li.dataset.q));
                    li.classList.toggle('next', !!next && li.dataset.q === next.id);
                });
                document.getElementById('qCount').textContent = `${done.size} / ${o.items.length}`;
                document.getElementById('qMeter').style.transform = `scaleX(${done.size / o.items.length})`;
                document.getElementById('qWin').classList.toggle('show', done.size === o.items.length);
            }
            const Q = {
                done(id) {
                    if (done.has(id) || !o.items.some(q => q.id === id)) return;
                    done.add(id); store.set(o.key, Array.from(done)); render();
                    if (o.onDone) o.onDone(id);
                },
                has: id => done.has(id),
                busy: false
            };
            document.getElementById('qReset').addEventListener('click', () => { done = new Set(); store.set(o.key, []); render(); if (o.onReset) o.onReset(); });
            list.addEventListener('click', async e => {
                const b = e.target.closest('[data-show]');
                if (!b || Q.busy) return;
                const stage = document.getElementById(o.stage || 'stage');
                const r = stage.getBoundingClientRect();
                if (r.top < 60 || r.bottom > innerHeight) stage.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
                await wait(380);
                Q.busy = true;
                try { await o.show[b.dataset.show](); } finally { Q.busy = false; if (o.afterShow) o.afterShow(); }
            });
            render();
            return Q;
        }
