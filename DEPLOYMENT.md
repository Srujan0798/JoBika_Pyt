# JoBika Deployment Guide

## 🚀 Deploy to Production

### Prerequisites
- GitHub account
- Railway or Render account (free tier)
- Gmail account (for email features)

---

## Option 1: Deploy to Railway (Recommended)

### Step 1: Prepare Your Code
```bash
# Ensure all code is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your JoBika repository

### Step 3: Configure Environment Variables
Add these in Railway dashboard:

```env
# Required
SECRET_KEY=<generate-random-64-char-string>
DATABASE_URL=<railway-will-provide-this>

# Optional (for email features)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password

# Optional (for OAuth)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 4: Add PostgreSQL Database
1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway auto-connects it to your app

### Step 5: Deploy
```bash
# Railway deploys automatically on push
git push origin main
```

Your app will be live at: `https://your-app.railway.app`

---

## Option 2: Deploy to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign in with GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: jobika
   - **Environment**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn server:app`

### Step 3: Add Environment Variables
Same as Railway (see above)

### Step 4: Add PostgreSQL
1. Click "New +" → "PostgreSQL"
2. Copy connection string
3. Add as `DATABASE_URL` environment variable

### Step 5: Deploy
Render auto-deploys on push to main branch.

---

## 🔧 Production Configuration

### 1. Generate Secure SECRET_KEY
```python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Gmail App Password
1. Enable 2FA on Gmail
2. Go to Google Account → Security
3. App Passwords → Generate new
4. Use this as `MAIL_PASSWORD`

### 3. Database Migration
```bash
# Automatically runs on first deploy
python3 backend/migrate_db.py
```

---

## ⚙️ Additional Setup

### Custom Domain (Optional)
**Railway**:
1. Settings → Domains → Add Custom Domain
2. Add CNAME record: `your-domain.com` → `your-app.railway.app`

**Render**:
1. Settings → Custom Domain
2. Follow DNS instructions

### HTTPS (Automatic)
Both Railway and Render provide free SSL certificates automatically.

### Monitoring
- **Railway**: Built-in metrics dashboard
- **Render**: Logs and metrics in dashboard

---

## 🔒 Security Checklist

Before deploying:

- [ ] Change `SECRET_KEY` to random string
- [ ] Set `FLASK_ENV=production`
- [ ] Update CORS origins to your domain
- [ ] Enable HTTPS/SSL (automatic)
- [ ] Set strong database password
- [ ] Review rate limits
- [ ] Test all endpoints
- [ ] Enable error logging
- [ ] Set up monitoring

---

## 📊 Post-Deployment

### Verify Deployment
```bash
# Check health
curl https://your-app.railway.app/api/health

# Should return:
# {"status": "healthy", ...}
```

### Test Features
1. Open app in browser
2. Register a test account
3. Upload a resume
4. Search for jobs
5. Apply to a job
6. Check analytics dashboard

### Monitor Performance
- Check `/api/performance/stats`
- Monitor error logs
- Review cache hit rates
- Track API response times

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Verify PostgreSQL is running
# Railway/Render dashboard → Database status
```

### Email Not Working
```bash
# Verify MAIL_USERNAME and MAIL_PASSWORD are set
# Check Gmail app password is correct
# Check logs for email errors
```

### Server Won't Start
```bash
# Check logs in Railway/Render dashboard
# Common issues:
# - Missing dependencies
# - Database not migrated
# - Port conflicts
```

---

## 📈 Scaling

### Free Tier Limits
- **Railway**: 500 hours/month, $5 credit
- **Render**: 750 hours/month free
- **PostgreSQL**: 500MB storage (free)

### Upgrade Options
If you outgrow free tier:
- Railway: $5/month (hobby plan)
- Render: $7/month (starter)
- PostgreSQL: $15/month (1GB)

---

## 🔄 CI/CD (Automatic)

Both platforms auto-deploy on git push:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Automatic deployment starts
# Check logs in dashboard
```

---

## 📱 Mobile App (Future)

Your API is ready for mobile apps!

### React Native
```javascript
const API_URL = 'https://your-app.railway.app/api';

// All endpoints work the same
fetch(`${API_URL}/jobs`)
  .then(res => res.json())
  .then(jobs => console.log(jobs));
```

### Flutter
```dart
final apiUrl = 'https://your-app.railway.app/api';

// Use your existing API
http.get(Uri.parse('$apiUrl/jobs'));
```

---

## 🎯 Success Metrics

After deployment, track:
- User registrations
- Job applications
- Resume uploads
- Email alerts sent
- API response times
- Error rates

Access analytics at:
- `/api/analytics/overview`
- `/api/performance/stats`
- `/api/cache/stats`

---

## 🆘 Support

### Documentation
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Flask Deployment](https://flask.palletsprojects.com/en/latest/deploying/)

### Monitoring
- Set up email alerts
- Monitor error logs
- Track performance metrics
- Review user feedback

---

## ✅ Deployment Checklist

**Pre-Deploy**:
- [ ] Code committed and pushed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Environment variables set
- [ ] SECRET_KEY changed
- [ ] Database configured

**Deploy**:
- [ ] Project created on Railway/Render
- [ ] GitHub connected
- [ ] Environment variables added
- [ ] PostgreSQL database added
- [ ] Initial deployment successful

**Post-Deploy**:
- [ ] Health check passes
- [ ] Can register/login
- [ ] Can upload resume
- [ ] Can search jobs
- [ ] Can create application
- [ ] Email notifications work
- [ ] Analytics dashboard loads
- [ ] API docs accessible

**Production**:
- [ ] Custom domain configured
- [ ] HTTPS enabled
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Error tracking enabled
- [ ] Performance optimized

---

**🎉 Your JoBika app is ready for the world! 🚀**

**Next**: Share with users and collect feedback!
