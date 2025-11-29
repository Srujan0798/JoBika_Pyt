# 🚀 SUPABASE SETUP - STEP-BY-STEP

## ✅ YOUR CREDENTIALS (Saved)

```
Supabase Project ID: eabkwiklxjbqbfxcdlkk
Password: 23110081aiiTgn
Connection: postgresql://postgres:23110081aiiTgn@db.eabkwiklxjbqbfxcdlkk.supabase.co:5432/postgres
Gemini Key: AIzaSyCfUUpFaa5GQ3F45znzykDS-eZNOimfhdg
JWT Secret: jobika-production-secret-key-2024
Vercel Project: prj_cBYpfrWqhTiJAiI3KlVD6cSINqaG
```

---

## 🔧 FIX: Tables Already Exist Error

### Step 1: Clean Existing Tables (Supabase SQL Editor)

1. **Go to:** https://supabase.com/dashboard/project/eabkwiklxjbqbfxcdlkk/editor/sql

2. **Run this SQL:**
```sql
-- Drop all existing tables
DROP TABLE IF EXISTS application_events CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS job_alerts CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS insider_connections CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS user_experience CASCADE;
DROP TABLE IF EXISTS user_education CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

3. **Click "Run"** - should see "Success"

### Step 2: Create Fresh Schema

1. **Open:** `backend/database/postgres_schema.sql`
2. **Copy ALL contents**
3. **Paste in Supabase SQL Editor**
4. **Click "Run"**
5. **Should succeed without errors**

---

## 🌐 FIX: DNS Not Resolving

The hostname `db.eabkwiklxjbqbfxcdlkk.supabase.co` is not resolving.

### Try Connection Pooler Instead:

1. **Go to:** https://supabase.com/dashboard/project/eabkwiklxjbqbfxcdlkk/settings/database

2. **Look for "Connection Pooling"**

3. **Copy the POOLER string** (it will have port 6543):
```
postgresql://postgres.eabkwiklxjbqbfxcdlkk:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

4. **If you see this format, USE IT!** It's more reliable than direct connection.

---

## 🎯 IMMEDIATE ACTIONS

### If DNS Still Fails:

**Check Supabase Project Status:**
1. Go to dashboard: https://supabase.com/dashboard/project/eabkwiklxjbqbfxcdlkk
2. Look for "Project Paused" or "Inactive"
3. If paused, click "Restore Project"
4. Wait 2-3 minutes

**Alternative: Use Supabase Direct Connection:**
1. In Settings → Database
2. Find "Direct Connection" tab
3. Copy that string instead
4. It might have a different host format

---

## 🚀 ONCE DATABASE WORKS

### Test Locally:
```bash
cd /Users/roshwinram/Downloads/JoBika_Pyt/backend
node server.js

# Should see:
# ✅ PostgreSQL connected
# 🚀 Server running on port 3000
```

### Deploy to Vercel:
```bash
# Your Vercel is already set up!
# Just push to GitHub:
git add -A
git commit -m "Production ready with Supabase"
git push origin master

# Vercel will auto-deploy
```

---

## 📞 WHAT TO DO NOW:

1. **Go to Supabase Dashboard**
2. **Check if project is active** (not paused)
3. **Try the Connection Pooler string** instead of direct connection
4. **Share the pooler string** and I'll update everything
5. **Or share a screenshot** of the connection strings page

I've created `drop_all.sql` to clean your database first!
