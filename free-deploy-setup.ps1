#!/usr/bin/env pwsh
# 🚀 FREE DEPLOYMENT SCRIPT FOR VANI AI

Write-Host "🎯 FREE DEPLOYMENT SETUP FOR VANI AI" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Step 1: Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Install from: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Install from: https://git-scm.com" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 DEPLOYMENT OPTIONS (100% FREE)" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  RECOMMENDED: Vercel (Frontend) + Render.com (Backend)" -ForegroundColor Green
Write-Host "   - Vercel: Unlimited deployments, 100GB bandwidth/month"
Write-Host "   - Render: 750 hours/month, auto-sleep (wakes automatically)"
Write-Host ""
Write-Host "2️⃣  ALTERNATIVE: Both on Render.com" -ForegroundColor Yellow
Write-Host "   - Single platform, easier management"
Write-Host ""

$choice = Read-Host "Choose deployment option (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🎯 OPTION 1: VERCEL + RENDER.COM DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "📝 SETUP INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "STEP 1: Deploy Backend to Render.com"
    Write-Host "1. Go to: https://render.com (signup free)"
    Write-Host "2. Click 'New' → 'Web Service'"
    Write-Host "3. Connect this GitHub repo: https://github.com/yourusername/vani-ai"
    Write-Host "4. Settings:"
    Write-Host "   - Name: vani-ai-backend"
    Write-Host "   - Root Directory: backend"
    Write-Host "   - Build Command: pip install -r requirements.txt"
    Write-Host "   - Start Command: uvicorn main:app --host 0.0.0.0 --port `$PORT"
    Write-Host "   - Environment Variables:"
    Write-Host "     GROQ_API_KEY=your_groq_api_key_here"
    Write-Host "     PYTHON_VERSION=3.11.0"
    Write-Host ""
    
    Write-Host "STEP 2: Install Vercel CLI and deploy frontend"
    Write-Host "Run these commands:"
    Write-Host "   npm install -g vercel"
    Write-Host "   cd frontend"
    Write-Host "   vercel"
    Write-Host ""
    Write-Host "STEP 3: Set environment variable in Vercel dashboard"
    Write-Host "   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com"
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "🎯 OPTION 2: ALL ON RENDER.COM" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "📝 SETUP INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "STEP 1: Deploy Backend to Render.com (same as above)"
    Write-Host ""
    Write-Host "STEP 2: Deploy Frontend to Render.com"
    Write-Host "1. Click 'New' → 'Web Service'"
    Write-Host "2. Connect same GitHub repo"
    Write-Host "3. Settings:"
    Write-Host "   - Name: vani-ai-frontend"
    Write-Host "   - Root Directory: frontend"
    Write-Host "   - Build Command: npm install && npm run build"
    Write-Host "   - Start Command: npm start"
    Write-Host "   - Environment Variables:"
    Write-Host "     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com"
    
} else {
    Write-Host "❌ Invalid choice. Please run script again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Push code to GitHub (if not done yet):"
Write-Host "   git remote add origin https://github.com/yourusername/vani-ai.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "2. Get your Groq API key from: https://console.groq.com/"
Write-Host ""
Write-Host "3. Follow the deployment steps above"
Write-Host ""
Write-Host "✨ Your app will be live and FREE!" -ForegroundColor Green