# AI Voice Assistant — Product Q&A

A real-time AI voice assistant that answers questions about your products and services. Speak naturally — it listens, responds, and shows a live transcript with a 3D animated orb that reacts to the conversation.

Built with **LiveKit** (Docker), **OpenAI** (Whisper STT + GPT-4o-mini + TTS), and **React + Framer Motion**.

---

## Features

- **Voice Q&A** — ask questions out loud, get spoken answers instantly
- **Live Transcript** — real-time display of everything said by you and the assistant
- **3D Animated Orb** — pulses and emits rings when speaking, breathes when listening
- **Knowledge Base** — edit a single text file to customize the agent's answers
- **Interruption support** — speak over the agent at any time

---

## Project Structure

```
├── backend/
│   ├── agent.py            # LiveKit voice agent (STT → LLM → TTS)
│   ├── knowledge_base.txt  # Edit this with your product/service info
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # API keys and LiveKit config
│   └── livekit.yaml        # LiveKit server config reference
│
└── frontend/
    └── src/
        ├── App.jsx         # UI: 3D orb + live transcript + connect screen
        └── index.css       # Dark glassmorphic theme + 3D orb styles
```

---

## Setup

### Prerequisites
- Docker (for LiveKit server)
- Python 3.11+
- Node.js 18+
- OpenAI API key

---

### Step 1 — Start LiveKit Server (Docker)

Pull the LiveKit images:

```bash
docker pull livekit/generate
docker pull livekit/livekit-server
```

Start the LiveKit server in dev mode (exposes ports for WebSocket, TCP, and UDP):

```bash
docker run --rm \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  livekit/livekit-server \
  --dev --bind 0.0.0.0
```

> The server runs in dev mode with credentials `devkey` / `secret`. Keep this terminal open — it must stay running while you use the app.

---

### Step 2 — Generate a Room Access Token

Install the LiveKit CLI if you don't have it:

```bash
brew install livekit-cli
```

Generate a token (valid for 24 hours):

```bash
livekit-cli create-token \
  --api-key devkey \
  --api-secret secret \
  --join \
  --room n8n-room \
  --identity user \
  --valid-for 24h
```

Copy the printed token — you'll paste it into the frontend connect screen.

---

### Step 3 — Backend (Voice Agent)

```bash
cd backend
python -m venv myenv && source myenv/bin/activate
pip install -r requirements.txt
```

Configure `backend/.env`:

```env
LIVEKIT_URL=ws://127.0.0.1:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
OPENAI_API_KEY=sk-...
```

Edit `backend/knowledge_base.txt` with your product/service information.

Start the voice agent:

```bash
python agent.py dev
```

The agent connects to LiveKit and waits for a user to join the room.

---

### Step 4 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser, then:
1. Enter LiveKit Server URL: `ws://127.0.0.1:7880`
2. Paste the access token from Step 2
3. Click **Start Conversation** and allow microphone access

---

## Running Order (every session)

```
1. docker run ... livekit/livekit-server --dev --bind 0.0.0.0   ← LiveKit server
2. python agent.py dev                                           ← Voice agent
3. npm run dev  (in frontend/)                                   ← UI
```

---

## Customizing the Knowledge Base

Open `backend/knowledge_base.txt` and replace the sample content with your own product/service information — pricing, FAQs, support details, etc. The agent reads this file on every startup.

---

## Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Voice      | LiveKit (Docker, WebRTC)         |
| STT        | OpenAI Whisper                   |
| LLM        | OpenAI GPT-4o-mini               |
| TTS        | OpenAI TTS                       |
| VAD        | Silero VAD                       |
| Frontend   | React 19 + Vite + Framer Motion  |
| Styling    | CSS glassmorphism + 3D orb       |
