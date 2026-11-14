        const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const store = {
            get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
            set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
        };
        const wait = ms => new Promise(r => setTimeout(r, REDUCED ? Math.min(ms, 60) : ms));
        const $ = (s, r = document) => r.querySelector(s);
        const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

        // ---------- Scroll reveals ----------
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
        }, { threshold: 0.12 });
        $$('.fade-in, .scale-in').forEach(el => io.observe(el));
