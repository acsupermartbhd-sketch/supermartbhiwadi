# SuperMart Firestore API

The backend uses Cloud Firestore through `firebase-admin`. Copy `.env.example`
to `.env`, fill in the Firebase service-account values, and start the server:

```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```

Required server-only Firebase settings:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

In production, all three Firebase settings, `JWT_SECRET`, `ADMIN_EMAIL`,
In production, all three Firebase settings, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `CLIENT_ORIGIN` are required. The backend uses Firestore only.
private key; use the deployment platform's secret environment variables.

The API runs at `http://localhost:4000`. On first startup, if the `admins`
collection is empty, it creates a bcrypt-hashed admin from `ADMIN_EMAIL` and
`ADMIN_PASSWORD` from the environment.
Firebase ID tokens are verified for customer sync and customer API routes.

See `firestore-schema.md` for the document layout. Orders embed their items in
the order document.

## WhatsApp order notifications

Optional server-only settings:

```env
WHATSAPP_ACCESS_TOKEN=your_meta_cloud_api_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_business_phone_number_id
WHATSAPP_ADMIN_PHONE_NUMBER=919549092686
WHATSAPP_API_VERSION=v21.0
```

After an order is saved to Firestore, the API sends the customer and product
summary to `WHATSAPP_ADMIN_PHONE_NUMBER`. Keep the access token only on the
server. Production messages may require an approved WhatsApp template and
recipient opt-in.

## Frontend

From the project root, copy `.env.example` to `.env` if the API is not running
on the default URL, then run:

```powershell
npm install
npm run dev
```

The frontend uses the API for products, orders, customer delivery details,
Firebase customer authentication, admin authentication, product CRUD, and order
status updates. It keeps a local fallback when the API is unavailable during
frontend-only development.
