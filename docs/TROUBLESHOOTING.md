# JoBika - Troubleshooting Guide

## Common Issues and Solutions

### 🔴 Installation Issues

#### Problem: "command not found: python"
**Solution**: Use `python3` instead of `python`
```bash
python3 server.py  # Instead of: python server.py
```

#### Problem: "No module named 'flask'"
**Solution**: Install dependencies
```bash
cd backend
pip install -r requirements.txt
# Or using pip3:
pip3 install -r requirements.txt
```

#### Problem: "Permission denied" when running setup.sh
**Solution**: Make the script executable
```bash
chmod +x setup.sh
./setup.sh
```

---

### 🗄️ Database Issues

#### Problem: "no such table: users"
**Solution**: Run database migration
```bash
cd backend
python3 migrate_db.py
```

#### Problem: "database is locked"
**Solution**: Close other connections and restart
```bash
# Kill any running Python processes
pkill -f "python.*server.py"

# Restart server
python3 server.py
```

#### Problem: Database corruption
**Solution**: Reset database (WARNING: Deletes all data)
```bash
cd backend
rm jobika.db
python3 migrate_db.py
```

---

### 🔐 Authentication Issues

#### Problem: "Invalid credentials" when logging in
**Solution**: 
1. Verify you registered with correct email/password
2. Password is case-sensitive
3. Try registering a new account

#### Problem: "Unauthorized" when accessing APIs
**Solution**: Include JWT token in headers
```javascript
headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}
```

---

### 📧 Email Issues

#### Problem: Email notifications not sending
**Solution**: Configure email settings in `.env`
```bash
cd backend
# Edit .env file
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # Not your regular password!
```

**Note**: For Gmail, you need an [App Password](https://support.google.com/accounts/answer/185833)

#### Problem: "SMTP authentication failed"
**Solution**: 
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use App Password in `.env`, not your regular password

---

### 🌐 Server Issues

#### Problem: "Address already in use"
**Solution**: Kill process on port 5000
```bash
# Find process on port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use alternative port
python3 server.py --port 5001
```

#### Problem: Server starts but pages don't load
**Solution**: Check correct URL
```bash
# Correct URLs:
http://localhost:5000/app/index.html  # Landing page
http://localhost:5000/app/auth.html   # Auth page
http://localhost:5000/app/jobs.html   # Jobs page

# NOT:
http://localhost:5000  # This won't work
```

---

### 🔍 Job Scraping Issues

#### Problem: No jobs returned when scraping
**Solution**: 
1. Check internet connection
2. Try different search terms
3. Some job boards may block automated requests

```python
# Try with different parameters
{
  "query": "python developer",
  "location": "remote",
  "limit": 5
}
```

#### Problem: "Request timed out"
**Solution**: Reduce scraping limit
```python
{
  "query": "developer",
  "location": "remote",
  "limit": 10  # Instead of 100
}
```

---

### 📱 Frontend Issues

#### Problem: Frontend shows "Network Error"
**Solution**: 
1. Ensure backend server is running
2. Check browser console for errors (F12)
3. Verify API URL in frontend code

#### Problem: Login button doesn't work
**Solution**: 
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify token is being saved to localStorage

#### Problem: CSS not loading
**Solution**: 
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Check file paths in HTML
3. Clear browser cache

---

### 🧪 Testing Issues

#### Problem: Tests fail with import errors
**Solution**: Install test dependencies
```bash
pip install pytest
cd backend/tests
python3 run_tests.py
```

#### Problem: "ModuleNotFoundError: No module named 'server'"
**Solution**: Run tests from correct directory
```bash
cd backend/tests
python3 run_tests.py
```

---

### 🚀 Deployment Issues

#### Problem: App doesn't work on Railway/Render
**Solution**: 
1. Check environment variables are set
2. Verify `Procfile` exists
3. Check deployment logs

#### Problem: "Application Error" on deployed app
**Solution**: 
1. Check logs for errors
2. Verify PostgreSQL connection
3. Ensure all environment variables are set

---

## Getting Help

### Still Having Issues?

1. **Check Logs**: Look at terminal output for error messages
2. **Review Documentation**: Check `docs/` folder for specific guides
3. **Search Issues**: Look through existing GitHub issues
4. **Ask for Help**: Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Python version)

### Useful Commands

```bash
# Check Python version
python3 --version

# Check installed packages
pip list

# View server logs
tail -f /path/to/logs

# Test database connection
cd backend
python3 -c "from server import get_db; print('✅ Database OK')"

# Test API health
curl http://localhost:5000/api/health
```

---

## Prevention Tips

1. **Always use `python3`** instead of `python`
2. **Run migrations** after pulling new code
3. **Keep dependencies updated**: `pip install -r requirements.txt --upgrade`
4. **Use virtual environments** to avoid conflicts
5. **Backup database** before major changes: `cp jobika.db jobika.db.backup`

---

**Last Updated**: 2025-11-26  
**Version**: 1.0
