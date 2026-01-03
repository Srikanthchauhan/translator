Write-Host "FREE DEPLOYMENT SETUP FOR VANI AI" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Gray

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Install from: https://nodejs.org" -ForegroundColor Red
    exit 1
}

try {
    $gitVersion = git --version  
    Write-Host "Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git not found. Install from: https://git-scm.com" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "DEPLOYMENT OPTIONS (100% FREE)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Vercel (Frontend) + Render.com (Backend)" -ForegroundColor Green
Write-Host "- Vercel: Unlimited deployments, 100GB bandwidth/month"
Write-Host "- Render: 750 hours/month, auto-sleep (wakes automatically)"
Write-Host ""
Write-Host "Option 2: Both on Render.com" -ForegroundColor Yellow
Write-Host "- Single platform, easier management"
Write-Host ""

$choice = Read-Host "Choose deployment option (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "OPTION 1: VERCEL + RENDER.COM DEPLOYMENT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "STEP 1: Deploy Backend to Render.com"
    Write-Host "1. Go to: https://render.com (signup free)"
    Write-Host "2. Click 'New' -> 'Web Service'"
    Write-Host "3. Connect this GitHub repo"
    Write-Host "4. Settings:"
    Write-Host "   - Root Directory: backend"
    Write-Host "   - Build Command: pip install -r requirements.txt"
    Write-Host "   - Start Command: uvicorn main:app --host 0.0.0.0 --port `$PORT"
    Write-Host "   - Environment Variable: GROQ_API_KEY=your_key_here"
    Write-Host ""
    Write-Host "STEP 2: Deploy Frontend to Vercel"
    Write-Host "1. Install: npm install -g vercel"
    Write-Host "2. Run: cd frontend && vercel"
    Write-Host "3. Set environment in Vercel: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com"
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "OPTION 2: ALL ON RENDER.COM" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Deploy both frontend and backend to Render.com using the same process"
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Push to GitHub:"
Write-Host "   git remote add origin https://github.com/yourusername/vani-ai.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "2. Get Groq API key: https://console.groq.com/"
Write-Host "3. Follow deployment steps above"
Write-Host ""
Write-Host "Your app will be live and FREE!" -ForegroundColor Green