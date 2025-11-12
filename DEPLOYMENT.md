# Deployment Guide

## Overview
This guide covers deploying the Spraystone Facade Simulator to production.

## Prerequisites

### Required API Keys
1. **Google Gemini API** (for text analysis)
   - Get from: https://makersuite.google.com/app/apikey
   - Add to `.env.local`: `VITE_GEMINI_API_KEY=your_key`

2. **OpenAI API** (for image generation - recommended)
   - Get from: https://platform.openai.com/api-keys
   - Add to `.env.local`: `VITE_OPENAI_API_KEY=your_key`
   - Billing required (~$0.04 per image)

3. **Google Maps API** (for address autocomplete)
   - Get from: https://console.cloud.google.com/apis/credentials
   - Enable Places API
   - Add to `.env.local`: `VITE_GOOGLE_MAPS_API_KEY=your_key`

## Deployment Options

### Option 1: Vercel (Recommended - Free Tier Available)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variables**
   - Go to project settings
   - Add all `VITE_*` variables from `.env.local`

4. **Production Deployment**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Environment Variables**
   - Add in Netlify Dashboard → Site Settings → Environment Variables

### Option 3: Custom Server

1. **Build**
   ```bash
   npm run build
   ```

2. **Serve with Express**
   ```javascript
   const express = require('express');
   const path = require('path');
   const app = express();
   
   app.use(express.static(path.join(__dirname, 'dist')));
   
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
   });
   
   app.listen(3000, () => console.log('Server running on port 3000'));
   ```

## Environment Configuration

### Production `.env` Template

```env
# Lead capture mode
VITE_LEAD_GATING_MODE=before

# Dev mode (false for production)
VITE_DEV_MODE=false

# Text provider (gemini recommended)
VITE_TEXT_PROVIDER=gemini
VITE_GEMINI_API_KEY=your_gemini_key_here

# Image provider (openai recommended for quality)
VITE_IMAGE_PROVIDER=openai
VITE_OPENAI_API_KEY=your_openai_key_here

# Google Maps for autocomplete
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

## Post-Deployment Checklist

- [ ] Test all 9 steps of the simulator
- [ ] Upload a test facade photo
- [ ] Verify text analysis works
- [ ] Verify image generation works
- [ ] Test address autocomplete
- [ ] Download PDF quote
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify lead capture works (before/after modes)
- [ ] Set up analytics (Google Analytics recommended)

## Performance Optimization

### Image Optimization
```bash
# Already configured in Vite
# Images are automatically optimized during build
```

### CDN Setup
- Use Vercel/Netlify CDN (automatic)
- Or configure Cloudflare for custom domains

### Caching
```javascript
// Add to vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          lucide: ['lucide-react']
        }
      }
    }
  }
}
```

## Monitoring

### Error Tracking
Recommended: Sentry

```bash
npm install @sentry/react
```

```javascript
// Add to main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production"
});
```

### Analytics
Add Google Analytics in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Security

### API Key Protection
✅ **Current Implementation**: All API keys are in environment variables
✅ **No secrets in Git**: `.env.local` is gitignored

### HTTPS
- Vercel/Netlify provide free SSL certificates
- Custom domains: Use Let's Encrypt or Cloudflare

### Content Security Policy
Add to `index.html` `<head>`:

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
  script-src 'self' 'unsafe-inline' https://maps.googleapis.com; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: blob: https:; 
  connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://maps.googleapis.com;">
```

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### API Calls Fail
- Check environment variables are set
- Verify API keys are valid
- Check API quotas/billing

### Mobile Issues
- Test on real devices
- Use Chrome DevTools mobile emulation
- Check touch event handlers

## Cost Estimation

### Hosting
- **Vercel/Netlify**: Free tier sufficient for moderate traffic
- **Custom VPS**: $5-20/month

### API Costs
- **Google Gemini**: Free tier (15 requests/minute)
- **OpenAI DALL-E**: ~$0.04 per image (1024x1024)
- **Google Maps**: $0.017 per request (first 25K free/month)

### Example Monthly Cost (100 simulations)
- Gemini API: $0 (free tier)
- OpenAI images: $4 (100 x $0.04)
- Google Maps: $0 (free tier)
- **Total: ~$4/month**

## Support
For issues, check:
- Application logs in deployment platform
- Browser console for client-side errors
- API provider status pages
