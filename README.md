# Raksha - SOS Emergency PWA

A Progressive Web App for emergency situations in India. Features an SOS radial dashboard, AI-powered emergency assistant, nearby help map, and emergency contact alerts.

## Links

- [Pitch Video](https://drive.google.com/file/d/180egKlZOUfEhjkh_Zdt1TaXjJ47UPn8R/view?usp=sharing)
- [Demo Video](https://drive.google.com/file/d/15QNgy5mF_Kbo1cCMKWxhb9IKNbQ-3bK_/view?usp=sharing)
- [Presentation](https://drive.google.com/file/d/1QKVGD-2xkQt-Z_kV0SYK4vciuil-vczT/view?usp=sharing)

## Features

- SOS Radial Dashboard
- AI Emergency Assistant
- Nearby Help Map
- Emergency Contacts
- Shake to SOS
- Hindi Support
- Dark/Light Mode
- Offline Ready

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vite + Vanilla JavaScript |
| AI | Groq API (Llama 3.3 70B) |
| TTS | ElevenLabs API (George voice) |
| Voice Input | Web Speech API |
| Maps | Leaflet + OpenStreetMap + Overpass API |
| Storage | localStorage |
| PWA | Service Worker + Web App Manifest |

## Setup

```bash
# Clone
git clone https://github.com/niveaaa/raksha-app.git
cd raksha-app

# Install
npm install

# Configure API keys
cp .env.example .env
# Edit .env with your keys:
#   VITE_GROQ_API_KEY=your_groq_key
#   VITE_ELEVENLABS_API_KEY=your_elevenlabs_key

# Run
npm run dev
```

### API Keys

| Service | Get Key | Required |
|---|---|---|
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Yes (for AI chat) |
| ElevenLabs | [elevenlabs.io](https://elevenlabs.io) | Optional (falls back to browser TTS) |

## Indian Emergency Numbers

| Service | Number |
|---|---|
| Police | 100 |
| Ambulance | 108 |
| Fire | 101 |
| Women Helpline | 1091 |
| Child Helpline | 1098 |
| Universal Emergency | 112 |

## Project Structure

```
src/
├── main.js              # Router + initialization
├── screens/
│   ├── home.js          # SOS radial dashboard
│   ├── ai-assistant.js  # AI chat + voice + TTS
│   ├── nearby-help.js   # Leaflet map
│   ├── contacts.js      # Emergency contacts
│   └── settings.js      # App settings
├── services/
│   ├── gemini.js        # Groq API client
│   ├── location.js      # GPS + navigation
│   ├── sms.js           # SMS alerts
│   ├── storage.js       # localStorage helpers
│   └── shake-detector.js
└── styles/              # Component CSS files
```

## License

MIT
