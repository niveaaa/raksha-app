// SMS Service - Emergency message sending via sms: URI

import { getContacts, getSettings } from './storage.js';
import { getCurrentPosition, getGoogleMapsLink } from './location.js';

/**
 * Build emergency message with location
 * @param {string} [customMessage] - Optional custom message override
 * @returns {Promise<string>}
 */
export async function buildEmergencyMessage(customMessage) {
    const settings = getSettings();
    let message = customMessage || settings.emergencyMessage;

    try {
        const pos = await getCurrentPosition();
        const mapsLink = getGoogleMapsLink(pos.lat, pos.lng);
        message = message.replace('{location}', mapsLink);
    } catch {
        message = message.replace('{location}', '(Location unavailable)');
    }

    return message;
}

/**
 * Open SMS app with pre-filled message to all emergency contacts
 * @param {string} message - The message to send
 */
export function sendSMSToContacts(message) {
    const contacts = getContacts();
    if (contacts.length === 0) {
        showToast('No emergency contacts added! Go to Contacts to add.');
        return;
    }

    const phoneNumbers = contacts.map(c => c.phone).join(',');
    const encodedMessage = encodeURIComponent(message);

    // Use sms: URI scheme
    const smsLink = `sms:${phoneNumbers}?body=${encodedMessage}`;
    window.open(smsLink, '_self');
}

/**
 * Send SOS to specific number with location
 * @param {string} phone - Phone number
 * @param {string} label - Emergency type label
 */
export async function sendEmergencySMS(phone, label) {
    const message = await buildEmergencyMessage(
        `🚨 EMERGENCY (${label}): I need immediate help. My location: {location}`
    );
    const encodedMessage = encodeURIComponent(message);
    window.open(`sms:${phone}?body=${encodedMessage}`, '_self');
}

/**
 * Trigger a full SOS - SMS to all contacts + optional call
 */
export async function triggerFullSOS() {
    const message = await buildEmergencyMessage();

    // Send SMS to all contacts
    sendSMSToContacts(message);
}

/**
 * Initiate a phone call
 * @param {string} number
 */
export function makeCall(number) {
    window.open(`tel:${number}`, '_self');
}

/**
 * Show a toast notification
 */
function showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}
