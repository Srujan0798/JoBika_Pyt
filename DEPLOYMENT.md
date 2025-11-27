# JoBika Deployment - Quick Start Guide

## 🚀 Deploy in 3 Steps

### Step 1: Setup Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your connection string from Settings → Database
3. Run migration:
   ```bash
   cd /Users/roshwinram/Downloads/JoBika_Pyt/backend
   export DATABASE_URL="your_supabase_connection_string"
   python3 migrate_to_supabase.py
   ```

### Step 2: Deploy to Render (5 minutes)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo: `Srujan0798/JoBika_Pyt`
3. Configure:
   - **Build**: `pip install -r backend/requirements.txt`
   - **Start**: `cd backend && gunicorn server:app --bind 0.0.0.0:$PORT`
4. Add environment variables (see below)
5. Click Deploy!

### Step 3: Test Your App (2 minutes)

1. Open `https://your-app.onrender.com`
2. Register an account
3. Upload a resume
4. Browse jobs

---

## 🔑 Required Environment Variables

Add these in Render dashboard:

```bash
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
GEMINI_API_KEY=your_gemini_key  # Get from https://makersuite.google.com/app/apikey
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password  # Get from https://myaccount.google.com/apppasswords
SECRET_KEY=auto_generated_by_render
```

---

## 📁 Files Created

- [supabase_schema.sql](file:///Users/roshwinram/Downloads/JoBika_Pyt/backend/supabase_schema.sql) - Complete database schema
- [migrate_to_supabase.py](file:///Users/roshwinram/Downloads/JoBika_Pyt/backend/migrate_to_supabase.py) - Migration script
- [.env.production.example](file:///Users/roshwinram/Downloads/JoBika_Pyt/.env.production.example) - Environment template

---

## 📖 Full Documentation

See [implementation_plan.md](file:///Users/roshwinram/.gemini/antigravity/brain/d6c85322-26b5-472f-b9bb-a13e2c92a2f4/implementation_plan.md) for detailed instructions.

---

## ⚠️ Important Notes

> [!WARNING]
> **RLS Policies**: The schema includes Row Level Security policies that assume Supabase Auth. If using custom JWT auth, you may need to disable RLS or modify policies.

> [!TIP]
> **Free Tier Limits**: 
> - Supabase: 500MB database
> - Render: App sleeps after 15min inactivity
> - Both are perfect for testing and small-scale production!

---

## 🆘 Need Help?

Check the troubleshooting section in the full implementation plan.
