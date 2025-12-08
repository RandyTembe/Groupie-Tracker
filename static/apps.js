// app.js - simple handler to open a modal with artist details
document.addEventListener('DOMContentLoaded', function () {
  // small helper used by multiple modal renderers
  function escapeHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function openModal(data) {
    const backdrop = document.getElementById('detailBackdrop');
    const title = document.getElementById('detailTitle');
    const body = document.getElementById('detailBody');
    title.textContent = data.Name || 'Détails';
    // Build full details (show all available fields returned by the API)
    const imgHtml = data.Image ? `<div style="text-align:center;margin-bottom:12px"><img src="${data.Image}" alt="${data.Name || ''}" style="max-width:220px;height:auto;border-radius:8px;display:block;margin:0 auto;"/></div>` : '';
    const membersHtml = (data.Members && data.Members.length) ? `<ul>${data.Members.map(m => `<li>${m}</li>`).join('')}</ul>` : '<em>Aucun membre listé</em>';
    // helper to turn comma/semicolon separated strings into lists
    function splitToList(s, allowUrlFetch = true) {
      if (!s) return '<em>—</em>';
      const parts = s.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
      if (!parts.length) return `<div>${escapeHtml(s)}</div>`;
      return `<ul>${parts.map(p => {
        // optionally render http(s) parts as placeholders to be fetched
        if (allowUrlFetch && /^https?:\/\//i.test(p)) return `<li><div data-url="${escapeHtml(p)}">Chargement…</div></li>`;
        return `<li>${escapeHtml(p)}</li>`;
      }).join('')}</ul>`;
    }
    

    // helper to read either lowercase JSON keys or capitalized (robust)
    function getField(key) {
      return data[key] ?? data[key.charAt(0).toUpperCase() + key.slice(1)];
    }

    // Dynamically render all fields provided by the API
    const preferred = ['name', 'id', 'image', 'creationDate', 'firstAlbum', 'locations', 'concertDates', 'relations', 'members'];
    const parts = [];

    // raw JSON details with copy button
    parts.push(`
      <details id="rawJsonDetails">
        <summary>Voir JSON brut</summary>
        <div style="display:flex;gap:8px;align-items:center;margin:8px 0">
    
        </div>
        <pre id="rawJsonPre" style="white-space:pre-wrap;max-height:240px;overflow:auto;background:#f7f7f7;border-radius:6px;padding:8px">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      </details>
    `);

    // show image prominently if present
    if (getField('image')) {
      parts.push(`<div style="text-align:center;margin-bottom:12px"><img src="${getField('image')}" alt="${escapeHtml(getField('name')||'')}" style="max-width:260px;height:auto;border-radius:8px;display:block;margin:0 auto;"/></div>`);
    }

    // render preferred fields in order
    preferred.forEach(key => {
      const val = getField(key);
      if (val == null || key === 'image') return; // image already handled
      if (key === 'members') {
        const membersList = (val && Array.isArray(val)) ? `<ul>${val.map(m => `<li>${escapeHtml(m)}</li>`).join('')}</ul>` : (val ? `<div>${escapeHtml(val)}</div>` : '<em>—</em>');
        parts.push(`<p><strong>Membres:</strong></p>${membersList}`);
        return;
      }
      if (key === 'locations' || key === 'concertDates' || key === 'relations') {
        // do not auto-fetch URLs for `locations` (keep them as plain text)
        const allowFetch = key !== 'locations';
        parts.push(`<p><strong>${escapeHtml(key)}:</strong></p>${splitToList(val, allowFetch)}`);
        return;
      }
      parts.push(`<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(val))}</p>`);
    });

    // any other keys
    const shown = new Set(preferred.map(k => k.toLowerCase()));
    const others = Object.keys(data).filter(k => !shown.has(k.toLowerCase()));
    if (others.length) {
      parts.push('<hr><h3>Autres champs</h3>');
      others.forEach(k => {
        const v = data[k];
        // avoid treating URLs in `locations` as fetchable placeholders
        if (typeof v === 'string' && /^https?:\/\//i.test(v) && k.toLowerCase() !== 'locations') {
          parts.push(`<p><strong>${escapeHtml(k)}:</strong> <div data-url="${escapeHtml(v)}">Chargement…</div></p>`);
        } else if (typeof v === 'string' && /[,;]+/.test(v)) {
          // maybe a comma-separated list with URLs inside; do not fetch for `locations`
          const allowFetch = k.toLowerCase() !== 'locations';
          parts.push(`<p><strong>${escapeHtml(k)}:</strong> ${splitToList(v, allowFetch)}</p>`);
        } else {
          parts.push(`<p><strong>${escapeHtml(k)}:</strong> <span>${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</span></p>`);
        }
      });
    }

    // collect all numeric IDs found in the object (artist id + ids in urls or nested objects)
    const idsFound = [];
    function addIdEntry(name, idValue, url) {
      if (idValue == null) return;
      const idStr = String(idValue);
      if (!idsFound.some(e => e.id === idStr && e.name === name)) idsFound.push({ name, id: idStr, url });
    }
    // artist id
    addIdEntry('artist', getField('id'));
    // scan fields for urls with trailing number or numeric tokens
    Object.keys(data).forEach(k => {
      // do not extract IDs from the `locations` field (avoid treating location strings as URLs)
      if (k.toLowerCase() === 'locations') return;
      const v = data[k];
      if (!v) return;
      if (typeof v === 'string') {
        // try to extract last number in URL-like strings
        const m = v.match(/\/(\d+)\b/);
        if (m) addIdEntry(k, m[1], v);
        else {
          // also capture plain numeric strings
          const m2 = v.match(/^(\d+)$/);
          if (m2) addIdEntry(k, m2[1]);
        }
      } else if (Array.isArray(v)) {
        v.forEach(item => {
          if (item && typeof item === 'object' && item.id) addIdEntry(k, item.id);
          if (typeof item === 'string') {
            const m = item.match(/\/(\d+)\b/);
            if (m) addIdEntry(k, m[1]);
            const m2 = item.match(/^(\d+)$/);
            if (m2) addIdEntry(k, m2[1]);
          }
        });
      } else if (typeof v === 'object' && v.id) {
        addIdEntry(k, v.id);
      }
    });

    if (idsFound.length) {
      parts.push('<hr><h3>Tous les IDs trouvés</h3>');
      parts.push('<ul>');
      idsFound.forEach(e => {
        if (e.url) parts.push(`<li><strong>${escapeHtml(e.name)}:</strong> <a href="${escapeHtml(e.url)}" target="_blank">${escapeHtml(e.id)}</a></li>`);
        else parts.push(`<li><strong>${escapeHtml(e.name)}:</strong> ${escapeHtml(e.id)}</li>`);
      });
      parts.push('</ul>');
    }

    body.innerHTML = parts.join('\n');
    backdrop.classList.add('open');

    // After rendering, replace URL placeholders with fetched content when possible
    setTimeout(() => {
      const urlEls = Array.from(document.querySelectorAll('[data-url]'));
      urlEls.forEach(async el => {
        const url = el.getAttribute('data-url');
        if (!url) return;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error('fetch failed');
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const json = await res.json();
            if (Array.isArray(json)) {
              el.innerHTML = '<ul>' + json.map(i => `<li>${escapeHtml(typeof i === 'object' ? JSON.stringify(i) : String(i))}</li>`).join('') + '</ul>';
            } else if (typeof json === 'object') {
              // try to render useful fields if present
              if (json.locations || json.dates || json.relation) {
                const fields = [];
                if (json.locations) fields.push('<strong>Locations:</strong> ' + escapeHtml(JSON.stringify(json.locations)));
                if (json.dates) fields.push('<strong>Dates:</strong> ' + escapeHtml(JSON.stringify(json.dates)));
                if (json.relation) fields.push('<strong>Relation:</strong> ' + escapeHtml(JSON.stringify(json.relation)));
                el.innerHTML = fields.map(f => `<p>${f}</p>`).join('');
              } else {
                el.innerHTML = '<pre style="white-space:pre-wrap">' + escapeHtml(JSON.stringify(json, null, 2)) + '</pre>';
              }
            } else {
              el.textContent = String(json);
            }
          } else {
            const text = await res.text();
            // if text contains JSON-looking content, try to parse
            try {
              const parsed = JSON.parse(text);
              el.innerHTML = '<pre style="white-space:pre-wrap">' + escapeHtml(JSON.stringify(parsed, null, 2)) + '</pre>';
            } catch (_e) {
              // otherwise, show the text trimmed
              el.textContent = text.length > 1000 ? text.slice(0, 1000) + '...' : text;
            }
          }
        } catch (err) {
          // can't fetch (CORS or network) — show the URL as a link
          el.innerHTML = `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a>`;
        }
      });
    }, 50);
  }

  function closeModal() {
    document.getElementById('detailBackdrop').classList.remove('open');
  }

  // open modal showing raw JSON and copy button
  function openJsonModal(data) {
    const backdrop = document.getElementById('detailBackdrop');
    const title = document.getElementById('detailTitle');
    const body = document.getElementById('detailBody');
    title.textContent = data.Name || data.name || 'Détails (JSON)';
    const preHtml = `<pre id="rawJsonPre" style="white-space:pre-wrap;max-height:480px;overflow:auto;background:#f7f7f7;border-radius:6px;padding:8px">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    body.innerHTML = preHtml;
    backdrop.classList.add('open');
  }

  document.body.addEventListener('click', function (ev) {
    // Ignore clicks that originated on the diamond; they are handled separately
    if (ev.target.closest('.diamond')) return;
    const card = ev.target.closest('.note-card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    if (!id) return;
    // navigate to the artist detail page
    window.location.href = `/artists/${encodeURIComponent(id)}`;
  });

  // Dedicated left-click handler for the icon (.diamond)
  document.body.addEventListener('click', function (ev) {
    const diamond = ev.target.closest('.diamond');
    if (!diamond) return;
    // only respond to primary (left) mouse button
    if (ev.button !== 0) return;
    ev.stopPropagation(); // prevent the card-level handler from also firing
    const card = diamond.closest('.note-card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    if (!id) return;
    // navigate to the artist detail page when clicking the icon
    window.location.href = `/artists/${encodeURIComponent(id)}`;
  });

  // keyboard activation (Enter / Space) when a .note-card is focused
  document.body.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const active = document.activeElement;
      const card = active && (active.classList && active.classList.contains('note-card') ? active : active.closest && active.closest('.note-card'));
      if (!card) return;
      e.preventDefault();
      const id = card.getAttribute('data-id');
      if (!id) return;
      // open artist page on keyboard activation as well
      window.location.href = `/artists/${encodeURIComponent(id)}`;
    }
  });

  // render JSON into the card (toggle)
  function renderJsonInCard(card, data) {
    let container = card.querySelector('.note-json');
    if (container) {
      // toggle off
      container.remove();
      return;
    }
    container = document.createElement('div');
    container.className = 'note-json';
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2);
    pre.style.whiteSpace = 'pre-wrap';
    container.appendChild(pre);
    // no copy button: user requested removal
    // insert at the end of card inner
    const inner = card.querySelector('.note-card-inner') || card;
    inner.appendChild(container);
    // scroll into view a bit
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // close handlers
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  document.getElementById('detailBackdrop')?.addEventListener('click', function (e) {
    if (e.target.id === 'detailBackdrop') closeModal();
  });
  const closeBtn = document.getElementById('detailClose');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
});