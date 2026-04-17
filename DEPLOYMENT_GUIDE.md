# 📦 DEPLOYMENT GUIDE

## Quick Start: Deploy to Production

### Option 1: Railway (Recommended - Easiest)

#### Step 1: Prepare Your Code
```bash
# Ensure everything is committed
git add .
git commit -m "Production ready: 14 features implemented"
git push origin main
```

#### Step 2: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your repositories

#### Step 3: Deploy
1. Click "New Project"
2. Select "Deploy from GitHub"
3. Choose your repository
4. Railway will auto-detect Node.js + SQLite
5. Configure environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=file:./crm.db
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   ```
6. Click "Deploy"

#### Step 4: Verify
- Railway will provide a URL (e.g., `https://crm-production.railway.app`)
- Test login functionality
- Test Slack integration
- Test report generation

**Estimated Time:** 15-20 minutes  
**Cost:** $5-20/month depending on usage

---

### Option 2: Vercel (Frontend Only)

#### Step 1: Separate Frontend and Backend
```bash
# This requires splitting the monorepo
# Not recommended for this project - use Railway instead
```

---

### Option 3: Docker (Any Platform)

#### Step 1: Build Docker Image
```bash
docker build -t crm-professional:latest .
```

#### Step 2: Run Locally
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e GOOGLE_CLIENT_ID=your_id \
  -e GOOGLE_CLIENT_SECRET=your_secret \
  crm-professional:latest
```

#### Step 3: Deploy to Cloud
- **AWS ECS:** Push to ECR, deploy with ECS
- **Google Cloud Run:** Push to GCR, deploy with Cloud Run
- **Azure Container Instances:** Push to ACR, deploy with ACI
- **DigitalOcean App Platform:** Connect GitHub, auto-deploy

---

### Option 4: AWS (Full Control)

#### Step 1: Create EC2 Instance
```bash
# Launch Ubuntu 22.04 LTS instance
# t3.medium (2 vCPU, 4GB RAM) recommended
```

#### Step 2: Install Dependencies
```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

#### Step 3: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-repo/crm-professional.git
cd crm-professional

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start "npm run start" --name "crm-professional"
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup -u ubuntu --hp /home/ubuntu
```

#### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

Create `.env` file in root directory:

```env
# Node Environment
NODE_ENV=production

# Database
DATABASE_URL=file:./crm.db

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Slack Integration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret

# Application
PORT=3000
HOST=0.0.0.0

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

---

## Pre-Deployment Checklist

### Security
- [ ] All secrets are in environment variables (not in code)
- [ ] HTTPS is enabled
- [ ] CORS is configured
- [ ] Rate limiting is enabled
- [ ] Database backups are configured

### Performance
- [ ] Build is optimized (`npm run build`)
- [ ] Database indexes are created
- [ ] CDN is configured for static assets
- [ ] Caching headers are set

### Monitoring
- [ ] Error tracking is configured (Sentry)
- [ ] Performance monitoring is enabled
- [ ] Uptime monitoring is set up
- [ ] Log aggregation is configured

### Testing
- [ ] All features tested in staging
- [ ] Login flow verified
- [ ] Slack integration tested
- [ ] Report generation tested
- [ ] PDF export tested
- [ ] CSV export tested

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/health
# Should return 200 OK
```

### 2. Login Test
- Navigate to https://your-domain.com
- Click "Login with Google"
- Verify authentication works

### 3. Feature Tests
- [ ] Generate a report
- [ ] Export to CSV
- [ ] Export to PDF
- [ ] Create a scheduled report
- [ ] Test Slack integration
- [ ] Create a lead
- [ ] Create an opportunity

### 4. Performance Check
- Open DevTools → Network tab
- Check page load time (should be <3s)
- Check API response times (should be <100ms)

### 5. Error Monitoring
- Check error tracking dashboard
- Verify no critical errors
- Review performance metrics

---

## Rollback Plan

If something goes wrong:

### Railway
```bash
# Go to Railway dashboard
# Click "Deployments"
# Select previous deployment
# Click "Redeploy"
```

### Docker
```bash
# Stop current container
docker stop crm-professional

# Run previous version
docker run -p 3000:3000 crm-professional:previous
```

### AWS/EC2
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Stop application
pm2 stop crm-professional

# Revert code
git revert HEAD
npm install
npm run build

# Restart
pm2 start crm-professional
```

---

## Monitoring & Maintenance

### Daily
- Check error tracking dashboard
- Monitor uptime
- Review performance metrics

### Weekly
- Backup database
- Review logs
- Check security alerts

### Monthly
- Update dependencies
- Security audit
- Performance optimization
- User feedback review

---

## Support

### Common Issues

**Issue:** Application won't start
```bash
# Check logs
pm2 logs crm-professional

# Verify environment variables
env | grep NODE_ENV

# Check database
ls -la crm.db
```

**Issue:** Database locked
```bash
# SQLite is single-writer
# Migrate to PostgreSQL for production
```

**Issue:** Slack integration not working
```bash
# Verify credentials in .env
# Check Slack app settings
# Review error logs
```

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch error tracking
   - Monitor performance
   - Gather user feedback

2. **Optimize based on metrics**
   - Identify slow endpoints
   - Optimize database queries
   - Improve frontend performance

3. **Plan next features**
   - Workflow Builder Visual
   - Dashboard Builder
   - Microsoft Teams Integration
   - Mobile App MVP

---

**Ready to deploy? Choose your platform above and follow the steps!**
