# PowerShell Deployment Script for Windows

Write-Host "Deploying Vani AI to Vercel & Railway..." -ForegroundColor Green

# Check if required tools are installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Install with: npm i -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Deploy Frontend to Vercel
Write-Host "Deploying Frontend to Vercel..." -ForegroundColor Yellow
Set-Location frontend
$frontendResult = vercel --prod 2>&1
$frontendUrl = ($frontendResult | Select-String "https://[^\s]+").Matches[0].Value
Set-Location ..

# Deploy Backend to Railway  
Write-Host "Deploying Backend to Railway..." -ForegroundColor Yellow
Set-Location backend
railway login
railway up --detach
$backendUrl = (railway status --json | ConvertFrom-Json).deployments[0].url
Set-Location ..

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host "Backend: $backendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update NEXT_PUBLIC_API_URL in Vercel dashboard to: $backendUrl"
Write-Host "2. Add GROQ_API_KEY to Railway environment variables"
Write-Host "3. Update CORS origins in main.py with your frontend URL"