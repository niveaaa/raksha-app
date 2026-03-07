// Main Application - Router + Initialization

import './styles/global.css';
import * as home from './screens/home.js';
import * as ai from './screens/ai-assistant.js';
import * as nearby from './screens/nearby-help.js';
import * as contacts from './screens/contacts.js';
import * as settings from './screens/settings.js';
import { startShakeDetection, stopShakeDetection } from './services/shake-detector.js';
import { getSettings } from './services/storage.js';
import { triggerFullSOS } from './services/sms.js';

// Screen registry
const screens = {
    home: { module: home, nav: 'nav-home' },
    ai: { module: ai, nav: 'nav-ai' },
    nearby: { module: nearby, nav: 'nav-nearby' },
    contacts: { module: contacts, nav: 'nav-contacts' },
    settings: { module: settings, nav: 'nav-settings' },
};

let currentScreen = null;

/**
 * Navigate to a screen
 */
function navigateTo(screenId) {
    const container = document.getElementById('screen-container');
    if (!container) return;

    // Unmount current screen
    if (currentScreen && screens[currentScreen]?.module.unmount) {
        screens[currentScreen].module.unmount();
    }

    // Update nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === screenId);
    });

    // Render new screen
    const screen = screens[screenId];
    if (screen) {
        container.innerHTML = screen.module.render();
        // Mount after DOM is ready
        requestAnimationFrame(() => {
            if (screen.module.mount) {
                screen.module.mount();
            }
        });
        currentScreen = screenId;
    }
}

/**
 * Hash-based routing
 */
function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const screenId = screens[hash] ? hash : 'home';
    navigateTo(screenId);
}

/**
 * Initialize the app
 */
function init() {
    // Set up navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.dataset.screen;
            window.location.hash = `#${screen}`;
        });
    });

    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);

    // Initial route
    handleRoute();

    // Initialize shake detection
    initShakeDetection();

    // Register service worker
    registerServiceWorker();

    console.log('🆘 SOS Emergency App initialized');
}

/**
 * Shake to SOS
 */
function initShakeDetection() {
    const settings = getSettings();
    if (settings.shakeToSOS) {
        startShakeDetection(() => {
            // Confirm before triggering
            if (confirm('Shake detected! Trigger SOS emergency alert?')) {
                activateSOS();
            }
        });
    }
}

function activateSOS() {
    const overlay = document.getElementById('sos-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    }

    const statusEl = document.getElementById('sos-overlay-status');
    if (statusEl) statusEl.textContent = 'Sending emergency alerts...';

    triggerFullSOS().then(() => {
        setTimeout(() => {
            if (overlay) overlay.classList.add('hidden');
            window.location.hash = '#ai';
        }, 1500);
    });

    // Cancel button
    const cancelBtn = document.getElementById('sos-cancel-btn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            overlay?.classList.add('hidden');
            if (navigator.vibrate) navigator.vibrate(0);
        };
    }
}

/**
 * Register PWA service worker
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');
        } catch (err) {
            console.warn('SW registration failed:', err);
        }
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
