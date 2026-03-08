// Groq AI Service (OpenAI-compatible API)

import { getSettings } from './storage.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT_EN = `You are an Emergency AI Assistant built into an SOS safety app used in India. Your role is to help users during emergency situations. 

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

const SYSTEM_PROMPT_HI = `आप एक इमरजेंसी AI असिस्टेंट हैं जो भारत में एक SOS सेफ्टी ऐप में बना है। आपका काम इमरजेंसी सिचुएशन में यूजर्स की मदद करना है।

महत्वपूर्ण दिशानिर्देश:
- शांत, स्पष्ट और भरोसेमंद रहें
- स्थिति समझने के लिए छोटे, सीधे सवाल पूछें
- कदम-दर-कदम कार्रवाई योग्य मार्गदर्शन दें
- मेडिकल इमरजेंसी: प्राथमिक चिकित्सा निर्देश दें (CPR, खून रोकना, जलना आदि)
- आग की इमरजेंसी: निकासी और सुरक्षा कदम बताएं
- अपराध/सुरक्षा: सुरक्षा टिप्स दें और अधिकारियों को क्या बताना है बताएं
- हमेशा इमरजेंसी सेवाओं को कॉल करने की सलाह दें
- जवाब संक्षिप्त रखें - यह इमरजेंसी है, हर सेकंड महत्वपूर्ण है
- सरल हिंदी भाषा का उपयोग करें
- हमेशा हिंदी में जवाब दें

भारतीय इमरजेंसी नंबर:
- पुलिस: 100
- एम्बुलेंस: 108
- फायर: 101
- महिला हेल्पलाइन: 1091
- चाइल्ड हेल्पलाइन: 1098
- यूनिवर्सल इमरजेंसी: 112

अगर यूजर ने नहीं बताया है तो पहले पूछें कि किस तरह की इमरजेंसी है।`;

/**
 * Send message to Groq and get response
 * @param {Array} conversationHistory - Array of {role, text} objects
 * @returns {Promise<string>}
 */
export async function sendToGemini(conversationHistory) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const settings = getSettings();
    const systemPrompt = settings.language === 'hi' ? SYSTEM_PROMPT_HI : SYSTEM_PROMPT_EN;

    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        return '⚠️ Groq API key not configured. Please set VITE_GROQ_API_KEY in the .env file.';
    }

    try {
        // Build messages array for OpenAI-compatible API
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.7,
                max_tokens: 512,
                top_p: 0.9,
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error('No response from AI');
        }

        return text;
    } catch (err) {
        console.error('Groq API error:', err);
        if (err.message.includes('API key') || err.message.includes('auth')) {
            return '⚠️ Invalid API key. Please check your Groq API key in Settings.';
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
