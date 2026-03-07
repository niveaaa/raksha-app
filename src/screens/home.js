// Home Screen - SOS Dashboard with Radial Emergency Menu

import { getCurrentPosition, getGoogleMapsLink } from '../services/location.js';
import { triggerFullSOS, makeCall, sendEmergencySMS } from '../services/sms.js';
import { getContacts } from '../services/storage.js';

// Emergency categories with Indian numbers
const EMERGENCY_CATEGORIES = [
    { id: 'police', icon: '🚓', label: 'Police', number: '100', color: 'police', fullLabel: 'Police Emergency' },
    { id: 'medical', icon: '🚑', label: 'Medical', number: '108', color: 'medical', fullLabel: 'Medical Emergency' },
    { id: 'fire', icon: '🔥', label: 'Fire', number: '101', color: 'fire', fullLabel: 'Fire Emergency' },
    { id: 'women', icon: '👩', label: 'Women', number: '1091', color: 'women', fullLabel: 'Women Safety' },
    { id: 'child', icon: '👶', label: 'Child', number: '1098', color: 'child', fullLabel: 'Child Emergency' },
    { id: 'elderly', icon: '👴', label: 'Elderly', number: '14567', color: 'elderly', fullLabel: 'Elderly Assistance' },
    { id: 'railway', icon: '🚆', label: 'Railway', number: '139', color: 'railway', fullLabel: 'Railway Helpline' },
    { id: 'disaster', icon: '🌪', label: 'Disaster', number: '9711077372', color: 'disaster', fullLabel: 'Disaster / NDRF' },
];

let hasLocation = false;

export function render() {
    // Try to get location on render
    getCurrentPosition()
        .then(() => {
            hasLocation = true;
            updateLocationStatus();
        })
        .catch(() => {
            hasLocation = false;
            updateLocationStatus();
        });

    // Calculate radial positions for 8 buttons
    const radius = 128; // distance from center
    const centerX = 160 - 32; // container center - half button width
    const centerY = 160 - 32;
    const startAngle = -90; // start from top (12 o'clock)

    const radialButtons = EMERGENCY_CATEGORIES.map((cat, i) => {
        const angle = startAngle + (i * 45); // 360/8 = 45° per button
        const rad = (angle * Math.PI) / 180;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);
        return `
      <button class="radial-btn ${cat.color}" data-number="${cat.number}" data-label="${cat.fullLabel}" data-id="${cat.id}" title="${cat.fullLabel}" style="left:${x}px;top:${y}px;">
        <span class="radial-icon">${cat.icon}</span>
        <span class="radial-label">${cat.label}</span>
      </button>
    `;
    }).join('');

    return `
    <div class="home-screen">
      <p class="home-title">Emergency Dashboard</p>
      
      <div class="radial-container">
        <!-- Decorative rings -->
        <div class="sos-ring sos-ring-1"></div>
        <div class="sos-ring sos-ring-2"></div>
        <div class="sos-ring sos-ring-3"></div>
        
        <!-- Center SOS Button -->
        <button class="sos-btn" id="sos-main-btn">SOS</button>
        
        <!-- Radial Emergency Buttons -->
        ${radialButtons}
      </div>

      <div class="home-status">
        <div class="status-label">
          <span class="status-dot ${hasLocation ? '' : 'no-location'}" id="status-dot"></span>
          <span id="status-text">${hasLocation ? 'Location active • Ready' : 'Acquiring location...'}</span>
        </div>
      </div>
    </div>
  `;
}

function updateLocationStatus() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (dot && text) {
        dot.className = `status-dot ${hasLocation ? '' : 'no-location'}`;
        text.textContent = hasLocation ? 'Location active • Ready' : 'Location unavailable';
    }
}

export function mount() {
    // SOS Main Button
    const sosBtn = document.getElementById('sos-main-btn');
    if (sosBtn) {
        let pressTimer;

        // Long press to activate SOS
        sosBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            sosBtn.style.transform = 'translate(-50%, -50%) scale(0.92)';
            pressTimer = setTimeout(() => {
                activateSOS();
            }, 800); // 800ms long press
        });

        sosBtn.addEventListener('pointerup', () => {
            sosBtn.style.transform = '';
            clearTimeout(pressTimer);
        });

        sosBtn.addEventListener('pointerleave', () => {
            sosBtn.style.transform = '';
            clearTimeout(pressTimer);
        });

        // Regular click also works
        sosBtn.addEventListener('click', () => {
            activateSOS();
        });
    }

    // Radial Buttons
    document.querySelectorAll('.radial-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const number = btn.dataset.number;
            const label = btn.dataset.label;
            handleEmergencyAction(number, label);
        });
    });
}

async function activateSOS() {
    const overlay = document.getElementById('sos-overlay');
    const statusEl = document.getElementById('sos-overlay-status');

    if (overlay) {
        overlay.classList.remove('hidden');

        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Step 1: Get location
        statusEl.textContent = 'Getting your location...';

        try {
            await getCurrentPosition();
            statusEl.textContent = 'Location found! Opening SMS...';
        } catch {
            statusEl.textContent = 'Location unavailable. Opening SMS...';
        }

        // Step 2: Send SMS
        await new Promise(r => setTimeout(r, 500));
        statusEl.textContent = 'Sending emergency alerts...';

        await triggerFullSOS();

        // Step 3: Navigate to AI assistant
        setTimeout(() => {
            overlay.classList.add('hidden');
            window.location.hash = '#ai';
        }, 1500);
    }

    // Cancel button
    const cancelBtn = document.getElementById('sos-cancel-btn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            overlay.classList.add('hidden');
            if (navigator.vibrate) navigator.vibrate(0);
        };
    }
}

function handleEmergencyAction(number, label) {
    // Vibrate
    if (navigator.vibrate) navigator.vibrate(100);

    // Show quick action choice
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${label}</h3>
        <button class="modal-close" id="em-modal-close">✕</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
        <button class="btn-primary" id="em-call-btn" style="width:100%">
          📞 Call ${number}
        </button>
        <button class="btn-secondary" id="em-sms-btn" style="width:100%">
          💬 Send Emergency SMS
        </button>
        <button class="btn-secondary" id="em-both-btn" style="width:100%">
          🚨 Call + SMS + Alert Contacts
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    // Close
    modal.querySelector('#em-modal-close').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Call only
    modal.querySelector('#em-call-btn').onclick = () => {
        modal.remove();
        makeCall(number);
    };

    // SMS only
    modal.querySelector('#em-sms-btn').onclick = async () => {
        modal.remove();
        await sendEmergencySMS(number, label);
    };

    // Both + contacts
    modal.querySelector('#em-both-btn').onclick = async () => {
        modal.remove();
        await triggerFullSOS();
        setTimeout(() => makeCall(number), 500);
    };
}

export function unmount() {
    // cleanup
}
