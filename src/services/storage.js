// localStorage Helper Service

const KEYS = {
    CONTACTS: 'sos_contacts',
    SETTINGS: 'sos_settings',
    CHAT_HISTORY: 'sos_chat_history',
};

// === Contacts ===

export function getContacts() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.CONTACTS)) || [];
    } catch {
        return [];
    }
}

export function saveContacts(contacts) {
    localStorage.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
}

export function addContact(contact) {
    const contacts = getContacts();
    contact.id = Date.now().toString();
    contacts.push(contact);
    saveContacts(contacts);
    return contact;
}

export function updateContact(id, updates) {
    const contacts = getContacts();
    const idx = contacts.findIndex(c => c.id === id);
    if (idx !== -1) {
        contacts[idx] = { ...contacts[idx], ...updates };
        saveContacts(contacts);
        return contacts[idx];
    }
    return null;
}

export function deleteContact(id) {
    const contacts = getContacts().filter(c => c.id !== id);
    saveContacts(contacts);
}

// === Settings ===

const DEFAULT_SETTINGS = {
    geminiApiKey: '',
    shakeToSOS: true,
    emergencyMessage: 'Emergency alert: I may need help. My live location is: {location}',
};

export function getSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS));
        return { ...DEFAULT_SETTINGS, ...stored };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);
}

// === Chat History ===

export function getChatHistory() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.CHAT_HISTORY)) || [];
    } catch {
        return [];
    }
}

export function saveChatHistory(messages) {
    // Keep last 100 messages max
    const trimmed = messages.slice(-100);
    localStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
}

export function clearChatHistory() {
    localStorage.removeItem(KEYS.CHAT_HISTORY);
}
