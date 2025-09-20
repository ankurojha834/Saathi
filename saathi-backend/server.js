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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Crisis keywords for detection
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm',
  'want to die', 'no point living', 'better off dead',
  'मरना चाहता', 'आत्महत्या', 'जीना नही चाहता', 'मौत चाहिए'
];

// Gemini API integration
async function callGeminiAPI(message, conversationHistory = []) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `You are Saathi, a compassionate AI mental wellness companion specifically designed for Indian youth (16-25 years). 

CORE IDENTITY:
- Warm, empathetic, non-judgmental friend
- Understands Indian cultural context deeply
- Speaks naturally in Hindi-English mix (Hinglish) when appropriate
- Focuses on mental wellness support

CULTURAL AWARENESS:
- Indian family dynamics (joint families, parental expectations)
- Academic pressure (JEE, NEET, boards, competitive exams)
- Career stress and societal expectations
- Economic constraints and accessibility issues
- Social stigma around mental health
- Regional diversity and languages

RESPONSE STYLE:
- Use simple, relatable language
- Mix Hindi-English naturally (like: "Main samajh sakta hun", "Yeh tough situation hai")
- Be encouraging but realistic
- Never diagnose or give medical advice
- Always validate their feelings first
- Keep responses under 150 words
- Be conversational and friendly

CRISIS PROTOCOL:
If user mentions self-harm, suicide, or severe distress:
1. Show immediate empathy and concern
2. Provide crisis helpline numbers
3. Encourage reaching trusted person
4. Offer continued support

GUIDELINES:
- Never provide medical diagnoses
- Always encourage professional help for serious issues
- Respect cultural sensitivities
- Be patient with academic and family pressures
- Use appropriate emojis sparingly`;

  // Build conversation context
  let conversationContext = systemPrompt + '\n\nConversation History:\n';
  
  // Include last 5 messages for context
  const recentHistory = conversationHistory.slice(-5);
  recentHistory.forEach(msg => {
    conversationContext += `${msg.role === 'user' ? 'User' : 'Saathi'}: ${msg.content}\n`;
  });
  
  conversationContext += `\nUser: ${message}\n\nSaathi:`;

  try {
    const result = await model.generateContent(conversationContext);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

// Check for crisis keywords
function containsCrisisKeywords(message) {
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}

// Get crisis resources
function getCrisisResources() {
  return {
    isEmergency: true,
    resources: [
      {
        name: "Vandrevala Foundation",
        phone: "+91-9999-666-555",
        description: "24/7 Free Crisis Helpline",
        availability: "24/7"
      },
      {
        name: "AASRA",
        phone: "+91-22-2754-6669",
        description: "Suicide Prevention Helpline",
        availability: "24/7"
      },
      {
        name: "Sneha India",
        phone: "+91-44-2464-0050",
        description: "Emotional Support Helpline",
        availability: "24/7"
      },
      {
        name: "iCall",
        phone: "+91-9152-987-821",
        description: "Psychosocial Helpline",
        availability: "Mon-Sat 8AM-10PM"
      }
    ],
    message: "🚨 I'm concerned about you. Please reach out to one of these helplines or talk to someone you trust - a family member, friend, teacher, or counselor. You're not alone, and your life matters. 💙"
  };
}

// Session storage (in production, use Redis or database)
const sessions = new Map();

// Generate session ID
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Start new session
app.post('/api/session/start', (req, res) => {
  const sessionId = generateSessionId();
  
  sessions.set(sessionId, {
    id: sessionId,
    messages: [],
    createdAt: new Date(),
    lastActivity: new Date()
  });

  res.json({
    success: true,
    sessionId,
    message: 'Session started successfully'
  });
});

// Send message
app.post('/api/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      sessions.set(sessionId, session);
    }

    // Update last activity
    session.lastActivity = new Date();

    // Add user message to history
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Check for crisis
    const isCrisis = containsCrisisKeywords(message);
    let crisisInfo = null;
    
    if (isCrisis) {
      crisisInfo = getCrisisResources();
    }

    // Get AI response
    const aiResponse = await callGeminiAPI(message, session.messages);
    
    // Add AI response to history
    const aiMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      crisis: isCrisis ? crisisInfo : null
    };
    session.messages.push(aiMessage);

    // Clean up old messages (keep last 20)
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    res.json({
      success: true,
      message: aiResponse,
      crisis: isCrisis ? crisisInfo : null,
      sessionId: sessionId,
      messageCount: session.messages.length
    });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({
      success: false,
      error: 'I\'m having trouble connecting right now. Please try again in a moment.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get session history
app.get('/api/session/:sessionId/history', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
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

// Get mental health resources
app.get('/api/resources', (req, res) => {
  res.json({
    success: true,
    resources: {
      crisis: getCrisisResources().resources,
      selfHelp: [
        {
          type: "breathing",
          name: "4-7-8 Breathing",
          description: "Inhale 4 seconds, hold 7, exhale 8",
          instructions: "Sit comfortably, breathe in through nose for 4 counts, hold breath for 7 counts, exhale through mouth for 8 counts. Repeat 3-4 times."
        },
        {
          type: "grounding",
          name: "5-4-3-2-1 Technique",
          description: "Grounding exercise for anxiety",
          instructions: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste."
        },
        {
          type: "meditation",
          name: "Quick Meditation",
          description: "5-minute mindfulness exercise",
          instructions: "Sit quietly, focus on your breath. When thoughts come, acknowledge them and return focus to breathing."
        }
      ],
      educational: [
        {
          title: "Understanding Exam Stress",
          description: "Tips for managing academic pressure",
          content: "Academic stress is normal. Break study into small chunks, take regular breaks, and remember that one exam doesn't define your worth."
        },
        {
          title: "Dealing with Family Expectations",
          description: "Navigating parental pressure",
          content: "Communicate openly with family about your feelings. Set boundaries while respecting their concerns. Remember, your mental health matters."
        }
      ]
    }
  });
});

// Clean up old sessions (run every hour)
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity < oneHourAgo) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Saathi Backend Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Make sure to set GEMINI_API_KEY in your .env file`);
});

module.exports = app;