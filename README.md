# 🐱 Sudden Mission

A full-stack web app that lets paired users — couples, friends, or roommates — send each other small "sudden missions": a hug, a snack run, a listening ear. Completed missions earn points, build streaks, and unlock titles.

**Live Demo:** [sudden-mission.vercel.app](https://sudden-mission.vercel.app)

---

## Screenshots

| Login | Home | Pending Mission |
|-------|------|-----------------|
| ![Login](photo/Login%20Page.jpeg) | ![Home](photo/Home%20Page%201.jpeg) | ![Pending](photo/Home%20Page%202.jpeg) |

| Awaiting Confirmation | Send Mission | Profile |
|-----------------------|-------------|---------|
| ![Confirm](photo/Home%20Page%203.jpeg) | ![Send](photo/Send%20Mission%20Page.jpeg) | ![Profile](photo/Profile%20Page.jpeg) |

---

## Features

- **Pairing System** — Users connect via a unique 6-character pair code
- **Mission Flow** — Sender creates a mission → Receiver accepts → Receiver completes → Sender confirms and rates (1–5 ⭐)
- **Gamification** — Points, streak multipliers (up to ×2.0), and unlockable titles
- **Real-time Notifications** — Socket.io pushes live updates when missions are sent or completed
- **Email Notifications** — Nodemailer sends non-blocking email alerts for new missions and point awards
- **Google OAuth** — One-click sign-in via Google, with fallback email/password auth
- **PWA-ready** — Mobile-first design optimised for iOS and Android home screen installation

---

## Tech Stack

### Frontend
| Tech | Usage |
|------|-------|
| React (Vite) | UI framework |
| React Router v6 | Client-side routing |
| Axios | HTTP client with JWT interceptor |
| Socket.io Client | Real-time event handling |
| CSS Variables | Duolingo-inspired "orange cat" design system |

### Backend
| Tech | Usage |
|------|-------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database and ODM |
| Socket.io | Real-time bidirectional communication |
| JSON Web Tokens | Stateless authentication |
| bcryptjs | Password hashing |
| Nodemailer | Transactional email |
| Google OAuth 2.0 | Third-party authentication |

### Infrastructure
| Service | Role |
|---------|------|
| Vercel | Frontend hosting (auto-deploy from GitHub) |
| Render | Backend hosting |
| MongoDB Atlas | Cloud database (AWS Tokyo region) |

---

## Architecture

```
Frontend (Vercel)          Backend (Render)           Database
React + Vite         →     Express REST API    →     MongoDB Atlas
Socket.io Client     ←→    Socket.io Server
```

**Auth flow:**
1. User signs in via Google OAuth or email/password
2. Backend issues a JWT (30-day expiry)
3. Frontend stores token in `localStorage` and attaches it to every request via an Axios interceptor

**Mission flow:**
1. Sender POSTs a mission → backend emits `newMission` via Socket.io + sends email
2. Receiver accepts → status: `pending` → `accepted`
3. Receiver completes → status: `accepted` → `completed` → sender notified via Socket.io
4. Sender confirms + rates → status: `completed` → `confirmed` → points calculated and awarded

**Points calculation:**
```
earnedPoints = missionPoints × streakMultiplier

Streak multiplier:
  ≥ 30 days  →  ×2.0
  ≥  7 days  →  ×1.5
  ≥  3 days  →  ×1.3
  default    →  ×1.0
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google OAuth credentials

### Installation

```bash
# Clone the repo
git clone https://github.com/lemmonie/sudden-mission.git
cd sudden-mission

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in `/backend`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password
```

### Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.

---

## Project Structure

```
sudden-mission/
├── backend/
│   ├── controllers/       # Business logic (auth, mission, pair)
│   ├── middleware/        # JWT auth middleware
│   ├── models/            # Mongoose schemas (User, Mission, Pair)
│   ├── routes/            # Express route definitions
│   ├── email.js           # Nodemailer config
│   ├── discord.js         # Discord bot (DM notifications)
│   └── server.js          # Entry point, Socket.io setup
└── frontend/
    └── src/
        ├── api/           # Axios instance
        ├── components/    # Shared components (BottomNav)
        ├── context/       # AuthContext
        ├── pages/         # Page components
        └── styles/        # Global CSS
```

---

## Deployment

The app uses a monorepo structure with separate deploy targets:

- **Frontend** — Vercel auto-deploys on every push to `main`. A `vercel.json` catch-all rewrite handles React Router's client-side routing.
- **Backend** — Render auto-deploys on every push to `main`.

---

## Roadmap

- [ ] Migrate email delivery to SendGrid
- [ ] Convert to React Native / Expo (mobile app)
- [ ] Push notifications (PWA)
- [ ] Mission history and analytics dashboard

---

## Author

**Joycelyn** — [GitHub](https://github.com/lemmonie)