# 🎙️ LiveKit Voice-to-Workflow (n8n Specialist)

An AI-powered voice assistant that listens to user requests, designs automation workflows, and creates them directly in **n8n** using a consultative approach.

This project combines **LiveKit voice agents**, **LLM reasoning**, and **n8n API automation** to turn spoken ideas into fully functional workflows.

---

## 🚀 Features

* 🎤 Voice-based interaction using LiveKit
* 🧠 AI-powered workflow design (LLM-driven)
* 🔄 Automatic n8n workflow creation via API
* ❓ Interactive clarification before execution
* 🧩 Modular architecture (frontend + backend)

---

## 🏗️ Project Structure

```
├── frontend/               # Vite + React frontend
│   ├── src/
│   ├── public/
│   └── dist/
│
├── backend/               # Python voice agent + n8n tools
│   ├── agent.py           # LiveKit voice agent logic
│   ├── n8n_tools.py       # n8n workflow creation utilities
│   ├── requirements.txt
│   └── .env.example
```

---

## ⚙️ How It Works

1. User speaks a workflow idea
2. Voice agent:

   * Listens to intent
   * Asks clarifying questions
   * Drafts workflow architecture
3. Upon approval:

   * Converts logic into n8n JSON
   * Calls `create_workflow` tool
   * Pushes workflow to n8n instance

---

## 🧠 Agent Behavior

The AI agent follows a strict consultative workflow:

1. **Listen** → Understand user intent
2. **Clarify** → Ask about triggers, actions, credentials
3. **Draft** → Propose workflow structure
4. **Execute** → Create workflow only after approval

---

## 🛠️ Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example`:

```bash
cp .env.example .env
```

Update values:

```env
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

OPENAI_API_KEY=

N8N_BASE_URL=
N8N_API_KEY=
```

(Optional) Use Ollama:

```env
USE_OLLAMA=true
```

---

### 3. Run Voice Agent

```bash
python agent.py
```

---

## 🌐 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 🔌 n8n Integration

The backend includes utility functions:

* `create_workflow` → Sends workflow JSON to n8n
* `research_n8n_node` → Helps AI understand node capabilities

Ensure your n8n instance:

* Is running
* Has API access enabled
* Accepts authenticated requests

---

## 📦 Tech Stack

* **Frontend:** React + Vite
* **Backend:** Python
* **Voice:** LiveKit Agents
* **LLM:** OpenAI / Ollama
* **Automation:** n8n

---

## 🧪 Example Use Case

> “Create a workflow that sends me a Slack message when I receive a new email.”

The agent will:

1. Ask for email provider details
2. Ask for Slack credentials
3. Draft nodes:

   * Email Trigger
   * Slack Node
4. Create workflow in n8n after approval

---

## ⚠️ Notes

* Workflow is only created after explicit user confirmation
* Agent maintains conversational context
* Designed for iterative refinement

---

## 📌 Future Improvements

* UI for workflow visualization
* Workflow editing via voice
* Multi-language support
* Error handling & retry logic

---

## 🤝 Contributing

Feel free to fork the project and submit PRs for improvements.

---

## 📄 License

MIT License

---

## 👤 Author

Vignesh Nagarajan - AI Engineer