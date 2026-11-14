(async () => { try {
  await sl(500);
  const L = window.__lq;
  $q('#pickMac').click(); $q('#signIn').click(); await sl(30);
  ok(L.connected() && !$q('#ssInd').hidden, 'connected');
  const s = $q('#surface'), r = s.getBoundingClientRect(), x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
  const c0 = { ...L.cur() };
  pe(s, 'pointerdown', x0, y0); for (let i = 1; i <= 8; i++) { pe(s, 'pointermove', x0 + i * 6, y0 + i * 4); await sl(10); } pe(s, 'pointerup', x0 + 48, y0 + 32);
  ok(L.cur().x > c0.x + 20 && L.cur().y > c0.y + 10, 'pointer moves ' + Math.round(L.cur().x - c0.x));
  // glide to the music dock icon and tap
  const d = L.M.box(L.M.dockEl.querySelector('[data-dk="music"]'));
  L.moveBy(d.x + d.w / 2 - L.cur().x, d.y + d.h / 2 - L.cur().y);
  pe(s, 'pointerdown', x0, y0); pe(s, 'pointerup', x0, y0); await sl(400);
  ok(L.space() === 1, 'tap clicked Music (space ' + L.space() + ')');
  // two-finger tap
  pe(s, 'pointerdown', x0, y0, { pointerId: 1 }); pe(s, 'pointerdown', x0 + 30, y0, { pointerId: 2 }); pe(s, 'pointerup', x0, y0, { pointerId: 1 }); pe(s, 'pointerup', x0 + 30, y0, { pointerId: 2 }); await sl(30);
  ok(!!$q('.mk-ui > .mk-menu'), 'two-finger tap right-clicks');
  // three-finger swipe up
  [1, 2, 3].forEach(i => pe(s, 'pointerdown', x0 + i * 20, y0, { pointerId: i }));
  for (let k = 1; k <= 6; k++) [1, 2, 3].forEach(i => pe(s, 'pointermove', x0 + i * 20, y0 - k * 20, { pointerId: i }));
  [1, 2, 3].forEach(i => pe(s, 'pointerup', x0 + i * 20, y0 - 120, { pointerId: i })); await sl(30);
  ok(L.Q.has('mc'), 'mission control');
  pe(s, 'pointerdown', x0, y0); pe(s, 'pointerup', x0, y0); await sl(20);
  s.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true }));
  ok(L.Q.has('scroll'), 'wheel scrolls');
  const lk = $q('#padLock'); lk.dispatchEvent(new PointerEvent('pointerdown')); ok(L.locked(), 'locked');
  lk.dispatchEvent(new PointerEvent('pointerdown')); await sl(900); ok(!L.locked(), 'hold unlocks');
  ok($q('#qCount').textContent === '7 / 7', 'quests ' + $q('#qCount').textContent);
  ok(document.documentElement.scrollWidth <= innerWidth, 'no h-scroll');
} catch (e) { ok(false, 'EXC ' + e.message); } finish(); })();
