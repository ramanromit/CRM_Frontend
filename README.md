# Customer Realtional Manager

A production-ready CRM system built with a React frontend and Node.js/Express backend, using PostgreSQL with Sequelize ORM.

## Tech Stack
- **Frontend**: React, Vite, Axios, HSL/Vanilla CSS
- **Backend**: Node.js, Express, Sequelize ORM, JWT, Helmet, Multer
- **Database**: Neon Serverless PostgreSQL / Local PostgreSQL
- **Hosting**: Vercel

---

## Deployment to Vercel (Backend)

The backend is refactored to run as Serverless Functions on Vercel.

### 1. Database Setup
1. Create a serverless PostgreSQL database on [Neon](https://neon.tech/).
2. Copy your connection URI (ensure `sslmode=require` is present at the end of the query parameters).

### 2. Environment Variables on Vercel
Set the following environment variables in your Vercel project configuration:
- `DATABASE_URL`: Your Neon PostgreSQL connection string.
- `JWT_SECRET`: A secure random string for signing auth tokens.
- `NODE_ENV`: Set to `production`.
- `FRONTEND_URL`: The URL of your deployed frontend app (e.g. `https://seminaagro-crm.vercel.app`).

### 3. Deploy
Run the Vercel deploy command or connect your GitHub repository for automated deployments:
```bash
cd server
vercel --prod
```

---

## Local Development Setup

### Backend
1. Create `server/.env` with local or Neon credentials (see `server/.env.example`).
2. Run backend dev server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

### Frontend
1. Create `client/.env` specifying the backend URL:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
2. Run frontend dev server:
   ```bash
   cd client
   npm install
   npm run dev
   ```
