// Initialiser la carte
const map = L.map('map', { worldCopyJump: false, minZoom: 2, maxZoom: 12 }).setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    noWrap: true,
    maxZoom: 19
}).addTo(map);

const geoCache = new Map();
const markers = [];

// Cache pré-calculé pour les lieux fréquents (évite le géocodage)
const preComputedCoords = {
    'london, uk': [51.5074, -0.1278],
    'paris, france': [48.8566, 2.3522],
    'new york, usa': [40.7128, -74.0060],
    'los angeles, usa': [34.0522, -118.2437],
    'california, usa': [36.7783, -119.4179],
    'texas, usa': [31.9686, -99.9018],
    'florida, usa': [27.9944, -81.7603],
    'berlin, germany': [52.5200, 13.4050],
    'madrid, spain': [40.4168, -3.7038],
    'barcelona, spain': [41.3851, 2.1734],
    'rome, italy': [41.9028, 12.4964],
    'milan, italy': [45.4642, 9.1900],
    'amsterdam, netherlands': [52.3676, 4.9041],
    'brussels, belgium': [50.8503, 4.3517],
    'stockholm, sweden': [59.3293, 18.0686],
    'copenhagen, denmark': [55.6761, 12.5683],
    'oslo, norway': [59.9139, 10.7522],
    'vienna, austria': [48.2082, 16.3738],
    'prague, czechia': [50.0755, 14.4378],
    'warsaw, poland': [52.2297, 21.0122],
    'budapest, hungary': [47.4979, 19.0402],
    'tokyo, japan': [35.6762, 139.6503],
    'sydney, australia': [33.8688, 151.2093],
    'melbourne, australia': [37.8136, 144.9631],
    'toronto, canada': [43.6532, -79.3832],
    'montreal, canada': [45.5017, -73.5673],
    'mexico city, mexico': [19.4326, -99.1332],
    'sao paulo, brazil': [23.5505, -46.6333],
    'rio de janeiro, brazil': [22.9068, -43.1729],
    'buenos aires, argentina': [34.6037, -58.3816],
    'santiago, chile': [33.4489, -70.6693],
    'bogota, colombia': [4.7110, -74.0721],
    'lima, peru': [12.0464, -77.0428],
    'lisbon, portugal': [38.7223, -9.1393],
    'dublin, ireland': [53.3498, -6.2603],
    'manchester, uk': [53.4808, -2.2426],
    'glasgow, uk': [55.8642, -4.2518],
    'chicago, usa': [41.8781, -87.6298],
    'seattle, usa': [47.6062, -122.3321],
    'boston, usa': [42.3601, -71.0589],
    'san francisco, usa': [37.7749, -122.4194],
    'washington, usa': [38.9072, -77.0369],
    'atlanta, usa': [33.7490, -84.3880],
    'georgia, usa': [32.1656, -82.9001],
    'nevada, usa': [38.8026, -116.4194],
    'munich, germany': [48.1351, 11.5820],
    'frankfurt, germany': [50.1109, 8.6821],
    'hamburg, germany': [53.5511, 9.9937]
};

// Initialiser le cache avec les coords pré-calculées
Object.entries(preComputedCoords).forEach(([key, coords]) => {
    geoCache.set(key, coords);
});

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function slugToPlace(slug) {
    return String(slug || '').replace(/_/g, ' ').replace(/-/g, ', ');
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function geocode(place) {
    const key = place.toLowerCase();
    if (geoCache.has(key)) return geoCache.get(key);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
    const resp = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    const data = await resp.json();
    if (Array.isArray(data) && data.length) {
        const latlng = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        geoCache.set(key, latlng);
        return latlng;
    }
    return null;
}

async function geocodeBatch(places, delayMs = 400) {
    const result = new Map();
    let count = 0;
    const total = places.length;
    const statusEl = document.getElementById('artistList');
    
    // Batch de 5 requêtes en parallèle
    const batchSize = 5;
    for (let i = 0; i < total; i += batchSize) {
        const batch = places.slice(i, Math.min(i + batchSize, total));
        
        await Promise.all(batch.map(async (place) => {
            count++;
            statusEl.textContent = `Géocodage ${count}/${total}...`;
            const latlng = await geocode(place);
            if (latlng) result.set(place, latlng);
        }));
        
        // Pause seulement entre les batches
        if (i + batchSize < total) await sleep(delayMs);
    }
    return result;
}

function renderList(items, byId) {
    const host = document.getElementById('artistList');
    if (!items.length) {
        host.textContent = 'Aucune donnée de localisation disponible.';
        return;
    }
    host.innerHTML = items.map(item => {
        const artistName = byId.get(item.id) || `Artiste #${item.id}`;
        const allLocs = (item.locations || []).map(slugToPlace);
        const displayLocs = allLocs.length > 3 
            ? allLocs.slice(0, 3).join(', ') + ` (+${allLocs.length - 3})`
            : allLocs.join(', ');
        return `<div class="artist-row" data-artist-id="${item.id}"><div class="artist-name">${artistName}</div><div class="artist-locs">${displayLocs || 'Aucune localisation'}</div></div>`;
    }).join('');
    
    // Ajouter les event listeners
    document.querySelectorAll('.artist-row').forEach(row => {
        row.addEventListener('click', () => {
            const artistId = parseInt(row.dataset.artistId);
            focusOnArtist(artistId);
        });
    });
}

const artistMarkers = new Map();

function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers.length = 0;
    artistMarkers.clear();
}

function focusOnArtist(artistId) {
    const artistMarkerList = artistMarkers.get(artistId) || [];
    if (artistMarkerList.length === 0) return;
    
    if (artistMarkerList.length === 1) {
        map.setView(artistMarkerList[0].getLatLng(), 6);
    } else {
        const group = L.featureGroup(artistMarkerList);
        map.fitBounds(group.getBounds().pad(0.3));
    }
    
    // Ouvrir le popup du premier marqueur
    artistMarkerList[0].openPopup();
}

async function loadData() {
    clearMarkers();
    const statusEl = document.getElementById('artistList');
    statusEl.textContent = 'Chargement...';
    try {
        const [artists, locations] = await Promise.all([
            fetch('/api/artists').then(r => r.json()),
            fetch('/api/locations').then(r => r.json())
        ]);

        console.log('Artists:', artists?.length, 'Locations items:', locations?.index?.length);

        const byId = new Map((artists || []).map(a => [a.id || a.ID, a.name || a.Name]));
        const items = (locations && locations.index) ? locations.index : [];

        // Géocode chaque lieu unique pour éviter les doublons et limiter le débit
        const uniquePlaces = new Set();
        for (const item of items) {
            for (const raw of item.locations || []) {
                uniquePlaces.add(slugToPlace(raw));
            }
        }

        console.log('Lieux uniques à géocoder:', uniquePlaces.size);
        
        // Filtrer les lieux déjà en cache
        const placesToGeocode = Array.from(uniquePlaces).filter(p => !geoCache.has(p.toLowerCase()));
        const alreadyCached = uniquePlaces.size - placesToGeocode.length;
        
        console.log(`${alreadyCached} lieux en cache, ${placesToGeocode.length} à géocoder`);
        statusEl.textContent = `${alreadyCached} lieux en cache, géocodage de ${placesToGeocode.length} restants...`;

        const coords = await geocodeBatch(placesToGeocode);
        
        console.log('Lieux géocodés avec succès:', coords.size);
        statusEl.textContent = `Placement des marqueurs...`;

        // Fusionner les coords fraîchement géocodées avec le cache
        const allCoords = new Map(geoCache);
        coords.forEach((v, k) => allCoords.set(k, v));

        for (const item of items) {
            const artistName = byId.get(item.id) || `Artiste #${item.id}`;
            const artistMarkerList = [];
            
            for (const raw of item.locations || []) {
                const place = slugToPlace(raw);
                const latlng = allCoords.get(place.toLowerCase());
                if (!latlng) {
                    console.warn('Pas de coords pour', place);
                    continue;
                }
                const marker = L.marker(latlng, { icon: defaultIcon })
                    .bindPopup(`<b>${artistName}</b><br>${place}`)
                    .addTo(map);
                markers.push(marker);
                artistMarkerList.push(marker);
            }
            
            if (artistMarkerList.length > 0) {
                artistMarkers.set(item.id, artistMarkerList);
            }
        }

        console.log('Marqueurs placés:', markers.length);

        if (markers.length) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.25));
        } else {
            map.setView([20, 0], 2);
        }

        renderList(items, byId);
    } catch (err) {
        console.error('Erreur chargement données:', err);
        statusEl.textContent = 'Impossible de charger les données.';
    }
}

document.getElementById('btnFit').addEventListener('click', () => {
    if (markers.length) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.25));
    } else {
        map.setView([20, 0], 2);
    }
});

document.getElementById('btnReload').addEventListener('click', () => {
    loadData();
});

loadData();
