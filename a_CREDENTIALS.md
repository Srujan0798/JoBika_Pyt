# 🔐 JoBika Production Credentials & Deployment Guide

**Last Updated**: December 2024  
**Stack**: TypeScript + Prisma + Next.js + Express + PostgreSQL

---

## ✅ **Production Credentials**

### **Database (PostgreSQL via Supabase)**
```bash
# Connection String (for Prisma)
DATABASE_URL="postgresql://postgres:23110081aiiTgn@db.eabkwiklxjbqbfxcdlkk.supabase.co:5432/postgres"

# Dashboard
URL: https://eabkwiklxjbqbfxcdlkk.supabase.co
Password: 23110081aiiTgn
```

### **AI (Google Gemini)**
```bash
GEMINI_API_KEY="AIzaSyCfUUpFaa5GQ3F45znzykDS-eZNOimfhdg"

# Dashboard
https://aistudio.google.com/app/apikey
```

### **Security (JWT)**
```bash
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
JWT_EXPIRES_IN="7d"
```

---

## 🚀 **Deployment Tokens**

### **Railway (Backend Hosting)**
```bash
RAILWAY_TOKEN="846fcaf3-cef6-479f-ae06-b32a8eb8ee04"

# Service URL
https://jobika-backend-production.up.railway.app
```

### **Vercel (Frontend Hosting)**
```bash
VERCEL_TOKEN="cOWVNATQUod1dhiXPsyZGeh3"
VERCEL_ORG_ID="team_qylQzs9SSaSlYkZZHaay74LU"
VERCEL_PROJECT_ID="prj_8Q0IkCnsgMAIAz43TpUTnEoa1P3s"

# Frontend URL
https://jobika-pyt.vercel.app
```

---

## 📝 **Environment Files**

### **Backend (.env)**
Create `backend/.env`:
```bash
# Database
DATABASE_URL="postgresql://postgres:23110081aiiTgn@db.eabkwiklxjbqbfxcdlkk.supabase.co:5432/postgres"

# AI
GEMINI_API_KEY="AIzaSyCfUUpFaa5GQ3F45znzykDS-eZNOimfhdg"

# Security
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=production
```

### **Frontend (.env.local)**
Create `frontend-next/.env.local`:
```bash
NEXT_PUBLIC_API_URL="https://jobika-backend-production.up.railway.app"
```

---

## 🛠️ **Local Development Setup**

### **1. Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend-next
npm install
```

### **2. Setup Prisma**
```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# (Optional) Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### **3. Run Development Servers**
```bash
# Terminal 1 - Backend (TypeScript)
cd backend
npm run dev
# Runs on http://localhost:3000

# Terminal 2 - Frontend
cd frontend-next
npm run dev
# Runs on http://localhost:3001
```

---

## 🚀 **Production Deployment**

### **Backend → Railway**

#### **Option 1: GitHub Actions (Automatic)**
1. Push to `master` branch
2. GitHub Actions auto-deploys to Railway
3. Check deployment status in Railway dashboard

#### **Option 2: Manual Deployment**
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Link to project
railway link

# Set environment variables
railway variables set DATABASE_URL="postgresql://postgres:23110081aiiTgn@db.eabkwiklxjbqbfxcdlkk.supabase.co:5432/postgres"
railway variables set GEMINI_API_KEY="AIzaSyCfUUpFaa5GQ3F45znzykDS-eZNOimfhdg"
railway variables set JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
railway variables set NODE_ENV="production"

# Deploy
cd backend
railway up
```

### **Frontend → Vercel**

#### **Option 1: GitHub Actions (Automatic)**
1. Push to `master` branch
2. GitHub Actions auto-deploys to Vercel
3. Check deployment at https://jobika-pyt.vercel.app

#### **Option 2: Manual Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend-next
vercel --prod
```

---

## 🔍 **Verify Deployment**

### **Backend Health Check**
```bash
curl https://jobika-backend-production.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "database": "postgresql",
  "gemini": "configured"
}
```

### **Frontend Check**
Visit: https://jobika-pyt.vercel.app

---

## 📊 **Database Management**

### **Prisma Studio (Visual Editor)**
```bash
cd backend
npm run prisma:studio
# Opens at http://localhost:5555
```

### **Database Migrations**
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy
```

### **Reset Database (Development Only)**
```bash
npx prisma migrate reset
```

---

## 🐛 **Troubleshooting**

### **Backend won't start**
```bash
# Check logs
railway logs

# Verify environment variables
railway variables

# Test database connection
npx prisma db pull
```

### **Frontend can't connect to backend**
1. Check `NEXT_PUBLIC_API_URL` in Vercel dashboard
2. Verify backend is running: `curl https://your-backend.railway.app/health`
3. Check CORS settings in `backend/server.ts`

### **Prisma errors**
```bash
# Regenerate Prisma Client
npm run prisma:generate

# Sync schema with database
npx prisma db push
```

---

## 📝 **GitHub Secrets (for CI/CD)**

Add these in **Settings → Secrets and variables → Actions**:

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN` | `846fcaf3-cef6-479f-ae06-b32a8eb8ee04` |
| `VERCEL_TOKEN` | `cOWVNATQUod1dhiXPsyZGeh3` |
| `VERCEL_ORG_ID` | `team_qylQzs9SSaSlYkZZHaay74LU` |
| `NEXT_PUBLIC_API_URL` | `https://jobika-backend-production.up.railway.app` |

---

## ✅ **Deployment Checklist**

- [ ] Backend `.env` configured
- [ ] Frontend `.env.local` configured
- [ ] Prisma Client generated (`npm run prisma:generate`)
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Health check passes
- [ ] Frontend can connect to backend
- [ ] GitHub Actions configured

---

## 🔐 **Security Notes**

1. **Never commit `.env` files** to Git
2. **Rotate JWT_SECRET** periodically
3. **Use environment variables** for all secrets
4. **Enable SSL** for database connections in production
5. **Keep API keys** secure and rotate if compromised

---

## 📞 **Support**

- **Backend Issues**: Check Railway logs
- **Frontend Issues**: Check Vercel deployment logs
- **Database Issues**: Check Supabase dashboard
- **AI Issues**: Verify Gemini API key at https://aistudio.google.com

---

**Stack**: TypeScript + Prisma + Next.js + Express + PostgreSQL  
**Last Updated**: December 2024
