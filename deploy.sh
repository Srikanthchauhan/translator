#!/bin/bash

# Vercel & Railway Deployment Script

echo "🚀 Deploying Vani AI to Vercel & Railway..."

# Check if required tools are installed
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI not found. Install with: npm i -g vercel"; exit 1; }
command -v railway >/dev/null 2>&1 || { echo "❌ Railway CLI not found. Install with: npm i -g @railway/cli"; exit 1; }

# Deploy Frontend to Vercel
echo "📦 Deploying Frontend to Vercel..."
cd frontend
vercel --prod
FRONTEND_URL=$(vercel --prod 2>&1 | grep -o 'https://[^[:space:]]*')
cd ..

# Deploy Backend to Railway
echo "🚂 Deploying Backend to Railway..."
cd backend
railway login
railway up --detach
BACKEND_URL=$(railway status --json | jq -r '.deployments[0].url')
cd ..

echo "✅ Deployment Complete!"
echo "🎯 Frontend: $FRONTEND_URL"
echo "🎯 Backend: $BACKEND_URL"
echo ""
echo "📝 Next Steps:"
echo "1. Update NEXT_PUBLIC_API_URL in Vercel dashboard to: $BACKEND_URL"
echo "2. Add GROQ_API_KEY to Railway environment variables"
echo "3. Update CORS origins in main.py with your frontend URL"