// Gemini Flash AI Service

import { getSettings } from './storage.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are an Emergency AI Assistant built into an SOS safety app used in India. Your role is to help users during emergency situations. 

IMPORTANT GUIDELINES:
- Be calm, clear, and reassuring
- Ask short, direct questions to understand the situation
- Provide actionable step-by-step guidance
- For medical emergencies: provide first-aid instructions (CPR, bleeding control, burns, etc.)
- For fire emergencies: provide evacuation and safety steps
- For crime/safety: provide safety tips and what to tell authorities
- Always recommend calling emergency services when appropriate
- Keep responses concise - this is an emergency, every second counts
- Use simple language anyone can understand
- If user seems in immediate danger, prioritize their safety first

Indian Emergency Numbers you can reference:
- Police: 100
- Ambulance: 108
- Fire: 101
- Women Helpline: 1091
- Child Helpline: 1098
- Universal Emergency: 112

Start by asking what kind of emergency the user is facing if they haven't specified.`;

/**
 * Send message to Gemini Flash and get response
 * @param {Array} conversationHistory - Array of {role, text} objects
 * @returns {Promise<string>}
 */
export async function sendToGemini(conversationHistory) {
    const settings = getSettings();
    const apiKey = settings.geminiApiKey;

    if (!apiKey) {
        return '⚠️ Gemini API key not set. Please go to **Settings** and add your API key to use the AI assistant.\n\nYou can get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).';
    }

    try {
        // Build contents array for Gemini API
        const contents = [];

        // Add system instruction as first user message context
        contents.push({
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT + '\n\nThe user has activated the emergency assistant. Begin the conversation.' }]
        });
        contents.push({
            role: 'model',
            parts: [{ text: 'I understand. I\'m ready to help. What emergency are you facing right now? Please tell me briefly what\'s happening so I can assist you.' }]
        });

        // Add conversation history
        for (const msg of conversationHistory) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        }

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 512,
                    topP: 0.9,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from AI');
        }

        return text;
    } catch (err) {
        console.error('Gemini API error:', err);
        if (err.message.includes('API key')) {
            return '⚠️ Invalid API key. Please check your Gemini API key in Settings.';
        }
        return `⚠️ AI is temporarily unavailable. Error: ${err.message}\n\nIn the meantime, call **112** for immediate emergency help.`;
    }
}

/**
 * Generate an emergency situation summary for contacts
 * @param {Array} chatHistory
 * @returns {Promise<string>}
 */
export async function generateSituationSummary(chatHistory) {
    const summaryRequest = [
        ...chatHistory,
        {
            role: 'user',
            text: 'Based on our conversation, generate a brief 2-line emergency situation summary that I can send to my emergency contacts. Include the type of emergency and key details. Format: "Emergency Type: ... | Details: ..."'
        }
    ];

    return await sendToGemini(summaryRequest);
}
