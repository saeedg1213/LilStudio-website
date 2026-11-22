(async () => { try {
  await sl(500);
  const L = window.__lc, note = $q('#note');
  const kd = (code, o) => note.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, key: code, bubbles: true, cancelable: true }, o || {})));
  const ku = code => note.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
  document.querySelector('#stage').scrollIntoView({ block: 'center' }); await sl(100);
  // Dynamics: a pause lands hard, a roll lands light (Dynamics.swift)
  const a = L.press(0, 10000), b = L.press(1, 10040), c = L.press(2, 10250);
  ok(a > c && c > b, `dynamics ${a.toFixed(2)} > ${c.toFixed(2)} > ${b.toFixed(2)}`);
  ok(L.pickLayer(0, 3, 0) === 0 && L.pickLayer(0.5, 3, 0) === 1 && L.pickLayer(1, 3, 1) === 2, 'layers');
  ok(L.pickTake(4, 12, 1, 0) === L.pickTake(4, 12, 0.9, 3), 'per-key take');
  // Typing counts keys and fills the meter
  note.focus(); kd('KeyH'); ku('KeyH'); kd('KeyI'); ku('KeyI'); await sl(30);
  ok($q('#mKey').textContent === 'I' && /keys today/.test($q('#pToday').textContent), 'typing meter ' + $q('#mKey').textContent);
  ok(L.Q.has('type'), 'type quest');
  // Popover: open, switch board, options
  pe($q('#lcItem'), 'pointerdown'); await sl(30);
  ok(!$q('#lcPop').hidden && document.querySelectorAll('.lc-card').length === 3, 'popover with 3 boards');
  $q('.lc-card[data-board="crisp"]').click(); await sl(30);
  ok(L.SET().board === 'crisp' && $q('.board[data-b="crisp"]').classList.contains('on'), 'board switch syncs the section');
  $q('#pOptH').click(); ok(!$q('#pOpts').hidden, 'options open');
  // Right-click toggles, ⌃⌥K toggles back
  pe($q('#lcItem'), 'pointerdown', null, null, { button: 2 }); await sl(30);
  ok(!L.SET().enabled && $q('#lcItem').classList.contains('off'), 'right-click turns off');
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK', key: 'k', ctrlKey: true, altKey: true, bubbles: true }));
  ok(L.SET().enabled, '⌃⌥K turns on');
  // A call pauses it
  L.setCall(true); await sl(30);
  ok($q('#pState').textContent === 'Paused, mic in use' && !$q('#micDot').hidden, 'call pauses');
  L.setCall(false);
  ok($q('#pState').textContent === 'On', 'call ends');
} catch (e) { ok(false, 'threw ' + e.message); } finish(); })();
