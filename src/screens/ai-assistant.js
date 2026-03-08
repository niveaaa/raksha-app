// AI Assistant Screen - Chat interface with Gemini Flash

import { sendToGemini } from '../services/gemini.js';
import { getChatHistory, saveChatHistory, clearChatHistory, getSettings } from '../services/storage.js';

let chatMessages = [];
let isProcessing = false;
let recognition = null;
let ttsEnabled = true;

export function render() {
    chatMessages = getChatHistory();
    const settings = getSettings();
    const isHindi = settings.language === 'hi';

    const messagesHTML = chatMessages.length > 0
        ? chatMessages.map(msg => createBubbleHTML(msg)).join('')
        : `<div class="chat-bubble ai">
        <span>${isHindi ? '👋 मैं आपका इमरजेंसी AI असिस्टेंट हूँ। मैं इमरजेंसी में प्राथमिक चिकित्सा, सुरक्षा निर्देश और बहुत कुछ में मदद कर सकता हूँ।' : '👋 I\'m your Emergency AI Assistant. I can help you during emergencies with first-aid guidance, safety instructions, and more.'}</span>
        <span class="bubble-time">AI Assistant</span>
       </div>`;

    return `
    <div class="ai-screen">
      <div class="ai-header">
        <div class="ai-avatar">🤖</div>
        <div class="ai-header-info">
          <h2>Emergency AI Assistant</h2>
          <p>● Online • Powered by Groq</p>
        </div>
        <button class="chat-voice-btn" id="tts-toggle" title="Toggle voice output" style="margin-left:auto;font-size:1.1rem;">${ttsEnabled ? '🔊' : '🔇'}</button>
        <button class="ai-clear-btn" id="ai-clear-btn">Clear Chat</button>
      </div>

      <div class="ai-quick-actions" id="ai-quick-actions">
        <button class="quick-action-chip" data-msg="I need help with a medical emergency">🚑 Medical Help</button>
        <button class="quick-action-chip" data-msg="How do I perform CPR?">❤️ CPR Steps</button>
        <button class="quick-action-chip" data-msg="There's a fire, what should I do?">🔥 Fire Safety</button>
        <button class="quick-action-chip" data-msg="I feel unsafe, what should I do?">🛡️ Personal Safety</button>
        <button class="quick-action-chip" data-msg="Someone is having a seizure">⚡ Seizure Help</button>
        <button class="quick-action-chip" data-msg="I need first aid for a wound">🩹 First Aid</button>
      </div>

      <div class="chat-messages" id="chat-messages">
        ${messagesHTML}
      </div>

      <div class="chat-input-container">
        <button class="chat-voice-btn" id="voice-btn" title="Voice Input">
          🎤
        </button>
        <textarea class="chat-input" id="chat-input" placeholder="${isHindi ? 'अपनी इमरजेंसी बताएं...' : 'Describe your emergency...'}" rows="1"></textarea>
        <button class="chat-send-btn" id="send-btn" title="Send">
          ➤
        </button>
      </div>
    </div>
  `;
}

function createBubbleHTML(msg) {
    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedText = formatMessageText(msg.text);
    return `
    <div class="chat-bubble ${msg.role}">
      <span>${formattedText}</span>
      <span class="bubble-time">${timeStr}</span>
    </div>
  `;
}

function formatMessageText(text) {
    // Basic markdown-like formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">$1</code>');
}

export function mount() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const clearBtn = document.getElementById('ai-clear-btn');
    const messagesContainer = document.getElementById('chat-messages');

    // Auto-resize textarea
    chatInput?.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
    });

    // Send on Enter (without Shift)
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn?.addEventListener('click', sendMessage);

    // Quick action chips
    document.querySelectorAll('.quick-action-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const msg = chip.dataset.msg;
            if (chatInput) chatInput.value = msg;
            sendMessage();
        });
    });

    // Voice input
    voiceBtn?.addEventListener('click', toggleVoiceInput);

    // TTS toggle
    document.getElementById('tts-toggle')?.addEventListener('click', () => {
        ttsEnabled = !ttsEnabled;
        const btn = document.getElementById('tts-toggle');
        if (btn) btn.textContent = ttsEnabled ? '🔊' : '🔇';
        if (!ttsEnabled) stopSpeaking();
        showToast(ttsEnabled ? 'Voice output ON' : 'Voice output OFF');
    });

    // Clear chat
    clearBtn?.addEventListener('click', () => {
        chatMessages = [];
        clearChatHistory();
        if (messagesContainer) {
            messagesContainer.innerHTML = `
        <div class="chat-bubble ai">
          <span>👋 Chat cleared. I'm ready to help with any emergency.</span>
          <span class="bubble-time">AI Assistant</span>
        </div>`;
        }
    });

    // Scroll to bottom
    scrollToBottom();
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    if (!chatInput || !messagesContainer || isProcessing) return;

    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    const userMsg = { role: 'user', text, timestamp: Date.now() };
    chatMessages.push(userMsg);
    messagesContainer.insertAdjacentHTML('beforeend', createBubbleHTML(userMsg));

    chatInput.value = '';
    chatInput.style.height = 'auto';
    scrollToBottom();

    // Show typing indicator
    isProcessing = true;
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-typing';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingEl);
    scrollToBottom();

    // Send to Gemini
    const conversationForAI = chatMessages.map(m => ({ role: m.role, text: m.text }));
    const aiResponse = await sendToGemini(conversationForAI);

    // Remove typing indicator
    typingEl.remove();

    // Add AI response
    const aiMsg = { role: 'ai', text: aiResponse, timestamp: Date.now() };
    chatMessages.push(aiMsg);
    messagesContainer.insertAdjacentHTML('beforeend', createBubbleHTML(aiMsg));

    // Speak the AI response
    speakText(aiResponse);

    // Save to localStorage
    saveChatHistory(chatMessages);

    isProcessing = false;
    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
    }
}

function toggleVoiceInput() {
    const voiceBtn = document.getElementById('voice-btn');
    const chatInput = document.getElementById('chat-input');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice input not supported — use Chrome browser');
        return;
    }

    if (recognition) {
        recognition.stop();
        recognition = null;
        voiceBtn?.classList.remove('recording');
        return;
    }

    // Request microphone permission first
    navigator.mediaDevices?.getUserMedia({ audio: true })
        .then((stream) => {
            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(t => t.stop());

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            const settings = getSettings();
            recognition.lang = settings.language === 'hi' ? 'hi-IN' : 'en-IN';
            recognition.continuous = false;
            recognition.interimResults = true;

            voiceBtn?.classList.add('recording');
            showToast('🎤 Listening... speak now');

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                if (chatInput) chatInput.value = transcript;
            };

            recognition.onend = () => {
                voiceBtn?.classList.remove('recording');
                recognition = null;
                if (chatInput?.value.trim()) {
                    sendMessage();
                }
            };

            recognition.onerror = (event) => {
                voiceBtn?.classList.remove('recording');
                recognition = null;
                if (event.error === 'no-speech') {
                    showToast('No speech detected — try again');
                } else if (event.error === 'not-allowed') {
                    showToast('Microphone access denied');
                } else {
                    showToast(`Voice error: ${event.error}`);
                }
            };

            recognition.start();
        })
        .catch(() => {
            showToast('Microphone access denied — check browser permissions');
        });
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

let currentAudio = null;

async function speakText(text) {
    if (!ttsEnabled) return;

    // Stop any ongoing speech
    stopSpeaking();

    // Strip markdown/emojis for cleaner speech
    const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/⚠️|🚨|📞|🏥|🚓|🚑|🔥|👩|👶|👴|🚆|🌪|✅|❌|💊|🩹|❤️|🛡️|⚡|🎤|👋|🤖|🆘/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/#/g, '')
        .trim();

    if (!cleanText) return;

    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    const settings = getSettings();
    const isHindi = settings.language === 'hi';

    if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
        // Fallback to browser TTS
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
            utterance.rate = 1.05;
            window.speechSynthesis.speak(utterance);
        }
        return;
    }

    try {
        // ElevenLabs streaming TTS
        // George voice for both — multilingual model for Hindi
        const voiceId = 'JBFqnCBsd6RMkjVDRZzb'; // George
        const modelId = isHindi ? 'eleven_multilingual_v2' : 'eleven_turbo_v2';
        console.log('TTS:', isHindi ? 'Hindi/Manav' : 'English/George', 'model:', modelId);
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text: cleanText,
                    model_id: modelId,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        speed: 1.1,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.warn('ElevenLabs error:', response.status, errText);
            return;
        }

        // Stream audio
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        currentAudio = new Audio(audioUrl);
        currentAudio.playbackRate = 1.0;
        currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
        };
        currentAudio.play();
    } catch (err) {
        console.warn('TTS error:', err);
    }
}

function stopSpeaking() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    window.speechSynthesis?.cancel();
}

export function unmount() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    stopSpeaking();
}
