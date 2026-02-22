import React, { useState, useEffect } from 'react';

// ============================================================
//  SAATHI 🤝 — Mann Ka Haal (Mood Tracker)
//  Daily mood check-ins, stored locally, shown as weekly graph
// ============================================================

const MOODS = [
  { emoji: '😄', label: 'Bahut Accha', value: 5, color: '#4caf50', hinglish: 'Feeling great!' },
  { emoji: '🙂', label: 'Theek Hai', value: 4, color: '#8bc34a', hinglish: 'Doing okay' },
  { emoji: '😐', label: 'Normal', value: 3, color: '#ffc107', hinglish: 'Just normal' },
  { emoji: '😔', label: 'Thoda Low', value: 2, color: '#ff9800', hinglish: 'Feeling low' },
  { emoji: '😢', label: 'Bahut Bura', value: 1, color: '#f44336', hinglish: 'Really bad' },
];

const TRIGGERS = [
  { emoji: '📚', label: 'Exams' },
  { emoji: '👨‍👩‍👧', label: 'Family' },
  { emoji: '💔', label: 'Relationship' },
  { emoji: '💸', label: 'Money' },
  { emoji: '😴', label: 'Sleep' },
  { emoji: '🏥', label: 'Health' },
  { emoji: '👥', label: 'Friends' },
  { emoji: '🎯', label: 'Career' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Save/load from localStorage
function saveMoodEntry(entry) {
  const existing = JSON.parse(localStorage.getItem('saathi_moods') || '[]');
  const today = new Date().toDateString();
  const filtered = existing.filter(e => e.date !== today);
  filtered.push(entry);
  // Keep only last 30 days
  const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
  localStorage.setItem('saathi_moods', JSON.stringify(sorted));
}

function loadMoodHistory() {
  return JSON.parse(localStorage.getItem('saathi_moods') || '[]');
}

function getTodayEntry() {
  const today = new Date().toDateString();
  const history = loadMoodHistory();
  return history.find(e => e.date === today) || null;
}

function getLast7Days() {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const history = loadMoodHistory();
    const entry = history.find(e => e.date === dateStr);
    result.push({
      day: DAYS[d.getDay()],
      date: dateStr,
      mood: entry ? entry.mood : null,
      isToday: i === 0,
    });
  }
  return result;
}

// ── Main MoodTracker Component ─────────────────────────────
const MoodTracker = ({ onClose, onMoodLogged }) => {
  const [step, setStep] = useState('check'); // check | select | triggers | note | done | history
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [note, setNote] = useState('');
  const [todayEntry, setTodayEntry] = useState(getTodayEntry());
  const [weekData, setWeekData] = useState(getLast7Days());
  const [animateIn, setAnimateIn] = useState(true);

  useEffect(() => {
    // If already logged today, go to history view
    if (todayEntry) setStep('history');
  }, []);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setStep('triggers');
  };

  const toggleTrigger = (trigger) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger.label)
        ? prev.filter(t => t !== trigger.label)
        : [...prev, trigger.label]
    );
  };

  const handleSave = () => {
    const entry = {
      date: new Date().toDateString(),
      timestamp: new Date().toISOString(),
      mood: selectedMood,
      triggers: selectedTriggers,
      note: note.trim(),
    };
    saveMoodEntry(entry);
    setTodayEntry(entry);
    setWeekData(getLast7Days());
    setStep('done');
    if (onMoodLogged) onMoodLogged(selectedMood);
  };

  const getMoodMessage = (moodValue) => {
    if (moodValue >= 4) return "Yaar, yeh sun ke achha laga! 😊 Khush rehna.";
    if (moodValue === 3) return "Theek hai — normal days bhi zaroori hote hain. 🌱";
    if (moodValue === 2) return "Thoda low feel ho raha hai. Main hoon na, baat karo. 💚";
    return "Yeh sun ke dil bhaari ho gaya. Tum akele nahi ho. 🤝";
  };

  const getStreakCount = () => {
    const history = loadMoodHistory();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const found = history.find(e => e.date === d.toDateString());
      if (found) streak++;
      else break;
    }
    return streak;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9998, padding: '1rem',
    }}>
      <div style={{
        background: '#0f0f1a',
        borderRadius: '24px',
        width: '100%', maxWidth: '400px',
        color: '#fff',
        boxShadow: '0 0 60px rgba(76,175,80,0.2)',
        overflow: 'hidden',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Top bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #4caf50, #81c784, #4caf50)' }} />

        <div style={{ padding: '1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>🌿 Mann Ka Haal</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#9e9e9e' }}>Daily mood check-in</p>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.08)', border: 'none',
              color: '#9e9e9e', borderRadius: '50%', width: 32, height: 32,
              cursor: 'pointer', fontSize: '1rem',
            }}>✕</button>
          </div>

          {/* ── STEP: Already logged today ── */}
          {step === 'history' && (
            <div>
              {/* Today's entry */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px', padding: '1rem',
                marginBottom: '1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem' }}>{todayEntry.mood.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.3rem' }}>
                  Aaj: {todayEntry.mood.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9e9e9e', marginTop: '0.2rem' }}>
                  {getMoodMessage(todayEntry.mood.value)}
                </div>
                {todayEntry.triggers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                    {todayEntry.triggers.map(t => (
                      <span key={t} style={{
                        background: 'rgba(255,255,255,0.1)', borderRadius: '20px',
                        padding: '2px 10px', fontSize: '0.72rem',
                      }}>{t}</span>
                    ))}
                  </div>
                )}
                {todayEntry.note && (
                  <p style={{ fontSize: '0.78rem', color: '#bbb', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
                    "{todayEntry.note}"
                  </p>
                )}
              </div>

              {/* 7-day graph */}
              <WeekGraph weekData={weekData} />

              {/* Streak */}
              <div style={{
                background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)',
                borderRadius: '12px', padding: '0.75rem', marginTop: '1rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.5rem' }}>🔥</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {getStreakCount()} day streak!
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9e9e9e' }}>
                    Kal bhi check-in karna mat bhoolo 💚
                  </div>
                </div>
              </div>

              {/* Chat button */}
              <button onClick={onClose} style={{
                display: 'block', width: '100%', marginTop: '1rem',
                background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                border: 'none', borderRadius: '12px', padding: '0.8rem',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                💬 Saathi se baat karo
              </button>
            </div>
          )}

          {/* ── STEP: Select mood ── */}
          {step === 'select' && (
            <div>
              <p style={{ textAlign: 'center', color: '#bbb', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Aaj kaisa feel ho raha hai? 🌸
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {MOODS.map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px', padding: '0.9rem 1rem',
                      cursor: 'pointer', color: '#fff',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${mood.color}22`}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <span style={{ fontSize: '1.8rem' }}>{mood.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mood.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9e9e9e' }}>{mood.hinglish}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: Triggers ── */}
          {step === 'triggers' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{selectedMood.emoji}</span>
                <p style={{ color: '#bbb', fontSize: '0.88rem', margin: '0.5rem 0 0' }}>
                  Kya cheez affect kar rahi hai? (optional)
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                {TRIGGERS.map(trigger => {
                  const selected = selectedTriggers.includes(trigger.label);
                  return (
                    <button
                      key={trigger.label}
                      onClick={() => toggleTrigger(trigger)}
                      style={{
                        background: selected ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)',
                        border: selected ? '1px solid #4caf50' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '0.65rem',
                        cursor: 'pointer', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span>{trigger.emoji}</span> {trigger.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setStep('note')} style={{
                width: '100%', background: 'linear-gradient(135deg,#388e3c,#4caf50)',
                border: 'none', borderRadius: '12px', padding: '0.8rem',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                Aage →
              </button>
            </div>
          )}

          {/* ── STEP: Note ── */}
          {step === 'note' && (
            <div>
              <p style={{ color: '#bbb', fontSize: '0.88rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                Kuch aur share karna hai? (optional)
              </p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Aaj jo feel hua woh yahan likh sakte ho... sirf tumhare liye hai 💚"
                maxLength={200}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '0.85rem',
                  color: '#fff', fontSize: '0.88rem', lineHeight: 1.6,
                  resize: 'none', height: '100px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#616161', marginBottom: '0.75rem' }}>
                {note.length}/200
              </div>
              <button onClick={handleSave} style={{
                width: '100%', background: 'linear-gradient(135deg,#388e3c,#4caf50)',
                border: 'none', borderRadius: '12px', padding: '0.8rem',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                💚 Save Mood
              </button>
            </div>
          )}

          {/* ── STEP: Done ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{selectedMood.emoji}</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Shukriya share karne ke liye 💚</h3>
              <p style={{ color: '#9e9e9e', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                {getMoodMessage(selectedMood.value)}
              </p>

              {/* Week graph */}
              <WeekGraph weekData={weekData} />

              {/* Low mood — suggest chat */}
              {selectedMood.value <= 2 && (
                <div style={{
                  background: 'rgba(76,175,80,0.1)',
                  border: '1px solid rgba(76,175,80,0.3)',
                  borderRadius: '12px', padding: '0.85rem', margin: '1rem 0',
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                    Lagta hai aaj thoda mushkil raha. Saathi se baat karo — judge nahi karega, bas sunéga. 🤝
                  </p>
                </div>
              )}

              <button onClick={onClose} style={{
                width: '100%', background: 'linear-gradient(135deg,#388e3c,#4caf50)',
                border: 'none', borderRadius: '12px', padding: '0.8rem',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                marginTop: '0.5rem',
              }}>
                💬 Saathi se baat karo
              </button>
            </div>
          )}

          {/* ── STEP: Initial check ── */}
          {step === 'check' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌿</div>
              <h3 style={{ margin: '0 0 0.5rem' }}>Aaj ka mood check-in</h3>
              <p style={{ color: '#9e9e9e', fontSize: '0.85rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
                Rozana 1 minute mein apna mood track karo. Yeh sirf tumhare liye hai — koi nahi dekhega. 🔒
              </p>
              <button onClick={() => setStep('select')} style={{
                width: '100%', background: 'linear-gradient(135deg,#388e3c,#4caf50)',
                border: 'none', borderRadius: '12px', padding: '0.9rem',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
                marginBottom: '0.5rem',
              }}>
                🌸 Check in karo
              </button>
              <button onClick={() => setStep('history')} style={{
                width: '100%', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.75rem',
                color: '#9e9e9e', cursor: 'pointer', fontSize: '0.85rem',
              }}>
                📊 Pichle din dekho
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── 7-Day Graph Component ──────────────────────────────────
const WeekGraph = ({ weekData }) => (
  <div>
    <p style={{ fontSize: '0.78rem', color: '#9e9e9e', margin: '0 0 0.5rem' }}>📊 Last 7 days:</p>
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'flex-end', height: '60px' }}>
      {weekData.map((day, i) => {
        const height = day.mood ? `${(day.mood.value / 5) * 100}%` : '8px';
        const color = day.mood ? day.mood.color : 'rgba(255,255,255,0.08)';
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%', height: day.mood ? `${(day.mood.value / 5) * 50}px` : '4px',
                background: color, borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease',
                opacity: day.isToday ? 1 : 0.7,
                boxShadow: day.isToday ? `0 0 8px ${color}` : 'none',
              }} />
            </div>
            <div style={{
              fontSize: '0.6rem', color: day.isToday ? '#4caf50' : '#616161',
              fontWeight: day.isToday ? 700 : 400,
            }}>
              {day.isToday ? 'Aaj' : day.day}
            </div>
            {day.mood && (
              <div style={{ fontSize: '0.65rem' }}>{day.mood.emoji}</div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ── Mood Tracker Button (add to your App.js header) ────────
export const MoodTrackerButton = ({ onClick, hasCheckedIn }) => (
  <button
    onClick={onClick}
    style={{
      background: hasCheckedIn ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.15)',
      border: hasCheckedIn ? '1px solid rgba(76,175,80,0.5)' : '1px solid rgba(255,255,255,0.2)',
      borderRadius: '20px', padding: '0.4rem 0.85rem',
      color: '#fff', cursor: 'pointer', fontSize: '0.78rem',
      display: 'flex', alignItems: 'center', gap: '0.4rem',
    }}
  >
    {hasCheckedIn ? '✅ Mood logged' : '🌿 Mood check-in'}
  </button>
);

export default MoodTracker;