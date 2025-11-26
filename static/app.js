// app.js - simple handler to open a modal with artist details
document.addEventListener('DOMContentLoaded', function () {
  function openModal(data) {
    const backdrop = document.getElementById('detailBackdrop');
    const title = document.getElementById('detailTitle');
    const body = document.getElementById('detailBody');
    title.textContent = data.Name || 'Détails';
    body.innerHTML = `
      <p><strong>Créé en:</strong> ${data.CreationDate || '—'}</p>
      <p><strong>Premier album:</strong> ${data.FirstAlbum || '—'}</p>
      <p><strong>Membres:</strong></p>
      <ul>${(data.Members || []).map(m => `<li>${m}</li>`).join('')}</ul>
      <p><strong>Locations:</strong> ${data.Locations || ''}</p>
    `;
    backdrop.classList.add('open');
  }

  function closeModal() {
    document.getElementById('detailBackdrop').classList.remove('open');
  }

  document.body.addEventListener('click', function (ev) {
    const card = ev.target.closest('.note-card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    if (!id) return;
    fetch(`/api/artists/${id}`)
      .then(r => r.json())
      .then(data => openModal(data))
      .catch(err => { console.error(err); alert('Erreur lors du chargement des détails'); });
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
      fetch(`/api/artists/${id}`)
        .then(r => r.json())
        .then(data => openModal(data))
        .catch(err => { console.error(err); alert('Erreur lors du chargement des détails'); });
    }
  });

  // close handlers
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  document.getElementById('detailBackdrop')?.addEventListener('click', function (e) {
    if (e.target.id === 'detailBackdrop') closeModal();
  });
  const closeBtn = document.getElementById('detailClose');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
});
