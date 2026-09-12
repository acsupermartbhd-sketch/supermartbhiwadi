# Firestore collections

The API uses Firebase Admin SDK and Cloud Firestore. It creates these collections
on demand; no SQL database or migration is required:

- `products`: catalog fields (`name`, `category`, `price`, `oldPrice`, `rating`,
  `stock`, `image`, `images`, `description`, `seoKeywords`) and `createdAt` /
  `updatedAt` timestamps.
- `admins`: `email`, `password_hash` (bcrypt), and `createdAt`.
- `customers`: `firebaseUid` (when using Firebase Auth), profile fields,
  optional `password_hash` for the legacy email/password routes, and timestamps.
- `orders`: customer delivery details in `customer`, payment, total, status,
  timestamps, and order `items` embedded as an array of `{ id, name, price,
  quantity }`.
- `contactEvents`: `contactNumber`, `source`, and `createdAt`.

Firestore document IDs are returned as the API `id` fields. Order statuses are
`Processing`, `Shipped`, `Delivered`, and `Cancelled`; payment methods are
`cod`, `upi`, and `card`.
