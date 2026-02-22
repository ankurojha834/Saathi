// server.js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// ============================================================
//  Groq client — single instance reused everywhere
// ============================================================
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
//  🚨 CRISIS DETECTION — LAYER 1: Keyword Bank
// ============================================================
const crisisKeywords = {
  high: [
    // English
    'suicide', 'kill myself', 'end it all', 'want to die', 'better off dead',
    'take my life', 'ending my life', 'no reason to live', 'cant live anymore',
    "can't live anymore", 'not worth living', 'rather be dead', 'ready to die',
    // Hindi
    'मरना चाहता', 'मरना चाहती', 'आत्महत्या', 'जीना नही चाहता', 'जीना नहीं चाहती',
    'मौत चाहिए', 'खुद को खत्म', 'जिंदगी खत्म करना',
    // Hinglish
    'khatam karna chahta', 'khatam karna chahti', 'jeena nahi chahta',
    'jeena nahi chahti', 'mar jaana chahta', 'marna chahta', 'suicide karna',
    'khud ko khatam', 'nahi rehna chahta', 'zindagi khatam karna',
  ],
  medium: [
    // English
    'hurt myself', 'self harm', 'no point living', 'feel hopeless',
    'nobody cares', 'burden to everyone', 'disappear forever', 'give up on life',
    "can't go on", 'cant go on', 'nothing to live for', 'so tired of life',
    'i am worthless', 'nobody would miss me', 'what is the point of everything',
    // Hindi
    'उम्मीद नहीं', 'कोई नहीं है', 'थक गया हूं', 'हार गया',
    // Hinglish
    'umeed nahi', 'koi nahi hai', 'thak gaya hoon', 'thak gayi hoon',
    'haar gaya', 'haar gayi', 'koi farak nahi', 'zindagi se thak',
    'ab nahi jee sakta', 'sab chhod dena chahta', 'bahut ho gaya',
    'main bekaar hoon', 'pagal ho jaaunga', 'kuch nahi bachha',
  ]
};

// ============================================================
//  🚨 CRISIS DETECTION — LAYER 2: Groq AI Sentiment
// ============================================================
async function analyzeMessageSentiment(message) {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a crisis detection AI for SAATHI, an Indian mental health app for youth.
Detect suicidal ideation or severe emotional distress in English, Hindi, and Hinglish.
Respond ONLY with valid JSON, no explanation, no markdown:
{
  "isCrisis": boolean,
  "severity": "high" | "medium" | null,
  "confidence": 0.0-1.0
}
HIGH = direct suicidal intent, self-harm, immediate danger
MEDIUM = deep hopelessness, indirect suicidal hints, emotional collapse
Examples of HIGH even if indirect:
- "sab khatam ho jaata toh acha hota"
- "kya farak padta hai agar main rahoon ya na rahoon"
- "I'm just so tired of everything. Just everything."
- "ghar se bhaag jaana chahta hoon"
Only flag confidence above 0.65.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 100,
      temperature: 0.1,
    });

    const text = completion.choices[0].message.content
      .replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    if (parsed.confidence < 0.65) return { isCrisis: false, severity: null };
    return { isCrisis: parsed.isCrisis, severity: parsed.severity };

  } catch (err) {
    console.warn('[CRISIS-AI] Sentiment failed, keywords only:', err.message);
    return { isCrisis: false, severity: null };
  }
}

// ============================================================
//  Combined crisis check — both layers, highest severity wins
// ============================================================
async function detectCrisis(message) {
  const lower = message.toLowerCase();

  // Layer 1: Instant keyword check
  let keywordSeverity = null;
  for (const kw of crisisKeywords.high) {
    if (lower.includes(kw.toLowerCase())) { keywordSeverity = 'high'; break; }
  }
  if (!keywordSeverity) {
    for (const kw of crisisKeywords.medium) {
      if (lower.includes(kw.toLowerCase())) { keywordSeverity = 'medium'; break; }
    }
  }

  // Layer 2: Groq AI sentiment
  const aiResult = await analyzeMessageSentiment(message);

  // Escalate to highest severity
  const rank = { high: 2, medium: 1, null: 0 };
  const finalSeverity =
    (rank[keywordSeverity] ?? 0) >= (rank[aiResult.severity] ?? 0)
      ? keywordSeverity
      : aiResult.severity;

  return {
    isCrisis: finalSeverity !== null,
    severity: finalSeverity,
    detectedBy: keywordSeverity ? 'keyword' : aiResult.isCrisis ? 'ai' : 'none'
  };
}

// ============================================================
//  Crisis resources
// ============================================================
function getCrisisResources(severity) {
  return {
    isEmergency: true,
    severity,
    autoCall: severity === 'high',
    primaryHelpline: {
      name: 'KIRAN',
      phone: '18005990019',
      display: '1800-599-0019',
      tag: 'Toll Free • 24/7 • Govt of India'
    },
    resources: [
      {
        name: 'KIRAN',
        phone: '18005990019',
        display: '1800-599-0019',
        description: '24/7 Free Mental Health Helpline — Govt of India',
        availability: '24/7', tollFree: true
      },
      {
        name: 'Vandrevala Foundation',
        phone: '18602662345',
        display: '1860-2662-345',
        description: '24/7 Free Crisis Helpline',
        availability: '24/7', tollFree: true
      },
      {
        name: 'iCall',
        phone: '9152987821',
        display: '9152987821',
        description: 'Psychosocial Support — TISS Mumbai',
        availability: 'Mon-Sat 8AM-10PM', tollFree: false
      },
      {
        name: 'AASRA',
        phone: '9820466627',
        display: '9820466627',
        description: 'Suicide Prevention Helpline',
        availability: '24/7', tollFree: false
      }
    ],
    message: severity === 'high'
      ? '🚨 Main tumhare baare mein worried hoon. Abhi KIRAN helpline call ho rahi hai — yeh free aur confidential hai. Tum akele nahi ho. 💚'
      : '💚 Lagta hai tum bahut kuch carry kar rahe ho. Neeche diye helpline numbers pe koi bhi baat kar sakta hai — free aur confidential.'
  };
}

// ============================================================
//  💬 Chat response — Groq only
// ============================================================
async function callGeminiAPI(message, conversationHistory = []) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not found in environment variables');
  }

  const recentHistory = conversationHistory.slice(-10).map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are Saathi (साथी), a compassionate AI mental wellness companion for Indian youth aged 16-25.

PERSONALITY:
- Warm, patient, non-judgmental — like a trusted older friend
- Never preachy or lecturing
- Validate feelings BEFORE offering advice
- Ask ONE follow-up question at a time

LANGUAGE:
- Default to Hinglish naturally: "Yaar, yeh sach mein tough hai"
- Match user's language — if they write Hindi reply in Hindi, English in English
- Never use robotic or clinical language

CULTURAL UNDERSTANDING:
- JEE/NEET/Board exam pressure
- Joint family dynamics, parental comparison
- "Log kya kahenge" fear
- Sharma ji ka beta syndrome
- Economic pressure, first-generation students
- Career vs passion conflicts

RESPONSE RULES:
- Always validate first: "Yeh sun ke dil bhaari ho gaya..."
- Keep under 120 words
- Never say "I understand" as opening words — show don't tell
- Ask ONE gentle question to go deeper
- Never give a list of tips unless asked
- Use emojis sparingly (max 1-2)

WHAT TO AVOID:
- Never say "As an AI..."
- Never diagnose
- Never dismiss feelings ("it'll be fine!")
- Never compare their problems to others
- Never give generic Western advice

CRISIS:
- If distress detected → empathy first, helpline second
- KIRAN: 1800-599-0019 (free, 24/7)`
        },
        ...recentHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error('Groq API Error:', error);
    // Safe fallback — never crash, always respond
    return `Yaar, abhi mujhe connect karne mein thodi dikkat ho rahi hai. Ek minute mein dobara try karo. Agar kuch urgent hai toh KIRAN helpline pe call karo: 1800-599-0019 💚`;
  }
}

// Session storage
const sessions = new Map();

function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// ============================================================
//  Routes
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    ai: 'Groq (llama-3.1-70b-versatile)'
  });
});

// Start session
app.post('/api/session/start', (req, res) => {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    id: sessionId,
    messages: [],
    createdAt: new Date(),
    lastActivity: new Date()
  });
  res.json({ success: true, sessionId, message: 'Session started successfully' });
});

// Send message
app.post('/api/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    let session = sessions.get(sessionId);
    if (!session) {
      session = { id: sessionId, messages: [], createdAt: new Date(), lastActivity: new Date() };
      sessions.set(sessionId, session);
    }
    session.lastActivity = new Date();
    session.messages.push({ role: 'user', content: message, timestamp: new Date() });

    // 🚨 Crisis detection + chat response run in PARALLEL
    const [crisisResult, aiResponse] = await Promise.all([
      detectCrisis(message),
      callGeminiAPI(message, session.messages)
    ]);

    const crisisInfo = crisisResult.isCrisis
      ? getCrisisResources(crisisResult.severity)
      : null;

    // Log crisis (severity only — never log message content)
    if (crisisResult.isCrisis) {
      console.log(`[CRISIS] severity=${crisisResult.severity} detectedBy=${crisisResult.detectedBy} session=${sessionId.slice(0, 8)}...`);
    }

    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      crisis: crisisInfo
    });

    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    res.json({
      success: true,
      message: aiResponse,
      crisis: crisisInfo,
      sessionId,
      messageCount: session.messages.length
    });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({
      success: false,
      error: "I'm having trouble connecting right now. Please try again in a moment.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get session history
app.get('/api/session/:sessionId/history', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({
    success: true,
    messages: session.messages,
    sessionInfo: {
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.messages.length
    }
  });
});

// Get resources
app.get('/api/resources', (req, res) => {
  res.json({
    success: true,
    resources: {
      crisis: getCrisisResources('medium').resources,
      selfHelp: [
        {
          type: 'breathing',
          name: '4-7-8 Breathing',
          description: 'Inhale 4 seconds, hold 7, exhale 8',
          instructions: 'Sit comfortably, breathe in through nose for 4 counts, hold for 7, exhale for 8. Repeat 3-4 times.'
        },
        {
          type: 'grounding',
          name: '5-4-3-2-1 Technique',
          description: 'Grounding exercise for anxiety',
          instructions: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.'
        },
        {
          type: 'meditation',
          name: 'Quick Meditation',
          description: '5-minute mindfulness exercise',
          instructions: 'Sit quietly, focus on breath. When thoughts come, acknowledge and return to breathing.'
        }
      ],
      educational: [
        {
          title: 'Understanding Exam Stress',
          description: 'Tips for managing academic pressure',
          content: 'Academic stress is normal. Break study into small chunks, take regular breaks, and remember one exam does not define your worth.'
        },
        {
          title: 'Dealing with Family Expectations',
          description: 'Navigating parental pressure',
          content: 'Communicate openly with family. Set boundaries while respecting their concerns. Your mental health matters.'
        }
      ]
    }
  });
});

// Clean up old sessions every hour
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity < oneHourAgo) sessions.delete(sessionId);
  }
}, 60 * 60 * 1000);

// Error handling
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Serve React frontend in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../saathi-frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../saathi-frontend/build', 'index.html'));
  });
}
app.listen(PORT, () => {
  console.log(`🚀 Saathi Backend running on port ${PORT}`);
  console.log(`🤖 AI: Groq (llama-3.1-70b-versatile)`);
  console.log(`🚨 Crisis detection: Keywords + Groq AI`);
  console.log(`📱 Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;


