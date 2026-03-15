# 🌿 Serenity AI — Digital Mental Health Companion

> A full-stack AI-powered mental health platform providing personalized emotional support, mood tracking, guided exercises, and crisis resources — built with React, Node.js, and Google Gemini AI.

---

## 📸 Screenshots

| Landing | Dashboard | Chat |
|--------|-----------|------|
| ![Landing](https://via.placeholder.com/250x150/f5f4f0/6366f1?text=Landing) | ![Dashboard](https://via.placeholder.com/250x150/f5f4f0/6366f1?text=Dashboard) | ![Chat](https://via.placeholder.com/250x150/f5f4f0/6366f1?text=Chat) |

---

## ✨ Features

- **🤖 AI Chat Companion** — 24/7 emotional support powered by Google Gemini AI
- **😊 Mood Tracking** — Daily mood logging with analytics and trend visualization
- **📝 Smart Journal** — AI-generated reflections and keyword insights
- **🎯 Goals Tracker** — Set and track personal wellness goals with progress rings
- **🧘 Guided Exercises** — Breathing, meditation, CBT, and grounding techniques with live timers
- **🌙 Sleep Tracker** — Log sleep quality, influencing factors, and mood correlation charts
- **📈 Analytics Dashboard** — Weekly trends, emotion heatmaps, and wellness scores
- **🧬 Sentiment Insights** — AI-powered sentiment analysis of journal entries
- **📊 Weekly Reports** — Auto-generated AI mental health summaries
- **🔔 Push Notifications** — Daily check-in reminders via Web Push API
- **🆘 Crisis Resources** — Global hotlines, coping techniques, and AI support check-in
- **🔐 JWT Authentication** — Secure cookie-based auth with encrypted sessions

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Recharts | Data visualization |
| Axios | HTTP client |
| DM Sans + Bricolage Grotesque | Typography |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| Google Gemini AI | AI responses & analysis |
| JWT (HTTP-only cookies) | Authentication |
| Web Push (VAPID) | Push notifications |
| bcryptjs | Password hashing |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerization |
| GitHub Actions | CI/CD pipeline |
| AWS ECR | Container registry |
| AWS EC2 + SSM | Backend hosting |
| AWS CloudFront + S3 | Frontend CDN |
| DuckDNS | Dynamic DNS |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- Docker (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/serenity-ai.git
cd serenity-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/serenity-ai
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173

# Web Push (optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your@email.com
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## 🐳 Docker Setup

### Run with Docker Compose
```bash
# Build and start both services
docker-compose up --build
```

### Docker Compose file
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file: ./backend/.env

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## ☁️ AWS Deployment

### Architecture
```
User → CloudFront CDN → S3 (React build)
                   ↓
              EC2 Instance
                   ↓
           Docker Container
                   ↓
           Node.js API Server
                   ↓
          MongoDB Atlas / EC2
```

### CI/CD Pipeline (GitHub Actions)

The pipeline automatically:
1. Builds the Docker image
2. Pushes to AWS ECR
3. Deploys to EC2 via SSM
4. Builds React and uploads to S3
5. Invalidates CloudFront cache

### Required GitHub Secrets
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_REPOSITORY
EC2_INSTANCE_ID
S3_BUCKET_NAME
CLOUDFRONT_DISTRIBUTION_ID
MONGO_URI
JWT_SECRET
GEMINI_API_KEY
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_EMAIL
```

---

## 📁 Project Structure

```
serenity-ai/
├── backend/
│   ├── controllers/        # Route handlers
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── moodController.js
│   │   ├── journalController.js
│   │   ├── sleepController.js
│   │   ├── goalsController.js
│   │   ├── exerciseController.js
│   │   ├── analyticsController.js
│   │   ├── sentimentController.js
│   │   ├── weeklyReportController.js
│   │   ├── crisisController.js
│   │   └── notificationController.js
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routes
│   ├── middleware/         # Auth middleware
│   ├── config/             # DB connection
│   └── index.js            # Entry point
│
├── frontend/
│   ├── public/
│   │   └── sw.js           # Service worker
│   ├── src/
│   │   ├── components/     # React pages
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Journal.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── SleepTracker.jsx
│   │   │   ├── GuidedExercises.jsx
│   │   │   ├── SentimentInsights.jsx
│   │   │   ├── WeeklyReport.jsx
│   │   │   ├── Notifications.jsx
│   │   │   └── CrisisResources.jsx
│   │   ├── config/
│   │   │   └── axios.js    # Axios instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf          # Nginx SPA config
│   └── Dockerfile
│
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
└── docker-compose.yml
```

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Mood / Dashboard
```
POST   /api/mood
GET    /api/mood
GET    /api/mood/stats
```

### Chat
```
POST   /api/chat
GET    /api/chat/history
DELETE /api/chat/history
```

### Journal
```
POST   /api/journal
GET    /api/journal
DELETE /api/journal/:id
```

### Sleep
```
POST   /api/sleep
GET    /api/sleep
GET    /api/sleep/stats
DELETE /api/sleep/:id
```

### Goals
```
POST   /api/goals
GET    /api/goals
PATCH  /api/goals/:id
DELETE /api/goals/:id
```

### Exercises
```
GET    /api/exercises
GET    /api/exercises/recommend
POST   /api/exercises/log
GET    /api/exercises/history
```

### Analytics & Reports
```
GET    /api/analytics
GET    /api/sentiment
GET    /api/weekly-report/latest
POST   /api/weekly-report/generate
```

### Notifications
```
GET    /api/notifications/settings
POST   /api/notifications/subscribe
DELETE /api/notifications/unsubscribe
PATCH  /api/notifications/settings
POST   /api/notifications/send-test
```

### Crisis
```
POST   /api/crisis/detect
```

---

## 🔒 Security

- HTTP-only JWT cookies (XSS protection)
- CORS configured for specific origins
- Passwords hashed with bcrypt (10 rounds)
- Rate limiting on auth routes
- Environment variables for all secrets
- HTTPS enforced via CloudFront

---

## 📱 PWA Support

- Service worker for push notifications
- Installable on mobile devices
- Offline-capable static assets

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚠️ Disclaimer

Serenity AI is a wellness platform and is **not** a substitute for professional mental health care, therapy, or emergency medical treatment. In a mental health emergency, please contact your local emergency services or a crisis hotline immediately.

**Crisis Hotlines:**
- 🇺🇸 USA: Call or text **988**
- 🌍 Global: [befrienders.org](https://befrienders.org)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Built with ❤️ for mental health awareness.

---

*"A good laugh and a long sleep are the two best cures for anything."*