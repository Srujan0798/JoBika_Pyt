# 🚀 JobSaathi - AI-Powered Job Platform for India

**India's first AI-powered job search platform with resume tailoring, auto-apply, and career coaching.**

---

## 🎯 **Tech Stack**

```
Frontend:  Next.js 14 (App Router) + TailwindCSS + Lucide Icons (Vercel)
Backend:   Node.js + Express (Railway/Render)
Database:  PostgreSQL (Supabase) + SQLite Fallback
AI:        Google Gemini (Free Tier)
Automation: Puppeteer (Auto-Apply Agent)
```

---

## ✨ **Key Features**

- **🤖 AI Job Matching:** Smart algorithm matches your skills to jobs (Score 0-100%).
- **📄 AI Resume Builder:** Tailors your resume for specific job descriptions using Gemini.
- **⚡ Auto-Apply Agent:** Automates job applications with a single click.
- **🧠 Orion Career Coach:** AI chatbot for interview prep and career advice.
- **📊 Application Tracker:** Kanban board to track your job search progress.
- **🤝 Networking:** Find connections and generate referral messages.
- **💰 Monetization:** Subscription plans (Free/Pro) with mock payment gateway.

---

## ⚡ **Quick Start (5 minutes)**

### 1. Clone & Install
```bash
git clone https://github.com/Srujan0798/JoBika_Pyt.git
cd JoBika_Pyt

# Install Backend
cd backend && npm install

# Install Frontend
cd ../frontend-next && npm install
```

### 2. Setup Environment
Create `backend/.env`:
```bash
DATABASE_TYPE=sqlite  # or postgres
DATABASE_URL=./database/local.sqlite
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key
PORT=3000
```

### 3. Seed Data (Optional)
Populate the database with realistic jobs and a demo user:
```bash
cd backend
node scripts/seed.js
```

### 4. Run Locally
**Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend-next
npm run dev
# Runs on http://localhost:3001
```

---

## 🚀 Deployment (CI/CD)

This project uses GitHub Actions for automatic deployment.

### Required GitHub Secrets
Go to **Settings** -> **Secrets and variables** -> **Actions** and add these:

| Secret Name | Description | Value (Example) |
| :--- | :--- | :--- |
| `RAILWAY_TOKEN` | Railway API Token | `846...` |
| `VERCEL_TOKEN` | Vercel API Token | `cOW...` |
| `VERCEL_ORG_ID` | Vercel Team ID | `team_...` |
| `VITE_API_URL` | Live Backend URL | `https://jobika-backend...` |

### Manual Deployment
- **Backend:** `railway up`
- **Frontend:** `vercel --prod`

---

## 📦 **Deployment**

### Backend → Railway / Render
1. Push `backend` folder.
2. Set Environment Variables (`GEMINI_API_KEY`, `DATABASE_URL`, etc.).
3. `Procfile` is included for automatic configuration.

### Frontend → Vercel
1. Push `frontend-next` folder.
2. Framework Preset: `Next.js`.
3. `vercel.json` is included for configuration.

---

## 📁 **Project Structure**

```
JoBika_Pyt/
├── frontend-next/          # Next.js 14 App
│   ├── src/app/           # App Router Pages
│   ├── public/            # Static Assets
│   └── vercel.json        # Deployment Config
│
├── backend/                # Node.js API
│   ├── server.js          # Entry Point
│   ├── routes/            # API Routes (Jobs, User, Resumes...)
│   ├── services/          # AI & Automation Services
│   ├── database/          # DB Logic (Postgres/SQLite)
│   ├── scripts/           # Seed & Migration Scripts
│   └── Procfile           # Deployment Config
│
└── README.md              # This file
```

---

## 🔐 **Environment Variables**

### Backend
```bash
# Database
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://...

# AI
GEMINI_API_KEY=AIzaSy...

# Security
JWT_SECRET=...

# Puppeteer (Optional for Cloud)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

---

## 📄 **License**
MIT License

**Built with ❤️ in India 🇮🇳**
