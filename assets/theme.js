/* LilStudio light/dark theme for subpages (privacy, support).
 * Same storage key ("theme") and default ("light") as every app page, so the
 * visitor's choice follows them across the whole site. Load in <head> (no
 * defer) so the right theme is set before the page paints. */
(function () {
    var saved = 'light';
    try { saved = localStorage.getItem('theme') || 'light'; } catch (e) { /* private mode */ }
    document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme() {
    var html = document.documentElement;
    var next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
}
