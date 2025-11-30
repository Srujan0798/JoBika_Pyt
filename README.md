# 🚀 JoBika - AI-Powered Job Application Platform

**India's first AI-powered job search platform with resume tailoring and auto-apply.**

---

## 🎯 **Tech Stack**

```
Frontend:  Vanilla JavaScript + Vercel (FREE)
Backend:   Node.js + Express + Railway ($5/mo)
Database:  PostgreSQL + Supabase (FREE)
AI:        Google Gemini (FREE tier)
```

---

## ⚡ **Quick Start (5 minutes)**

### 1. Clone & Install
```bash
git clone https://github.com/Srujan0798/JoBika_Pyt.git
cd JoBika_Pyt
cd backend && npm install
```

### 2. Setup Environment
```bash
# Create backend/.env
DATABASE_TYPE=postgres
DATABASE_URL=your_supabase_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### 3. Run Locally
```bash
# Start backend
cd backend
node server.js

# Open frontend
# Open app/index.html in browser
```

---

## 📦 **Deployment**

### Backend → Railway
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login & deploy
railway login
railway init
cd backend && railway up
```

### Frontend → Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Database → Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `backend/database/postgres_schema.sql` in SQL Editor
3. Copy connection string to `.env`

---

## 🎨 **Features**

- ✅ **AI Resume Tailoring** - Customize resume for each job (Gemini)
- ✅ **Auto-Apply** - Automated job applications (Puppeteer)
- ✅ **Orion AI Coach** - 24/7 career guidance
- ✅ **ATS Checker** - Resume compatibility scoring
- ✅ **Application Tracker** - Track all applications
- ✅ **Job Search** - Search & filter jobs
- ✅ **Meta-Grade SRE** - Autonomous error monitoring

---

## 📁 **Project Structure**

```
JoBika_Pyt/
├── app/                    # Frontend (Vercel)
│   ├── index.html
│   ├── dashboard.html
│   ├── jobs.html
│   ├── chat.html
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
│
├── backend/                # Backend (Railway)
│   ├── server.js          # Main server
│   ├── database/          # DB config & schema
│   ├── services/          # AI, scraping, etc.
│   ├── middleware/        # Auth, validation
│   ├── utils/             # Helpers
│   └── scripts/           # Cron jobs, SRE agent
│
├── .env                   # Environment variables
├── package.json
└── README.md
```

---

## 🔐 **Environment Variables**

```bash
# Database (Supabase)
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
DATABASE_SSL=true

# AI (Gemini)
GEMINI_API_KEY=your_key_from_aistudio.google.com

# Auth
JWT_SECRET=generate_with_openssl_rand_hex_32

# Environment
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://jobika.vercel.app
```

---

## 💰 **Cost Breakdown**

| Service | Tier | Cost |
|---------|------|------|
| Vercel (Frontend) | FREE | $0 |
| Railway (Backend) | Hobby | $5/mo |
| Supabase (Database) | FREE | $0 |
| Gemini AI | FREE | $0 |
| **Total** | | **$5/month** |

---

## 📚 **Documentation**

- [Quick Start Guide](./a_START_HERE.md) - Deploy in 20 minutes
- [Startup Workflow](./a_JoBika_STARTUP_WORKFLOW.md) - Launch strategy
- [Audit Report](./AUDIT_SUMMARY.md) - Project analysis
- [Credentials](./a_CREDENTIALS.md) - Your saved credentials

---

## 🆘 **Support**

**Issues?**
1. Check [a_START_HERE.md](./a_START_HERE.md)
2. Check Railway/Vercel logs
3. Review backend health: `curl https://jobika-backend-production.up.railway.app/health`

**Questions?**
- GitHub Issues
- Email: support@jobika.com

---

## 📄 **License**

MIT License - See LICENSE file

---

**Built with ❤️ in India 🇮🇳**

**Version:** 1.0.0  
**Status:** 🟢 Production Ready
