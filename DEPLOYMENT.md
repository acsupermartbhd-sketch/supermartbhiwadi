# Production deployment

The project deploys as two services:

- Vercel: Vite frontend from the repository root (`supermart`)
- Render: Express + Firestore API from the `server` directory

## Before deployment

1. Rotate any Firebase service-account key, Razorpay secret, Telegram token, or admin password that was ever stored in a local `.env` file.
2. Keep real secrets out of Git. `.env`, `server/.env`, Firebase service-account JSON files, and local values are ignored by `.gitignore`.
3. In Firebase Console, enable Authentication providers used by the site and create/verify the Firestore database.
4. In Razorpay, use test keys first. Switch to live keys only after a successful test order and configure the correct live webhook/production settings if required by your account.

## Deploy API on Render

1. Push the repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository. Render will detect `render.yaml`.
3. Fill the variables marked `sync: false`:
   - `CLIENT_ORIGIN`: your Vercel URL, for example `https://supermart.vercel.app`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - Optional WhatsApp and Telegram variables
4. For `FIREBASE_PRIVATE_KEY`, paste the complete private key and preserve line breaks. If the platform stores escaped newlines, the server converts `\\n` to real newlines.
5. Deploy and check:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

The response should be JSON with `ok: true`.

## Deploy frontend on Vercel

1. In Vercel, choose **Add New > Project** and import the same repository.
2. Set the project root to `supermart` if the repository contains a parent folder. If `supermart` is the repository root, leave the root directory empty.
3. Vercel uses `vercel.json`, `npm run build`, and `dist` automatically.
4. Add the variables from `.env.production.example`:
   - `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`
   - All `VITE_FIREBASE_*` web-app values
5. Deploy the frontend.
6. Copy the final Vercel URL into Render's `CLIENT_ORIGIN`, then redeploy the Render service.
7. Add the Vercel domain to Firebase Authentication > Settings > Authorized domains.

## Smoke test

- Open the Vercel URL in an incognito window.
- Sign up or log in with Firebase.
- Place a COD order.
- Test Razorpay with test keys and a test payment method.
- Log in to `/admin-login` and confirm the order appears.
- Update the order to `Delivered` and confirm it appears in customer order history.
- Add a review and confirm it remains visible after a refresh and from another browser.

Never put `FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`, Telegram tokens, or admin passwords in Vercel frontend variables. Only variables beginning with `VITE_` are bundled into the browser.
