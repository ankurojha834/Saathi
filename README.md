# SAATHI 🤝
### Your Anonymous Mental Health Companion
> *"Tum akele nahi ho. SAATHI hai tumhare saath."*
> *You're not alone. SAATHI is with you.*

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://saathi-supporter.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️%20for%20India-orange?style=for-the-badge)]()

---

## 🚀 Live Access

| Resource | Link |
|----------|------|
| 🔗 Live Application | [saathi-supporter.vercel.app](https://saathi-supporter.vercel.app/) |
| 🎥 Demo Video | [Watch Demo](#) |
| 📄 Pitch Deck | [View PPT](#) |

---

## 💔 The Silent Crisis

Every night, thousands of Indian students stare at their phones, drowning in anxiety...

> *"What if I fail JEE again?"*
> *"My parents will be so disappointed..."*
> *"I can't tell anyone how I really feel..."*

- **25%** of Indian youth battle anxiety and depression in silence
- **85%** suffer alone because therapy is expensive, stigmatized, and feels impossible to access
- Student suicides in India are at an **all-time high**

**When a student in Kota ends their life. When a teenager cries alone after board results. When family pressure becomes unbearable — who do they turn to?**

---

## 💡 Meet SAATHI — A Friend Who Always Listens

SAATHI isn't just an app. It's the friend who's awake at 3 AM when panic strikes. The listener who doesn't judge. The support system that understands your struggles.

✨ **No login. No judgment. Just someone who cares.**

> *"I'm tired of pretending I'm okay."*

SAATHI hears you.

---

## 🌟 What Makes SAATHI Different?

### 🧠 Understands YOU
Not generic Western advice. SAATHI gets:
- The crushing weight of JEE/NEET preparation
- Parents comparing you to *Sharma ji's* kid
- The fear of *"log kya kahenge"*
- Feeling trapped between dreams and expectations

### 🗣️ Speaks YOUR Language
*"Yaar, bohot stress ho raha hai"* or *"I can't take this anymore"* — SAATHI understands both. Natural **Hinglish**, just like talking to a friend.

### 🚨 Dual-Layer Crisis Detection
When thoughts get dark, SAATHI uses **two layers of protection**:
1. **Keyword bank** — instant detection in English, Hindi & Hinglish
2. **Groq AI sentiment analysis** — catches indirect hints like *"kya farak padta hai agar main rahoon ya na rahoon"*

Crisis response includes verified helplines, grounding exercises, and auto-call on mobile.

### 🔒 Your Secrets Stay Safe
100% anonymous. No phone numbers. No emails. No judgment. Just pure, private support.

---

## ✨ Unique Features

### 🌿 Mann Ka Haal — Mood Tracker
Daily mood check-ins in Hinglish with 5 mood levels, 8 trigger categories, 7-day history graph, and streak tracking. Saathi reacts empathetically to low moods.

### 🔮 Kal Ka Ankur — Chat with Your Future Self
**The feature no other mental health app has.**

Talk to an AI-powered version of yourself — 5 years in the future. Your future self:
- Knows your exact struggles, dreams, and fears
- Survived everything you're going through right now
- Speaks in warm Hinglish, like talking to yourself
- Is mysterious but deeply comforting: *"Main itna nahi bata sakta, but trust karo..."*

### 🆘 Smart Crisis Panel
- Mobile: 10-second countdown → **auto-dials KIRAN helpline**
- Laptop: Full-screen emergency number display
- 4 verified helplines (KIRAN, Vandrevala, iCall, AASRA)
- Built-in 5-4-3-2-1 grounding exercise

---

## 🛠️ Built With Care

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Tailwind CSS |
| Backend | Node.js + Express |
| AI Engine | Groq (llama-3.3-70b-versatile) |
| Crisis AI | Groq sentiment analysis |
| Future Self | Groq via `/api/kal-ka-ankur` |
| Hosting | Render (backend) + Vercel (frontend) |

### Why Groq + Llama 3.3 70B?
- **70B parameters** = better emotional intelligence and cultural context
- Catches indirect suicidal hints other models miss
- Understands Hinglish naturally
- ~0.5-1s response time on Groq's LPU hardware — critical for crisis moments

---

## 🏗️ How It Works

```
Your Message (anytime, anywhere)
        ↓
Secure, Anonymous Connection
        ↓
SAATHI listens with empathy (Groq AI)
        ↓
Dual-layer crisis detection running in parallel
        ↓
Culturally-aware Hinglish response
        ↓
Crisis panel if needed → auto-call on mobile
        ↓
You feel heard. You feel less alone. 💚
```

---

## 🚦 Run SAATHI Locally

```bash
# Clone
git clone https://github.com/ankurojha834/saathi.git
cd saathi

# Backend setup
cd saathi-backend
npm install
cp .env.example .env
# Add GROQ_API_KEY to .env

# Run backend
node server.js

# Frontend setup (new terminal)
cd ../saathi-frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) 💚

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
NODE_ENV=development
BACKEND_URL=https://your-render-url.onrender.com
```

---

## 📊 The Impact We Dream Of

| Challenge | SAATHI's Answer |
|-----------|----------------|
| 💰 Therapy costs ₹2000+/session | Free forever |
| 🏥 Months-long waitlists | Instant, 24/7 support |
| 🙈 Stigma prevents seeking help | 100% anonymous |
| 🌍 Western solutions fail here | Built for Indian context |
| 📍 Limited to metro cities | Accessible anywhere with internet |
| 🕐 No one awake at 3 AM | SAATHI never sleeps |

**Cost to save lives: Only ₹8-12K/month. Infinitely scalable.**

---

## 💪 Real Stories, Real Impact

> *"I was crying at 2 AM before my boards. SAATHI helped me calm down when no one else was awake."*
> — Anonymous user, Mumbai

> *"For the first time, I could talk about my anxiety without feeling ashamed."*
> — Anonymous user, Delhi

> *"It understood my Hinglish and my desi family problems. Finally, someone gets it."*
> — Anonymous user, Bangalore

---

## 🌈 The Future We're Building

- [ ] 🎤 Voice support for those who can't type through tears
- [ ] 👥 Connect to verified counselors when ready
- [ ] 🤝 Safe peer support communities
- [ ] 🗣️ More languages — Tamil, Telugu, Bengali, Marathi
- [ ] 📚 Mental health education for parents
- [ ] 📱 Native mobile app (React Native)

---

## 🎯 Why This Matters

Every **40 seconds**, someone loses their life to suicide globally.
In India, student suicides are at an all-time high.

SAATHI can't solve everything. But it can be there **when it matters most.**

> *The question isn't whether we need this.*
> *The question is: How many lives could we have saved if we had this sooner?*

---

## 👥 Team

**Ankur Ojha** — Student who refused to accept that youth should suffer alone.

> *"We're not just building an app. We're starting a movement."*

---

## 📄 License

MIT License — Because mental health support should be free for everyone.

---

## 🌟 Join the Movement

⭐ **Star this repo** if you believe no youth should suffer alone

🤝 **Contribute** to save lives

💝 **Share SAATHI** with someone who needs it

---

<div align="center">

### SAATHI साथी
*Because everyone deserves a companion in their darkest hours.*

🕯️ *Dedicated to every student we couldn't reach in time.*
*This is for you. This is for everyone who's still fighting.*

**"Haar mat mano. SAATHI hai na."**
*Don't give up. SAATHI is here.*

💚 [Live Demo](https://saathi-supporter.vercel.app/) | 📧 Contact | 🐦 Twitter | 💬 Discord

</div>
