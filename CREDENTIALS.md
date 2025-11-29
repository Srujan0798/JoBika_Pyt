# 🔐 JoBika Production Credentials

## ✅ YOUR REAL CREDENTIALS (Saved)

### Supabase Database
```
Connection String:
postgresql://postgres:23110081aiiTgn@db.eabkwiklxjbqbfxcdlkk.supabase.co:5432/postgres

Dashboard URL:
https://eabkwiklxjbqbfxcdlkk.supabase.co

Password: 23110081aiiTgn
```

### Gemini AI
```
API Key: AIzaSyCfUUpFaa5GQ3F45znzykDS-eZNOimfhdg
Dashboard: https://aistudio.google.com/app/apikey
```

### JWT Secret (Generated)
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## ✅ STATUS

- [x] .env file created with real credentials
- [x] Supabase connected (db.eabkwiklxjbqbfxcdlkk.supabase.co)
- [x] Database schema already exists (tables created)
- [ ] Migration running...
- [ ] Server tested
- [ ] Ready for Railway deployment

---

## 🚀 NEXT STEPS

### 1. Test Server Locally
```bash
cd /Users/roshwinram/Downloads/JoBika_Pyt/backend
node server.js

# Should see:
# ✅ PostgreSQL connected
# 🚀 Server running on port 3000
```

### 2. Deploy to Railway
```bash
# Install Railway
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Initialize
railway init

# Set environment variables (copy from .env)
railway variables set DATABASE_TYPE=postgres
railway variables set DATABASE_URL="postgresql://postgres:23110081aiiTgn@db.eabkwiklxjbqbfxcdlkk.supabase.co:5432/postgres"
railway variables set GEMINI_API_KEY="AIzaSyCfUUpFaa5GQ3F45znzykDS-eZNOimfhdg"
railway variables set JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
railway variables set NODE_ENV=production
railway variables set DATABASE_SSL=true

# Deploy
cd /Users/roshwinram/Downloads/JoBika_Pyt/backend
railway up

# Get your backend URL
railway domain
```

### 3. Update Frontend & Deploy
```bash
# Edit app/assets/js/api.js
# Change API_URL to your Railway backend URL

# Then deploy
vercel --prod
```

---

## ⚠️ Database Note

Your Supabase database **already has tables created**. This is GOOD - means schema is deployed!

The migration script will now just copy data from SQLite to PostgreSQL (if you have any local data).

---

**All credentials are saved in backend/.env** ✅
