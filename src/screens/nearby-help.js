// Nearby Help Screen - Leaflet Map with Overpass API

import { getCurrentPosition, calculateDistance, getNavigationLink } from '../services/location.js';
import { getSettings } from '../services/storage.js';

const CATEGORIES = [
    { id: 'all', label: '📍 All', query: '' },
    { id: 'hospital', label: '🏥 Hospitals', query: '"amenity"="hospital"' },
    { id: 'police', label: '🚓 Police', query: '"amenity"="police"' },
    { id: 'pharmacy', label: '💊 Pharmacy', query: '"amenity"="pharmacy"' },
    { id: 'fire', label: '🚒 Fire Stn', query: '"amenity"="fire_station"' },
];

let map = null;
let markers = [];
let userPos = null;
let activeCategory = 'all';

export function render() {
    const filterChips = CATEGORIES.map(cat => `
    <button class="filter-chip ${cat.id === activeCategory ? 'active' : ''}" data-category="${cat.id}">
      ${cat.label}
    </button>
  `).join('');

    return `
    <div class="nearby-screen">
      <div class="nearby-filters" id="nearby-filters">
        ${filterChips}
      </div>
      <div class="nearby-map">
        <div id="map"></div>
        <div class="map-loading" id="map-loading">
          <div class="spinner"></div>
          <p>Loading map & finding your location...</p>
        </div>
        <button class="my-location-btn" id="my-location-btn" title="My Location">
          📍
        </button>
      </div>
    </div>
  `;
}

export async function mount() {
    // Initialize map
    initMap();

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.dataset.category;
            if (userPos) searchNearby(userPos.lat, userPos.lng);
        });
    });

    // My location button
    document.getElementById('my-location-btn')?.addEventListener('click', () => {
        if (userPos && map) {
            map.setView([userPos.lat, userPos.lng], 15);
        } else {
            locateUser();
        }
    });
}

function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || !window.L) return;

    // Default to center of India
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([20.5937, 78.9629], 5);

    // Theme-aware map tiles
    const settings = getSettings();
    const tileStyle = settings.theme === 'light' ? 'light_all' : 'dark_all';
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}{r}.png`, {
        maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Try to locate user
    locateUser();
}

async function locateUser() {
    try {
        const pos = await getCurrentPosition();
        userPos = pos;

        if (map) {
            map.setView([pos.lat, pos.lng], 15);

            // User marker
            const userIcon = L.divIcon({
                html: `<div style="
          width: 18px; height: 18px;
          background: #007aff;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(0,122,255,0.5);
        "></div>`,
                iconSize: [18, 18],
                className: ''
            });

            L.marker([pos.lat, pos.lng], { icon: userIcon })
                .addTo(map)
                .bindPopup('<strong>You are here</strong>');
        }

        hideLoading();
        searchNearby(pos.lat, pos.lng);
    } catch (err) {
        hideLoading();
        console.warn('Could not get location:', err.message);
    }
}

function hideLoading() {
    const loading = document.getElementById('map-loading');
    if (loading) loading.style.display = 'none';
}

async function searchNearby(lat, lng) {
    // Clear existing markers
    markers.forEach(m => map?.removeLayer(m));
    markers = [];

    let query;
    if (activeCategory === 'all') {
        query = `
      [out:json][timeout:15];
      (
        node["amenity"="hospital"](around:5000,${lat},${lng});
        node["amenity"="police"](around:5000,${lat},${lng});
        node["amenity"="pharmacy"](around:5000,${lat},${lng});
        node["amenity"="fire_station"](around:5000,${lat},${lng});
      );
      out body 50;
    `;
    } else {
        const cat = CATEGORIES.find(c => c.id === activeCategory);
        if (!cat || !cat.query) return;
        query = `
      [out:json][timeout:15];
      node[${cat.query}](around:5000,${lat},${lng});
      out body 30;
    `;
    }

    try {
        const resp = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`
        });
        const data = await resp.json();
        displayResults(data.elements, lat, lng);
    } catch (err) {
        console.warn('Overpass API error:', err);
    }
}

function displayResults(elements, userLat, userLng) {
    if (!map) return;

    const iconMap = {
        hospital: { emoji: '🏥', color: '#34c759' },
        police: { emoji: '🚓', color: '#007aff' },
        pharmacy: { emoji: '💊', color: '#af52de' },
        fire_station: { emoji: '🚒', color: '#ff9500' },
    };

    elements.forEach(el => {
        if (!el.lat || !el.lon) return;

        const amenity = el.tags?.amenity || 'unknown';
        const name = el.tags?.name || capitalizeType(amenity);
        const iconData = iconMap[amenity] || { emoji: '📍', color: '#ff2d55' };
        const distance = calculateDistance(userLat, userLng, el.lat, el.lon);
        const distanceStr = distance < 1
            ? `${Math.round(distance * 1000)}m`
            : `${distance.toFixed(1)}km`;
        const phone = el.tags?.phone || el.tags?.['contact:phone'] || '';

        const icon = L.divIcon({
            html: `<div style="
        width: 32px; height: 32px;
        background: ${iconData.color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.3);
      ">${iconData.emoji}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            className: ''
        });

        const navLink = getNavigationLink(el.lat, el.lon);

        const popupContent = `
      <div class="popup-content">
        <h4>${name}</h4>
        <div class="popup-type">${capitalizeType(amenity)}</div>
        <div class="popup-distance">📏 ${distanceStr} away</div>
        <div class="popup-actions">
          <button class="navigate-btn" onclick="window.open('${navLink}', '_blank')">Navigate</button>
          ${phone ? `<button class="call-btn" onclick="window.open('tel:${phone}')">Call</button>` : ''}
        </div>
      </div>
    `;

        const marker = L.marker([el.lat, el.lon], { icon })
            .bindPopup(popupContent)
            .addTo(map);

        markers.push(marker);
    });
}

function capitalizeType(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function unmount() {
    if (map) {
        map.remove();
        map = null;
    }
    markers = [];
    userPos = null;
}
