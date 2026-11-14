(async () => { try {
  await sl(400);
  const L = window.__lp, w = $q('#pWorld');
  ok(L.ean13('4006381333931').includes('<rect'), 'ean13 draws');
  // wrong card at coffee
  $q('[data-card="gym"]').click(); await sl(30);
  ok(L.view() === 'card' && $q('#pGlare').classList.contains('bright'), 'open + brightness');
  L.scan(); ok(L.stop() === 0 && /not recognised/.test($q('#scScreen').textContent), 'wrong card rejected');
  $q('[data-act="close"]').click(); $q('[data-card="coffee"]').click(); await sl(30);
  // drag the phone by its grip onto the scanner
  const grip = $q('.lp-grip'), g = grip.getBoundingClientRect(), b = $q('#scGlass').getBoundingClientRect(), s = $q('#pScreen').getBoundingClientRect();
  const dx = (b.left + b.width / 2) - (s.left + s.width / 2), dy = (b.top + b.height / 2) - (s.top + s.height / 2);
  pe(grip, 'pointerdown', g.left + 5, g.top + 5);
  for (let i = 1; i <= 8; i++) { pe($q('#phone'), 'pointermove', g.left + 5 + dx * i / 8, g.top + 5 + dy * i / 8); await sl(10); }
  pe($q('#phone'), 'pointerup', g.left + 5 + dx, g.top + 5 + dy); await sl(30);
  ok(L.stop() === 1, 'drag onto scanner beeps (stop ' + L.stop() + ')');
  await sl(1400);
  for (const id of ['gym', 'groc', 'pharm', 'lib']) { $q('[data-act="close"]').click(); $q(`[data-card="${id}"]`).click(); L.scan(); await sl(1350); }
  ok(L.stop() === 5, 'route complete');
  const dots = document.querySelectorAll('#vCard [data-dot]'); dots[0].click(); await sl(20);
  $q('[data-act="enlarge"]').click(); ok(L.view() === 'big', 'enlarge'); $q('[data-act="unbig"]').click();
  $q('#vCard [data-act="close"]').click(); $q('[data-card="lib"]').click(); $q('[data-act="star"]').click(); $q('[data-act="close"]').click();
  ok(document.querySelectorAll('.lp-c')[2].dataset.card === 'lib' || [...document.querySelectorAll('.lp-c')].slice(0,3).some(c => c.dataset.card === 'lib'), 'starred floats up');
  $q('[data-act="add"]').click(); ok(!$q('#vSheet').hidden, 'paywall sheet');
  ok($q('#qCount').textContent === '7 / 7', 'quests ' + $q('#qCount').textContent);
  ok(document.documentElement.scrollWidth <= innerWidth, 'no h-scroll');
} catch (e) { ok(false, 'EXC ' + e.message); } finish(); })();
