# 🆓 FREE DEPLOYMENT GUIDE

## Option 1: Vercel + Render.com (100% FREE)

### ✅ What you get FREE:
- **Vercel**: Unlimited deployments, custom domain, 100GB bandwidth/month
- **Render.com**: 750 hours/month, auto-sleep after 15min (wakes up automatically)

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### STEP 1: Deploy Backend to Render.com

1. **Create account** at [render.com](https://render.com) (free)

2. **Connect GitHub** (push your code to GitHub first)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/vani-ai.git
   git push -u origin main
   ```

3. **Create Web Service** on Render:
   - New → Web Service
   - Connect your GitHub repo
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**: 
     ```
     GROQ_API_KEY=your_groq_api_key_here
     PYTHON_VERSION=3.11.0
     ```

### STEP 2: Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy frontend**:
   ```bash
   cd frontend
   vercel
   ```
   - Follow prompts
   - Set **Environment Variable** in Vercel dashboard:
     ```
     NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
     ```

---

## 🎯 Alternative: ALL-FREE on Render.com

Deploy BOTH frontend and backend on Render.com:

### Backend (as above)

### Frontend on Render:
- **Build Command**: `npm install && npm run build`  
- **Start Command**: `npm start`
- **Environment**: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

---

## ⚡ INSTANT DEPLOY COMMANDS

Run these commands to deploy now: