const T = { log: [], fails: 0 };
const ok = (c, m) => { T.log.push((c ? 'ok ' : 'FAIL ') + m); if (!c) T.fails++; };
const sl = ms => new Promise(r => setTimeout(r, ms));
function pe(el, type, x, y, extra) {
  const r = el.getBoundingClientRect();
  if (x == null) { x = r.left + r.width / 2; y = r.top + r.height / 2; }
  el.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1 }, extra || {})));
}
function tap(el) { pe(el, 'pointerdown'); pe(el, 'pointerup'); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
async function drag(el, dx, dy) {
  const r = el.getBoundingClientRect(), x = r.left + 30, y = r.top + r.height / 2;
  pe(el, 'pointerdown', x, y);
  for (let i = 1; i <= 5; i++) { pe(el, 'pointermove', x + dx * i / 5, y + dy * i / 5); await sl(16); }
  pe(el, 'pointerup', x + dx, y + dy);
}
function finish() { document.title = (T.fails ? 'FAIL ' : 'PASS ') + T.log.join(' | '); }
const $q = (s) => document.querySelector(s);
window.addEventListener('error', e => { T.log.push('JSERR ' + e.message); T.fails++; });
