(async () => { try {
  await sl(500);
  const L = window.__lu, item = $q('#luItem');
  pe(item, 'pointerdown'); await sl(50);
  ok(!$q('#luPop').hidden && !!$q('#luStart'), 'intro shown');
  $q('#luStart').click(); await sl(50);
  ok(!$q('#kc').hidden, 'keychain prompt');
  $q('#kc [data-kc="always"]').click(); await sl(900);
  ok(L.S().access === 'always' && L.S().fetchedAt > 0, 'connected');
  ok($q('#luMeter').style.getPropertyValue('--f') !== '', 'meter fill set');
  const s0 = L.S().session;
  $q('#luSugg [data-t="0"]').click(); while (L.busy()) await sl(50); await sl(200);
  ok(L.S().session > s0, 'work fills session ' + s0.toFixed(0) + '→' + L.S().session.toFixed(0));
  pe(item, 'pointerdown'); await sl(50);
  ok(document.querySelectorAll('.lu-row').length === 4, 'four rows');
  ok(/Resets in/.test($q('.lu-reset').textContent), 'countdown');
  pe($q('#luDots'), 'pointerdown'); await sl(30);
  $q('#luMenu .mk-mi').click(); await sl(30);
  ok(L.S().showPercent && $q('#luLbl').textContent !== '', 'percent shown ' + $q('#luLbl').textContent);
  for (let i = 0; i < 6 && L.S().session < 100; i++) { $q('#luSugg [data-t="big"]').click(); while (L.busy()) await sl(30); }
  $q('#luSugg [data-t="1"]').click(); await sl(50);
  ok(L.S().session >= 100 && /limit reached/.test($q('#luOut').textContent), 'limit reached');
  for (let i = 0; i < 6; i++) { $q('[data-do="skip"]').click(); await sl(350); }
  ok(L.S().session === 0, 'reset after hours');
  $q('[data-do="expire"]').click(); await sl(500);
  ok($q('#luLbl').textContent === 'Sign in', 'sign in shown');
  const inp = $q('#luIn'); inp.value = '/login'; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await sl(1500);
  ok(L.S().loggedIn && $q('#luLbl').textContent !== 'Sign in', 'logged back in');
  ok($q('#qCount').textContent === '7 / 7', 'quests ' + $q('#qCount').textContent);
  pe(item, 'pointerdown'); await sl(30); $q('#luQuit').click(); await sl(30);
  ok(item.hidden && !$q('[data-do="relaunch"]').hidden, 'quit');
  ok(document.documentElement.scrollWidth <= innerWidth, 'no h-scroll');
  $q('#qReset').click(); await sl(100);
  $q('[data-show="connect"]').click(); await sl(4000);
  ok(L.S().access === 'always', 'show me connect');
} catch (e) { ok(false, 'EXC ' + e.message); } finish(); })();
