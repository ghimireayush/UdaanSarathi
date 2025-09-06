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

6. **Automatic Deployments:**
   - Once connected to Git, Netlify will automatically deploy on every push to your main branch
   - Pull requests will create deploy previews
   - Check "Site settings > Build & deploy > Continuous deployment" to configure branch settings

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

## Automatic Deployment Setup

### Git Integration Benefits:
- **Auto-deploy on push** - Every commit to main branch triggers deployment
- **Deploy previews** - Pull requests get preview URLs for testing
- **Rollback capability** - Easy rollback to previous deployments
- **Build notifications** - Get notified of successful/failed builds

### Setting up Auto-Deploy:
1. Connect your repository when creating the site
2. Netlify automatically detects changes and deploys
3. Configure branch settings in "Site settings > Build & deploy"

### Git Workflow:
```bash
# Make changes to your code
git add .
git commit -m "Update login security and fix bugs"
git push origin main

# Netlify automatically:
# 1. Detects the push
# 2. Runs npm install
# 3. Runs npm run build
# 4. Deploys to your site
# 5. Sends notification (if configured)
```

## Security Features Added

### Login Page Security:
- **Paste disabled** - Users cannot paste credentials (prevents clipboard attacks)
- **Security message** - Users get feedback when paste is attempted
- **Form validation** - Proper error handling and validation

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] All routes work (no 404s)
- [ ] Forms submit properly
- [ ] Login paste prevention works
- [ ] API calls work
- [ ] Images and assets load
- [ ] Mobile responsiveness
- [ ] Performance check
- [ ] Auto-deployment from Git works

Your site will be available at: `https://[random-name].netlify.app`

You can change the site name in Site settings > General > Site details.