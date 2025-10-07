# 🧠 MindCare PAK – Mental Health Support Platform

A full-stack AI-powered platform for **therapist discovery** and **safe, supportive AI conversations** with simulated therapist personas.  
Built to **empower mental health accessibility in Pakistan 🇵🇰**.

---

## ✨ What Our Prototype Can Do

### 👩‍⚕️ Therapist Finder
- Search and filter therapists by:
  - City
  - Gender
  - Experience range
  - Consultation mode (online / in-person)
  - Fee range
- Sort by relevance, fee, or experience.
- View detailed therapist profiles with education, expertise, contact info.
- Save favorites ❤️ for quick access later.
- Voice input 🎙️ for search (English + Urdu).

### 💬 AI Roundtable Chat
- Join an **interactive digital therapy roundtable**:
  - **Dr. Sarah Chen (CBT)** → Evidence-based, structured, practical.
  - **Dr. James Williams (Holistic)** → Mind-body-spirit, breath, mindfulness.
  - **Dr. Maria Rodriguez (Analytical)** → Root causes, childhood patterns, insight.
- Supports **realistic therapist debate topics**:
  - Best Approaches for Treating Anxiety
  - Digital Therapy vs Traditional Sessions
  - Work-Life Balance in Modern Times
  - Depression Treatment Approaches
  - The Role of Medication in Mental Health
- Features:
  - Typing indicators + delays for realism.
  - User joins as the **4th participant**.
  - Export conversations as **.txt** or **.json**.
  - Playback speed control (1x, 1.5x, 2x).
  - Pause/resume ongoing debate.

### 🛡️ Safety Features
- **Crisis Detection Agent**:
  - Flags words like “suicide”, “self-harm”, etc.
  - Immediately inserts a **supportive helpline message** (e.g., Umang 1093 in Pakistan).
  - Provides extra cards with emergency resources.
- **Wellness Agent**:
  - Detects stress/anxiety terms.
  - Provides guided **breathing exercises** with visuals and steps.





## 🧩 Agents Flow & Orchestration

MindCare AI uses a **multi-agent orchestration pipeline**:

1. **Frontend (React + Vite)**  
   - Sends user input and chat history to backend (`/chat/respond`).  
   - Displays responses with persona avatars, colors, timestamps.  

2. **Backend (FastAPI + Agents)**  
   - **Chat Agent (`chat_agent.py`)**  
     - Orchestrates conversation flow.  
     - Decides which persona should respond (CBT, Holistic, Analytical).  
     - Formats messages with timestamps + typing delays.  
   - **Crisis Detector (`crisis_detector.py`)**  
     - If crisis keywords found → inserts emergency message + helpline card.  
   - **Wellness Agent (`wellness_agent.py`)**  
     - If stress/anxiety detected → adds breathing card with visual guidance.  

3. **OpenAI Integration**  
   - Each persona has a **system prompt** guiding its philosophy.  
   - Messages include context + user’s history.  
   - AI generates responses in **persona-specific style**.  

4. **Orchestration Loop**  
   - User sends message →  
   - Crisis/Wellness checks →  
   - Selected AI persona replies →  
   - Frontend enqueues response with delay →  
   - UI displays conversation as if it were real-time.  

---



Demo user: `demo-user`

---

## 📦 Technology Stack
- **Frontend**: React (Vite), TailwindCSS, Framer Motion.
- **Backend**: FastAPI, Python.
- **Database**: Supabase (Postgres).
- **AI**: OpenAI GPT (multi-persona orchestration).


---
## live link
https://68e0e8f158a78cc336fe922b--clinquant-gnome-b3b682.netlify.app/


## ⚙️ Setup Instructions

### 1. Clone Repo
```bash
git clone https://github.com/alishan4/MINDCARE_PAK.git
cd MINDCARE_PAK
