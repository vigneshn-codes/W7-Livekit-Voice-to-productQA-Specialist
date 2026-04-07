import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useRoomContext,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

// ── 3D Orb ────────────────────────────────────────────────────────────────────
function AgentOrb({ state }) {
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';

  return (
    <div className="orb-scene">
      {/* Emanating rings when speaking */}
      {isSpeaking && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="orb-ring"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45, ease: 'easeOut' }}
        />
      ))}

      {/* 3D Sphere */}
      <motion.div
        className="orb-sphere"
        animate={{
          scale: isSpeaking
            ? [1, 1.07, 1.03, 1.09, 1.02, 1]
            : isListening
            ? [1, 1.025, 1]
            : 1,
          filter: isSpeaking
            ? ['brightness(1.25) saturate(1.6)', 'brightness(1.5) saturate(2.2)', 'brightness(1.25) saturate(1.6)']
            : ['brightness(1) saturate(1)'],
        }}
        transition={{
          duration: isSpeaking ? 0.45 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Specular highlight — gives 3D depth */}
        <div className="orb-highlight" />
        {/* Rim light on bottom-right */}
        <div className="orb-rim" />
        {/* Inner glow core */}
        <motion.div
          className="orb-core"
          animate={{
            opacity: isSpeaking ? [0.5, 1, 0.5] : isListening ? [0.25, 0.5, 0.25] : [0.15, 0.25, 0.15],
            scale:   isSpeaking ? [0.45, 0.75, 0.45] : [0.4, 0.45, 0.4],
          }}
          transition={{ duration: isSpeaking ? 0.5 : 2.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
}

// ── Live Transcript ───────────────────────────────────────────────────────────
function TranscriptPanel({ transcripts }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="transcript-scroll">
      {transcripts.length === 0 ? (
        <p className="transcript-empty">Transcript will appear here as you speak…</p>
      ) : (
        <AnimatePresence initial={false}>
          {transcripts.map((t, i) => (
            <motion.div
              key={t.id ?? i}
              className={`transcript-line ${t.isAgent ? 'agent' : 'user'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <span className="transcript-speaker">{t.speaker}</span>
              <span className="transcript-text">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Dashboard (shown when connected) ─────────────────────────────────────────
function VoiceDashboard({ onDisconnect }) {
  const { state } = useVoiceAssistant();
  const room = useRoomContext();
  const [transcripts, setTranscripts] = useState([]);

  useEffect(() => {
    if (!room) return;

    const handleTranscription = (segments, participant) => {
      const isAgent = !participant || participant.identity !== 'user';
      segments.forEach(segment => {
        if (!segment.text.trim()) return;
        setTranscripts(prev => {
          const idx = prev.findIndex(t => t.id === segment.id);
          const entry = {
            id: segment.id,
            text: segment.text,
            speaker: isAgent ? 'Assistant' : 'You',
            isAgent,
          };
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = entry;
            return updated;
          }
          return [...prev.slice(-40), entry];
        });
      });
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => room.off(RoomEvent.TranscriptionReceived, handleTranscription);
  }, [room]);

  const STATE_META = {
    disconnected: { label: 'Offline',     color: '#6b7280' },
    initializing: { label: 'Starting…',   color: '#6b7280' },
    listening:    { label: 'Listening',   color: '#22c55e' },
    thinking:     { label: 'Thinking…',   color: '#f59e0b' },
    processing:   { label: 'Processing…', color: '#f59e0b' },
    speaking:     { label: 'Speaking',    color: '#a855f7' },
  };
  const meta = STATE_META[state] ?? { label: state, color: '#6b7280' };

  const hint =
    state === 'listening' ? "Go ahead, I'm listening…" :
    state === 'speaking'  ? 'Playing response…' :
    state === 'thinking'  ? 'Working on it…' :
    'Ask me anything about our products';

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="brand">
          <span className="brand-live" />
          <span className="brand-name">AI Support Assistant</span>
        </div>
        <button className="glass-button exit-btn" onClick={onDisconnect}>
          End Session
        </button>
      </div>

      {/* Body */}
      <div className="dashboard-body">

        {/* Left — 3D Orb + status */}
        <div className="orb-panel">
          <AgentOrb state={state} />

          <motion.div
            className="state-badge"
            style={{ '--dot-color': meta.color }}
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="state-dot" />
            {meta.label}
          </motion.div>

          <p className="orb-hint">{hint}</p>
        </div>

        {/* Right — Live Transcript */}
        <div className="transcript-panel glass-panel">
          <div className="transcript-header">
            <span>Live Transcript</span>
            <button className="glass-button clear-btn" onClick={() => setTranscripts([])}>
              Clear
            </button>
          </div>
          <TranscriptPanel transcripts={transcripts} />
        </div>

      </div>
    </div>
  );
}

// ── Connection Screen ─────────────────────────────────────────────────────────
function ConnectScreen({ onConnect }) {
  const [roomUrl, setRoomUrl] = useState(
    () => localStorage.getItem('lk_url') || import.meta.env.VITE_LIVEKIT_URL || ''
  );
  const [token, setToken] = useState(() => localStorage.getItem('lk_token') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomUrl && token) {
      localStorage.setItem('lk_url', roomUrl);
      localStorage.setItem('lk_token', token);
      onConnect({ roomUrl, token });
    }
  };

  return (
    <div className="app">
      <div className="bg-orbs">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      <div className="connect-screen">
        <motion.div
          className="connect-card glass-panel"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          {/* Preview orb */}
          <div className="connect-orb-wrap">
            <motion.div
              className="connect-orb"
              animate={{ scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <h1 className="gradient-text">AI Voice Assistant</h1>
          <p className="connect-subtitle">
            Ask anything about our products and services — just speak naturally.
          </p>

          <form onSubmit={handleSubmit} className="connect-form">
            <input
              className="glass-input"
              placeholder="LiveKit Server URL (ws://…)"
              value={roomUrl}
              onChange={e => setRoomUrl(e.target.value)}
              required
            />
            <input
              className="glass-input"
              placeholder="Access Token"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
            <button type="submit" className="primary-button">
              Start Conversation
            </button>
          </form>

          <p className="connect-note">
            Microphone access required &nbsp;·&nbsp; Powered by LiveKit + OpenAI
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <ConnectScreen onConnect={setSession} />;
  }

  return (
    <LiveKitRoom
      serverUrl={session.roomUrl}
      token={session.token}
      connect={true}
      audio={true}
      video={false}
      style={{ width: '100%', height: '100%' }}
      onDisconnected={() => setSession(null)}
    >
      <RoomAudioRenderer />
      <VoiceDashboard onDisconnect={() => setSession(null)} />
    </LiveKitRoom>
  );
}
