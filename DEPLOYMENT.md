# Deployment Guide for Vani AI

## 🚀 Quick Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Prerequisites:
```bash
npm install -g vercel @railway/cli
```

#### Steps:
1. **Deploy Backend to Railway:**
   ```bash
   cd backend
   railway login
   railway up
   # Add GROQ_API_KEY in Railway dashboard
   ```

2. **Deploy Frontend to Vercel:**
   ```bash
   cd frontend
   vercel
   # Add NEXT_PUBLIC_API_URL in Vercel dashboard
   ```

3. **Update CORS origins** in `backend/main.py` with your Vercel URL

### Option 2: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or deploy to any cloud platform that supports Docker
```

### Option 3: Manual Cloud Deployment

#### For DigitalOcean/Linode/AWS:
1. Create Ubuntu 20.04+ droplet
2. Install Docker and Docker Compose
3. Clone your repo and run:
   ```bash
   docker-compose up -d
   ```

## Environment Variables

### Backend (.env):
```
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Production Checklist

- [ ] GROQ API key configured
- [ ] CORS origins updated
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Domain configured (optional)
- [ ] WebSocket support enabled on hosting platform

## Troubleshooting

### WebSocket Issues:
- Ensure your hosting platform supports WebSockets
- Railway and Vercel both support WebSockets
- For custom deployments, check if load balancer supports WebSocket upgrades

### CORS Issues:
- Update allowed origins in `backend/main.py`
- Ensure frontend URL is correctly set

### Audio Issues:
- Verify HTTPS is enabled (required for microphone access)
- Check browser compatibility for Web Audio API