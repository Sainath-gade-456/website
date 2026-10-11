# Deployment Guide

This project is ready for local development, but production deployment still requires real credentials and a hosting provider.

## Recommended host

Use a Node host such as Render or Railway. The app runs from `server.js`, so it needs a real backend process instead of a pure static CDN-only deploy.

## Required production setup

1. Create a Firebase project and enable Authentication + Firestore.
2. Deploy Firestore rules:
   npm run firebase:rules
3. Create a Firebase admin user and grant the admin claim:
   ADMIN_EMAIL=your-admin@example.com npm run admin:claim
4. Create a Razorpay account and get live keys.
5. Configure your supplier provider (CJ or Spocket) and store the real API credentials in the hosting provider secret manager.
6. Keep `ORDER_STORAGE=firestore` and `DROPSHIPPING_PROVIDER=cj` in production.

## Render deployment steps

1. Push this repo to GitHub.
2. In Render, click New > Web Service.
3. Connect the GitHub repository.
4. Set the runtime to Node.
5. Use the following values:
   - Build command: `npm install`
   - Start command: `npm start`
   - Port: use the environment variable `PORT` (Render injects it automatically)
6. Add these environment variables in the Render dashboard:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `ORDER_STORAGE=firestore`
   - `DROPSHIPPING_PROVIDER=cj`
   - `FIREBASE_SERVICE_ACCOUNT_JSON`
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `DROPSHIPPING_API_URL`
   - `DROPSHIPPING_API_KEY`
   - `DROPSHIPPING_API_SECRET`
7. Deploy the service and test `/api/health`.

## Important notes

- Never commit `.env` or a Firebase service-account JSON file.
- Keep backend secrets on the host only.
- Use `npm run build` locally before deployment.
- Live testing should be done on a staging URL before switching to production payments and supplier APIs.
