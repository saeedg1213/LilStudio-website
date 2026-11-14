(async () => { try {
  await sl(500);
  const L = window.__lm, item = $q('#lmItem');
  for (let i = 0; i < 3; i++) { pe(item, 'pointerdown'); await sl(30); ok(!$q('#lmPop').hidden && !$q('#lmInd').hidden && $q('.mk-cam').classList.contains('on'), 'open ' + i + ' ' + $q('#lmComp').textContent); pe($q('#macScreen'), 'pointerdown'); await sl(30); }
  ok($q('#lmInd').hidden && !$q('.mk-cam').classList.contains('on'), 'camera off on close');
  pe(item, 'pointerdown', null, null, { button: 2 }); await sl(30);
  const sub = [...document.querySelectorAll('.mk-ui > .mk-menu .mk-sub .mk-mi')]; sub[1].click(); await sl(20);
  ok(L.P.camera === 'iphone', 'iphone camera');
  pe(item, 'pointerdown', null, null, { button: 2 }); await sl(30);
  [...document.querySelectorAll('.mk-ui > .mk-menu > .mk-mi')].find(m => m.textContent.includes('Compliments')).click();
  ok(!L.P.compliments, 'compliments off');
  pe(item, 'pointerdown'); await sl(30); ok($q('#lmComp').hidden, 'no compliment shown');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sl(20);
  ok($q('#lmPop').hidden, 'esc closes');
  $q('#lmJoin').click();
  ok($q('#qCount').textContent === '6 / 6', 'quests ' + $q('#qCount').textContent);
  ok(document.documentElement.scrollWidth <= innerWidth, 'no h-scroll');
} catch (e) { ok(false, 'EXC ' + e.message); } finish(); })();
