# Railway Deployment Guide (Monorepo)

This repo should be deployed as **2 services** in Railway:

1. `backend` (Node + Express + Socket.io)
2. `frontend` (Vite build + static serve)

The `jsp/` folder is optional and not required by the current React app routes.

## What Is Already Configured

These files are now ready:

- `backend/railway.toml`
- `frontend/railway.toml`
- `backend/.env.example`
- `frontend/.env.example`

Code changes were also made so production works across separate frontend/backend Railway domains:

- no hardcoded `/api` fetch targets
- Socket.io URL fallback is production-safe
- uploaded image URLs resolve correctly from backend domain
- backend CORS accepts one or many frontend origins
- backend healthcheck route: `GET /api/health`

## Manual Steps In Railway (You Do These)

## 1) Create Backend Service

- New Service -> Deploy from GitHub repo
- Set **Root Directory** to `backend`
- Set **Config as Code path** to `/backend/railway.toml`
- Expose a public domain
- Add environment variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
CLIENT_URL=https://your-frontend-domain.up.railway.app
PROXY_BID_INCREMENT=1
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

If you need multiple frontend origins:

```env
CLIENT_URL=https://your-frontend-domain.up.railway.app,https://your-custom-domain.com
```

## 2) Create Frontend Service

- New Service -> same repo
- Set **Root Directory** to `frontend`
- Set **Config as Code path** to `/frontend/railway.toml`
- Expose a public domain
- Add environment variables:

```env
VITE_API_URL=https://your-backend-domain.up.railway.app
VITE_SOCKET_URL=https://your-backend-domain.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key
```

Important: `VITE_API_URL` must be the backend origin only (no `/api` suffix).

## 3) Redeploy Backend After Frontend Domain Exists

After frontend gets its real domain, update backend `CLIENT_URL` to that exact domain and redeploy backend.

## Optional: Deploy `jsp/` as a Third Service

Only do this if you explicitly want Tomcat/JSP pages live. The current frontend already has React versions of receipt/certificate routes.

## Important Production Note

`backend/uploads` is local disk storage. On Railway, container filesystem is ephemeral, so uploads can be lost on restart/redeploy. For real production, switch image storage to S3/Cloudinary/R2.

If you want a quick persistence option on Railway before moving to object storage, attach a **Volume** to the backend service at `/app/uploads`.
