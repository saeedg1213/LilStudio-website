(async () => { try {
  await sl(500);
  const L = window.__lb, c = $q('#playfield'), r = c.getBoundingClientRect();
  ok(L.balls().length === 12, 'twelve balls ' + L.balls().length);
  const b = L.balls()[0]; const x = r.left + b.x, y = r.top + b.y;
  pe(c, 'pointerdown', x, y); pe(c, 'pointerup', x, y);
  ok(L.Q.has('kick'), 'tap kicks');
  // pick one up and push it into the island
  const I = L.islandBox();
  for (let k = 0; k < 3; k++) {
    const t = L.balls()[0];
    pe(c, 'pointerdown', r.left + t.x, r.top + t.y);
    pe(c, 'pointermove', r.left + I.cx, r.top + I.cy);
    for (let i = 0; i < 30; i++) L.step(1 / 120);
    pe(c, 'pointerup', r.left + I.cx, r.top + I.cy);
    for (let i = 0; i < 60; i++) L.step(1 / 120);
  }
  ok(L.balls().length === 9, 'three eaten, left ' + L.balls().length);
  $q('#play-shake').click(); $q('#play-drop').click();
  ok(L.balls().length === 12, 'drop brings them back');
  ok(L.Q.has('feed') && L.Q.has('three') && L.Q.has('drop') && L.Q.has('shake'), 'quests ' + $q('#qCount').textContent);
  ok(document.documentElement.scrollWidth <= innerWidth, 'no h-scroll');
} catch (e) { ok(false, 'EXC ' + e.message); } finish(); })();
