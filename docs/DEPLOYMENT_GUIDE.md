# 🚀 JoBika Deployment - Step-by-Step Guide

Follow these steps to deploy JoBika to production using Supabase and Render.

---

## 📋 Prerequisites

Before starting, make sure you have:
- [ ] GitHub account with JoBika repository
- [ ] Email account for notifications
- [ ] Google account (for Gemini API)

---

## Step 1: Create Supabase Project (5 minutes)

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub

### 1.2 Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name**: `jobika-db`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### 1.3 Get Connection String
1. Go to **Project Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password
6. **Save this connection string** - you'll need it later!

---

## Step 2: Run Database Migration (3 minutes)

### 2.1 Set Environment Variable
Open terminal and run:
```bash
cd /Users/roshwinram/Downloads/JoBika_Pyt/backend

# Set your Supabase connection string
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### 2.2 Test Connection
```bash
python3 migrate_to_supabase.py test
```

**Expected output:**
```
🔍 Testing Supabase connection...
✅ Connected successfully!
📊 PostgreSQL version: PostgreSQL 15.x
```

### 2.3 Run Migration
```bash
python3 migrate_to_supabase.py
```

**Expected output:**
```
🚀 Starting Supabase database migration...
✅ Connected to Supabase PostgreSQL
📝 Creating tables and indexes...
✅ Schema created successfully

📊 Created 10 tables:
  ✓ users
  ✓ resumes
  ✓ jobs
  ✓ applications
  ✓ notifications
  ✓ resume_versions
  ✓ ai_suggestions
  ✓ user_preferences
  ✓ skill_gaps
  ✓ saved_jobs

📈 Created 16 indexes
🔒 RLS policies: Disabled (using application-level security)

🎉 Migration completed successfully!
```

### 2.4 Verify in Supabase Dashboard
1. Go to Supabase → **Table Editor**
2. Confirm you see all 10 tables
3. Click on `users` table - should be empty but ready

---

## Step 3: Get API Keys (10 minutes)

### 3.1 Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select "Create API key in new project"
4. Copy the API key
5. **Save as**: `GEMINI_API_KEY`

### 3.2 Gmail App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. You may need to enable 2-Step Verification first
3. Select app: "Mail"
4. Select device: "Other" → Type "JoBika"
5. Click "Generate"
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
7. **Save as**: `GMAIL_APP_PASSWORD`
8. **Save your Gmail address as**: `GMAIL_USER`

---

## Step 4: Deploy to Render (7 minutes)

### 4.1 Push to GitHub
```bash
cd /Users/roshwinram/Downloads/JoBika_Pyt

# Make sure all changes are committed
git status

# If there are uncommitted changes, commit them
git add .
git commit -m "Ready for deployment"

# Push to GitHub
git push origin master
```

### 4.2 Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub

### 4.3 Create Web Service
1. Click "New +" → "Web Service"
2. Click "Connect account" to link GitHub
3. Find and select your repository: `Srujan0798/JoBika_Pyt`
4. Click "Connect"

### 4.4 Configure Service
Fill in the following:

**Basic Settings:**
- **Name**: `jobika-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `master`
- **Runtime**: `Python 3`

**Build Settings:**
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && gunicorn server:app --bind 0.0.0.0:$PORT`

**Instance Type:**
- **Plan**: `Free`

### 4.5 Add Environment Variables
Scroll down to **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Your Gmail app password (16 chars) |
| `SECRET_KEY` | Click "Generate" |
| `PYTHON_VERSION` | `3.11.5` |
| `ALLOWED_ORIGINS` | `https://jobika-backend.onrender.com` |

> **Note**: Replace `jobika-backend` in `ALLOWED_ORIGINS` with your actual service name if different.

### 4.6 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Watch the logs for any errors

**Successful deployment logs should show:**
```
✅ All enhanced features loaded successfully!
✅ Email service initialized
✅ Connected to Supabase PostgreSQL
✅ Database initialized
🎉 All systems initialized successfully!
🌐 Server running on http://0.0.0.0:10000
```

### 4.7 Get Your App URL
Once deployed, your app will be available at:
```
https://jobika-backend.onrender.com
```
(Replace `jobika-backend` with your service name)

---

## Step 5: Test Your Deployment (5 minutes)

### 5.1 Health Check
Open in browser or use curl:
```bash
curl https://jobika-backend.onrender.com/api/health
```

**Expected**: `{"status": "healthy"}`

### 5.2 Test Registration
```bash
curl -X POST https://jobika-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "fullName": "Test User"
  }'
```

**Expected**: JWT token + user object

### 5.3 Test Frontend
1. Open `https://jobika-backend.onrender.com/` in browser
2. You should see the JoBika landing page
3. Try registering a new account
4. Upload a resume
5. Browse jobs

### 5.4 Verify in Supabase
1. Go to Supabase → **Table Editor** → `users`
2. You should see your test user
3. Check `resumes` table for uploaded resume

---

## Step 6: Enable Auto-Deploy (2 minutes)

### 6.1 Configure Auto-Deploy
1. In Render dashboard, go to your service
2. Click "Settings"
3. Scroll to "Build & Deploy"
4. Enable "Auto-Deploy": **Yes**
5. Click "Save Changes"

Now every time you push to `master`, Render will automatically deploy!

---

## 🎉 Deployment Complete!

Your JoBika app is now live at:
```
https://jobika-backend.onrender.com
```

### What's Working:
✅ PostgreSQL database on Supabase  
✅ AI resume enhancement with Gemini  
✅ Email notifications via Gmail  
✅ All 60+ features enabled  
✅ Auto-deploy on git push  

---

## 📊 Monitor Your App

### Render Dashboard
- **Logs**: View real-time application logs
- **Metrics**: CPU, memory usage
- **Events**: Deployment history

### Supabase Dashboard
- **Table Editor**: View database records
- **Database**: Query performance, storage usage
- **Logs**: Database queries and errors

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render Free Tier:**
- App sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month (enough for one app)

**Supabase Free Tier:**
- 500MB database storage
- 2GB bandwidth/month
- Unlimited API requests

### Keeping App Awake (Optional)
Use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 5 minutes.

---

## 🔧 Troubleshooting

### Issue: "Database connection failed"
**Solution**: 
- Verify `DATABASE_URL` in Render environment variables
- Check Supabase password is correct
- Ensure no extra spaces in connection string

### Issue: "Module not found" errors
**Solution**:
- Check `backend/requirements.txt` is complete
- Verify build command: `pip install -r backend/requirements.txt`
- Check Render logs for specific missing module

### Issue: "CORS error" in browser
**Solution**:
- Update `ALLOWED_ORIGINS` with your actual Render URL
- Restart the service in Render dashboard

### Issue: App returns 404 for frontend
**Solution**:
- Verify `app/` directory exists in repository
- Check static file path in `server.py`
- Look for errors in Render logs

---

## 🚀 Next Steps

1. **Custom Domain** (Optional)
   - Buy domain from Namecheap, GoDaddy, etc.
   - Add to Render: Settings → Custom Domain
   - Update DNS records

2. **Monitoring**
   - Set up error tracking (Sentry)
   - Add analytics (Google Analytics)
   - Monitor uptime (UptimeRobot)

3. **Scaling** (When needed)
   - Upgrade Render to paid plan ($7/month)
   - Upgrade Supabase for more storage
   - Add caching layer (Redis)

---

## 📞 Need Help?

- Check [DEPLOYMENT.md](file:///Users/roshwinram/Downloads/JoBika_Pyt/DEPLOYMENT.md) for quick reference
- Review [implementation_plan.md](file:///Users/roshwinram/.gemini/antigravity/brain/d6c85322-26b5-472f-b9bb-a13e2c92a2f4/implementation_plan.md) for detailed docs
- Check Render logs for errors
- Verify Supabase connection in dashboard

---

**Congratulations! Your JoBika app is now in production! 🎊**
