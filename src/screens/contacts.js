// Emergency Contacts Screen - CRUD with localStorage

import { getContacts, addContact, deleteContact } from '../services/storage.js';
import { makeCall } from '../services/sms.js';
import { buildEmergencyMessage } from '../services/sms.js';

export function render() {
    const contacts = getContacts();

    const contactCards = contacts.length > 0
        ? contacts.map(c => createContactCard(c)).join('')
        : `<div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3>No Emergency Contacts</h3>
        <p>Add trusted contacts who will receive alerts when you trigger SOS.</p>
       </div>`;

    return `
    <div class="contacts-screen">
      <div class="screen-header">
        <h1>Emergency Contacts</h1>
        <p>People who will be alerted during emergencies</p>
      </div>

      <div class="contacts-list" id="contacts-list">
        ${contactCards}
      </div>

      <button class="add-contact-btn" id="add-contact-btn">
        ➕ Add Emergency Contact
      </button>
    </div>
  `;
}

function createContactCard(contact) {
    const initials = contact.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return `
    <div class="contact-card" data-id="${contact.id}">
      <div class="contact-avatar">${initials}</div>
      <div class="contact-info">
        <h4>${contact.name}</h4>
        <p>${contact.phone}</p>
        ${contact.relationship ? `<span class="contact-relation">${contact.relationship}</span>` : ''}
      </div>
      <div class="contact-actions">
        <button class="contact-action-btn call" data-phone="${contact.phone}" title="Call">
          📞
        </button>
        <button class="contact-action-btn sms" data-phone="${contact.phone}" data-name="${contact.name}" title="SMS">
          💬
        </button>
        <button class="contact-action-btn delete" data-id="${contact.id}" title="Delete">
          🗑️
        </button>
      </div>
    </div>
  `;
}

export function mount() {
    // Add contact button
    document.getElementById('add-contact-btn')?.addEventListener('click', showAddModal);

    // Contact action buttons
    document.querySelectorAll('.contact-action-btn.call').forEach(btn => {
        btn.addEventListener('click', () => makeCall(btn.dataset.phone));
    });

    document.querySelectorAll('.contact-action-btn.sms').forEach(btn => {
        btn.addEventListener('click', async () => {
            const msg = await buildEmergencyMessage();
            const encoded = encodeURIComponent(msg);
            window.open(`sms:${btn.dataset.phone}?body=${encoded}`, '_self');
        });
    });

    document.querySelectorAll('.contact-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (confirm('Remove this emergency contact?')) {
                deleteContact(id);
                refreshList();
            }
        });
    });
}

function showAddModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'add-contact-modal';
    modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add Contact</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <form class="contact-form" id="contact-form">
        <div class="form-group">
          <label>Name</label>
          <input type="text" class="form-input" id="contact-name" placeholder="e.g. Mom" required />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" class="form-input" id="contact-phone" placeholder="e.g. +91 98765 43210" required />
        </div>
        <div class="form-group">
          <label>Relationship (optional)</label>
          <input type="text" class="form-input" id="contact-relation" placeholder="e.g. Mother, Friend, Spouse" />
        </div>
        <button type="submit" class="btn-primary">Add Contact</button>
      </form>
    </div>
  `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('#modal-close-btn').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Form submit
    modal.querySelector('#contact-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const relationship = document.getElementById('contact-relation').value.trim();

        if (!name || !phone) return;

        addContact({ name, phone, relationship });
        modal.remove();
        refreshList();
        showToast('Contact added ✓');
    };
}

function refreshList() {
    const container = document.getElementById('screen-container');
    if (container) {
        container.innerHTML = render();
        mount();
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
