# MÈWOS Wear Dropshipping Setup

This project includes a storefront, an Express order backend, Firebase Auth for
the admin dashboard, and Firestore persistence for production orders.

## Run locally

1. Install dependencies:
   npm install
2. Start the app:
   npm start
3. Open the site in the browser:
   http://localhost:3000

## Production & Deployment Checklist

Follow these steps before going live:

1. Create a production `.env` (do NOT commit it). Use `.env.example` as a template.
2. Inject Firebase web config at runtime instead of committing keys. Use the
   `window.__FIREBASE_CONFIG__` pattern shown in `index.html` to set config
   server-side or during your build pipeline.
3. Deploy `firestore.rules` with the Firebase CLI and create an administrator
   user in Firebase Authentication. Give that user the custom claim
   `{ "admin": true }` using a trusted server or Admin SDK script.
4. Configure `FIREBASE_SERVICE_ACCOUNT_JSON`, `ORDER_STORAGE=firestore`, and the
   supplier variables from `.env.example` in the backend host's secret manager.
5. Create Razorpay test/live keys and configure `RAZORPAY_KEY_ID` and
   `RAZORPAY_KEY_SECRET`. The secret stays on the backend; only the public key
   is sent to the browser.
6. Run the app in a secure environment (Fly.io, Render, Railway, or a managed
   Node host). Make sure ports and firewall rules are configured.
7. Enable HTTPS (TLS) — most providers include automatic SSL; for a VPS use
   Let's Encrypt.
8. Test COD and Razorpay test-mode orders end-to-end on a staging domain before
   switching Razorpay and CJ to live mode.

Deploy rules and assign the admin claim after logging in with the Firebase CLI:

```bash
npm run firebase:rules
ADMIN_EMAIL=admin@example.com npm run admin:claim
```

The claim command uses `GOOGLE_APPLICATION_CREDENTIALS` or
`FIREBASE_SERVICE_ACCOUNT_JSON` for Admin SDK credentials. Never put either
credential in the browser bundle or commit it to the repository.

Commands (example):

```bash
# install deps
npm install

# run locally
npm start

# run a quick health check (after server is up)
curl http://localhost:3000/api/health
```

## What is included

- Express backend for order creation
- Firestore order and fulfillment-log storage
- explicit mock dropshipping mode for local development only
- `POST /api/create-order` endpoint
- `POST /api/payment/create-order` Razorpay payment-order endpoint
- health endpoint at `GET /api/health`

## Recommended supplier strategy

For a fashion storefront like this, the best starting suppliers are:

- CJdropshipping: best for a broad clothing catalog and lower-cost global fulfillment
- Spocket: better if you want a more premium/brand-focused catalog

For your current project, I recommend starting with CJdropshipping if speed and catalog breadth matter most, or Spocket if you want cleaner premium fashion sourcing.

## Connect to a real supplier

Set these values in a `.env` file based on `.env.example`:

- `PORT=3000`
- `DROPSHIPPING_PROVIDER=cj` or `spocket`
- `DROPSHIPPING_API_URL=https://your-supplier-api.com/order`
- `DROPSHIPPING_API_KEY=your-key`

When the API URL is configured, the backend formats the order payload according to
the selected provider and forwards it to the supplier. Supplier failures are
returned to the storefront; they are never converted into fake successful orders.

For local-only testing, set `ORDER_STORAGE=local` and
`DROPSHIPPING_PROVIDER=mock`. Do not use those settings in production.

## Important note

This project uses a backend because direct browser calls to supplier APIs are not secure and usually require server-side credentials. The adapter layer is designed so you can switch providers cleanly without changing the storefront code.
