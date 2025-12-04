# 🚀 JoBika - Quick Start Guide

**Stack**: TypeScript + Prisma + Next.js + Express + PostgreSQL  
**Last Updated**: December 2024

---

## ⚡ Quick Start (5 Minutes)

### **1. Clone & Install**
```bash
git clone https://github.com/Srujan0798/JoBika_Pyt.git
cd JoBika_Pyt

# Backend
cd backend && npm install

# Frontend
cd ../frontend-next && npm install
```

### **2. Environment Setup**

**Backend** (`backend/.env`):
```bash
DATABASE_URL="postgresql://postgres:23110081aiiTgn@db.eabkwiklxjbqbfxcdlkk.supabase.co:5432/postgres"
GEMINI_API_KEY="AIzaSyCfUUpFaa5GQ3F45znzykDS-eZNOimfhdg"
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
PORT=3000
NODE_ENV=development
```

**Frontend** (`frontend-next/.env.local`):
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### **3. Setup Prisma**
```bash
cd backend
npm run prisma:generate
npx prisma db push  # Optional: sync schema to DB
```

### **4. Run Development**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend-next && npm run dev
```

**Open**: http://localhost:3001

---

## 🎯 Current Tech Stack

```
┌─────────────────────────────────────────┐
│  FRONTEND                               │
│  ├─ Next.js 14 (Pages Router)          │
│  ├─ TypeScript                          │
│  ├─ TailwindCSS                         │
│  └─ Deployed on Vercel                  │
│                                          │
│  BACKEND                                │
│  ├─ Node.js + Express                   │
│  ├─ TypeScript (100%)                   │
│  ├─ Prisma ORM                          │
│  └─ Deployed on Railway                 │
│                                          │
│  DATABASE                               │
│  ├─ PostgreSQL (Supabase)               │
│  └─ Managed via Prisma                  │
│                                          │
│  AI                                     │
│  └─ Google Gemini 1.5 Flash             │
└─────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
JoBika_Pyt/
├── frontend-next/          # Next.js 14 + TypeScript
│   ├── src/app/           # Pages
│   └── src/lib/           # Config
│
├── backend/                # Express + TypeScript
│   ├── server.ts          # Main entry
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── services/          # 20 .ts files
│   ├── routes/            # 10 .ts files
│   ├── middleware/        # 6 .ts files
│   └── utils/             # 4 .ts files
│
├── README.md              # Main documentation
└── a_CREDENTIALS.md       # Deployment guide
```

---

## 🚀 Production URLs

- **Frontend**: https://jobika-pyt.vercel.app
- **Backend**: https://jobika-backend-production.up.railway.app
- **Health Check**: `curl https://jobika-backend-production.up.railway.app/health`

---

## 🔧 Common Commands

### **Backend**
```bash
npm run dev          # Development (ts-node-dev)
npm run build        # Compile TypeScript
npm start            # Production
npm run prisma:studio  # Visual DB editor
```

### **Frontend**
```bash
npm run dev          # Development
npm run build        # Production build
npm start            # Production server
```

### **Prisma**
```bash
npx prisma generate      # Generate client
npx prisma db push       # Sync schema
npx prisma studio        # Visual editor
npx prisma migrate dev   # Create migration
```

---

## 🐛 Troubleshooting

### **Backend won't start**
```bash
# Check Prisma
npm run prisma:generate

# Check environment
cat .env | grep DATABASE_URL
```

### **Frontend can't connect**
```bash
# Check API URL
cat frontend-next/.env.local

# Should be: NEXT_PUBLIC_API_URL=http://localhost:3000
```

### **Database errors**
```bash
# Test connection
npx prisma db pull

# Reset (dev only)
npx prisma migrate reset
```

---

## 📚 Documentation

- **README.md** - Complete guide
- **a_CREDENTIALS.md** - Deployment & credentials
- **Prisma Schema** - `backend/prisma/schema.prisma`

---

## ✅ Features

- ✅ AI Resume Tailoring (Gemini)
- ✅ Auto-Apply to Jobs (Puppeteer)
- ✅ Orion AI Career Coach
- ✅ ATS Resume Checker
- ✅ Application Tracker
- ✅ Job Search & Matching
- ✅ Type-safe Database (Prisma)

---

## 💰 Cost

```
Vercel (Frontend):  FREE
Railway (Backend):  $5/month
Supabase (Database): FREE
Gemini AI:          FREE
─────────────────────────────
Total:              $5/month
```

---

**Need help?** Check README.md or a_CREDENTIALS.md

**Stack**: TypeScript + Prisma + Next.js + Express + PostgreSQL 🚀
