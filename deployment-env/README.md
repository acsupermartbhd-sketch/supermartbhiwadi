# Deployment environment files

These are templates only. Do not rename them to `.env` and upload them to GitHub.

## Render

Use `RENDER.env.example` as a checklist in Render Dashboard > your API service > Environment. Render runs the backend from the `server` directory. Required values include `CLIENT_ORIGIN`, `JWT_SECRET`, admin credentials, Firebase service-account Base64, and Razorpay keys.

For Firebase, create a new service-account JSON key, then run locally:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\service-account.json")) | Set-Clipboard
```

Paste the clipboard value into Render as `FIREBASE_SERVICE_ACCOUNT_BASE64`. Do not paste the Firebase private key into Vercel.

## Vercel

Use `VERCEL.env.example` in Vercel Project Settings > Environment Variables. Vercel only needs frontend `VITE_*` values and the deployed Render API URL.

Set:

```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

After changing Vercel variables, redeploy the Vercel project. After changing `CLIENT_ORIGIN` on Render, redeploy the Render service.

## Security

Never commit real `.env` files, Base64 service-account values, private keys, Razorpay secrets, JWT secrets, admin passwords, Telegram tokens, or WhatsApp tokens. The Firebase service account previously shared in chat must be revoked and replaced before production use.
