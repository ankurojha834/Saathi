import React, { useState, useRef, useEffect } from 'react';

// ============================================================
//  🔮 KAL KA ANKUR — Chat with Your Future Self
//  Uses your Groq backend — no API key needed in frontend
// ============================================================

const FUTURE_YEARS = 5;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://saathi-backend-u648.onrender.com/api';

const SETUP_QUESTIONS = [
  {
    id: 'name',
    question: 'Tumhara naam kya hai?',
    placeholder: 'Apna naam likho...',
    type: 'text',
    minLength: 2,
    errorMsg: 'Naam thoda aur likho...',
  },
  {
    id: 'struggle',
    question: 'Aaj sabse badi mushkil kya hai tumhari zindagi mein?',
    placeholder: 'Exams, family pressure, relationship, career confusion, kuch bhi...',
    type: 'textarea',
    minLength: 10,
    errorMsg: 'Thoda aur detail mein likho — future self ko samajhne do...',
  },
  {
    id: 'dream',
    question: 'Zindagi mein kya chahte ho? Koi bhi cheez — career, love, peace, kuch bhi?',
    placeholder: 'Chahe chota sapna ho ya bada, chahe koi insaan ho ya koi goal...',
    type: 'textarea',
    minLength: 5,
    errorMsg: 'Kuch bhi likho — koi judge nahi karega 💜',
  },
  {
    id: 'fear',
    question: 'Sabse bada dar kya hai? Jo raat ko sone nahi deta?',
    placeholder: 'Koi judge nahi karega — sach likho...',
    type: 'textarea',
    minLength: 10,
    errorMsg: 'Thoda aur share karo — yeh sirf tumhare liye hai...',
  },
];

// ── Call Groq via your backend ──────────────────────────────
async function callFutureSelf(messages, profile, currentYear, futureYear) {
  const systemPrompt = `You are ${profile.name}'s future self, speaking from the year ${futureYear}.

THEIR CURRENT SITUATION IN ${currentYear}:
- Biggest struggle: "${profile.struggle}"
- What they want from life: "${profile.dream}"
- Biggest fear: "${profile.fear}"

YOUR ROLE:
- You ARE them — 5 years older, wiser, and you survived ALL of this
- You remember exactly how hard ${currentYear} felt
- Speak in warm, natural Hinglish (mix Hindi + English naturally like Indian youth)
- Be specific to THEIR emotions and situation — never give generic advice
- Be mysterious about the future: "Main itna nahi bata sakta, but..."
- Validate their pain FIRST, then give hope
- Keep responses under 120 words
- Never say "As an AI" — you ARE their future self
- Never be preachy or lecture them

CRITICAL — HOW TO HANDLE THEIR ANSWERS:
- NEVER quote their exact words back to them in quotes — it sounds robotic and awkward
- Instead, INTERPRET and EMPATHIZE with the feeling behind their words
- If their dream is about a person/relationship (e.g. "she left me") → acknowledge the pain of loss, talk about healing and new connections
- If their struggle is vague → ask a gentle follow-up
- Always speak FROM EXPERIENCE: "Main bhi wahan tha..." not "I see that you feel..."
- Sound like a real human talking to themselves — casual, warm, real

EXAMPLES OF GOOD RESPONSES:
✅ "Yaar, woh dard jo tum feel kar rahe ho kisi ke jaane ka — main jaanta hoon. ${currentYear} mein main bhi raat ko phone scroll karta tha unki purani photos dekhte hue. Aur main ${futureYear} se bol raha hoon — it gets better. Genuinely. Kya hua tha?"
✅ "Exam pressure... haan yaar. Main yaad karta hoon woh feeling — jaise poori duniya judge kar rahi ho. Lekin sun, jo tum abhi face kar rahe ho — yeh tumhe kuch sikha raha hai jo main describe nahi kar sakta. Trust karo. Kya cheez sabse zyada pressure de rahi hai?"

EXAMPLES OF BAD RESPONSES (never do this):
❌ 'tumhara sapna — "she leave me yrr" — yeh 2031 mein bhi zinda hai' (quoting raw input = awkward!)
❌ Generic: "Everything will be okay, just believe in yourself"
❌ Preachy: "You should focus on your studies and family"`;

  try {
    const response = await fetch(`${API_BASE_URL}/kal-ka-ankur`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt,
        profile,
        currentYear,
        futureYear,
      }),
    });

    const data = await response.json();
    if (data.success) return data.message;
    throw new Error(data.error);
  } catch (err) {
    console.error('Kal Ka Ankur API error:', err);
    return getFallbackResponse(profile, futureYear, currentYear);
  }
}

function getFallbackResponse(profile, futureYear, currentYear) {
  // Fallbacks also don't quote raw input
  const responses = [
    `${profile.name}... main jaanta hoon ${currentYear} mein sab kuch bahut overwhelming lag raha hai. Main ${futureYear} se bol raha hoon — tum isse zyada strong ho jitna tumhe lagta hai. Kya puchna chahte ho mujhse? 💚`,
    `Yaar, woh dar jo tum feel kar rahe ho — main bhi wahan se guzra hoon. Aur dekho, main yahan hoon — ${futureYear} mein. Sab theek hoga. Baat karo mujhse. 🔮`,
    `${profile.name}, jo tum chahte ho zindagi mein — woh feeling, woh longing — main samajh sakta hoon. ${futureYear} se bol raha hoon: trust karo process ko. Kuch puchna hai? 💜`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Validate if input is meaningful (not random garbage)
function isValidInput(text) {
  if (!text || text.trim().length < 2) return false;
  const words = text.trim().split(/\s+/);
  if (words.length === 1 && text.length > 20) return false;
  const realChars = text.replace(/[^a-zA-Z\u0900-\u097F]/g, '').length;
  return realChars >= 2;
}

// ── Main Component ─────────────────────────────────────────
const KalKaAnkur = ({ onClose }) => {
  const [phase, setPhase] = useState('intro');
  const [setupStep, setSetupStep] = useState(0);
  const [profile, setProfile] = useState({ name: '', struggle: '', dream: '', fear: '' });
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [setupAnswers, setSetupAnswers] = useState({});
  const [inputError, setInputError] = useState('');
  const messagesEndRef = useRef(null);
  const currentYear = new Date().getFullYear();
  const futureYear = currentYear + FUTURE_YEARS;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSetupNext = () => {
    const q = SETUP_QUESTIONS[setupStep];
    const val = currentInput.trim();

    if (!val || val.length < q.minLength) {
      setInputError(q.errorMsg);
      return;
    }
    if (!isValidInput(val)) {
      setInputError('Yeh samajh nahi aaya — thoda clearly likho 😊');
      return;
    }

    setInputError('');
    const updated = { ...setupAnswers, [q.id]: val };
    setSetupAnswers(updated);
    setCurrentInput('');

    if (setupStep < SETUP_QUESTIONS.length - 1) {
      setSetupStep(prev => prev + 1);
    } else {
      setProfile(updated);
      startFutureChat(updated);
    }
  };

  const startFutureChat = async (p) => {
    setPhase('chat');
    setIsLoading(true);

    // 🔑 KEY FIX: Don't pass raw inputs — ask AI to interpret emotionally
    const openingMessage = {
      role: 'user',
      content: `Open the conversation as ${p.name}'s future self from ${futureYear}.

Context about their current life in ${currentYear}:
- They are struggling with: ${p.struggle}
- What they want from life: ${p.dream}
- Their biggest fear: ${p.fear}

IMPORTANT for your opening message:
1. Do NOT quote their words back in quotes — interpret the feeling behind them
2. Start by acknowledging their biggest pain point emotionally
3. Be warm and mysterious — like you know something they don't yet
4. End with one gentle question to start the conversation
5. Sound like a real person talking to their younger self — casual and real`
    };

    const reply = await callFutureSelf([openingMessage], p, currentYear, futureYear);
    setMessages([{ role: 'future', content: reply, timestamp: new Date() }]);
    setIsLoading(false);
  };

  const sendMessage = async (msg = currentInput) => {
    const val = msg.trim();
    if (!val || isLoading) return;

    if (!isValidInput(val)) {
      setInputError('Yeh samajh nahi aaya — thoda clearly likho 😊');
      return;
    }

    setInputError('');
    const userMsg = { role: 'user', content: val, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setCurrentInput('');
    setIsLoading(true);

    const apiMessages = updatedMessages.map(m => ({
      role: m.role === 'future' ? 'assistant' : 'user',
      content: m.content,
    }));

    const reply = await callFutureSelf(apiMessages, profile, currentYear, futureYear);
    setMessages(prev => [...prev, { role: 'future', content: reply, timestamp: new Date() }]);
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      phase === 'chat' ? sendMessage() : handleSetupNext();
    }
  };

  // ── STYLES ──────────────────────────────────────────────
  const s = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9997, padding: '1rem',
    },
    card: {
      background: 'linear-gradient(160deg, #0a0a1a, #0f0f2a)',
      borderRadius: '24px', width: '100%', maxWidth: '440px',
      color: '#fff', overflow: 'hidden',
      maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 80px rgba(147,51,234,0.3)',
      border: '1px solid rgba(147,51,234,0.2)',
    },
    topBar: { height: '4px', background: 'linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)' },
    closeBtn: {
      background: 'rgba(255,255,255,0.08)', border: 'none',
      color: '#9e9e9e', borderRadius: '50%', width: 32, height: 32,
      cursor: 'pointer', fontSize: '1rem',
    },
    input: {
      width: '100%', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(147,51,234,0.3)',
      borderRadius: '12px', padding: '0.85rem',
      color: '#fff', fontSize: '0.9rem', lineHeight: 1.6,
      outline: 'none', boxSizing: 'border-box',
    },
    btn: (active) => ({
      width: '100%', marginTop: '1rem', padding: '0.85rem',
      background: active ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.08)',
      border: 'none', borderRadius: '12px',
      color: active ? '#fff' : '#616161',
      fontWeight: 700, fontSize: '0.95rem',
      cursor: active ? 'pointer' : 'not-allowed',
      boxShadow: active ? '0 4px 20px rgba(147,51,234,0.3)' : 'none',
    }),
  };

  // ── INTRO SCREEN ───────────────────────────────────────
  if (phase === 'intro') return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.topBar} />
        <div style={{ padding: '2rem', textAlign: 'center', overflowY: 'auto' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🔮</div>
          <h2 style={{
            fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.25rem',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Kal Ka Ankur</h2>
          <p style={{ color: '#9e9e9e', fontSize: '0.82rem', margin: '0 0 1.5rem' }}>
            Chat with your future self — {FUTURE_YEARS} years from now
          </p>

          <div style={{ background: 'rgba(147,51,234,0.08)', border: '1px solid rgba(147,51,234,0.2)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            {[
              ['🔮', 'Tumhara future self tumse baat karega'],
              ['💜', 'Woh tumhari pain samjhega — survived it all'],
              ['🧠', 'AI-powered — genuinely samjhega tumhari baat'],
              ['🔒', 'Sirf tumhare liye — koi nahi dekhega'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <span style={{ fontSize: '0.85rem', color: '#e0e0e0' }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9e9e9e', fontStyle: 'italic', lineHeight: 1.6 }}>
              "Yaar, main jaanta hoon {currentYear} kitna mushkil lag raha hai. Main {futureYear} se bol raha hoon — sab theek hoga. Trust karo."
            </p>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#616161' }}>
              — Tumhara future self, {futureYear}
            </p>
          </div>

          <button onClick={() => setPhase('setup')} style={{
            width: '100%', padding: '0.9rem',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: 'none', borderRadius: '14px',
            color: '#fff', fontWeight: 800, fontSize: '1rem',
            cursor: 'pointer', marginBottom: '0.75rem',
            boxShadow: '0 4px 20px rgba(147,51,234,0.4)',
          }}>
            🔮 Future self se baat karo
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#616161', cursor: 'pointer', fontSize: '0.8rem' }}>
            Abhi nahi
          </button>
        </div>
      </div>
    </div>
  );

  // ── SETUP SCREEN ──────────────────────────────────────
  if (phase === 'setup') {
    const q = SETUP_QUESTIONS[setupStep];
    const progress = ((setupStep + 1) / SETUP_QUESTIONS.length) * 100;
    const isValid = currentInput.trim().length >= q.minLength && isValidInput(currentInput);

    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <div style={s.topBar} />
          <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#9e9e9e' }}>{setupStep + 1} / {SETUP_QUESTIONS.length}</span>
              <button onClick={onClose} style={s.closeBtn}>✕</button>
            </div>

            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔮</div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.5 }}>{q.question}</h3>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: '#616161' }}>
                Koi bhi jawab sahi hai — future self judge nahi karega 💜
              </p>
            </div>

            {q.type === 'textarea' ? (
              <textarea
                autoFocus
                value={currentInput}
                onChange={e => { setCurrentInput(e.target.value); setInputError(''); }}
                onKeyPress={handleKeyPress}
                placeholder={q.placeholder}
                rows={4}
                style={{ ...s.input, resize: 'none', borderColor: inputError ? '#e53935' : 'rgba(147,51,234,0.3)' }}
              />
            ) : (
              <input
                autoFocus
                type="text"
                value={currentInput}
                onChange={e => { setCurrentInput(e.target.value); setInputError(''); }}
                onKeyPress={handleKeyPress}
                placeholder={q.placeholder}
                style={{ ...s.input, borderColor: inputError ? '#e53935' : 'rgba(147,51,234,0.3)' }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
              {inputError ? (
                <span style={{ fontSize: '0.72rem', color: '#ef5350' }}>⚠️ {inputError}</span>
              ) : (
                <span style={{ fontSize: '0.72rem', color: currentInput.length >= q.minLength ? '#4caf50' : '#616161' }}>
                  {currentInput.length >= q.minLength ? '✓ Perfect!' : `${Math.max(0, q.minLength - currentInput.length)} more characters...`}
                </span>
              )}
              <span style={{ fontSize: '0.68rem', color: '#424242' }}>{currentInput.length}</span>
            </div>

            <button onClick={handleSetupNext} disabled={!isValid} style={s.btn(isValid)}>
              {setupStep < SETUP_QUESTIONS.length - 1 ? 'Aage →' : '🔮 Future self se milo'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHAT SCREEN ───────────────────────────────────────
  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.topBar} />

        <div style={{ padding: '1rem 1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', boxShadow: '0 0 15px rgba(147,51,234,0.5)',
            }}>🔮</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile.name} — {futureYear}</div>
              <div style={{ fontSize: '0.7rem', color: '#9e9e9e' }}>Tumhara future self • {FUTURE_YEARS} saal aage</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'rgba(147,51,234,0.2)', border: '1px solid rgba(147,51,234,0.4)', borderRadius: '20px', padding: '3px 12px', fontSize: '0.72rem', color: '#c084fc' }}>{futureYear}</span>
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          </div>
        </div>

        <div style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(147,51,234,0.2)' }} />
          <span style={{ fontSize: '0.65rem', color: '#7c3aed', whiteSpace: 'nowrap' }}>✨ {currentYear} → {futureYear} ✨</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(147,51,234,0.2)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}>
          {isLoading && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔮</div>
              <p style={{ color: '#9e9e9e', fontSize: '0.85rem' }}>Tumhara future self {futureYear} se aa raha hai...</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '0.5rem' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'bounce 0.8s infinite', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isFuture = msg.role === 'future';
            return (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', justifyContent: isFuture ? 'flex-start' : 'flex-end' }}>
                {isFuture && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', boxShadow: '0 0 10px rgba(147,51,234,0.4)' }}>🔮</div>
                )}
                <div style={{
                  maxWidth: '78%',
                  background: isFuture ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.1))' : 'rgba(255,255,255,0.08)',
                  border: isFuture ? '1px solid rgba(147,51,234,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: isFuture ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  padding: '0.75rem 1rem',
                }}>
                  {isFuture && (
                    <div style={{ fontSize: '0.65rem', color: '#7c3aed', marginBottom: '0.3rem', fontWeight: 600 }}>
                      {profile.name} ({futureYear})
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.7, color: '#e0e0e0' }}>{msg.content}</p>
                  <div style={{ fontSize: '0.65rem', color: '#424242', marginTop: '0.3rem', textAlign: 'right' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!isFuture && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                    {(profile.name || 'Y')[0].toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && messages.length > 0 && (
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🔮</div>
              <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(147,51,234,0.3)', borderRadius: '4px 16px 16px 16px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'bounce 0.8s infinite', animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '0.75rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {inputError && (
            <div style={{ fontSize: '0.72rem', color: '#ef5350', marginBottom: '0.4rem', textAlign: 'center' }}>
              ⚠️ {inputError}
            </div>
          )}
          <div style={{ fontSize: '0.72rem', color: '#424242', marginBottom: '0.4rem', textAlign: 'center' }}>
            💜 Kuch bhi puchho — woh judge nahi karega
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={currentInput}
              onChange={e => { setCurrentInput(e.target.value); setInputError(''); }}
              onKeyPress={handleKeyPress}
              placeholder="Future self se puchho..."
              disabled={isLoading}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${inputError ? '#e53935' : 'rgba(147,51,234,0.3)'}`,
                borderRadius: '25px', padding: '0.65rem 1rem',
                color: '#fff', fontSize: '0.88rem', outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !currentInput.trim()}
              style={{
                background: currentInput.trim() && !isLoading ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: '50%', width: 42, height: 42,
                cursor: currentInput.trim() ? 'pointer' : 'not-allowed',
                fontSize: '1.1rem', flexShrink: 0,
                boxShadow: currentInput.trim() ? '0 0 15px rgba(147,51,234,0.4)' : 'none',
              }}
            >→</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Trigger Button ─────────────────────────────────────────
export const KalKaAnkurButton = ({ onClick }) => (
  <button onClick={onClick} style={{
    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))',
    border: '1px solid rgba(147,51,234,0.4)',
    borderRadius: '20px', padding: '0.4rem 0.85rem',
    color: '#e9d5ff', cursor: 'pointer', fontSize: '0.78rem',
    display: 'flex', alignItems: 'center', gap: '0.4rem',
  }}>
    🔮 Kal Ka Ankur
  </button>
);

export default KalKaAnkur;