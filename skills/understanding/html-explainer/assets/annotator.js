/* explainer-review annotator — v0.1
 * Drop next to an explainer HTML and include with:
 *   <script src="annotator.js"></script>
 * Click a block to comment it; select text first for a precise quote.
 * "Copy feedback" exports a compact `review v1` block for pasting into an AI chat.
 */
(() => {
  'use strict';
  if (window.__erLoaded) return;
  window.__erLoaded = true;

  const SEL = 'h1,h2,h3,h4,h5,h6,p,li,figcaption,td';
  const QUOTE_MAX = 120;
  const FILE = decodeURIComponent(location.pathname.split('/').pop() || 'document.html');
  const KEY = 'explainer-review:' + location.pathname;

  const norm = s => s.normalize('NFC').replace(/\s+/g, ' ').trim();
  const esc = s => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // Refs are assigned over the original document, before any UI is injected.
  const blocks = Array.from(document.querySelectorAll(SEL));
  const refOf = new Map();
  const elOf = new Map();
  blocks.forEach((el, i) => {
    const ref = 'b' + (i + 1);
    refOf.set(el, ref);
    elOf.set(ref, el);
  });

  let comments = [];
  try { comments = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { /* fresh start */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(comments)); } catch (e) {} };

  // ---------- UI ----------
  const style = document.createElement('style');
  style.textContent = `
    .er-hover { outline: 2px dashed #f59e0b; outline-offset: 2px; cursor: pointer; }
    .er-commented { box-shadow: inset 4px 0 0 #f59e0b; background: rgba(245,158,11,.08); position: relative; }
    .er-commented::after { content: attr(data-er-count); position: absolute; top: 2px; right: 4px;
      font: bold 11px/1.6 system-ui; color: #92400e; background: #fde68a; border-radius: 8px;
      padding: 0 6px; pointer-events: none; }
    #er-ui, #er-ui * { box-sizing: border-box; font: 13px/1.4 system-ui, sans-serif; color: #1f2937; }
    #er-bar { position: fixed; right: 16px; bottom: 16px; z-index: 99999; display: flex; gap: 8px; }
    #er-bar button, #er-pop button { border: 1px solid #d1d5db; border-radius: 6px; background: #fff;
      padding: 6px 12px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
    #er-bar button:hover, #er-pop button:hover { background: #f3f4f6; }
    #er-copy { font-weight: 600; }
    #er-pop { position: absolute; z-index: 99999; width: 320px; background: #fff; border: 1px solid #d1d5db;
      border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.2); padding: 10px; }
    #er-pop header { font-weight: 600; margin-bottom: 6px; color: #92400e; }
    #er-pop .er-quote { color: #6b7280; font-style: italic; margin-bottom: 6px; max-height: 3.2em; overflow: hidden; }
    #er-pop ul { list-style: none; margin: 0 0 6px; padding: 0; }
    #er-pop li { display: flex; gap: 6px; align-items: baseline; padding: 2px 0; }
    #er-pop li span { flex: 1; }
    #er-pop li b { cursor: pointer; color: #b91c1c; }
    #er-pop textarea { width: 100%; height: 56px; margin-bottom: 6px; border: 1px solid #d1d5db;
      border-radius: 6px; padding: 6px; resize: vertical; }
    #er-toast { position: fixed; right: 16px; bottom: 60px; z-index: 99999; background: #111827; color: #fff;
      padding: 8px 14px; border-radius: 6px; font: 13px system-ui; opacity: 0; transition: opacity .2s; }
  `;
  document.head.appendChild(style);

  const ui = document.createElement('div');
  ui.id = 'er-ui';
  ui.innerHTML = `
    <div id="er-bar">
      <button id="er-copy">📋 Copy feedback (0)</button>
      <button id="er-clear" title="Delete all comments">✕</button>
    </div>
    <div id="er-toast"></div>
  `;
  document.body.appendChild(ui);

  const bar = ui.querySelector('#er-copy');
  const toast = ui.querySelector('#er-toast');
  let pop = null;
  let current = null; // { el, ref, quote }

  function showToast(msg) {
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 1600);
  }

  function refresh() {
    bar.textContent = `📋 Copy feedback (${comments.length})`;
    document.querySelectorAll('.er-commented').forEach(el => {
      el.classList.remove('er-commented');
      el.removeAttribute('data-er-count');
    });
    const counts = {};
    comments.forEach(c => { counts[c.ref] = (counts[c.ref] || 0) + 1; });
    for (const [ref, n] of Object.entries(counts)) {
      const el = elOf.get(ref);
      if (el) { el.classList.add('er-commented'); el.setAttribute('data-er-count', n); }
    }
  }

  function closePop() {
    if (pop) { pop.remove(); pop = null; current = null; }
  }

  function openPop(el) {
    closePop();
    const ref = refOf.get(el);
    let quote = norm(el.textContent).slice(0, QUOTE_MAX);
    const s = getSelection();
    if (s && !s.isCollapsed && el.contains(s.anchorNode)) {
      const t = norm(s.toString());
      if (t) quote = t.slice(0, QUOTE_MAX);
    }
    current = { el, ref, quote };

    pop = document.createElement('div');
    pop.id = 'er-pop';
    const existing = comments
      .map((c, i) => ({ c, i }))
      .filter(x => x.c.ref === ref);
    pop.innerHTML = `
      <header>${ref} · ${el.tagName.toLowerCase()}</header>
      <div class="er-quote">“${quote}”</div>
      <ul>${existing.map(x =>
        `<li data-i="${x.i}"><span>${x.c.comment.replace(/</g, '&lt;')}</span><b title="delete">×</b></li>`
      ).join('')}</ul>
      <textarea placeholder="Comment or question… (Enter to add)"></textarea>
      <button class="er-add">Add</button>
      <button class="er-close">Close</button>
    `;
    ui.appendChild(pop);

    const r = el.getBoundingClientRect();
    const top = r.bottom + window.scrollY + 6;
    const left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - 336));
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';

    const ta = pop.querySelector('textarea');
    ta.focus();

    const add = () => {
      const text = norm(ta.value);
      if (!text) return;
      comments.push({ ref, tag: el.tagName.toLowerCase(), quote: current.quote, comment: text });
      save();
      refresh();
      openPop(el); // re-render list, keep annotating
    };
    pop.querySelector('.er-add').addEventListener('click', add);
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); }
    });
    pop.querySelector('.er-close').addEventListener('click', closePop);
    pop.querySelectorAll('li b').forEach(b => b.addEventListener('click', e => {
      const i = Number(e.target.parentElement.dataset.i);
      comments.splice(i, 1);
      save();
      refresh();
      openPop(el);
    }));
  }

  // ---------- interactions ----------
  let hovered = null;
  document.addEventListener('mouseover', e => {
    if (e.target.closest('#er-ui')) return;
    const el = e.target.closest(SEL);
    if (hovered && hovered !== el) { hovered.classList.remove('er-hover'); hovered = null; }
    if (el && refOf.has(el)) { el.classList.add('er-hover'); hovered = el; }
  });
  document.addEventListener('mouseout', () => {
    if (hovered) { hovered.classList.remove('er-hover'); hovered = null; }
  });

  document.addEventListener('click', e => {
    if (e.target.closest('#er-ui')) return;
    if (e.target.closest('a,button,input,textarea,select,label,summary,audio,video')) return;
    const el = e.target.closest(SEL);
    if (el && refOf.has(el)) { openPop(el); }
    else closePop();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePop();
  });

  // ---------- export ----------
  function exportText() {
    const lines = ['review v1 · ' + FILE];
    for (const c of comments) lines.push(`${c.ref} ${c.tag} "${esc(c.quote)}" → ${c.comment}`);
    return lines.join('\n');
  }

  bar.addEventListener('click', async () => {
    if (!comments.length) { showToast('No comments yet — click a block to add one'); return; }
    const text = exportText();
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${comments.length} comment${comments.length > 1 ? 's' : ''} — paste into the chat`);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Copied (fallback)');
    }
  });

  ui.querySelector('#er-clear').addEventListener('click', () => {
    if (!comments.length) return;
    if (!confirm(`Delete all ${comments.length} comments?`)) return;
    comments = [];
    save();
    refresh();
    closePop();
  });

  refresh();
})();
