// LilDisplay: the website on a Mac, wired to an iPhone (run with --motion: throws need real velocity).
// Headless Chrome barely runs requestAnimationFrame, so the test drives the physics with __ld.step(n).
(async () => {
  await sl(400);
  const L = window.__ld;
  ok(!!L, 'test handle');
  ok(L.S.connected && L.S.plugged, 'starts connected over USB');
  ok(!L.ph.mount && L.ph.x + L.ph.w < L.mac.x + L.G.mac.lidX - 20, 'iPhone starts beside the Mac, with a gap');
  ok(document.querySelector('.win[data-w="browser"] h1').textContent.includes('second display'), 'website is inside the Mac');

  // 0. The "Drag to move" grips move each device
  for (const [sel, b, name] of [['.mac-grip', L.mac, 'Mac'], ['.ph-tools .grip', L.ph, 'iPhone']]) {
    const g = $q(sel), gr = g.getBoundingClientRect(), x0g = b.x, gx0 = gr.left + gr.width / 2, gy0 = gr.top + gr.height / 2;
    pe(g, 'pointerdown', gx0, gy0);
    for (let i = 1; i <= 6; i++) { pe(g, 'pointermove', gx0 - 6 * i, gy0); L.step(3); await sl(10); }
    pe(g, 'pointerup', gx0 - 36, gy0); L.step(40);
    ok(b.x < x0g - 20, 'grip moves the ' + name + ' (' + Math.round(x0g - b.x) + ' px)');
  }
  L.place(true); L.step(10); await sl(30);

  // 1. Drag the note onto the iPhone
  const bar = $q('#macWins .win[data-w="notes"] .win-bar');
  const br = bar.getBoundingClientRect(), pr = $q('#phScreen').getBoundingClientRect();
  const x0 = br.left + br.width * 0.6, y0 = br.top + 10, x1 = pr.left + pr.width / 2, y1 = pr.top + pr.height * 0.3;
  pe(bar, 'pointerdown', x0, y0);
  ok($q('#phDrop').classList.contains('on') && $q('#macEdge').classList.contains('on'), 'pressing a Mac window lights up the iPhone');
  let swallowed = false;
  for (let i = 1; i <= 12; i++) { pe(bar, 'pointermove', x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * i / 12); if (L.SW && L.SW.toPhone) swallowed = true; await sl(16); }
  ok(swallowed, 'the window goes down the cable (snake swallow)');
  ok($q('#phDrop').classList.contains('over'), 'over the iPhone: release to drop');
  pe(bar, 'pointerup', x1, y1);
  ok(!$q('#phDrop').classList.contains('on'), 'highlight goes away after the drop');
  await sl(100);
  const n = L.WIN.notes;
  ok(n.x + n.w / 2 < 0, 'note moved onto the iPhone (world x ' + Math.round(n.x) + ')');
  ok($q('#phWins .win[data-w="notes"]').style.display !== 'none', 'iPhone copy of the note is visible');
  ok(L.done.includes('drag'), 'quest: drag');

  // 2. Menu
  $q('#mbLd').click(); await sl(50);
  ok($q('#ldm').classList.contains('open') && $q('#ldmStatus').textContent === 'Connected · USB', 'LilDisplay menu: ' + $q('#ldmStatus').textContent);
  ok(L.done.includes('menu'), 'quest: menu');
  $q('#mbLd').click(); await sl(30);

  // 3. Pull the iPhone off the Mac and far away: the cable pops out
  const ph = $q('#phone');
  let r = ph.getBoundingClientRect();
  let px = r.left + 8, py = r.top + 8;
  pe(ph, 'pointerdown', px, py);
  for (let i = 1; i <= 40; i++) { pe(ph, 'pointermove', px + 8 * i, py - 3 * i); L.step(2); await sl(16); }
  for (let i = 1; i <= 40 && L.S.plugged; i++) { pe(ph, 'pointermove', px + 320 + 30 * i, py - 120); L.step(2); await sl(16); }
  ok(!L.S.plugged, 'yanked the cable out');
  ok(!L.S.connected && $q('#aStatus').textContent === 'Connection lost', 'iPhone says: ' + $q('#aStatus').textContent);
  ok(n.x + n.w / 2 > 0, 'note came back to the Mac');
  // keep going past the Mac: the iPhone is now on its right
  const mrr = $q('#mac').getBoundingClientRect();
  let cx = px + 320 + 30 * 40;
  for (let i = 1; i <= 10; i++) { pe(ph, 'pointermove', cx + (mrr.right + 80 - cx) * i / 10, py - 120); L.step(2); await sl(12); }
  pe(ph, 'pointerup', mrr.right + 80, py - 120);
  const keep = { x: L.ph.x, y: L.ph.y };
  L.step(600); await sl(50);
  ok(Math.abs(L.ph.x - keep.x) + Math.abs(L.ph.y - keep.y) < 1, 'iPhone stays where it was let go');
  ok(L.done.includes('side'), 'quest: other side');

  // 4. Bring it back next to the Mac, then plug it in (drag the plug to the port)
  r = ph.getBoundingClientRect(); px = r.left + 10; py = r.top + 10;
  const gx = L.mac.x - 80 - L.ph.w + 10, gy = L.mac.y + (L.G.mac.lidH - L.ph.h) / 2 + 10;
  pe(ph, 'pointerdown', px, py);
  for (let i = 1; i <= 20; i++) { pe(ph, 'pointermove', px + (gx - px) * i / 20, py + (gy - py) * i / 20); L.step(2); await sl(12); }
  pe(ph, 'pointerup', gx, gy); L.step(600); await sl(30);
  const tip = L.plugTip(), port = L.portInfo(L.ph);
  const room = $q('#room');
  pe(room, 'pointerdown', tip.x, tip.y);
  for (let i = 1; i <= 20 && !L.S.plugged; i++) { pe(room, 'pointermove', tip.x + (port.x - tip.x) * i / 20, tip.y + (port.y + 10 - tip.y) * i / 20); L.step(2); await sl(20); }
  pe(room, 'pointerup', port.x, port.y);
  ok(L.S.plugged, 'plugged back in');
  ok(L.done.includes('cable'), 'quest: cable');

  // 5. Connect from the iPhone app
  $q('#aSwipe').click(); await sl(80);
  ok($q('#app').classList.contains('sheet-open'), 'swipe-up menu opens');
  $q('#cbtn').click(); await sl(1300);
  ok(L.S.connected, 'connected again');

  // 6. Turn it from the iPhone's menu (Portrait | Landscape); the phone keeps its size
  const area0 = L.ph.w * L.ph.h;
  $q('.pill').click(); await sl(30);
  $q('#app [data-a="ori:landscape"]').click(); L.step(4); await sl(50);
  ok(Math.abs(L.ph.w * L.ph.h - area0) < 1 && L.ph.w > L.ph.h, 'same size, on its side');
  ok($q('#app [data-a="ori:landscape"]').classList.contains('on'), 'Landscape selected');
  ok(L.S.orient === 'landscape' && L.PO && L.done.includes('rotate'), 'landscape (' + L.S.orient + ')');

  // 7. Swing the cable
  const m = L.ROPE.P[Math.floor(L.ROPE.n / 2)];
  pe(room, 'pointerdown', m.x, m.y);
  for (let i = 1; i <= 8; i++) { pe(room, 'pointermove', m.x + 15 * i, m.y - 6 * i); L.step(2); await sl(12); }
  pe(room, 'pointerup', m.x + 120, m.y - 48); L.step(200);
  ok(L.done.includes('swing'), 'quest: swing');
  ok(L.done.length === 6, 'all six (' + L.done.join(',') + ')');

  // 8. Terminal: it runs by itself, and you can type into it
  const tout = $q('#macWins .win[data-w="terminal"] .t-out');
  ok(tout.textContent.length > 5, 'terminal is running: "' + tout.textContent.slice(0, 30).replace(/\n/g, ' ') + '"');
  $q('#macWins .win[data-w="terminal"] .term').click();
  ok(L.T.user && document.activeElement === $q('#termIn'), 'click the terminal to type');
  const ti = $q('#termIn'); ti.value = 'lildisplay'; ti.dispatchEvent(new Event('input', { bubbles: true }));
  ti.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok(/Connected · USB · Code 42/.test(tout.textContent), 'lildisplay command prints the status');
  ok($q('#phWins .win[data-w="terminal"] .t-out').innerHTML === tout.innerHTML, 'iPhone copy mirrors the terminal');
  const o0 = L.S.orient; ti.value = 'rotate'; ti.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); L.step(4);
  ok(L.S.orient !== o0, 'rotate command turns the iPhone');

  // 8b. The note is writable and mirrored on both screens
  const ne = $q('#macWins .n-edit'); ne.focus(); ne.innerHTML += '<p>hello</p>'; ne.dispatchEvent(new InputEvent('input', { bubbles: true }));
  ok($q('#phWins .n-edit').innerHTML.includes('hello'), 'typing in the note shows on both screens');
  // 8c. Type a website in the Mac's browser
  L.goTo('lilstudio.app/lilstats/'); await sl(50);
  const bw = $q('#macWins .win[data-w="browser"]');
  ok(bw.classList.contains('framed') && /lilstats/.test(bw.querySelector('iframe').getAttribute('src')), 'address bar opens lilstudio.app/lilstats in the Mac');
  $q('#macWins .nb[data-a="nav:back"]').click(); await sl(50);
  ok(!bw.classList.contains('framed') && bw.querySelector('.url').value === 'lilstudio.app/lildisplay', 'Back returns to the site');
  // 8d. Full Mac menu: Advanced › Keep Awake shows the real alert
  $q('#mbLd').click(); $q('#miKeep').click(); await sl(30);
  ok($q('#malert').classList.contains('open') && /Keep Mac Awake/.test($q('#maTitle').textContent), 'Keep Awake alert');
  $q('#maBtns button').click(); ok(L.S.keep, 'Keep Awake on');
  ok(!$q('#lidBtn'), 'no lid button');
  // 8e. Trackpad mode drives the Mac pointer
  L.setMode('trackpad'); L.step(4); await sl(30);
  ok($q('#app').classList.contains('padmode') && /Trackpad/.test($q('#ldmStatus').textContent), 'Trackpad mode: pad + "Connected · USB · Trackpad"');
  const pad = $q('#pad'), prr = pad.getBoundingClientRect(), c0 = { ...L.S.cur };
  pe(pad, 'pointerdown', prr.left + 80, prr.top + 80); for (let i = 1; i <= 5; i++) pe(pad, 'pointermove', prr.left + 80 + 10 * i, prr.top + 80); pe(pad, 'pointerup', prr.left + 130, prr.top + 80);
  ok(L.S.cur.x > c0.x + 20, 'pad moves the Mac pointer');
  L.setMode('display'); L.step(4);
  // 8f. WiFi: wrong code fails, Scan pairs with the QR in the Mac menu
  L.disconnect(''); $q('#app [data-a="conn:wifi"]').click(); $q('#app [data-a="dig:1:+"]').click();
  $q('#cbtn').click(); await sl(1300);
  ok(!L.S.connected && /No Mac with code 43/.test($q('#aHint').textContent), 'wrong WiFi code: ' + $q('#aHint').textContent.slice(0, 40));
  $q('#app [data-a="scan"]').click(); $q('#mbLd').click(); $q('#miQR').click(); await sl(2600);
  ok(L.S.connected && L.S.conn === 'wifi' && L.S.phoneCode === L.S.code, 'Scan pairs and connects over WiFi');

  // 9. In-page links scroll the website inside the Mac (handled in the page, no hash jump)
  const lk = $q('#macWins .s-links a[href="#faq"]');
  const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
  lk.dispatchEvent(ev);
  ok(ev.defaultPrevented && !location.hash, 'FAQ link scrolls inside the browser window');
  ok(__errs.length === 0, 'no JS errors ' + __errs.join('|'));
  finish();
})();
