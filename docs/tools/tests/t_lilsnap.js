(async () => { try {
  await sl(500);
  const S = window.__sn, kd = (code, o) => document.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, key: code, ctrlKey: true, altKey: true, bubbles: true, cancelable: true }, o || {})));
  const ku = code => document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
  document.querySelector('#stage').scrollIntoView({ block: 'center' }); await sl(100);
  const w = S.front();
  kd('ArrowLeft'); ku('ArrowLeft'); await sl(30);
  ok(S.memory.get(w.id).act === 'left' && Math.abs(w.x - 8) < 1, 'left half x=' + w.x);
  kd('ArrowLeft'); ku('ArrowLeft');
  ok(S.memory.get(w.id).step === 1, 'cycles to 2/3');
  kd('ArrowRight'); kd('ArrowUp'); ku('ArrowRight'); ku('ArrowUp');
  ok(S.memory.get(w.id).act === 'tr', 'chord quarter');
  kd('Backspace');
  ok(!S.memory.get(w.id).act, 'restore');
  kd('Digit3', { metaKey: true });
  ok([...S.memory.values()].filter(m => m.act === 'tile').length === 3, 'tile 3');
  // drag a window to the left edge
  const t = S.M.wins.get('terminal'); S.M.focusWin('terminal');
  const bar = document.querySelector('[data-win="terminal"] .mk-bar');
  const sr = document.querySelector('#macScreen').getBoundingClientRect(), br = bar.getBoundingClientRect();
  const x0 = br.left + br.width / 2, y0 = br.top + br.height / 2;
  pe(bar, 'pointerdown', x0, y0);
  for (let i = 1; i <= 10; i++) { const x = x0 + (sr.left + 2 - x0) * i / 10, y = y0 + (sr.top + sr.height * 0.5 - y0) * i / 10; pe(document.querySelector('#macScreen'), 'pointermove', x, y); pe(bar, 'pointermove', x, y); await sl(10); }
  ok(document.querySelector('#snPreview').classList.contains('show'), 'preview while dragging');
  pe(bar, 'pointerup', sr.left + 2, sr.top + sr.height * 0.5); await sl(30);
  ok(S.memory.get('terminal').act === 'left', 'drag snapped left: ' + S.memory.get('terminal').act);
  pe(document.querySelector('#snItem'), 'pointerdown'); await sl(30);
  ok(!document.querySelector('#snPop').hidden && document.querySelectorAll('.sn-t').length === 15, 'menu tiles');
  document.querySelector('.sn-t[data-a="t2"]').click(); await sl(30);
  ok(S.memory.get(S.front().id).act === 't2', 'menu tile snaps');
  ok(document.documentElement.scrollWidth <= innerWidth, 'no h-scroll');
  document.querySelector('[data-show="snapbar"]').click(); await sl(3500);
  ok(S.Q.has('snapbar'), 'show me snap bar');
  ok(document.querySelector('#qCount').textContent.startsWith('7') || document.querySelector('#qCount').textContent.startsWith('8'), 'quests ' + document.querySelector('#qCount').textContent);
} catch (e) { ok(false, 'EXC ' + e.message); } finish(); })();
