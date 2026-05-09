import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const WEBHOOK_URL =
  'https://thunderhawk.app.n8n.cloud/webhook/5e4c965c-6c3a-473e-aad0-119e47ec845c/chat';

const INITIAL_MESSAGE = {
  id: 'init',
  role: 'agent',
  text: "Bonjour 👋 Posez-moi une question sur l'actu tech, finance ou crypto de votre veille.",
};

// ── Inline styles using CSS variables ─────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed',
    bottom: '6rem',
    right: '1.5rem',
    width: '350px',
    height: '500px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    animation: 'chatSlideUp 0.25s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    flexShrink: 0,
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
  bubbleAgent: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    padding: '0.6rem 0.9rem',
    borderRadius: '0 var(--radius) var(--radius) var(--radius)',
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    padding: '0.6rem 0.9rem',
    borderRadius: 'var(--radius) 0 var(--radius) var(--radius)',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  footer: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.75rem',
    borderTop: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: 'calc(var(--radius) - 2px)',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--input))',
    color: 'hsl(var(--foreground))',
    fontSize: '0.875rem',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: 'calc(var(--radius) - 2px)',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  fab: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    width: '3.25rem',
    height: '3.25rem',
    borderRadius: '50%',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  errorBubble: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    padding: '0.6rem 0.9rem',
    borderRadius: '0 var(--radius) var(--radius) var(--radius)',
    background: 'hsl(var(--destructive) / 0.15)',
    color: 'hsl(var(--destructive))',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    border: '1px solid hsl(var(--destructive) / 0.3)',
  },
};

// ── Animated loading dots ──────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div style={styles.bubbleAgent} aria-label="Chargement…">
      <span className="chat-dot" />
      <span className="chat-dot" style={{ animationDelay: '0.18s' }} />
      <span className="chat-dot" style={{ animationDelay: '0.36s' }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(crypto.randomUUID());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: text, sessionId: sessionId.current }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const agentText =
        data?.output ??
        "Je n'ai pas pu obtenir une réponse. Veuillez réessayer.";

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'agent', text: agentText },
      ]);
    } catch (err) {
      console.error('[ChatWidget] fetch error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'error',
          text: '⚠️ Une erreur est survenue. Vérifiez votre connexion et réessayez.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        .chat-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          margin: 0 2px;
          border-radius: 50%;
          background: hsl(var(--muted-foreground));
          animation: dotBounce 1.1s infinite ease-in-out;
          vertical-align: middle;
        }
        #chat-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 14px 30px rgba(0,0,0,0.45);
        }
        #chat-send-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        #chat-input:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.25);
        }
      `}</style>

      {/* ── Floating action button ── */}
      <button
        id="chat-fab"
        style={styles.fab}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        title={isOpen ? 'Fermer le chat' : 'Assistant TechWatch'}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* ── Chat window ── */}
      {isOpen && (
        <div
          id="chat-window"
          role="dialog"
          aria-label="Assistant TechWatch"
          style={styles.overlay}
        >
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Assistant TechWatch
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.8,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div id="chat-messages" style={styles.messages}>
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} style={styles.bubbleUser}>
                    {msg.text}
                  </div>
                );
              }
              if (msg.role === 'error') {
                return (
                  <div key={msg.id} style={styles.errorBubble}>
                    {msg.text}
                  </div>
                );
              }
              return (
                <div key={msg.id} style={styles.bubbleAgent}>
                  {msg.text}
                </div>
              );
            })}
            {loading && <LoadingDots />}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer / input */}
          <div style={styles.footer}>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              placeholder="Posez votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                ...styles.input,
                opacity: loading ? 0.6 : 1,
              }}
            />
            <button
              id="chat-send-btn"
              style={styles.sendBtn}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Envoyer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
