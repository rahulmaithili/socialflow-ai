# ⚡ SocialFlow AI — Universal AI Content Studio & Social Media Scheduler

> **One unified production-ready application for AI-powered multimodal content creation, scheduling, queue management, and automated Facebook & social media publishing.**

---

## 🌟 Key Features

### 🎨 1. AI Content Studio & Strategy Planner
* **Smart Content Generation:** Generate viral hooks, compelling multi-tone captions (Casual, Professional, Viral, Storytelling, Humorous), and targeted hashtags.
* **AI Engagement Score:** Instant evaluation and predicted engagement rate for generated posts.
* **Multi-Day Strategy Builder:** Automatically generate a 3 to 14-day customized content calendar by industry/niche, audience, and preferred tone.
* **Multilingual Support:** Ready for English, Hindi, Hinglish, and Spanish content.

### 🖼️ 2. Media Management
* **Firebase Storage Integration:** Drag-and-drop file upload for high-resolution images and videos.
* **Direct URL Importer:** Add media directly using image/video web URLs for fast workflow.
* **Media Library Gallery:** Filter by media type (images, videos), instant search by title, and 1-click "Create Post" transition.

### 📅 3. Smart Scheduler & Multi-Destination Publisher
* **Instant vs. Scheduled Publishing:** Publish posts immediately or schedule for future dates with customized time slots.
* **Publishing Queue:** Real-time visibility into queued, scheduled, and draft posts with instant "Publish Now" actions.
* **Visual Content Calendar:** Interactive calendar view displaying all scheduled and published posts across a weekly timeline.
* **Destination Management:** Connect and manage Facebook Pages and Facebook Groups with status toggle (Active / Paused) and permission audits.
* **Error Resilience & Retry Queue:** Dedicated "Failed Posts" view with clear error messages and 1-click retry mechanism.

### 📊 4. Real-time Analytics & Activity Audit
* **Dynamic Analytics:** Computes reach, engagement, and reaction curves derived directly from real published posts.
* **Live Audit Log:** Chronological timeline tracking all media uploads, post creations, scheduled jobs, and publications.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Zustand
* **Backend:** Firebase (Authentication, Cloud Firestore, Cloud Storage, Cloud Functions)
* **AI Engine:** Google Gemini API / Generative Content Engine
* **Browser Extension:** Chrome Extension Manifest V3 for instant web clipping and scheduling

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* Git

### 2. Clone the Repository
```bash
git clone https://github.com/rahulmaithili/socialflow-ai.git
cd socialflow-ai
```

### 3. Install Dependencies
```bash
cd frontend
npm install
```

### 4. Configure Environment Variables
In `frontend/`, create a `.env` file (or use existing `.env.example`):
```env
VITE_FIREBASE_API_KEY=AIzaSyBsD_FfzbAGOUtTHVI0VhArXwLpyk2dUtA
VITE_FIREBASE_AUTH_DOMAIN=project-bf864408-f4e2-4d6f-83c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-bf864408-f4e2-4d6f-83c
VITE_FIREBASE_STORAGE_BUCKET=project-bf864408-f4e2-4d6f-83c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=898625141451
VITE_FIREBASE_APP_ID=1:898625141451:web:1ebdb411bd368796f7b94e
VITE_APP_ENV=production
VITE_USE_EMULATORS=false
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploy Online (Live on Internet)

### Option A: Free 1-Click Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** ➔ **Project** and select `socialflow-ai`.
3. Set **Root Directory** to `frontend`.
4. Copy the environment variables from your `.env` file into Vercel's **Environment Variables** section.
5. Click **Deploy** — your live app will be available in ~30 seconds!

### Option B: Firebase Hosting & Functions
```bash
# 1. Build frontend production bundle
cd frontend
npm run build

# 2. Deploy to Firebase
cd ..
firebase deploy
```

---

## 📁 Project Structure

```
socialflow-ai/
├── frontend/                  # React + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/        # Layout, navigation, common UI elements
│   │   ├── contexts/          # AuthContext (Firebase authentication)
│   │   ├── lib/               # firebase.ts, firestoreService.ts
│   │   ├── pages/             # Dashboard, Create, Media, Queue, Calendar, Pages, AI Studio, etc.
│   │   └── stores/            # Zustand UI store
│   └── package.json
├── functions/                 # Firebase Cloud Functions (Auto-publisher background scheduler)
│   ├── src/
│   │   ├── ai/                # AI analysis endpoints
│   │   ├── facebook/          # Meta API endpoints
│   │   └── scheduler/         # processPublishQueue background worker
│   └── package.json
├── extension/                 # Manifest V3 Chrome Extension
├── shared/                    # Shared TypeScript interfaces and types
├── firebase.json              # Firebase Hosting, Functions, and Firestore config
├── firestore.rules            # Firestore security rules
└── storage.rules              # Firebase Storage security rules
```

---

## 🔒 Security & Data Privacy
* Secret API keys and private tokens are handled server-side in Cloud Functions and are never exposed in frontend bundles.
* Firestore Security Rules ensure users can only read and write their own media, posts, and destinations.

---

## 📄 License
MIT License. Free for personal and commercial development.
