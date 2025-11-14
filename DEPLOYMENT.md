# Spraystone Facade Simulator Deployment Playbook

This repo ships two deployables:

1. Static frontend (Vite build output in `dist/`) that orchestrates the UI.
2. Node/Express proxy API (`api/apply-spraystone.js`) that keeps `OPENAI_API_KEY` private while calling OpenAI image edits.

Both pieces must run in production to match local behavior.

---

## 1. Pre-flight (local validation)

1. Install deps: `npm install`
2. Copy the env template: `cp .env.example .env.production` (or create a Vercel env later). Do not add real secrets yet.
3. Build the frontend: `npm run build` (ensures TypeScript passes and `dist/` exists).
4. Start the proxy: `npm run server` (now runs `node api/apply-spraystone.js`). Hit `http://localhost:8787/api/apply-spraystone` with a sample payload to verify OpenAI access.
5. Run Vite locally with the proxy endpoint exported: `VITE_PROXY_IMAGE_ENDPOINT=http://localhost:8787/api/apply-spraystone npm run dev`.

Stop and fix issues before deploying anywhere.

---

## 2. Deploy the proxy API (Render free tier example)

Railway, Fly, or Koyeb follow the same recipe. Using Render:

1. Render dashboard -> **New +** -> **Web Service** -> pick the GitHub repo on branch `main`.
2. Settings:
   - Environment: Node
   - Region: closest to end users
   - Instance type: Free
3. Build command: `npm install`
4. Start command: `npm run server` (points to `node api/apply-spraystone.js`)
5. Environment variables:
   - `OPENAI_API_KEY=sk-...`
   - `PORT` (optional; Render sets this automatically)
6. Deploy. Wait until logs show `Spraystone proxy listening at http://localhost:XXXX`.
7. Note the public base URL (example `https://spraystone-api.onrender.com`). The API path is `/api/apply-spraystone`.
8. Smoke test:

   ```bash
   curl -X POST https://spraystone-api.onrender.com/api/apply-spraystone \
     -H "Content-Type: application/json" \
     -d "{\"imageBase64\":\"fake\",\"prompt\":\"test\"}"
   ```

   Expect a `400` saying `imageBase64 and prompt required`. Replace with a valid payload to confirm OpenAI returns `output`.

---

## 3. Deploy the frontend (Vercel free tier example)

1. Vercel dashboard -> **Add New Project** -> import the same repo.
2. Framework preset: Vite (auto detected).
3. Build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Environment variables (Project Settings -> Environment Variables):
   - `VITE_PROXY_IMAGE_ENDPOINT=https://spraystone-api.onrender.com/api/apply-spraystone`
   - `VITE_GOOGLE_MAPS_API_KEY` if using address autocomplete
   - Any other overrides from `.env.example`
5. Trigger the deploy. Promote the preview to production once you validate.
6. Load the live URL, walk through the wizard, upload an image, and confirm the network tab shows requests to the Render proxy returning 200 responses.

> Netlify, Cloudflare Pages, or GitHub Pages can host the SPA as well. The only requirement is setting `VITE_PROXY_IMAGE_ENDPOINT` to the proxy URL from step 2.

---

## 4. Parallel work checklist

- You: set up Vercel/Render accounts, collect production API keys, and configure env vars.
- Me (done in repo): fixed the `npm run server` script and documented the deployment plan.
- While builds run: configure DNS/custom domains, invite teammates, and set up monitoring (Render logs + Vercel analytics).
- While proxy deploys: prepare a golden facade image and prompt to validate outputs quickly when prod is live.

---

## 5. Verification plan

1. `curl` the proxy health endpoint after every deploy and whenever you rotate API keys.
2. On the live frontend:
   - Confirm Google Maps autocomplete if enabled.
   - Upload a facade photo, watch the POST to `/api/apply-spraystone`, and ensure the response contains `output`.
   - Generate the PDF/report and verify downloads still succeed.
3. Monitor Render logs and Vercel deployment logs for at least one full session after launch.

Once these checks pass, wire DNS to the Vercel project and announce the release.
