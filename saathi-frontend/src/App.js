import React, { useState, useEffect, useRef } from 'react';
import MoodTracker, { MoodTrackerButton } from './MoodTracker';

const App = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [crisisState, setCrisisState] = useState(null);
  const [showMoodTracker, setShowMoodTracker] = useState(false); // 🆕
  const [hasCheckedIn, setHasCheckedIn] = useState(() => {   // 🆕
    try {
      const moods = JSON.parse(localStorage.getItem('saathi_moods') || '[]');
      return moods.some(e => e.date === new Date().toDateString());
    } catch { return false; }
  });
  const messagesEndRef = useRef(null);

  // const API_BASE_URL = 'http://localhost:5000/api';
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://saathi-backend-u648.onrender.com/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize session
  const startSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setShowWelcome(false);
        setTimeout(() => {
          setMessages([{
            role: 'assistant',
            content: 'Hello! मैं Saathi हूं। I understand the pressures you face as an Indian student. Whether it\'s academic stress, family expectations, or just needing someone to talk to - I\'m here for you. What would you like to share today?',
            timestamp: new Date(),
            crisis: null
          }]);
          // 🆕 Prompt mood check-in after welcome
          setTimeout(() => setShowMoodTracker(true), 2000);
        }, 1000);
      }
    } catch (err) {
      setError('Failed to start session. Please check if the backend server is running.');
    }
  };

  // Send message
  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || !sessionId || isLoading) return;

    const userMessage = { role: 'user', content: message.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          crisis: data.crisis || null
        };
        setMessages(prev => [...prev, aiMessage]);

        if (data.crisis) {
          setCrisisState(data.crisis);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment. If you\'re in crisis, please contact KIRAN: 1800-599-0019 (Free, 24/7) 💚',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // 🆕 Handle mood logged — Saathi reacts to low mood
  const handleMoodLogged = (mood) => {
    setHasCheckedIn(true);
    setShowMoodTracker(false);
    if (mood.value <= 2) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Maine dekha ki aaj tumhara mood thoda low hai ${mood.emoji} Kya hua? Baat karo mujhse — main sun raha hoon. 💚`,
          timestamp: new Date(),
          crisis: null
        }]);
      }, 500);
    } else if (mood.value >= 4) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Wah! Aaj ka mood ${mood.emoji} dekh ke achha laga! Yeh energy banaaye rakhna. Kuch share karna hai aaj? 😊`,
          timestamp: new Date(),
          crisis: null
        }]);
      }, 500);
    }
  };

  const quickMessages = [
    { text: 'I am feeling stressed about exams', emoji: '📚', label: 'Exam Stress' },
    { text: 'Family pressure ho rahi hai', emoji: '👨‍👩‍👧‍👦', label: 'Family Pressure' },
    { text: 'I feel anxious about my future', emoji: '😰', label: 'Career Anxiety' },
    { text: 'Mood theek nahi hai aaj', emoji: '😔', label: 'Feeling Low' },
  ];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================
  // 🚨 CrisisPanel
  // ============================================================
  const CrisisPanel = ({ crisis, onDismiss }) => {
    const [countdown, setCountdown] = useState(crisis.autoCall ? 10 : null);
    const [callInitiated, setCallInitiated] = useState(false);
    const intervalRef = useRef(null);
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

    useEffect(() => {
      if (!crisis.autoCall || !isMobile || countdown === null) return;
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            triggerCall(crisis.primaryHelpline.phone);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }, []);

    const triggerCall = (number) => {
      setCallInitiated(true);
      window.location.href = `tel:${number}`;
    };

    const cancelCountdown = () => {
      clearInterval(intervalRef.current);
      setCountdown(null);
    };

    const progressPct = countdown !== null ? (countdown / 10) * 100 : 0;

    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: '1rem',
      }}>
        <div style={{
          background: '#0f0f1a', borderRadius: '20px',
          width: '100%', maxWidth: '420px', color: '#fff',
          boxShadow: '0 0 60px rgba(229,57,53,0.35)',
          overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto',
        }}>
          <div style={{
            height: '5px',
            background: crisis.severity === 'high'
              ? 'linear-gradient(90deg,#e53935,#b71c1c)'
              : 'linear-gradient(90deg,#fb8c00,#e65100)'
          }} />
          <div style={{ padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.2rem' }}>💚</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.4rem 0 0.2rem' }}>
                Tum Akele Nahi Ho
              </h2>
              <p style={{ color: '#9e9e9e', fontSize: '0.85rem', margin: 0 }}>
                You are not alone. Real help is one call away.
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid #4caf50',
              borderRadius: '0 10px 10px 0', padding: '0.85rem 1rem', marginBottom: '1rem',
            }}>
              <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.9rem', color: '#e0e0e0' }}>
                {crisis.message}
              </p>
            </div>

            {/* Mobile: countdown | Laptop: show number */}
            {crisis.autoCall && (
              isMobile ? (
                countdown !== null && countdown > 0 && (
                  <div style={{
                    background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.4)',
                    borderRadius: '12px', padding: '1rem', marginBottom: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.88rem' }}>🚨 Auto-calling KIRAN in</span>
                      <strong style={{ fontSize: '1.5rem', color: '#ef5350' }}>{countdown}s</strong>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#e53935,#ef9a9a)', borderRadius: '3px', transition: 'width 1s linear' }} />
                    </div>
                    <button onClick={cancelCountdown} style={{ background: 'transparent', border: '1px solid #555', color: '#9e9e9e', borderRadius: '8px', padding: '4px 14px', cursor: 'pointer', fontSize: '0.78rem' }}>
                      Cancel auto-call
                    </button>
                  </div>
                )
              ) : (
                <div style={{ background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.4)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#ef9a9a' }}>🚨 Please call this number RIGHT NOW:</p>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '3px', margin: '0.5rem 0' }}>1800-599-0019</div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#9e9e9e' }}>KIRAN • Toll Free • 24/7 • Free • Confidential</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#80cbc4' }}>📱 Apne phone se abhi call karo</p>
                </div>
              )
            )}

            {callInitiated && (
              <div style={{ background: '#1b5e20', color: '#a5d6a7', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }} />
                Connecting to {crisis.primaryHelpline?.name}...
              </div>
            )}

            <p style={{ color: '#757575', fontSize: '0.78rem', margin: '0 0 0.5rem' }}>📞 Free & confidential helplines:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {crisis.resources.map((h, i) => (
                <button key={i} onClick={() => triggerCall(h.phone)} style={{
                  background: i === 0 ? 'linear-gradient(135deg,#c62828,#e53935)' : 'rgba(255,255,255,0.05)',
                  border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '0.75rem 1rem', cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
                  boxShadow: i === 0 ? '0 4px 15px rgba(229,57,53,0.3)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>📞</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{h.name} — {h.display}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                        {h.description} • {h.availability}{h.tollFree && ' • Toll Free'}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>→</span>
                </button>
              ))}
            </div>

            <details style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem', marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#80cbc4', fontSize: '0.85rem' }}>
                🧘 Try a quick grounding exercise (5-4-3-2-1)
              </summary>
              <div style={{ paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[['👁','5 cheezein dekho','things you can SEE'],['✋','4 cheezein chuo','things you can TOUCH'],['👂','3 awaazein suno','sounds you can HEAR'],['👃','2 khusboo mahso karo','things you can SMELL'],['👅','1 taste notice karo','thing you can TASTE']].map(([icon, hindi, english]) => (
                  <div key={english} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 500 }}>{hindi}</div>
                      <div style={{ fontSize: '0.7rem', color: '#757575' }}>{english}</div>
                    </div>
                  </div>
                ))}
                <p style={{ margin: '0.5rem 0 0', color: '#80cbc4', fontSize: '0.78rem', fontStyle: 'italic' }}>
                  Breathe in 4... hold 4... out 4... Tum theek rahoge. 💚
                </p>
              </div>
            </details>

            {crisis.severity === 'medium' && (
              <button onClick={onDismiss} style={{ display: 'block', width: '100%', background: 'transparent', color: '#616161', border: '1px solid #333', borderRadius: '10px', padding: '0.6rem', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Main theek hoon, Saathi se baat karna chahta hoon
              </button>
            )}
            <p style={{ textAlign: 'center', color: '#424242', fontSize: '0.72rem', margin: 0 }}>
              🔒 100% anonymous — no data saved, no one notified
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Message component
  const Message = ({ message }) => {
    const isUser = message.role === 'user';
    return (
      <div className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-0`}>
        {!isUser && (
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">S</div>
        )}
        <div className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white rounded-br-md' : message.isError ? 'bg-red-100 text-red-800 border border-red-300 rounded-bl-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
          <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">{message.content}</div>
          {message.crisis && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs">
              <p className="font-bold text-red-800 mb-1">🚨 Helplines:</p>
              {message.crisis.resources.slice(0, 2).map((r, i) => (
                <div key={i}><a href={`tel:${r.phone}`} className="text-red-600 hover:underline">{r.name}: {r.display}</a></div>
              ))}
            </div>
          )}
          <div className="text-xs opacity-60 mt-1 sm:mt-2">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {isUser && (
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">Y</div>
        )}
      </div>
    );
  };

  // Typing indicator
  const TypingIndicator = () => (
    <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4 px-2 sm:px-0">
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">S</div>
      <div className="bg-gray-100 px-3 sm:px-4 py-2 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs sm:text-sm">Saathi is typing</span>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">

      {/* 🚨 Crisis Panel */}
      {crisisState && <CrisisPanel crisis={crisisState} onDismiss={() => setCrisisState(null)} />}

      {/* 🌿 Mood Tracker */}
      {showMoodTracker && (
        <MoodTracker
          onClose={() => setShowMoodTracker(false)}
          onMoodLogged={handleMoodLogged}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center">
              <img src="/img.png" alt="Logo" className="w-6 h-6 mr-2" />
              Saathi
            </h1>
            {/* 🆕 Mood tracker button — only shown after session starts */}
            {sessionId && (
              <MoodTrackerButton
                onClick={() => setShowMoodTracker(true)}
                hasCheckedIn={hasCheckedIn}
              />
            )}
          </div>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Your AI Mental Wellness Companion - Anonymous, Safe, Culturally Aware
          </p>
          {sessionId && (
            <div className="text-xs text-blue-200 mt-1">Session: {sessionId.slice(-8)}</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden">

        {/* Welcome Screen */}
        {showWelcome && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="text-center max-w-sm sm:max-w-md">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 animate-pulse">🌟</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                नमस्ते! Welcome to Saathi
              </h2>
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Your anonymous, culturally-aware AI companion for mental wellness support.
                I understand the unique pressures faced by Indian youth and can communicate
                in both Hindi and English.
              </p>
              <div className="space-y-3">
                <button onClick={startSession} className="bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto">
                  Start Anonymous Chat
                </button>
                <p className="text-xs text-gray-500">No registration required • Completely anonymous • Safe space</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {sessionId && (
          <>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 messages">
              {messages.map((message, index) => (<Message key={index} message={message} />))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-white p-3 sm:p-4 shadow-lg">
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                {quickMessages.map((quick, index) => (
                  <button key={index} onClick={() => sendMessage(quick.text)} disabled={isLoading}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="text-sm">{quick.emoji}</span>
                    <span className="hidden sm:inline">{quick.label}</span>
                    <span className="sm:hidden text-xs">{quick.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 sm:gap-3">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress} placeholder="Type your message... (Hindi/English)"
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
                  maxLength={500} />
                <button onClick={() => sendMessage()} disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-[80px] text-sm sm:text-base">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    </div>
                  ) : 'Send'}
                </button>
              </div>

              <div className="text-xs text-gray-400 mt-1 sm:mt-2 text-right">{inputMessage.length}/500</div>

              {error && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-xs sm:text-sm">
                  <strong>Connection Error:</strong> {error}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;