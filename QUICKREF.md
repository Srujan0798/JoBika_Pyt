# JoBika - Quick Reference Card

## 🚀 Start Server (3 Ways)

```bash
# Method 1: Python script (Recommended)
python3 start.py

# Method 2: Bash script (Mac/Linux)
./setup.sh

# Method 3: Manual
cd backend && python3 server.py
```

## 📝 Common Commands

```bash
# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Database
cd backend
python3 migrate_db.py
python3 check_db.py

# Testing
cd backend/tests
python3 run_tests.py

# Server
cd backend
python3 server.py
```

## 🌐 Access Points

- Landing: http://localhost:5000/app/index.html
- Auth: http://localhost:5000/app/auth.html
- Jobs: http://localhost:5000/app/jobs.html
- Dashboard: http://localhost:5000/app/dashboard.html

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `command not found: python` | Use `python3` instead |
| `no such table: users` | Run `python3 migrate_db.py` |
| Port 5000 in use | `kill -9 $(lsof -ti:5000)` |
| Missing dependencies | `pip install -r requirements.txt` |

## 📚 Documentation

- README.md - Quick start
- TROUBLESHOOTING.md - Common issues
- CONTRIBUTING.md - Development guide
- docs/ - Detailed documentation

## 🧪 Testing

```bash
cd backend/tests
python3 run_tests.py        # All tests
python3 test_basic.py       # Unit tests
python3 test_api.py         # API tests
```

## 🎯 Key Features

✅ AI Resume Customization
✅ Multi-source Job Scraping
✅ Auto-Apply System
✅ Skill Gap Analysis
✅ Application Tracking
✅ Email Notifications

## 📞 Help

- Docs: `/docs` folder
- Issues: GitHub Issues
- Guide: TROUBLESHOOTING.md
