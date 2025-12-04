# 🚀 JoBika - AI-Powered Job Application Platform

**India's most advanced AI-powered job search platform with TypeScript, Prisma ORM, resume tailoring, auto-apply, and career coaching.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 🎯 **Modern Tech Stack (2024)**

### **Frontend**
```
Framework:     Next.js 14 (Pages Router)
Language:      TypeScript
Styling:       TailwindCSS
UI Components: Custom + Lucide Icons
Deployment:    Vercel
```

### **Backend**
```
Runtime:       Node.js
Framework:     Express.js
Language:      TypeScript
ORM:           Prisma (Type-safe queries)
Database:      PostgreSQL (Production)
               SQLite (Development fallback)
Deployment:    Railway
```

### **AI & Automation**
```
AI Engine:     Google Gemini 1.5 Flash
Automation:    Puppeteer (Headless Chrome)
PDF Parsing:   pdf-parse
Resume Gen:    PDFKit
```

### **Infrastructure**
```
Caching:       Redis (optional)
Logging:       Winston
Monitoring:    Built-in health checks
CI/CD:         GitHub Actions
```

---

## ✨ **Key Features**

### 🤖 **AI-Powered**
- **Smart Job Matching**: ML algorithm scores job compatibility (0-100%)
- **Resume Tailoring**: AI customizes your resume for each job using Gemini
- **ATS Optimization**: Ensures your resume passes Applicant Tracking Systems
- **Orion Career Coach**: AI chatbot for interview prep and career advice

### ⚡ **Automation**
- **Auto-Apply Agent**: One-click application to multiple jobs
- **Batch Processing**: Apply to 20+ jobs simultaneously (Premium)
- **Form Filling**: Puppeteer automates application forms

### 📊 **Tracking & Analytics**
- **Application Dashboard**: Track all applications in one place
- **Status Updates**: Real-time application status tracking
- **Analytics**: Insights on application success rates

### 💼 **Professional Tools**
- **Cover Letter Generator**: AI-powered cover letters
- **Interview Preparation**: Company-specific interview questions
- **Networking**: Find connections and generate referral messages

### 💰 **Monetization**
- **Subscription Tiers**: Free, Pro, Premium
- **Credit System**: Usage-based limits
- **Payment Integration**: Razorpay (ready to integrate)

---

## ⚡ **Quick Start**

### **Prerequisites**
- Node.js 18+ (with npm)
- PostgreSQL (or use SQLite for development)
- Git

### **1. Clone & Install**
```bash
git clone https://github.com/Srujan0798/JoBika_Pyt.git
cd JoBika_Pyt

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend-next
npm install
```

### **2. Environment Setup**

Create `backend/.env`:
```bash
# Database (Choose one)
DATABASE_URL=postgresql://user:password@localhost:5432/jobika  # Production
# DATABASE_URL=./database/local.sqlite  # Development

# AI (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Security (Required)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Optional: Redis (for caching)
# REDIS_URL=redis://localhost:6379

# Optional: Email (for notifications)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
```

Create `frontend-next/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### **3. Database Setup (Prisma)**

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# (Optional) Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio (visual DB editor)
npm run prisma:studio
```

### **4. Run Development Servers**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend-next
npm run dev
# App runs on http://localhost:3001
```

### **5. Test the Application**

1. Open http://localhost:3001
2. Register a new account
3. Upload your resume
4. Search for jobs
5. Try AI features (Chat, Resume Tailoring)

---

## 📁 **Project Structure**

```
JoBika_Pyt/
├── frontend-next/              # Next.js Frontend (TypeScript)
│   ├── src/
│   │   ├── app/               # Pages (Login, Dashboard, Jobs, etc.)
│   │   └── lib/               # Utilities & Config
│   ├── public/                # Static assets
│   └── package.json
│
├── backend/                    # Express Backend (TypeScript)
│   ├── server.ts              # Main entry point ✅
│   ├── prisma/
│   │   └── schema.prisma      # Database schema ✅
│   ├── database/
│   │   ├── db.js              # Legacy DB (compatibility)
│   │   └── prisma.ts          # Prisma client ✅
│   ├── services/              # Business logic (20 .ts files) ✅
│   │   ├── AuthService.ts
│   │   ├── GeminiService.ts
│   │   ├── OrionCoachService.ts
│   │   ├── ATSService.ts
│   │   └── ...
│   ├── routes/                # API endpoints (10 .ts files) ✅
│   │   ├── auth.ts
│   │   ├── jobs.ts
│   │   ├── resumes.ts
│   │   └── ...
│   ├── middleware/            # Auth, validation, etc. (6 .ts files) ✅
│   └── utils/                 # Helpers (4 .ts files) ✅
│
└── README.md                   # This file
```

**Note**: All backend code is now TypeScript (`.ts` files) with Prisma ORM for type-safe database queries.

---

## 🔧 **Development**

### **TypeScript Compilation**
```bash
cd backend
npm run build  # Compiles TypeScript to JavaScript
```

### **Prisma Commands**
```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Open Prisma Studio (visual DB editor)
npm run prisma:studio

# Create migration
npx prisma migrate dev --name migration_name

# Push schema to DB (without migration)
npx prisma db push
```

### **Database Queries (Prisma)**

**Old Way (Raw SQL):**
```javascript
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

**New Way (Prisma - Type-safe):**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }
});
// ✅ Full autocomplete
// ✅ Type-safe (knows all User fields)
// ✅ No SQL syntax errors
```

---

## 🚀 **Deployment**

### **Backend → Railway**

1. **Connect GitHub Repo**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo
   - Select `backend` folder

2. **Set Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   GEMINI_API_KEY=AIzaSy...
   JWT_SECRET=your_secret
   NODE_ENV=production
   ```

3. **Deploy**
   - Railway auto-deploys on push to `master`
   - Build command: `npm run build`
   - Start command: `npm start`

### **Frontend → Vercel**

1. **Connect GitHub Repo**
   - Go to [Vercel](https://vercel.com)
   - Import `frontend-next` folder

2. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

3. **Deploy**
   - Vercel auto-deploys on push
   - Framework: Next.js
   - Build command: `npm run build`

---

## 🔐 **Environment Variables Reference**

### **Backend (.env)**
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIzaSy...` |
| `JWT_SECRET` | Yes | Secret for JWT tokens | `super_secret_key_123` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment | `development` or `production` |
| `REDIS_URL` | No | Redis connection (optional) | `redis://localhost:6379` |

### **Frontend (.env.local)**
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `http://localhost:3000` |

---

## 📚 **API Documentation**

### **Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### **Jobs**
- `GET /api/jobs` - Search jobs
- `GET /api/jobs/:id` - Get job details

### **Resumes**
- `POST /api/resumes/upload` - Upload resume
- `POST /api/resumes/tailor` - Tailor resume for job
- `POST /api/resumes/analyze/:id` - ATS analysis

### **Applications**
- `GET /api/applications` - List applications
- `POST /api/applications/auto-apply` - Auto-apply to job

### **AI Features**
- `POST /api/orion/chat` - Chat with AI coach
- `POST /api/cover-letter` - Generate cover letter
- `POST /api/interview-prep` - Get interview questions

---

## 🧪 **Testing**

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend-next
npm test
```

---

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 **License**

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 **Acknowledgments**

- **Google Gemini** for free AI API
- **Prisma** for amazing ORM
- **Next.js** for powerful React framework
- **Railway** & **Vercel** for hosting

---

**Built with ❤️ in India 🇮🇳**

**Stack**: TypeScript + Prisma + Next.js + Express + PostgreSQL
