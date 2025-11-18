# deploying frontend to vercel

this is a cloud-ready frontend configured for vercel deployment.

## prerequisites

1. vercel account (free tier works fine)
2. vercel CLI installed (optional, can deploy via git)
3. backend deployed to google cloud run (see backend-cloud/DEPLOY.md)

## option 1: deploy via vercel CLI (quickest)

### 1. install vercel CLI

```bash
npm install -g vercel
```

### 2. login to vercel

```bash
vercel login
```

### 3. deploy

```bash
cd /Users/mabid/Desktop/entropyindustrialCapital/demo/vite-frontend-entropy

# first deployment (will ask for project setup)
vercel

# follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - What's your project's name? entropy-frontend (or whatever you want)
# - In which directory is your code located? ./
# - Want to override settings? N

# once successful, deploy to production
vercel --prod
```

### 4. set environment variables

after first deployment, set your backend URL:

```bash
vercel env add VITE_API_URL

# when prompted, enter your google cloud run backend url:
# https://entropy-backend-<hash>.run.app

# select environment: Production, Preview, Development (select all if needed)
```

### 5. redeploy with env vars

```bash
vercel --prod
```

## option 2: deploy via git (recommended for ongoing work)

### 1. create a github repo

```bash
cd /Users/mabid/Desktop/entropyindustrialCapital/demo/vite-frontend-entropy

git init
git add .
git commit -m "initial commit for vercel deployment"

# create repo on github first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. connect to vercel

1. go to https://vercel.com/new
2. import your github repository
3. configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. set environment variables

in the vercel dashboard:

1. go to project settings > environment variables
2. add: `VITE_API_URL` = `https://entropy-backend-<hash>.run.app`
3. select all environments (production, preview, development)
4. save

### 4. deploy

vercel will auto-deploy on every push to main branch. or click "deploy" in the dashboard.

## updating environment variables

### via CLI

```bash
# add or update
vercel env add VITE_API_URL

# list all env vars
vercel env ls

# remove
vercel env rm VITE_API_URL
```

### via dashboard

1. go to project settings > environment variables
2. edit or add variables
3. redeploy for changes to take effect

## local development

```bash
cd /Users/mabid/Desktop/entropyindustrialCapital/demo/vite-frontend-entropy

# install dependencies
npm install

# create .env.local (already exists, but update if needed)
# add: VITE_API_URL=http://localhost:8000
# or: VITE_API_URL=https://your-backend.run.app

# run dev server
npm run dev
```

## testing the deployment

after deployment:

1. get your vercel url (something like `https://entropy-frontend-abc123.vercel.app`)
2. open in browser
3. check browser console for any CORS errors
4. if CORS errors occur, make sure you've added your vercel domain to backend env vars:

```bash
# on backend (cloud run)
gcloud run services update entropy-backend \
  --region us-central1 \
  --set-env-vars "FRONTEND_URL=https://your-vercel-app.vercel.app"
```

## troubleshooting

### build fails

- check that all dependencies are in package.json
- verify build command: `npm run build`
- check build logs in vercel dashboard

### api calls fail (404 or CORS)

- verify `VITE_API_URL` is set correctly in vercel env vars
- verify backend is running and accessible
- check backend CORS settings include your vercel domain

### environment variables not working

- make sure env vars start with `VITE_` prefix (vite requirement)
- redeploy after changing env vars
- check env vars are set for correct environment (production/preview/development)

### check deployments

```bash
# list recent deployments
vercel ls

# get deployment url
vercel inspect <deployment-url>
```

## custom domain (optional)

### add custom domain

```bash
vercel domains add yourdomain.com
```

or via dashboard:
1. go to project settings > domains
2. add your domain
3. configure DNS as instructed

## costs

**vercel free tier includes:**
- 100 GB bandwidth/month
- unlimited projects
- automatic https
- preview deployments

**more than enough for this app**

## updating the deployment

### via git (if using option 2)

```bash
# make changes to code
git add .
git commit -m "your changes"
git push

# vercel auto-deploys on push
```

### via CLI (if using option 1)

```bash
# make changes to code
vercel --prod
```
