(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const log = [];
 try {
  await sl(2500);
  const root = document.querySelector('.lsw'), H = innerHeight;
  const hitAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && root.contains(el) ? el : null; };
  log.push('peek ' + root.classList.contains('peek'));
  // find visible watch pixels: scan the bottom-right region for elements of the watch (not the button)
  const btn = root.getBoundingClientRect(); let spot = null, hits = 0;
  for (let y = H - 2; y > H - 300; y -= 6) for (let x = innerWidth - 300; x < btn.left - 4; x += 6) { const el = hitAt(x, y); if (el && !el.closest('.lsw-trigger')) { hits++; if (!spot || y < spot.y) spot = { x, y, el }; } }
  log.push('watch pixels ' + hits + ' topmost y ' + (spot && Math.round(H - spot.y)) + 'px above bottom (' + (spot && spot.el.className) + ')');
  // hover the topmost visible bit (the strap) -> reveals
  spot.el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse', clientX: spot.x, clientY: spot.y }));
  await sl(600); log.push('hover strap reveals ' + !root.classList.contains('peek'));
  const c = document.querySelector('.lsw-case').getBoundingClientRect(); log.push('case fully on screen ' + (c.bottom <= H && c.top > 0) + ' (' + Math.round(c.top) + '-' + Math.round(c.bottom) + ')');
  root.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  await sl(200); log.push('waits ' + !root.classList.contains('peek')); await sl(400); log.push('sinks ' + root.classList.contains('peek'));
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: innerWidth - 120, clientY: H - 2, pointerType: 'mouse' }));
  await sl(100); log.push('bottom edge reveals ' + !root.classList.contains('peek'));
 } catch (e) { log.push('ERR ' + e.message); }
 document.title = log.join(' | ');
})();
