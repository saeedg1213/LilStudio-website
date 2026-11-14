// Big Mac hero (shared by lilstats, lildock, lilhide, lilvibe, lilsnap, lildim): layout, guide and glow
(async () => {
  await sl(1200);
  const hero = $q('.hero.big'), mac = $q('#mac'), G = window.__guide;
  ok(!!hero && !!G, 'big hero + guide handle');
  const m = mac.getBoundingClientRect();
  ok(m.width / innerWidth > 0.6, 'the Mac is big (' + Math.round(m.width / innerWidth * 100) + '% wide)');
  ok(m.right + m.width * 0.03 <= innerWidth + 1 && m.left >= 0, 'the Mac fits the window');
  ok(hero.classList.contains('side') === (innerWidth / innerHeight >= 1.42 && innerWidth >= 1000), 'layout follows the window shape');
  const first = [...document.querySelectorAll('#quests .quest')].find(li => !li.classList.contains('done'));
  ok(first && $q('#gTitle').textContent === first.querySelector('b').textContent, 'guide shows the first quest: ' + $q('#gTitle').textContent);
  await sl(300);
  const glow = $q('#mkGlow');
  ok(glow.classList.contains('on'), 'glow is on');
  const gr = glow.getBoundingClientRect(), cx = gr.left + gr.width / 2, cy = gr.top + gr.height / 2;
  const under = document.elementsFromPoint(cx, cy).filter(el => el !== glow && !glow.contains(el))[0];
  ok(under && !under.matches('body, html, section'), 'glow sits on something real: ' + (under && (under.id || under.className || under.tagName)).toString().slice(0, 40));
  const t0 = $q('#gTitle').textContent;
  $q('#gSkip').click(); await sl(80);
  ok($q('#gTitle').textContent !== t0, 'Skip moves to the next step');
  // finishing a step moves the guide on
  const cur = G.cur, li = $q(`#quests .quest[data-q="${cur}"]`);
  li.classList.add('done'); await sl(80);
  ok(G.cur !== cur, 'a done step is passed over');
  li.classList.remove('done');
  ok(__errs.length === 0, 'no JS errors ' + __errs.join('|'));
  finish();
})();
