// Settings Screen

import { getSettings, updateSetting } from '../services/storage.js';
import { isShakeSupported } from '../services/shake-detector.js';

export function render() {
  const settings = getSettings();
  const shakeSupported = isShakeSupported();

  return `
    <div class="settings-screen">
      <div class="screen-header">
        <h1>Settings</h1>
        <p>Configure your safety preferences</p>
      </div>

      <div class="settings-sections">
        <!-- Safety Features -->
        <div class="settings-section">
          <div class="settings-section-title">Safety Features</div>
          <div class="setting-item">
            <div class="setting-icon red">📳</div>
            <div class="setting-info">
              <h4>Shake to SOS</h4>
              <p>${shakeSupported ? 'Shake your phone 3 times to trigger SOS' : 'Not supported on this device'}</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="shake-toggle" ${settings.shakeToSOS ? 'checked' : ''} ${!shakeSupported ? 'disabled' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Emergency Message -->
        <div class="settings-section">
          <div class="settings-section-title">Emergency Message</div>
          <div class="setting-item">
            <div class="setting-icon orange">💬</div>
            <div class="setting-info">
              <h4>SOS Message Template</h4>
              <p>Use {location} for auto GPS link</p>
            </div>
          </div>
          <div class="message-template-group">
            <textarea id="emergency-message">${settings.emergencyMessage || ''}</textarea>
          </div>
        </div>

        <!-- Emergency Numbers Reference -->
        <div class="settings-section">
          <div class="settings-section-title">Indian Emergency Numbers</div>
          <div class="setting-item">
            <div class="setting-icon blue">🚓</div>
            <div class="setting-info"><h4>Police</h4></div>
            <span style="color:var(--text-secondary);font-size:var(--font-sm);font-weight:600;">100</span>
          </div>
          <div class="setting-item">
            <div class="setting-icon green">🚑</div>
            <div class="setting-info"><h4>Ambulance</h4></div>
            <span style="color:var(--text-secondary);font-size:var(--font-sm);font-weight:600;">108</span>
          </div>
          <div class="setting-item">
            <div class="setting-icon orange">🔥</div>
            <div class="setting-info"><h4>Fire</h4></div>
            <span style="color:var(--text-secondary);font-size:var(--font-sm);font-weight:600;">101</span>
          </div>
          <div class="setting-item">
            <div class="setting-icon purple">👩</div>
            <div class="setting-info"><h4>Women Helpline</h4></div>
            <span style="color:var(--text-secondary);font-size:var(--font-sm);font-weight:600;">1091</span>
          </div>
          <div class="setting-item">
            <div class="setting-icon red">👶</div>
            <div class="setting-info"><h4>Child Helpline</h4></div>
            <span style="color:var(--text-secondary);font-size:var(--font-sm);font-weight:600;">1098</span>
          </div>
          <div class="setting-item">
            <div class="setting-icon blue">🆘</div>
            <div class="setting-info"><h4>Universal Emergency</h4></div>
            <span style="color:var(--text-secondary);font-size:var(--font-sm);font-weight:600;">112</span>
          </div>
        </div>

        <!-- About -->
        <div class="about-section">
          <div class="app-logo">🆘</div>
          <h3>SOS Emergency</h3>
          <p class="app-version">Version 1.0.0</p>
          <p class="app-tagline">Your personal safety companion. Stay safe, stay connected.</p>
        </div>
      </div>
    </div>
  `;
}

export function mount() {
  // Shake toggle
  const shakeToggle = document.getElementById('shake-toggle');
  if (shakeToggle) {
    shakeToggle.addEventListener('change', () => {
      updateSetting('shakeToSOS', shakeToggle.checked);
      showToast(shakeToggle.checked ? 'Shake to SOS enabled' : 'Shake to SOS disabled');
    });
  }

  // Emergency message
  const messageArea = document.getElementById('emergency-message');
  if (messageArea) {
    let debounceTimer;
    messageArea.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateSetting('emergencyMessage', messageArea.value.trim());
        showToast('Message template saved ✓');
      }, 800);
    });
  }
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function unmount() { }
