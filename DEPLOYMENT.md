# Deployment Guide 🚀

This guide walks you through deploying the Resume AI Analyzer to production using Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account with the repository pushed
- Vercel account (free tier available)
- Render account (free tier available)
- OpenAI API key

## 1. Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com) and sign up
2. Connect your GitHub account

### Step 2: Create Database
1. In Render Dashboard, click "New +"
2. Select "PostgreSQL"
3. Configure:
   - **Name**: `resume-ai-db`
   - **Database**: `resume_ai_analyzer`
   - **User**: `resume_user`
   - **Region**: Oregon (US West)
   - **Plan**: Free
4. Click "Create Database"
5. **Copy the External Database URL** - you'll need this

### Step 3: Deploy Backend Service
1. In Render Dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `resume-ai-analyzer-backend`
   - **Environment**: Node
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 4: Configure Environment Variables
Add these environment variables in Render:

```bash
NODE_ENV=production
DATABASE_URL=<your-database-url-from-step-2>
JWT_SECRET=<generate-a-secure-random-string>
OPENAI_API_KEY=<your-openai-api-key>
CORS_ORIGIN=https://your-frontend-domain.vercel.app
PORT=10000
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. **Copy your backend URL** (e.g., `https://resume-ai-analyzer-backend.onrender.com`)

## 2. Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [Vercel.com](https://vercel.com) and sign up
2. Connect your GitHub account

### Step 2: Import Project
1. Click "New Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables
Add these environment variables in Vercel:

```bash
VITE_API_URL=<your-backend-url-from-render>
VITE_APP_NAME=Resume AI Analyzer
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. **Copy your frontend URL** (e.g., `https://resume-ai-analyzer.vercel.app`)

## 3. Update CORS Settings

### Update Backend CORS
1. Go back to your Render backend service
2. Update the `CORS_ORIGIN` environment variable with your actual Vercel URL
3. Redeploy the service

## 4. Test Deployment

### Test Backend
Visit `https://your-backend-url.onrender.com/api/health` - should return:
```json
{
  "status": "success",
  "message": "API is healthy",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

### Test Frontend
1. Visit your Vercel URL
2. Try registering a new account
3. Test login functionality
4. Upload a resume for analysis

## 5. Custom Domains (Optional)

### Vercel Custom Domain
1. In Vercel project settings → Domains
2. Add your custom domain
3. Configure DNS records as shown

### Render Custom Domain
1. In Render service settings → Custom Domains
2. Add your custom domain
3. Configure DNS records as shown

## Environment Variables Reference

### Frontend (.env.production)
```bash
VITE_API_URL=https://your-backend-url.onrender.com
VITE_APP_NAME=Resume AI Analyzer
```

### Backend (Render Environment Variables)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secure-jwt-secret-key
OPENAI_API_KEY=sk-your-openai-api-key
CORS_ORIGIN=https://your-frontend-url.vercel.app
PORT=10000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` matches your exact Vercel URL
   - Check for trailing slashes

2. **Database Connection**
   - Verify `DATABASE_URL` is correctly formatted
   - Ensure database is running

3. **Build Failures**
   - Check Node.js version (use 18.x)
   - Verify all dependencies are in package.json

4. **API Not Found**
   - Ensure backend health endpoint works
   - Check environment variable `VITE_API_URL`

### Logs
- **Render**: Service → Logs tab
- **Vercel**: Project → Functions tab → View logs

## Monitoring

### Performance
- Render provides basic metrics on the free tier
- Vercel provides analytics and performance insights

### Uptime
Both platforms provide 99.9% uptime on paid tiers. Free tiers may have:
- **Render**: Services sleep after 15 minutes of inactivity
- **Vercel**: No sleep issues for static sites

## Scaling

### Free Tier Limits
- **Render**: 512MB RAM, sleeps when inactive
- **Vercel**: 100GB bandwidth, unlimited sites

### Upgrade Path
Both platforms offer paid tiers with:
- More resources
- No sleeping
- Priority support
- Advanced features

## Security Checklist

- ✅ Environment variables configured
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Helmet.js security headers
- ✅ Input validation and sanitization
- ✅ JWT secrets are secure

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review deployment logs
3. Verify environment variables
4. Test locally first

---

🎉 **Congratulations!** Your Resume AI Analyzer is now live in production!
