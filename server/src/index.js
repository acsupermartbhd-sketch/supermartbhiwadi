import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { db, firebaseConfig, firestoreDatabaseId, listFirebaseUsers, updateFirebaseUserRole, verifyFirebaseToken } from "./firebase.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "";
const collection = (name) => db.collection(name);
const allowedOrderStatuses = new Set(["Processing", "Payment pending", "Shipped", "Delivered", "Cancelled"]);
const allowedPaymentMethods = new Set(["cod", "online"]);
const productCache = { data: null, expiresAt: 0, promise: null };
const reviewCache = { data: null, expiresAt: 0, promise: null };
const adminOrdersCache = { data: null, expiresAt: 0, promise: null };
const adminCustomersCache = { data: null, expiresAt: 0, promise: null };
const customerByUidCache = new Map();
const customerByIdCache = new Map();
const CUSTOMER_CACHE_TTL = 15 * 60 * 1000;

function getCachedCustomerByUid(uid) {
  const entry = customerByUidCache.get(uid);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  return null;
}

function setCachedCustomerByUid(uid, data) {
  customerByUidCache.set(uid, { data, expiresAt: Date.now() + CUSTOMER_CACHE_TTL });
  if (data?.id) {
    customerByIdCache.set(String(data.id), { data, expiresAt: Date.now() + CUSTOMER_CACHE_TTL });
  }
}

function getCachedCustomerById(id) {
  const entry = customerByIdCache.get(String(id));
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  return null;
}

function setCachedCustomerById(id, data) {
  customerByIdCache.set(String(id), { data, expiresAt: Date.now() + CUSTOMER_CACHE_TTL });
  if (data?.firebaseUid) {
    customerByUidCache.set(data.firebaseUid, { data, expiresAt: Date.now() + CUSTOMER_CACHE_TTL });
  }
}

function invalidateAdminCustomersCache() {
  adminCustomersCache.data = null;
  adminCustomersCache.expiresAt = 0;
}

function invalidateAdminOrdersCache() {
  adminOrdersCache.data = null;
  adminOrdersCache.expiresAt = 0;
}

function invalidateReviewCache() {
  reviewCache.data = null;
  reviewCache.expiresAt = 0;
}

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

const configuredOrigins = (process.env.CLIENT_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const defaultOrigins = [
  "https://supermartbhiwadi.com",
  "https://www.supermartbhiwadi.com",
  "https://supermartbhiwadi.vercel.app",
  "https://supermart.vercel.app",
  "http://localhost:5173",
  "http://localhost:4000",
  "http://localhost:3000",
];
const allowedOrigins = new Set([...configuredOrigins, ...defaultOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || origin.endsWith("supermartbhiwadi.com") || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireFirestore() {
  if (!db) throw new Error("Firestore is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
  return db;
}

function serializeFirestoreValue(value) {
  if (value === undefined) return null;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeFirestoreValue(item)]));
  return String(value);
}

function documentData(snapshot) {
  return serializeFirestoreValue(snapshot.data ? snapshot.data() : snapshot);
}

function timestampValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return new Date(value).toISOString();
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function normalizeOrderItems(items, role = "customer") {
  const products = await getCachedProducts();
  return items.map((item) => {
    const product = products.find((candidate) => String(candidate.id) === String(item.id || item.productId)
      || (item.productCode && String(candidate.productCode).toLowerCase() === String(item.productCode).toLowerCase())
      || (item.name && candidate.name.toLowerCase() === String(item.name).toLowerCase()));
    const quantity = Number(item.quantity);
    if (!product && (!item.id || !item.name)) throw new HttpError(400, "Each order item must identify a valid product");
    if (!Number.isInteger(quantity) || quantity <= 0) throw new HttpError(400, "Each order item must include a valid quantity");
    return {
      id: product?.id || item.id || item.productId,
      productCode: product?.productCode || item.productCode || item.code || "",
      name: product?.name || item.name || item.productName || item.title || "Product",
      image: product?.image || item.image || item.imageUrl || "",
      price: product ? numberValue(role === "partner" ? product.partnerPrice || product.customerPrice || product.price : product.customerPrice || product.price) : numberValue(item.price),
      quantity,
    };
  });
}

async function enrichStoredOrders(orders) {
  const products = await getCachedProducts();
  return orders.map((order) => {
    let rawItems = order.items || [];
    if (!rawItems.length) {
      const matching = products.filter((p) => Number(p.price) + (Number(p.price) >= 999 ? 0 : 79) === Number(order.total));
      if (matching.length === 1) {
        rawItems = [{ id: matching[0].id, name: matching[0].name, productCode: matching[0].productCode, image: matching[0].image, price: matching[0].price, quantity: 1 }];
      }
    }
    return {
      ...order,
      items: rawItems.map((item) => {
        const product = products.find((candidate) => String(candidate.id) === String(item.id)
          || (item.productCode && String(candidate.productCode).toLowerCase() === String(item.productCode).toLowerCase())
          || (item.name && candidate.name.toLowerCase() === String(item.name).toLowerCase()));
        return {
          ...item,
          id: item.id || product?.id || "",
          name: item.name && item.name !== "Product" ? item.name : (product?.name || item.name || "Product"),
          productCode: item.productCode || product?.productCode || "",
          image: item.image || product?.image || "",
          price: Number.isFinite(Number(item.price)) && Number(item.price) > 0 ? Number(item.price) : (product ? product.price : 0),
          quantity: Math.max(1, Math.trunc(numberValue(item.quantity, 1))),
        };
      }),
    };
  });
}

async function getCachedProducts() {
  if (productCache.data && productCache.expiresAt > Date.now()) return productCache.data;
  if (productCache.promise) return productCache.promise;
  productCache.promise = collection("products").get().then((result) => {
    productCache.data = result.docs
      .sort((a, b) => new Date(timestampValue(b.data().createdAt)).getTime() - new Date(timestampValue(a.data().createdAt)).getTime())
      .map(toProduct);
    productCache.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
    return productCache.data;
  }).catch((error) => {
    const isQuota = error.code === 8 || error.code === "RESOURCE_EXHAUSTED" || String(error.message || "").includes("Quota exceeded");
    if (productCache.data && productCache.data.length > 0) {
      console.warn(`[Products Cache] Firestore ${isQuota ? "quota exceeded" : "fetch failed"}; serving existing cached products (${productCache.data.length} items).`);
      productCache.expiresAt = Date.now() + 10 * 60 * 1000;
      return productCache.data;
    }
    throw error;
  }).finally(() => { productCache.promise = null; });
  return productCache.promise;
}

function invalidateProductCache() {
  productCache.data = null;
  productCache.expiresAt = 0;
}

function toProduct(snapshot) {
  const row = documentData(snapshot);
  return {
    id: snapshot.id || row.id,
    name: row.name || "",
    productCode: row.productCode || row.code || "",
    category: row.category || "",
    price: numberValue(row.price),
    customerPrice: numberValue(row.customerPrice ?? row.customer_price ?? row.price),
    partnerPrice: numberValue(row.partnerPrice ?? row.partner_price ?? row.customerPrice ?? row.price),
    oldPrice: numberValue(row.oldPrice ?? row.old_price ?? row.price),
    rating: numberValue(row.rating, 4.5),
    stock: Math.max(0, Math.trunc(numberValue(row.stock))),
    image: row.image || "",
    images: Array.isArray(row.images) ? row.images : [],
    description: row.description || "",
    seoKeywords: row.seoKeywords ?? row.seo_keywords ?? "",
  };
}

function toCustomer(snapshot) {
  const row = documentData(snapshot);
  return {
    id: snapshot.id || row.id,
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    city: row.city || "Bhiwadi",
    state: row.state || "Rajasthan",
    pincode: row.pincode || "",
    role: row.role === "partner" ? "partner" : "customer",
    createdAt: timestampValue(row.createdAt || row.created_at),
  };
}

function toOrder(snapshot, includeItems = true) {
  const row = documentData(snapshot);
  const shouldInclude = includeItems !== false;
  const order = {
    id: snapshot.id || row.id,
    customerId: row.customerId ?? row.customer_id ?? null,
    customer: {
      name: row.customer?.name || row.customer_name || "",
      email: row.customer?.email || row.customer_email || "",
      phone: row.customer?.phone || row.customer_phone || "",
      address: row.customer?.address || row.address || "",
      city: row.customer?.city || row.city || "Bhiwadi",
      state: row.customer?.state || row.state || "Rajasthan",
      pincode: row.customer?.pincode || row.pincode || "",
    },
    payment: row.payment || row.payment_method || "cod",
    total: numberValue(row.total),
    status: row.status || "Processing",
    createdAt: timestampValue(row.createdAt || row.created_at) || new Date(0).toISOString(),
  };
  if (shouldInclude) {
    let storedItems = [row.items, row.orderItems, row.order_items, row.cart, row.products, row.orderedProducts, row.ordered_products].find(Array.isArray);
    if (!storedItems && typeof row.items === "string") {
      try { storedItems = JSON.parse(row.items); } catch {}
    }
    if (!storedItems && typeof row.orderItems === "string") {
      try { storedItems = JSON.parse(row.orderItems); } catch {}
    }
    const itemsList = Array.isArray(storedItems) ? storedItems : [];
    order.items = itemsList.map((item) => ({
      id: item.id || item.productId || item.product?.id || "",
      name: item.name || item.productName || item.title || item.product?.name || "Product",
      productCode: item.productCode || item.code || item.product?.productCode || item.product?.code || "",
      image: item.image || item.imageUrl || item.product?.image || "",
      price: numberValue(item.price),
      quantity: Math.max(1, Math.trunc(numberValue(item.quantity, 1))),
    }));
  }
  return order;
}

function toContactEvent(snapshot) {
  const row = documentData(snapshot);
  return {
    id: snapshot.id || row.id,
    contact_number: row.contactNumber ?? row.contact_number ?? "",
    source: row.source || "website-call-button",
    created_at: timestampValue(row.createdAt || row.created_at) || new Date(0).toISOString(),
  };
}

function toReview(snapshot) {
  const row = documentData(snapshot);
  return {
    id: snapshot.id || row.id,
    type: row.type === "product" ? "product" : "shop",
    productId: row.productId ?? null,
    name: row.name || "Super Mart customer",
    customerId: row.customerId ?? null,
    customerEmail: row.customerEmail || "",
    rating: Math.min(5, Math.max(1, Math.trunc(numberValue(row.rating, 5)))),
    text: row.text || "",
    createdAt: timestampValue(row.createdAt || row.created_at) || new Date(0).toISOString(),
    updatedAt: timestampValue(row.updatedAt || row.updated_at),
  };
}

async function getCachedReviews() {
  if (reviewCache.data && reviewCache.expiresAt > Date.now()) return reviewCache.data;
  if (reviewCache.promise) return reviewCache.promise;
  reviewCache.promise = collection("reviews").get().then((result) => {
    reviewCache.data = result.docs
      .map(toReview)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    reviewCache.expiresAt = Date.now() + 60 * 60 * 1000;
    return reviewCache.data;
  }).catch((error) => {
    const isQuota = error.code === 8 || error.code === "RESOURCE_EXHAUSTED" || String(error.message || "").includes("Quota exceeded");
    if (reviewCache.data && reviewCache.data.length > 0) {
      console.warn(`[Reviews Cache] Firestore ${isQuota ? "quota exceeded" : "fetch failed"}; serving existing cached reviews.`);
      reviewCache.expiresAt = Date.now() + 10 * 60 * 1000;
      return reviewCache.data;
    }
    throw error;
  }).finally(() => { reviewCache.promise = null; });
  return reviewCache.promise;
}

async function getCachedAdminOrders() {
  if (adminOrdersCache.data && adminOrdersCache.expiresAt > Date.now()) return adminOrdersCache.data;
  if (adminOrdersCache.promise) return adminOrdersCache.promise;
  adminOrdersCache.promise = collection("orders").get().then(async (result) => {
    const orders = result.docs
      .sort((a, b) => new Date(timestampValue(b.data().createdAt)).getTime() - new Date(timestampValue(a.data().createdAt)).getTime())
      .map((doc) => toOrder(doc, true));
    const enriched = await enrichStoredOrders(orders);
    adminOrdersCache.data = enriched;
    adminOrdersCache.expiresAt = Date.now() + 5 * 60 * 1000;
    return adminOrdersCache.data;
  }).catch((error) => {
    const isQuota = error.code === 8 || error.code === "RESOURCE_EXHAUSTED" || String(error.message || "").includes("Quota exceeded");
    if (adminOrdersCache.data && adminOrdersCache.data.length > 0) {
      console.warn(`[Admin Orders Cache] Firestore ${isQuota ? "quota exceeded" : "fetch failed"}; serving existing cached orders.`);
      adminOrdersCache.expiresAt = Date.now() + 2 * 60 * 1000;
      return adminOrdersCache.data;
    }
    throw error;
  }).finally(() => { adminOrdersCache.promise = null; });
  return adminOrdersCache.promise;
}

function validateReviewInput(review) {
  const type = review?.type === "product" ? "product" : "shop";
  const rating = Number(review?.rating);
  const text = String(review?.text || "").trim();
  if (!text || text.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Review text and a rating from 1 to 5 are required");
  if (type === "product" && !review.productId) throw new HttpError(400, "Product review requires a product");
  return { type, productId: type === "product" ? String(review.productId) : null, name: String(review.name || "Super Mart customer").trim().slice(0, 80), rating, text };
}

async function customerCanReview(customerId, review, customerEmail) {
  const orders = await getOrdersForCustomer(customerId, customerEmail);
  return orders.some((order) => order.status.toLowerCase() === "delivered" && (review.type === "shop" || order.items.some((item) => String(item.id) === String(review.productId))));
}

function bearerToken(request) {
  const value = request.headers.authorization;
  return value?.startsWith("Bearer ") ? value.slice(7) : null;
}

async function findCustomerByFirebaseUid(uid) {
  const cached = getCachedCustomerByUid(uid);
  if (cached) return cached;
  const result = await collection("customers").where("firebaseUid", "==", uid).limit(1).get();
  if (result.empty) return null;
  const doc = result.docs[0];
  const customer = toCustomer(doc);
  setCachedCustomerByUid(uid, customer);
  return doc;
}

async function getCustomerIdentity(request) {
  const token = bearerToken(request);
  if (!token) return null;
  try {
    const session = jwt.verify(token, jwtSecret);
    if (session.role !== "customer" || !session.id) return null;
    return { id: String(session.id), firebaseUid: null, email: session.email, role: session.role };
  } catch (error) {
    if (error.code === 8 || error.code === "RESOURCE_EXHAUSTED") throw error;
    try {
      const decoded = await verifyFirebaseToken(token);
      if (!decoded?.uid) return null;
      const cached = getCachedCustomerByUid(decoded.uid);
      if (cached) return { id: cached.id, firebaseUid: decoded.uid, email: cached.email, role: cached.role };
      const customer = await findCustomerByFirebaseUid(decoded.uid);
      if (customer) {
        const custObj = typeof customer.data === "function" ? toCustomer(customer) : customer;
        setCachedCustomerByUid(decoded.uid, custObj);
        return { id: customer.id || custObj.id, firebaseUid: decoded.uid, email: custObj.email, role: custObj.role };
      }
      return { id: decoded.uid, firebaseUid: decoded.uid, email: decoded.email, role: "customer" };
    } catch (firebaseError) {
      if (firebaseError.code === 8 || firebaseError.code === "RESOURCE_EXHAUSTED") throw firebaseError;
      return null;
    }
  }
}

async function notifyOnTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token === "your_telegram_bot_token") return false;
  const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  if (!result.ok) throw new Error(`Telegram API returned ${result.status}: ${await result.text()}`);
  return true;
}

async function notifyOrderOnTelegram({ orderId, customer, payment, items, total }) {
  const itemLines = items.map((item) => `- ${item.name} x ${item.quantity}: Rs ${numberValue(item.price * item.quantity).toLocaleString("en-IN")}`).join("\n");
  return notifyOnTelegram([
    "New Super Mart order", `Order: ${orderId}`, "", `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`, `Email: ${customer.email}`,
    `Address: ${customer.address}, ${customer.city || "Bhiwadi"}, ${customer.state || "Rajasthan"} - ${customer.pincode}`,
    `Payment: ${(payment || "cod").toUpperCase()}`, "", "Products:", itemLines, "",
    `Total: Rs ${numberValue(total).toLocaleString("en-IN")}`,
  ].join("\n"));
}

async function initializeFirestore() {
  if (!jwtSecret) throw new Error("JWT_SECRET is required");
  if (isProduction) {
    const missing = [
      !firebaseConfig.projectId && "FIREBASE_SERVICE_ACCOUNT_BASE64 (project_id)",
      !firebaseConfig.clientEmail && "FIREBASE_SERVICE_ACCOUNT_BASE64 (client_email)",
      !firebaseConfig.privateKey && "FIREBASE_SERVICE_ACCOUNT_BASE64 (private_key)",
      !process.env.JWT_SECRET && "JWT_SECRET",
      !process.env.ADMIN_EMAIL && "ADMIN_EMAIL",
      !process.env.ADMIN_PASSWORD && "ADMIN_PASSWORD",
      !process.env.CLIENT_ORIGIN && "CLIENT_ORIGIN",
    ].filter(Boolean);
    if (missing.length) throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  }
  if (!db) {
    if (isProduction) throw new Error("Firestore is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
    console.warn("Firestore is not configured. Development mode will only support Razorpay test order creation.");
    return;
  }
  try {
    const existing = await collection("admins").limit(1).get();
    if (existing.empty) {
      const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
      const password = process.env.ADMIN_PASSWORD || "";
      if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to initialize the first admin");
      await collection("admins").doc(email).set({
        email,
        password_hash: await bcrypt.hash(password, 12),
        createdAt: new Date(),
      });
      console.log(`Initialized Firestore admin account for ${email}`);
    }
  } catch (error) {
    if (error.code === 8 || error.code === "RESOURCE_EXHAUSTED" || String(error.message || "").includes("Quota exceeded")) {
      console.warn("[Firestore Quota Exceeded] Skipping admin check during startup due to quota limit.");
      return;
    }
    throw error;
  }
}

function requireAdmin(request, response, next) {
  try {
    const session = jwt.verify(bearerToken(request), jwtSecret);
    if (session.role !== "admin") return response.status(403).json({ error: "Admin access required" });
    request.admin = session;
    next();
  } catch {
    response.status(401).json({ error: "Admin authentication required" });
  }
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, database: Boolean(db) ? "firestore" : "unavailable" });
});

app.get("/api/products", async (_request, response, next) => {
  try {
    response.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=3600");
    response.json(await getCachedProducts());
  } catch (error) { next(error); }
});

app.post("/api/admin/login", async (request, response, next) => {
  try {
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");
    if (!email || !password) return response.status(400).json({ error: "Email and password are required" });
    if (!isProduction && email === String(process.env.ADMIN_EMAIL || "").trim().toLowerCase() && password === String(process.env.ADMIN_PASSWORD || "")) {
      return response.json({ token: jwt.sign({ id: `dev-admin:${email}`, email, role: "admin" }, jwtSecret, { expiresIn: "8h" }), admin: { email, role: "admin" } });
    }
    let result = await collection("admins").where("email", "==", email).limit(1).get();
    if (result.empty) {
      const firstAdmin = await collection("admins").limit(1).get();
      if (firstAdmin.empty && email === String(process.env.ADMIN_EMAIL || "").trim().toLowerCase()) {
        await initializeFirestore();
        result = await collection("admins").where("email", "==", email).limit(1).get();
      }
    }
    const admin = result.empty ? null : result.docs[0];
    const adminData = admin?.data();
    if (!admin || !adminData?.password_hash || !(await bcrypt.compare(password, adminData.password_hash))) return response.status(401).json({ error: "Invalid admin credentials" });
    response.json({ token: jwt.sign({ id: admin.id, email: adminData.email, role: "admin" }, jwtSecret, { expiresIn: "8h" }), admin: { email: adminData.email, role: "admin" } });
  } catch (error) { next(error); }
});

app.post("/api/customer/signup", async (request, response, next) => {
  try {
    const { name, email, phone, password, address, city, state, pincode } = request.body;
    if (!name || !email || !phone || !password) return response.status(400).json({ error: "Name, email, phone and password are required" });
    if (String(password).length < 6) return response.status(400).json({ error: "Password must be at least 6 characters" });
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await collection("customers").where("email", "==", normalizedEmail).limit(1).get();
    if (!existing.empty) return response.status(409).json({ error: "An account with this email already exists" });
    const customerRecord = {
      name: String(name).trim(), email: normalizedEmail, phone: String(phone).trim(),
      password_hash: await bcrypt.hash(String(password), 12), address: address || "",
      city: city || "Bhiwadi", state: state || "Rajasthan", pincode: pincode || "",
      role: "customer",
      createdAt: new Date(), updatedAt: new Date(),
    };
    const reference = await collection("customers").add(customerRecord);
    const customer = toCustomer({ id: reference.id, data: () => customerRecord });
    setCachedCustomerById(reference.id, customer);
    invalidateAdminCustomersCache();
    response.status(201).json({ customer, token: jwt.sign({ id: customer.id, email: customer.email, role: "customer" }, jwtSecret, { expiresIn: "30d" }) });
  } catch (error) { next(error); }
});

app.post("/api/customer/firebase-sync", async (request, response, next) => {
  try {
    const decoded = await verifyFirebaseToken(bearerToken(request));
    if (!decoded?.uid || !decoded.email) return response.status(401).json({ error: "Firebase customer authentication required" });
    const { name, phone } = request.body;

    const cached = getCachedCustomerByUid(decoded.uid);
    const targetName = String(name || decoded.name || cached?.name || decoded.email.split("@")[0]).trim();
    const targetPhone = phone !== undefined ? String(phone).trim() : (cached?.phone || "");

    // If customer already cached and info hasn't changed, return immediately with 0 reads & 0 writes
    if (cached && cached.name === targetName && (phone === undefined || cached.phone === targetPhone)) {
      return response.json({ customer: cached, token: bearerToken(request) });
    }

    let existing = await findCustomerByFirebaseUid(decoded.uid);
    if (!existing) {
      const byEmail = await collection("customers").where("email", "==", decoded.email.toLowerCase()).limit(1).get();
      existing = byEmail.empty ? null : byEmail.docs[0];
    }
    const reference = existing?.ref || (existing?.id ? collection("customers").doc(existing.id) : collection("customers").doc());
    const current = (typeof existing?.data === "function" ? existing.data() : existing) || {};

    const mergedData = {
      firebaseUid: decoded.uid,
      name: targetName || current.name || decoded.email.split("@")[0],
      email: decoded.email.toLowerCase(),
      phone: targetPhone || current.phone || "",
      address: current.address || "",
      city: current.city || "Bhiwadi",
      state: current.state || "Rajasthan",
      pincode: current.pincode || "",
      createdAt: current.createdAt || new Date(),
      updatedAt: new Date(),
      role: current.role === "partner" ? "partner" : "customer",
    };

    const needsWrite = !existing || current.name !== mergedData.name || current.phone !== mergedData.phone || current.firebaseUid !== decoded.uid;
    if (needsWrite) {
      await reference.set(mergedData, { merge: true });
    }

    const customerObj = toCustomer({ id: reference.id, data: () => mergedData });
    setCachedCustomerByUid(decoded.uid, customerObj);
    setCachedCustomerById(reference.id, customerObj);
    invalidateAdminCustomersCache();

    response.json({ customer: customerObj, token: bearerToken(request) });
  } catch (error) { next(error); }
});

app.post("/api/customer/login", async (request, response, next) => {
  try {
    const email = String(request.body.email || "").trim().toLowerCase();
    const result = await collection("customers").where("email", "==", email).limit(1).get();
    const customer = result.empty ? null : result.docs[0];
    if (!customer || !(await bcrypt.compare(String(request.body.password || ""), customer.data().password_hash || ""))) return response.status(401).json({ error: "Invalid email or password" });
    const view = toCustomer(customer);
    setCachedCustomerById(view.id, view);
    if (customer.data()?.firebaseUid) setCachedCustomerByUid(customer.data().firebaseUid, view);
    response.json({ customer: view, token: jwt.sign({ id: view.id, email: view.email, role: "customer" }, jwtSecret, { expiresIn: "30d" }) });
  } catch (error) { next(error); }
});

app.get("/api/customer/me", async (request, response) => {
  const identity = await getCustomerIdentity(request);
  if (!identity) return response.status(401).json({ error: "Customer authentication required" });
  try {
    const cached = getCachedCustomerById(identity.id);
    if (cached) return response.json(cached);
    const customer = await collection("customers").doc(identity.id).get();
    if (!customer.exists) return response.status(404).json({ error: "Customer not found" });
    const custObj = toCustomer(customer);
    setCachedCustomerById(identity.id, custObj);
    response.json(custObj);
  } catch {
    response.status(401).json({ error: "Customer authentication required" });
  }
});

app.patch("/api/customer/me", async (request, response) => {
  const identity = await getCustomerIdentity(request);
  if (!identity) return response.status(401).json({ error: "Customer authentication required" });
  try {
    const allowed = ["name", "phone", "email", "address", "city", "state", "pincode"];
    const updates = Object.fromEntries(allowed.filter((key) => request.body[key] !== undefined).map((key) => [key, String(request.body[key] || "").trim()]));
    const currentCached = getCachedCustomerById(identity.id) || {};
    await collection("customers").doc(identity.id).set({ ...updates, updatedAt: new Date() }, { merge: true });
    const updated = { ...currentCached, ...updates, id: identity.id, updatedAt: new Date().toISOString() };
    setCachedCustomerById(identity.id, updated);
    invalidateAdminCustomersCache();
    response.json(updated);
  } catch (error) {
    response.status(500).json({ error: error.message || "Unable to save customer details" });
  }
});

app.get("/api/admin/customers", requireAdmin, async (_request, response, next) => {
  try {
    if (adminCustomersCache.data && adminCustomersCache.expiresAt > Date.now()) {
      return response.json(adminCustomersCache.data);
    }
    let firestoreCustomers = [];
    if (db) {
      try {
        const result = await collection("customers").get();
        firestoreCustomers = result.docs.map(toCustomer);
      } catch (firestoreError) {
        if (firestoreError.code !== 8 && firestoreError.code !== "RESOURCE_EXHAUSTED") throw firestoreError;
      }
    }
    try {
      const authUsers = await listFirebaseUsers();
      const existingMap = new Map();
      firestoreCustomers.forEach((c) => {
        if (c.firebaseUid) existingMap.set(c.firebaseUid, c);
        if (c.email) existingMap.set(c.email.toLowerCase(), c);
      });
      for (const authUser of authUsers) {
        const found = existingMap.get(authUser.firebaseUid) || (authUser.email && existingMap.get(authUser.email.toLowerCase()));
        if (!found) {
          firestoreCustomers.push(authUser);
        } else if (found.role !== "partner" && authUser.role === "partner") {
          found.role = "partner";
        }
      }
    } catch {}
    const sorted = firestoreCustomers.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    adminCustomersCache.data = sorted;
    adminCustomersCache.expiresAt = Date.now() + 10 * 60 * 1000;
    response.json(sorted);
  } catch (error) {
    try {
      response.json((await listFirebaseUsers()).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))));
    } catch (fallbackError) {
      next(fallbackError.code === 8 ? error : fallbackError);
    }
  }
});

app.patch("/api/admin/customers/:id", requireAdmin, async (request, response, next) => {
  try {
    const rawId = String(request.params.id || "").trim();
    const role = request.body.role === "partner" ? "partner" : "customer";
    const firebaseUid = rawId.startsWith("firebase:") ? rawId.slice(9) : rawId;
    const email = request.body.email ? String(request.body.email).trim().toLowerCase() : "";

    let customerDoc = null;
    let customerRef = null;

    if (db) {
      try {
        const directRef = collection("customers").doc(rawId);
        const directSnap = await directRef.get();
        if (directSnap.exists) {
          customerDoc = directSnap;
          customerRef = directRef;
        }
      } catch {}

      if (!customerDoc && firebaseUid) {
        try {
          const byUid = await collection("customers").where("firebaseUid", "==", firebaseUid).limit(1).get();
          if (!byUid.empty) {
            customerDoc = byUid.docs[0];
            customerRef = customerDoc.ref;
          }
        } catch {}
      }

      if (!customerDoc && email) {
        try {
          const byEmail = await collection("customers").where("email", "==", email).limit(1).get();
          if (!byEmail.empty) {
            customerDoc = byEmail.docs[0];
            customerRef = customerDoc.ref;
          }
        } catch {}
      }
    }

    // Update Firebase Auth custom claims if user exists in Firebase Auth
    let authUser = null;
    try {
      if (firebaseUid) {
        authUser = await updateFirebaseUserRole(firebaseUid, role);
      }
    } catch {}

    invalidateAdminCustomersCache();

    // Update or create Firestore customer doc without redundant post-write read
    if (customerRef) {
      await customerRef.set({ role, updatedAt: new Date() }, { merge: true });
      const currentData = customerDoc?.data ? customerDoc.data() : {};
      const updated = toCustomer({ id: customerRef.id, data: () => ({ ...currentData, role, updatedAt: new Date() }) });
      setCachedCustomerById(customerRef.id, updated);
      if (firebaseUid) setCachedCustomerByUid(firebaseUid, updated);
      return response.json({ ...updated, id: rawId, role });
    }

    if (db) {
      try {
        const newRef = collection("customers").doc(firebaseUid || rawId);
        const newRecord = {
          firebaseUid: firebaseUid || rawId,
          name: request.body.name || authUser?.name || "Customer",
          email: email || authUser?.email || "",
          phone: request.body.phone || authUser?.phone || "",
          address: request.body.address || "",
          city: request.body.city || "Bhiwadi",
          state: request.body.state || "Rajasthan",
          pincode: request.body.pincode || "",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await newRef.set(newRecord, { merge: true });
        const updated = toCustomer({ id: newRef.id, data: () => newRecord });
        setCachedCustomerById(newRef.id, updated);
        if (firebaseUid) setCachedCustomerByUid(firebaseUid, updated);
        return response.json({ ...updated, id: rawId, role });
      } catch {}
    }

    response.json({
      id: rawId,
      firebaseUid,
      role,
      name: request.body.name || authUser?.name || "User",
      email: email || authUser?.email || "",
      phone: request.body.phone || authUser?.phone || "",
      city: "Bhiwadi",
      state: "Rajasthan",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

async function getOrdersForCustomer(customerId, customerEmail, firebaseUid) {
  const docsMap = new Map();
  const queries = [];
  if (customerId) {
    queries.push(collection("orders").where("customerId", "==", customerId).get());
    const strippedId = String(customerId).replace(/^firebase:/, "");
    if (strippedId !== customerId) {
      queries.push(collection("orders").where("customerId", "==", strippedId).get());
    } else {
      queries.push(collection("orders").where("customerId", "==", `firebase:${strippedId}`).get());
    }
  }
  if (firebaseUid && firebaseUid !== customerId) {
    queries.push(collection("orders").where("customerId", "==", firebaseUid).get());
    queries.push(collection("orders").where("customerId", "==", `firebase:${firebaseUid}`).get());
  }
  if (customerEmail) {
    queries.push(collection("orders").where("customer.email", "==", String(customerEmail).toLowerCase()).get());
  }

  const results = await Promise.allSettled(queries);
  for (const res of results) {
    if (res.status === "fulfilled" && res.value?.docs) {
      for (const doc of res.value.docs) {
        docsMap.set(doc.id, doc);
      }
    }
  }

  const sortedDocs = Array.from(docsMap.values()).sort(
    (a, b) => new Date(timestampValue(b.data().createdAt)).getTime() - new Date(timestampValue(a.data().createdAt)).getTime()
  );
  const orders = sortedDocs.map((doc) => toOrder(doc, true));
  return enrichStoredOrders(orders);
}

app.get("/api/customer/orders", async (request, response) => {
  const identity = await getCustomerIdentity(request);
  if (!identity) return response.status(401).json({ error: "Customer authentication required" });
  try {
    const orders = await getOrdersForCustomer(identity.id, identity.email, identity.firebaseUid);
    response.json(orders);
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    response.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/reviews", async (_request, response, next) => {
  try {
    response.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=3600");
    response.json(await getCachedReviews());
  } catch (error) { next(error); }
});

app.post("/api/reviews", async (request, response, next) => {
  try {
    const identity = await getCustomerIdentity(request);
    if (!identity) return response.status(401).json({ error: "Customer authentication required" });
    const review = validateReviewInput(request.body);
    if (!(await customerCanReview(identity.id, review, identity.email))) return response.status(403).json({ error: "Reviews are available after delivery" });
    const reference = collection("reviews").doc();
    const reviewData = { ...review, customerId: identity.id, customerEmail: String(request.body.customerEmail || "").toLowerCase(), createdAt: new Date(), updatedAt: new Date() };
    await reference.set(reviewData);
    invalidateReviewCache();
    response.status(201).json(toReview({ id: reference.id, data: () => reviewData }));
  } catch (error) { next(error); }
});

app.get("/api/admin/reviews", requireAdmin, async (_request, response, next) => {
  try {
    response.json(await getCachedReviews());
  } catch (error) { next(error); }
});

app.post("/api/admin/reviews", requireAdmin, async (request, response, next) => {
  try {
    const review = validateReviewInput(request.body);
    const reference = collection("reviews").doc();
    const reviewData = { ...review, createdAt: new Date(), updatedAt: new Date() };
    await reference.set(reviewData);
    invalidateReviewCache();
    response.status(201).json(toReview({ id: reference.id, data: () => reviewData }));
  } catch (error) { next(error); }
});

app.patch("/api/admin/reviews/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("reviews").doc(request.params.id);
    const review = validateReviewInput(request.body);
    const reviewData = { ...review, updatedAt: new Date() };
    await reference.update(reviewData);
    invalidateReviewCache();
    response.json(toReview({ id: request.params.id, data: () => reviewData }));
  } catch (error) { next(error); }
});

app.delete("/api/admin/reviews/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("reviews").doc(request.params.id);
    await reference.delete();
    invalidateReviewCache();
    response.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/admin/orders", requireAdmin, async (_request, response, next) => {
  try {
    response.json(await getCachedAdminOrders());
  } catch (error) { next(error); }
});

app.post("/api/payments/razorpay/order", async (request, response, next) => {
  try {
    if (!razorpay) throw new HttpError(503, "Online payment is not configured on the server");
    const amount = Number(request.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, "A valid payment amount is required");
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `supermart_${Date.now()}`,
      payment_capture: 1,
    });
    response.json({ id: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) { next(error); }
});

app.post("/api/orders", async (request, response, next) => {
  try {
    const identity = await getCustomerIdentity(request);
    if (!identity) return response.status(401).json({ error: "Please log in before placing an order." });
    const { customer, payment, items } = request.body;
    if (!customer?.name || !customer?.email || !customer?.phone || !customer?.address || !customer?.pincode || !Array.isArray(items) || !items.length) return response.status(400).json({ error: "Customer and order details are required" });
    if (!allowedPaymentMethods.has(payment || "cod")) return response.status(400).json({ error: "Invalid payment method" });
    
    const cachedCust = getCachedCustomerById(identity.id);
    let customerRole = identity.role || cachedCust?.role;
    if (!customerRole) {
      try {
        const customerSnapshot = await collection("customers").doc(String(identity.id)).get();
        customerRole = customerSnapshot.data()?.role === "partner" ? "partner" : "customer";
      } catch {
        customerRole = "customer";
      }
    }

    const normalizedItems = await normalizeOrderItems(items, customerRole);
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + (subtotal >= 999 ? 0 : 79);
    if (payment === "online") {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.body;
      if (!razorpay || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return response.status(400).json({ error: "Online payment details are required" });
      const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
      if (expectedSignature !== razorpaySignature) return response.status(400).json({ error: "Online payment verification failed" });
      const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
      const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
      if (Number(razorpayOrder.amount) !== Math.round(total * 100) || razorpayPayment.order_id !== razorpayOrderId || razorpayPayment.status !== "captured") {
        return response.status(400).json({ error: "Online payment amount or status could not be verified" });
      }
    }
    const orderId = `SM-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const order = {
      customerId: identity.id, customer: {
        name: String(customer.name), email: String(customer.email).toLowerCase(), phone: String(customer.phone),
        address: String(customer.address), city: customer.city || "Bhiwadi", state: customer.state || "Rajasthan", pincode: String(customer.pincode),
      },
      payment: payment || "cod", total, status: "Processing", paymentStatus: payment === "online" ? "paid" : "cod_pending", items: normalizedItems, orderItems: normalizedItems,
      createdAt: new Date(), updatedAt: new Date(),
    };
    await collection("orders").doc(orderId).create(order);
    invalidateAdminOrdersCache();
    notifyOrderOnTelegram({ orderId, customer: order.customer, payment: order.payment, items: normalizedItems, total }).catch((error) => console.error("Telegram order notification failed:", error.message));
    response.status(201).json({
      id: orderId,
      total,
      status: order.status,
      payment: order.payment,
      customer: order.customer,
      items: normalizedItems,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) { next(error); }
});

app.post("/api/inquiries", async (request, response, next) => {
  try {
    const { name, email, phone, subject, message } = request.body;
    if (!name || !email || !subject || !message) return response.status(400).json({ error: "Name, email, subject and message are required" });
    const inquiry = { name: String(name).trim(), email: String(email).trim().toLowerCase(), phone: String(phone || "").trim(), subject: String(subject).trim(), message: String(message).trim(), createdAt: new Date() };
    const reference = await collection("inquiries").add(inquiry);
    notifyOnTelegram([
      "New Super Mart inquiry", `Name: ${inquiry.name}`, `Phone: ${inquiry.phone || "Not provided"}`,
      `Email: ${inquiry.email}`, `Subject: ${inquiry.subject}`, "", inquiry.message,
    ].join("\n")).catch((error) => console.error("Telegram inquiry notification failed:", error.message));
    response.status(201).json({ id: reference.id, message: "Inquiry received" });
  } catch (error) { next(error); }
});

app.post("/api/contact-events", async (request, response, next) => {
  try {
    const { contactNumber, source } = request.body;
    if (!contactNumber) return response.status(400).json({ error: "Contact number is required" });
    const eventData = { contactNumber: String(contactNumber), source: source || "website-call-button", createdAt: new Date() };
    const reference = await collection("contactEvents").add(eventData);
    response.status(201).json(toContactEvent({ id: reference.id, data: () => eventData }));
  } catch (error) { next(error); }
});

app.get("/api/admin/contact-events", requireAdmin, async (_request, response, next) => {
  try {
    const result = await collection("contactEvents").get();
    response.json(result.docs.sort((a, b) => new Date(timestampValue(b.data().createdAt)).getTime() - new Date(timestampValue(a.data().createdAt)).getTime()).slice(0, 200).map(toContactEvent));
  } catch (error) { next(error); }
});

app.patch("/api/admin/orders/:id", requireAdmin, async (request, response, next) => {
  try {
    const status = String(request.body.status || "").trim();
    if (!allowedOrderStatuses.has(status)) return response.status(400).json({ error: `Invalid order status. Allowed: ${[...allowedOrderStatuses].join(", ")}` });
    const reference = collection("orders").doc(request.params.id);
    if (db) {
      try {
        const existing = await reference.get();
        if (existing.exists) {
          const updatedAt = new Date();
          await reference.update({ status, updatedAt });
          invalidateAdminOrdersCache();
          const merged = { ...existing.data(), status, updatedAt };
          const baseOrder = toOrder({ id: reference.id, data: () => merged }, true);
          const enriched = (await enrichStoredOrders([baseOrder]))[0];
          return response.json(enriched || baseOrder);
        }
      } catch (dbErr) {
        if (dbErr.code !== 8 && dbErr.code !== "RESOURCE_EXHAUSTED") throw dbErr;
      }
    }
    invalidateAdminOrdersCache();
    response.json({
      id: request.params.id,
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) { next(error); }
});

function validateProductInput(product) {
  if (!product?.name || !product?.productCode || !product?.category || !product?.image) throw new HttpError(400, "Name, product code, category and image are required");
  const price = Number(product.price);
  const customerPrice = Number(product.customerPrice ?? price);
  const partnerPrice = Number(product.partnerPrice ?? customerPrice);
  const stock = Number(product.stock ?? 0);
  const rating = Number(product.rating ?? 4.5);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(customerPrice) || customerPrice < 0 || !Number.isFinite(partnerPrice) || partnerPrice < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(rating) || rating < 0) throw new HttpError(400, "Product prices, rating and stock must be valid numbers");
  return {
    name: String(product.name).trim(), productCode: String(product.productCode).trim(), category: String(product.category).trim(), price, customerPrice, partnerPrice,
    oldPrice: Number.isFinite(Number(product.oldPrice)) ? Number(product.oldPrice) : price,
    rating, stock: Math.trunc(stock), image: String(product.image).trim(),
    images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 20) : [],
    description: product.description || "", seoKeywords: product.seoKeywords || "",
  };
}

app.post("/api/admin/products", requireAdmin, async (request, response, next) => {
  try {
    const product = validateProductInput(request.body);
    const productData = { ...product, createdAt: new Date(), updatedAt: new Date() };
    const reference = await collection("products").add(productData);
    invalidateProductCache();
    response.status(201).json(toProduct({ id: reference.id, data: () => productData }));
  } catch (error) { next(error); }
});

app.patch("/api/admin/products/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("products").doc(request.params.id);
    const product = validateProductInput(request.body);
    const productData = { ...product, updatedAt: new Date() };
    await reference.update(productData);
    invalidateProductCache();
    response.json(toProduct({ id: request.params.id, data: () => productData }));
  } catch (error) { next(error); }
});

app.delete("/api/admin/products/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("products").doc(request.params.id);
    await reference.delete();
    invalidateProductCache();
    response.status(204).end();
  } catch (error) { next(error); }
});

app.use((error, _request, response, _next) => {
  const isQuota = error.code === 8 || error.code === "RESOURCE_EXHAUSTED" || String(error.message || "").includes("Quota exceeded");
  if (isQuota) {
    console.warn(`[Firestore Quota Exceeded] Request failed: Daily free Firestore read/write quota reached on Google Cloud project.`);
    return response.status(503).json({
      error: "Firestore quota exceeded. Daily operations limit reached on Firebase. Please wait for the daily quota reset or upgrade to the Blaze plan.",
      code: "RESOURCE_EXHAUSTED",
    });
  }
  console.error(error);
  const status = Number(error.status) >= 400 && Number(error.status) < 500 ? error.status : 500;
  response.status(status).json({ error: status === 500 ? "Server error" : error.message });
});

function describeFirestoreStartupError(error) {
  if (error.code === 5) return `Firestore database "${firestoreDatabaseId}" was not found in project "${firebaseConfig.projectId}". Create/enable that database in Firebase Console > Firestore Database, or set FIRESTORE_DATABASE_ID to an existing database ID.`;
  if (error.code === 8 || error.code === "RESOURCE_EXHAUSTED") return "Firestore quota exceeded. Check Firebase Console > Firestore > Usage, wait for the quota window to reset, or enable billing/raise the database quota.";
  return error.message;
}

function startServer() {
  app.listen(port, () => console.log(`SuperMart API running on http://localhost:${port}`));
}

initializeFirestore()
  .then(startServer)
  .catch((error) => {
    const detail = describeFirestoreStartupError(error);
    console.error(`Firestore startup failed: ${detail}`);
    if (isProduction) {
      process.exit(1);
      return;
    }
    console.warn("Development mode: starting the API without the Firestore startup check. Firestore-backed requests will work after the quota is available again.");
    startServer();
  });
