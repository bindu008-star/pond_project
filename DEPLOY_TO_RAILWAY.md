# Deploying Pond Project to Railway

I have prepared your project for deployment by creating a `Procfile` and ensuring `requirements.txt` is ready.

## Step 1: Push to GitHub
Since your changes are already committed, you just need to push them to GitHub. Run this command in your terminal:

```bash
git push origin main
```

## Step 2: Create a Project on Railway
1. Go to [Railway.app](https://railway.app/) and log in.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your repository (the one containing `Pond_porject`).

## Step 3: Configure Root Directory (CRITICAL)
Since your project is inside a subfolder, you must tell Railway where to find it.

1. Once the project is created, click on the service card (the box representing your app).
2. Go to **Settings** > **General**.
3. Scroll down to **Root Directory**.
4. Enter the path: `IOT/Basic Practice/IOT-project-06/Pond_porject`
5. Press **Enter** or Save. Railway will automatically redeploy.

## Step 4: Verify Deployment
1. Go to the **Deployments** tab to see the build logs.
2. Once active, Railway will generate a URL for your app (you can find it in the **Settings** > **Networking** section).
3. Click the URL to view your live app.

## Notes
- **Procfile**: I created a `Procfile` containing `web: gunicorn app:app`. This tells Railway to use Gunicorn to serve your Flask app.
- **Dependencies**: Railway will install everything listed in `requirements.txt`.
