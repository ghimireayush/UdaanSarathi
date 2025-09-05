# Netlify Deployment Guide for Udaan Sarathi

## Files Created for Deployment

1. **netlify.toml** - Main Netlify configuration file
2. **_redirects** - Backup redirect rules for SPA routing
3. **.nvmrc** - Specifies Node.js version (18)

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended for beginners)

1. **Build your project locally first (optional but recommended):**
   ```bash
   npm install
   npm run build
   ```

2. **Go to Netlify:**
   - Visit [netlify.com](https://netlify.com)
   - Sign up/login with GitHub, GitLab, or Bitbucket

3. **Deploy from Git:**
   - Click "New site from Git"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository
   - Netlify will auto-detect the settings from `netlify.toml`

4. **Verify build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

5. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete (usually 2-5 minutes)

### Option 2: Drag and Drop Deployment

1. **Build locally:**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder to the deploy area

### Option 3: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and deploy:**
   ```bash
   netlify login
   npm run build
   netlify deploy --prod --dir=dist
   ```

## Environment Variables (if needed)

If your app uses environment variables:
1. Go to Site settings > Environment variables
2. Add your variables (e.g., API URLs, keys)
3. Redeploy the site

## Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Add custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check Node.js version (should be 18)
   - Ensure all dependencies are in package.json
   - Check build logs for specific errors

2. **404 errors on refresh:**
   - The `netlify.toml` and `_redirects` files handle this
   - Ensure they're in the root directory

3. **Environment variables not working:**
   - Prefix with `VITE_` for Vite projects
   - Set them in Netlify dashboard

### Build Commands Reference:
- `npm install` - Install dependencies
- `npm run build` - Build for production
- `npm run preview` - Preview build locally

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] All routes work (no 404s)
- [ ] Forms submit properly
- [ ] API calls work
- [ ] Images and assets load
- [ ] Mobile responsiveness
- [ ] Performance check

Your site will be available at: `https://[random-name].netlify.app`

You can change the site name in Site settings > General > Site details.