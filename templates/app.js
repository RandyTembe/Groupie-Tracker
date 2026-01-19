// Configuration
const GENRE_MAP = {
    'Queen': 'Rock', 'SOJA': 'Reggae', 'Pink Floyd': 'Rock', 'Scorpions': 'Metal',
    'XXXTentacion': 'Rap', 'Mac Miller': 'Rap', 'Joyner Lucas': 'Rap', 'Kendrick Lamar': 'Hip-Hop',
    'ACDC': 'Hard Rock', 'Pearl Jam': 'Rock', 'Katy Perry': 'Pop', 'Rihanna': 'Pop',
    'Genesis': 'Rock', 'Phil Collins': 'Pop', 'Led Zeppelin': 'Rock', 'The Jimi Hendrix Experience': 'Rock',
    'Bee Gees': 'Pop', 'Deep Purple': 'Rock', 'Aerosmith': 'Rock', 'Dire Straits': 'Rock',
    'Mamonas Assassinas': 'Rock', 'Thirty Seconds to Mars': 'Alternative', 'Imagine Dragons': 'Alternative',
    'Juice Wrld': 'Rap', 'Logic': 'Rap', 'Alec Benjamin': 'Pop', 'Bobby McFerrins': 'Soul',
    'R3HAB': 'EDM', 'Post Malone': 'Hip-Hop', 'Travis Scott': 'Hip-Hop', 'J. Cole': 'Hip-Hop',
    'Nickelback': 'Rock', 'Mobb Deep': 'Hip-Hop', 'Guns N\' Roses': 'Hard Rock', 'NWA': 'Hip-Hop',
    'U2': 'Rock', 'Arctic Monkeys': 'Indie', 'Fall Out Boy': 'Alternative', 'Gorillaz': 'Alternative',
    'Eagles': 'Rock', 'Linkin Park': 'Rock', 'Red Hot Chili Peppers': 'Rock', 'Eminem': 'Rap',
    'Green Day': 'Rock', 'Metallica': 'Metal', 'Coldplay': 'Pop', 'Maroon 5': 'Pop',
    'Twenty One Pilots': 'Alternative', 'The Rolling Stones': 'Rock', 'Muse': 'Rock', 'Foo Fighters': 'Rock',
    'The Chainsmokers': 'EDM', 'Nirvana': 'Rock', 'Sabaton': 'Metal', 'Skillet': 'Metal', 'Avicii': 'EDM'
};

const ORIGIN_MAP = {
    'Sabaton': 'falun-sweden',
    'Skillet': 'memphis_tennessee-usa',
    'Avicii': 'stockholm-sweden',
    'Nirvana': 'aberdeen-washington-usa'
};

const CONCERT_DATES = {
    'Skillet': [
        '26 FÉV. 2026. jeu 19:30. Lancaster, PA, États-Unis.',
        '27 FÉV. 2026. ven 19:00. Bensalem, PA, États-Unis.',
        '28 FÉV. 2026. sam 19:00. Huntington, WV, États-Unis.',
        '14 MAR. 2026. sam 20:00. Charles Town, WV, États-Unis.',
        '15 MAR. 2026. dim 20:00. Chattangooda, TN, États-Unis.',
        '19 MAR. 2026. jeu 19:00. Raleigh, NC, États-Unis.',
        '20 MAR. 2026. ven 19:00. Myrtle Beach, SC, États-Unis.',
        '16 AVR. 2026. jeu 19:00. Riverside, CA, États-Unis.',
        '17 AVR. 2026. ven 19:00. San Diego, CA, États-Unis.',
        '18 AVR. 2026. sam 19:00. Anaheim, CA, États-Unis.',
        '28 AVR 2026. mar 19:00. Paris, Zenith, FRANCE'
    ],
    'Katy Perry': [
        '3 JUIL. 2026. ven 21:00. Arras, Main Square festival, FRANCE',
        '9 JUIL. 2026. jeu 21:00. Savoie, Paloma, FRANCE',
        '11 JUIL. 2026. sam 21:00. Nîmes, Radiant-Bellevue, FRANCE',
        '12 JUIL. 2026. dim 21:00. Nacy open air, FRANCE'
    ],
    'Coldplay': [
        '15 JUIL. 2026. mer 21:00. Lyon, Groupama Stadium, FRANCE',
        '18 JUIL. 2026. sam 21:00. Paris, Stade de France, FRANCE'
    ]
};

// Image de publicité à afficher dans la modale (remplace par ton URL/chemin)
const AD_IMAGE_URL = '/static/img/pub.png'; // ou une URL externe

// Leaflet
let leafletMap = null;
let leafletGroup = null;
const geocodeCache = {};
const GENRE_LIST = ['Tous', 'Rock', 'Metal', 'Pop', 'Hip-Hop', 'Rap', 'Reggae', 'EDM', 'Alternative', 'Hard Rock', 'Indie', 'Soul'];

const defaultMarkerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Filter state
let currentGenre = 'Tous';

// Utility functions
function isSoundCloudUrl(u) {
    return u && (u.includes('soundcloud.com') || u.includes('w.soundcloud.com'));
}

function yearFromDateStr(s) {
    if (!s) return null;
    if (s.includes('2026')) return 2026;
    const m = s.match(/(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
}

function formatDateForDisplay(s) {
    if (!s) return s;
    const parts = s.split('.');
    if (parts.length > 0) {
        let dateStr = parts[0].trim();
        if (parts.length > 3) {
            const location = parts[parts.length - 2].trim();
            if (location && location.length > 0 && !location.match(/\d{2}:\d{2}/)) {
                return dateStr + ' - ' + location;
            }
        }
        return dateStr;
    }
    return s;
}

function buildTicketUrl(artist, date) {
    const q = `${artist} billets ${date}`;
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function slugToPlace(slug) {
    if (!slug) return '';
    const parts = String(slug).split('-');
    let city = (parts[0] || '').replace(/_/g, ' ');
    let country = (parts[1] || '').replace(/_/g, ' ');
    const cap = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());
    
    const cityFix = {
        'london': 'Londres',
        'moscow': 'Moscou',
        'athens': 'Athènes',
        'rome': 'Rome',
        'lisbon': 'Lisbonne',
        'brussels': 'Bruxelles',
        'vienna': 'Vienne',
        'prague': 'Prague',
        'copenhagen': 'Copenhague',
        'stockholm': 'Stockholm',
        'geneva': 'Genève',
        'zurich': 'Zurich',
        'munich': 'Munich',
        'cologne': 'Cologne',
        'nuremberg': 'Nuremberg',
        'venice': 'Venise',
        'florence': 'Florence',
        'naples': 'Naples',
        'turin': 'Turin',
        'milan': 'Milan',
        'warsaw': 'Varsovie',
        'cairo': 'Le Caire',
        'beijing': 'Pékin',
        'new york': 'New York',
        'los angeles': 'Los Angeles',
        'memphis': 'Memphis',
        'new orleans': 'La Nouvelle-Orléans'
    };
    
    const countryFix = {
        'usa': 'États-Unis',
        'uk': 'Royaume-Uni',
        'uae': 'Émirats Arabes Unis',
        'south korea': 'Corée du Sud',
        'north korea': 'Corée du Nord',
        'united states': 'États-Unis',
        'united kingdom': 'Royaume-Uni',
        'sweden': 'Suède',
        'france': 'France',
        'germany': 'Allemagne',
        'spain': 'Espagne',
        'italy': 'Italie',
        'portugal': 'Portugal',
        'belgium': 'Belgique',
        'netherlands': 'Pays-Bas',
        'switzerland': 'Suisse',
        'austria': 'Autriche',
        'poland': 'Pologne',
        'russia': 'Russie',
        'japan': 'Japon',
        'china': 'Chine',
        'brazil': 'Brésil',
        'mexico': 'Mexique',
        'canada': 'Canada',
        'australia': 'Australie',
        'new zealand': 'Nouvelle-Zélande',
        'india': 'Inde',
        'norway': 'Norvège',
        'denmark': 'Danemark',
        'finland': 'Finlande',
        'greece': 'Grèce',
        'ireland': 'Irlande',
        'czech republic': 'République Tchèque',
        'hungary': 'Hongrie',
        'romania': 'Roumanie'
    };
    
    const cityNorm = city.toLowerCase();
    if (cityFix[cityNorm]) city = cityFix[cityNorm];
    
    const norm = country.toLowerCase();
    if (countryFix[norm]) country = countryFix[norm];
    
    return `${cityFix[cityNorm] ? city : cap(city)}${country ? ', ' + country : ''}`.trim();
}

function parseLocationsAttr(attr) {
    if (!attr) return [];
    try {
        const j = JSON.parse(attr);
        if (Array.isArray(j)) return j;
    } catch (e) { }
    let s = String(attr).trim();
    s = s.replace(/^\[|\]$/g, '').trim();
    if (!s) return [];
    const items = s.split(/[\s,]+/).filter(Boolean);
    return items;
}

async function fetchJSON(u) {
    const r = await fetch(u);
    if (!r.ok) throw new Error('fetch ' + u + ' failed');
    return r.json();
}

// Shared helpers
function getDatesFromResponse(data) {
    const d = Array.isArray(data?.dates) ? data.dates : (Array.isArray(data?.Dates) ? data.Dates : []);
    return Array.isArray(d) ? d : [];
}

function enrichDates2026(artistName, dates) {
    let in2026 = (dates || []).filter(d => yearFromDateStr(d) === 2026);
    if (CONCERT_DATES[artistName]) {
        in2026 = in2026.concat(CONCERT_DATES[artistName]);
    }
    return in2026;
}

function makeTicketLink(artistName, dateText) {
    const a = document.createElement('a');
    a.href = buildTicketUrl(artistName, dateText);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = formatDateForDisplay(dateText);
    a.style.color = 'inherit';
    a.style.textDecoration = 'none';
    return a;
}

// Leaflet functions
function initLeaflet() {
    if (!leafletMap) {
        leafletMap = L.map('leafletMap', {
            zoomControl: true,
            worldCopyJump: false,
            maxBounds: [[-85, -180], [85, 180]],
            maxBoundsViscosity: 1,
            minZoom: 2,
            maxZoom: 10
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            noWrap: true,
            maxZoom: 19
        }).addTo(leafletMap);
        leafletGroup = L.featureGroup().addTo(leafletMap);
        leafletMap.setView([20, 0], 2);
    }
}

async function geocode(place) {
    if (!place || place.trim() === '') return null;
    if (geocodeCache[place]) return geocodeCache[place];
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
        const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return null;
        const j = await r.json();
        if (Array.isArray(j) && j.length > 0) {
            const res = { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) };
            geocodeCache[place] = res;
            return res;
        }
    } catch (e) {
        console.error('Geocode error:', e);
    }
    return null;
}

async function plotLocationsFromAttr(attr, artistName) {
    try {
        initLeaflet();
        if (leafletGroup) leafletGroup.clearLayers();
        const slugs = parseLocationsAttr(attr);
        if (!slugs.length) {
            leafletMap.setView([20, 0], 2);
            return;
        }
        for (const slug of slugs) {
            const place = slugToPlace(slug);
            const c = await geocode(place);
            if (!c) continue;
            const m = L.marker([c.lat, c.lon], { icon: defaultMarkerIcon }).bindPopup(`${artistName} — ${place}`);
            leafletGroup.addLayer(m);
            leafletMap.setView([c.lat, c.lon], 8);
            return;
        }
        leafletMap.setView([20, 0], 2);
    } catch (e) {
        console.error('plotLocationsFromAttr error:', e);
    }
}

// Filter management
function applyFilters() {
    const searchBar = document.getElementById('search-bar');
    const cards = document.querySelectorAll('.artist-card');
    const query = (searchBar?.value || '').toLowerCase();
    cards.forEach(card => {
        const name = card.dataset.name?.toLowerCase() || '';
        const genre = card.dataset.genre || 'Autre';
        const matchName = name.includes(query);
        const matchGenre = currentGenre === 'Tous' || genre === currentGenre;
        card.style.display = (matchName && matchGenre) ? '' : 'none';
    });
}

// Modal management
async function openModal(card) {
    const modal = document.getElementById('artistModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalSub = document.getElementById('modalSub');
    const modalLocations = document.getElementById('modalLocations');
    const modalExcerpt = document.getElementById('modalExcerpt');
    const modalAudio = document.getElementById('modalAudio');
    const modalSoundcloud = document.getElementById('modalSoundcloud');
    const modalTourContainer = document.getElementById('modalTourContainer');
    const modalTourList = document.getElementById('modalTourList');
    const modalPub = document.getElementById('modalPub');
    const modalPubImage = document.getElementById('modalPubImage');

    const id = card.dataset.id;
    const name = card.dataset.name;
    const img = card.querySelector('.artist-image')?.src || '';
    const locations = card.dataset.locations || 'Localisations indisponibles';
    const firstAlbum = card.dataset.firstalbum || 'Album inconnu';
    const musique = card.dataset.musique || '';
    const concertsUrl = card.dataset.concerts || '';
    const relationsUrl = card.dataset.relations || '';

    modalImage.src = img;
    modalImage.alt = name;
    modalTitle.textContent = name;
    modalSub.textContent = `Création / 1er album : ${firstAlbum}`;
    modal.classList.add('active');
    modalLocations.textContent = 'Lieux : chargement...';
    initLeaflet();
    setTimeout(() => {
        try { leafletMap?.invalidateSize(); } catch (e) { }
    }, 120);

    let nicePlaces = '';
    let locationsToPlot = '';

    if (locations && locations.startsWith('http')) {
        try {
            const locData = await fetchJSON(`/api/proxy?url=${encodeURIComponent(locations)}`);
            const locList = locData.locations || locData.Locations || [];
            if (Array.isArray(locList) && locList.length > 0) {
                const first = locList[0];
                locationsToPlot = JSON.stringify(locList);
                nicePlaces = first ? slugToPlace(first) : '';
            }
        } catch (e) {
            console.error('Error fetching locations:', e);
        }
    } else {
        const parsed = parseLocationsAttr(locations);
        const first = parsed[0];
        if (first) {
            locationsToPlot = JSON.stringify(parsed);
            nicePlaces = slugToPlace(first);
        }
    }

    if ((!locationsToPlot || locationsToPlot === '[]') && relationsUrl && relationsUrl.startsWith('http')) {
        try {
            const relData = await fetchJSON(`/api/proxy?url=${encodeURIComponent(relationsUrl)}`);
            const dl = relData.datesLocations || relData.DatesLocations || {};
            const keys = Object.keys(dl);
            if (keys.length > 0) {
                const entries = Object.entries(dl).map(([slug, dates]) => ({ slug, count: Array.isArray(dates) ? dates.length : 0 }));
                entries.sort((a, b) => b.count - a.count);
                const best = entries[0].slug;
                locationsToPlot = JSON.stringify([best]);
                nicePlaces = slugToPlace(best);
            }
        } catch (e) {
            console.error('Error fetching relations:', e);
        }
    }

    const originSlug = ORIGIN_MAP[name];
    if (originSlug) {
        locationsToPlot = JSON.stringify([originSlug]);
        nicePlaces = slugToPlace(originSlug);
    }

    modalLocations.textContent = nicePlaces ? `Lieux : ${nicePlaces}` : 'Lieux indisponibles';

    if (locationsToPlot) {
        plotLocationsFromAttr(locationsToPlot, name).catch(err => console.error(err));
    }

    modalAudio.pause();
    modalAudio.currentTime = 0;
    modalAudio.removeAttribute('src');
    modalAudio.style.display = 'none';
    modalSoundcloud.innerHTML = '';
    modalSoundcloud.style.display = 'none';
    if (modalPub) {
        modalPub.style.display = 'none';
    }

    if (musique.trim() !== '') {
        if (isSoundCloudUrl(musique)) {
            const embed = `https://w.soundcloud.com/player/?url=${encodeURIComponent(musique)}&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`;
            modalSoundcloud.innerHTML = `<iframe width="100%" height="140" scrolling="no" frameborder="no" allow="autoplay" src="${embed}"></iframe>`;
            modalSoundcloud.style.display = 'block';
            modalExcerpt.textContent = `Extrait SoundCloud — cliquez pour lire si besoin.`;
        } else {
            modalAudio.src = musique;
            modalAudio.style.display = 'block';
            modalAudio.controls = true;
            modalAudio.style.pointerEvents = 'auto';
            modalAudio.load();
            const tryPlay = modalAudio.play();
            if (tryPlay && typeof tryPlay.catch === 'function') {
                tryPlay.catch(() => { });
            }
            modalExcerpt.textContent = `Lecture de l'extrait lié à : ${firstAlbum}`;
        }
    } else {
        modalExcerpt.textContent = `Pas d'extrait audio disponible. (Single lié à : ${firstAlbum})`;
    }

    if (AD_IMAGE_URL && modalPub && modalPubImage) {
        modalPubImage.src = AD_IMAGE_URL;
        modalPub.style.display = 'block';
    }

    if (modalTourList) modalTourList.innerHTML = '';
    if (modalTourContainer) modalTourContainer.style.display = 'none';
    if (concertsUrl) {
        try {
            const proxy = `/api/proxy?url=${encodeURIComponent(concertsUrl)}`;
            const data = await fetchJSON(proxy);
            const dates = getDatesFromResponse(data);
            const in2026 = enrichDates2026(name, dates);
            if (in2026.length > 0) {
                modalTourContainer.style.display = 'block';
                in2026.forEach(d => {
                    const li = document.createElement('li');
                    li.textContent = d;
                    modalTourList.appendChild(li);
                });
            }
        } catch (e) {
            if (modalTourContainer) modalTourContainer.style.display = 'none';
        }
    }
}

function closeModal() {
    const modal = document.getElementById('artistModal');
    const modalAudio = document.getElementById('modalAudio');
    const modalTourList = document.getElementById('modalTourList');
    const modalTourContainer = document.getElementById('modalTourContainer');

    if (modalAudio) {
        modalAudio.pause();
        modalAudio.currentTime = 0;
    }
    if (modalTourList) modalTourList.innerHTML = '';
    const prevEmpty = modalTourContainer?.querySelector('.tour-empty');
    if (prevEmpty) prevEmpty.remove();
    if (modalTourContainer) modalTourContainer.style.display = 'none';
    modal.classList.remove('active');
}

// Load tours on cards
async function loadToursOnCards() {
    const cards = document.querySelectorAll('.artist-card');
    for (const card of cards) {
        try {
            const artistName = card.dataset.name || '';
            const concertsUrl = card.dataset.concerts;
            const section = card.querySelector('.tour-2026');
            const list = card.querySelector('.tour-list');
            if (!concertsUrl) { if (section) section.remove(); continue; }
            const proxy = `/api/proxy?url=${encodeURIComponent(concertsUrl)}`;
            const data = await fetchJSON(proxy);
            const dates = getDatesFromResponse(data);
            const dates2026 = enrichDates2026(artistName, dates);
            if (!section || !list) continue;
            if (dates2026.length === 0) {
                section.remove();
            } else {
                list.innerHTML = '';
                dates2026.forEach(d => {
                    const li = document.createElement('li');
                    li.appendChild(makeTicketLink(artistName, d));
                    list.appendChild(li);
                });
            }
        } catch (e) {
            const section = card.querySelector('.tour-2026');
            if (section) section.remove();
        }
    }
}

// Load concerts section
async function loadConcertsSection() {
    const concertsContainer = document.getElementById('concerts-list');
    if (!concertsContainer) return;

    const allConcerts = [];
    const cards = document.querySelectorAll('.artist-card');

    for (const card of cards) {
        try {
            const concertsUrl = card.dataset.concerts;
            const artistName = card.dataset.name || '';
            if (!concertsUrl) continue;

            const proxy = `/api/proxy?url=${encodeURIComponent(concertsUrl)}`;
            const data = await fetchJSON(proxy);
            const dates = getDatesFromResponse(data);
            const in2026 = enrichDates2026(artistName, dates);

            in2026.forEach(d => {
                allConcerts.push({ artist: artistName, date: d });
            });
        } catch (e) {
            console.error(`Erreur pour ${card.dataset.name}:`, e);
        }
    }

    concertsContainer.innerHTML = '';
    if (allConcerts.length === 0) {
        concertsContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7); grid-column: 1 / -1;">Aucun concert en 2026.</p>';
    } else {
        allConcerts.forEach(concert => {
            const card = document.createElement('div');
            card.className = 'concert-card';

            const artistEl = document.createElement('div');
            artistEl.className = 'concert-artist';
            artistEl.textContent = concert.artist;

            const genreEl = document.createElement('div');
            genreEl.className = 'concert-genre';
            genreEl.textContent = GENRE_MAP[concert.artist] || 'Autre';

            const dateEl = document.createElement('a');
            dateEl.className = 'concert-date';
            dateEl.href = buildTicketUrl(concert.artist, concert.date);
            dateEl.target = '_blank';
            dateEl.rel = 'noopener noreferrer';
            dateEl.textContent = formatDateForDisplay(concert.date);

            card.appendChild(artistEl);
            card.appendChild(genreEl);
            card.appendChild(dateEl);
            concertsContainer.appendChild(card);
        });
    }
}

// Load genres
function loadGenres() {
    const genresList = document.getElementById('genres-list');
    if (!genresList) return;
    genresList.innerHTML = '';
    GENRE_LIST.forEach(g => {
        const chip = document.createElement('div');
        chip.className = 'genre-chip';
        chip.textContent = g;
        if (g === 'Tous') chip.classList.add('active');
        chip.addEventListener('click', () => {
            document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentGenre = g;
            applyFilters();
        });
        genresList.appendChild(chip);
    });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const cards = document.querySelectorAll('.artist-card');
    const modal = document.getElementById('artistModal');
    const modalClose = document.getElementById('modalClose');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    // Assign genres to cards
    cards.forEach(card => {
        const name = card.dataset.name;
        const g = GENRE_MAP[name] || 'Autre';
        card.dataset.genre = g;
    });

    // Attach click events to cards
    cards.forEach(card => {
        card.addEventListener('click', () => openModal(card));
    });

    // Search bar filtering
    if (searchBar) {
        searchBar.addEventListener('input', applyFilters);
    }

    // Modal closing
    [modalClose, modalCloseBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closeModal);
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    window.addEventListener('beforeunload', () => {
        const modalAudio = document.getElementById('modalAudio');
        if (modalAudio) {
            modalAudio.pause();
            modalAudio.currentTime = 0;
        }
    });

    // Load initial data
    applyFilters();
    loadGenres();
    loadToursOnCards();
    loadConcertsSection();
});