import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { db, firebaseConfig, firestoreDatabaseId, verifyFirebaseToken } from "./firebase.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "";
const collection = (name) => db.collection(name);
const allowedOrderStatuses = new Set(["Processing", "Shipped", "Delivered", "Cancelled"]);
const allowedPaymentMethods = new Set(["cod", "online"]);
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",").map((value) => value.trim()) || "http://localhost:5173" }));
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

async function normalizeOrderItems(items) {
  const productSnapshot = await collection("products").get();
  const products = productSnapshot.docs.map((snapshot) => toProduct(snapshot));
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
      price: product ? numberValue(product.price) : numberValue(item.price),
      quantity,
    };
  });
}

async function enrichStoredOrders(orders) {
  const result = await collection("products").get();
  const products = result.docs.map((snapshot) => toProduct(snapshot));
  return orders.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => {
      const product = products.find((candidate) => String(candidate.id) === String(item.id)
        || (item.productCode && String(candidate.productCode).toLowerCase() === String(item.productCode).toLowerCase())
        || (item.name && candidate.name.toLowerCase() === String(item.name).toLowerCase()));
      return {
        ...item,
        id: product?.id || item.id,
        name: product?.name || item.name || "Product",
        productCode: product?.productCode || item.productCode || "",
        image: product?.image || item.image || "",
        price: product ? product.price : item.price,
      };
    }),
  }));
}

function toProduct(snapshot) {
  const row = documentData(snapshot);
  return {
    id: snapshot.id || row.id,
    name: row.name || "",
    productCode: row.productCode || row.code || "",
    category: row.category || "",
    price: numberValue(row.price),
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
  };
}

function toOrder(snapshot, includeItems = true) {
  const row = documentData(snapshot);
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
  if (includeItems) {
    const storedItems = [row.items, row.orderItems, row.order_items, row.cart, row.products, row.orderedProducts, row.ordered_products].find(Array.isArray) || [];
    order.items = storedItems.map((item) => ({
      id: item.id || item.productId || item.product?.id,
      name: item.name || item.productName || item.title || item.product?.name || "",
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

function validateReviewInput(review) {
  const type = review?.type === "product" ? "product" : "shop";
  const rating = Number(review?.rating);
  const text = String(review?.text || "").trim();
  if (!text || text.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Review text and a rating from 1 to 5 are required");
  if (type === "product" && !review.productId) throw new HttpError(400, "Product review requires a product");
  return { type, productId: type === "product" ? String(review.productId) : null, name: String(review.name || "Super Mart customer").trim().slice(0, 80), rating, text };
}

async function customerCanReview(customerId, review) {
  const orders = await getOrdersForCustomer(customerId);
  return orders.some((order) => order.status.toLowerCase() === "delivered" && (review.type === "shop" || order.items.some((item) => String(item.id) === String(review.productId))));
}

function bearerToken(request) {
  const value = request.headers.authorization;
  return value?.startsWith("Bearer ") ? value.slice(7) : null;
}

async function findCustomerByFirebaseUid(uid) {
  const result = await collection("customers").where("firebaseUid", "==", uid).limit(1).get();
  return result.empty ? null : result.docs[0];
}

async function getCustomerIdentity(request) {
  const token = bearerToken(request);
  if (!token) return null;
  try {
    const session = jwt.verify(token, jwtSecret);
    if (session.role !== "customer" || !session.id) return null;
    const customer = await collection("customers").doc(String(session.id)).get();
    return customer.exists ? { id: customer.id, firebaseUid: null } : null;
  } catch {
    try {
      const decoded = await verifyFirebaseToken(token);
      if (!decoded?.uid) return null;
      const customer = await findCustomerByFirebaseUid(decoded.uid);
      return customer ? { id: customer.id, firebaseUid: decoded.uid } : null;
    } catch {
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
  if (isProduction && (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey || !process.env.JWT_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.CLIENT_ORIGIN)) {
    throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD and CLIENT_ORIGIN are required in production");
  }
  if (!db) {
    if (isProduction) throw new Error("Firestore is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
    console.warn("Firestore is not configured. Development mode will only support Razorpay test order creation.");
    return;
  }
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

app.get("/api/health", async (_request, response) => {
  try {
    requireFirestore();
    await collection("products").limit(1).get();
    response.json({ ok: true, database: "firestore" });
  } catch {
    response.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.get("/api/products", async (_request, response, next) => {
  try {
    const result = await collection("products").get();
    response.json(result.docs
      .sort((a, b) => new Date(timestampValue(b.data().createdAt)).getTime() - new Date(timestampValue(a.data().createdAt)).getTime())
      .map(toProduct));
  } catch (error) { next(error); }
});

app.post("/api/admin/login", async (request, response, next) => {
  try {
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");
    if (!email || !password) return response.status(400).json({ error: "Email and password are required" });
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
    const reference = await collection("customers").add({
      name: String(name).trim(), email: normalizedEmail, phone: String(phone).trim(),
      password_hash: await bcrypt.hash(String(password), 12), address: address || "",
      city: city || "Bhiwadi", state: state || "Rajasthan", pincode: pincode || "",
      createdAt: new Date(), updatedAt: new Date(),
    });
    const customer = toCustomer(await reference.get());
    response.status(201).json({ customer, token: jwt.sign({ id: customer.id, email: customer.email, role: "customer" }, jwtSecret, { expiresIn: "30d" }) });
  } catch (error) { next(error); }
});

app.post("/api/customer/firebase-sync", async (request, response, next) => {
  try {
    const decoded = await verifyFirebaseToken(bearerToken(request));
    if (!decoded?.uid || !decoded.email) return response.status(401).json({ error: "Firebase customer authentication required" });
    const { name, phone } = request.body;
    let existing = await findCustomerByFirebaseUid(decoded.uid);
    if (!existing) {
      const byEmail = await collection("customers").where("email", "==", decoded.email.toLowerCase()).limit(1).get();
      existing = byEmail.empty ? null : byEmail.docs[0];
    }
    const reference = existing?.ref || collection("customers").doc();
    const current = existing?.data() || {};
    await reference.set({
      firebaseUid: decoded.uid, name: name || decoded.name || current.name || decoded.email.split("@")[0],
      email: decoded.email.toLowerCase(), phone: phone ?? current.phone ?? "",
      address: current.address || "", city: current.city || "Bhiwadi", state: current.state || "Rajasthan",
      pincode: current.pincode || "", createdAt: current.createdAt || new Date(), updatedAt: new Date(),
    }, { merge: true });
    response.json({ customer: toCustomer(await reference.get()), token: bearerToken(request) });
  } catch (error) { next(error); }
});

app.post("/api/customer/login", async (request, response, next) => {
  try {
    const email = String(request.body.email || "").trim().toLowerCase();
    const result = await collection("customers").where("email", "==", email).limit(1).get();
    const customer = result.empty ? null : result.docs[0];
    if (!customer || !(await bcrypt.compare(String(request.body.password || ""), customer.data().password_hash || ""))) return response.status(401).json({ error: "Invalid email or password" });
    const view = toCustomer(customer);
    response.json({ customer: view, token: jwt.sign({ id: view.id, email: view.email, role: "customer" }, jwtSecret, { expiresIn: "30d" }) });
  } catch (error) { next(error); }
});

app.get("/api/customer/me", async (request, response) => {
  const identity = await getCustomerIdentity(request);
  if (!identity) return response.status(401).json({ error: "Customer authentication required" });
  try {
    const customer = await collection("customers").doc(identity.id).get();
    if (!customer.exists) return response.status(404).json({ error: "Customer not found" });
    response.json(toCustomer(customer));
  } catch {
    response.status(401).json({ error: "Customer authentication required" });
  }
});

async function getOrdersForCustomer(customerId) {
  const result = await collection("orders").where("customerId", "==", customerId).get();
  const orders = result.docs.sort((a, b) => new Date(timestampValue(b.data().createdAt)).getTime() - new Date(timestampValue(a.data().createdAt)).getTime()).map(toOrder);
  return enrichStoredOrders(orders);
}

app.get("/api/customer/orders", async (request, response) => {
  const identity = await getCustomerIdentity(request);
  if (!identity) return response.status(401).json({ error: "Customer authentication required" });
  try { response.json(await getOrdersForCustomer(identity.id)); } catch { response.status(401).json({ error: "Customer authentication required" }); }
});

app.get("/api/reviews", async (_request, response, next) => {
  try {
    const result = await collection("reviews").get();
    response.json(result.docs.map(toReview).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) { next(error); }
});

app.post("/api/reviews", async (request, response, next) => {
  try {
    const identity = await getCustomerIdentity(request);
    if (!identity) return response.status(401).json({ error: "Customer authentication required" });
    const review = validateReviewInput(request.body);
    if (!(await customerCanReview(identity.id, review))) return response.status(403).json({ error: "Reviews are available after delivery" });
    const reference = collection("reviews").doc();
    await reference.set({ ...review, customerId: identity.id, customerEmail: String(request.body.customerEmail || "").toLowerCase(), createdAt: new Date(), updatedAt: new Date() });
    response.status(201).json(toReview(await reference.get()));
  } catch (error) { next(error); }
});

app.get("/api/admin/reviews", requireAdmin, async (_request, response, next) => {
  try {
    const result = await collection("reviews").get();
    response.json(result.docs.map(toReview));
  } catch (error) { next(error); }
});

app.post("/api/admin/reviews", requireAdmin, async (request, response, next) => {
  try {
    const review = validateReviewInput(request.body);
    const reference = collection("reviews").doc();
    await reference.set({ ...review, createdAt: new Date(), updatedAt: new Date() });
    response.status(201).json(toReview(await reference.get()));
  } catch (error) { next(error); }
});

app.patch("/api/admin/reviews/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("reviews").doc(request.params.id);
    if (!(await reference.get()).exists) return response.status(404).json({ error: "Review not found" });
    const review = validateReviewInput(request.body);
    await reference.update({ ...review, updatedAt: new Date() });
    response.json(toReview(await reference.get()));
  } catch (error) { next(error); }
});

app.delete("/api/admin/reviews/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("reviews").doc(request.params.id);
    if (!(await reference.get()).exists) return response.status(404).json({ error: "Review not found" });
    await reference.delete();
    response.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/admin/orders", requireAdmin, async (_request, response, next) => {
  try {
    const result = await collection("orders").get();
    const orders = result.docs.sort((a, b) => new Date(timestampValue(b.data().createdAt)).getTime() - new Date(timestampValue(a.data().createdAt)).getTime()).map(toOrder);
    response.json(await enrichStoredOrders(orders));
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
    const normalizedItems = await normalizeOrderItems(items);
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
    const reference = await collection("contactEvents").add({ contactNumber: String(contactNumber), source: source || "website-call-button", createdAt: new Date() });
    response.status(201).json(toContactEvent(await reference.get()));
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
    if (!allowedOrderStatuses.has(request.body.status)) return response.status(400).json({ error: "Invalid order status" });
    const reference = collection("orders").doc(request.params.id);
    const existing = await reference.get();
    if (!existing.exists) return response.status(404).json({ error: "Order not found" });
    await reference.update({ status: request.body.status, updatedAt: new Date() });
    response.json(toOrder(await reference.get(), false));
  } catch (error) { next(error); }
});

function validateProductInput(product) {
  if (!product?.name || !product?.productCode || !product?.category || !product?.image) throw new HttpError(400, "Name, product code, category and image are required");
  const price = Number(product.price);
  const stock = Number(product.stock ?? 0);
  const rating = Number(product.rating ?? 4.5);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(rating) || rating < 0) throw new HttpError(400, "Product price, rating and stock must be valid numbers");
  return {
    name: String(product.name).trim(), productCode: String(product.productCode).trim(), category: String(product.category).trim(), price,
    oldPrice: Number.isFinite(Number(product.oldPrice)) ? Number(product.oldPrice) : price,
    rating, stock: Math.trunc(stock), image: String(product.image).trim(),
    images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 20) : [],
    description: product.description || "", seoKeywords: product.seoKeywords || "",
  };
}

app.post("/api/admin/products", requireAdmin, async (request, response, next) => {
  try {
    const product = validateProductInput(request.body);
    const reference = await collection("products").add({ ...product, createdAt: new Date(), updatedAt: new Date() });
    response.status(201).json(toProduct(await reference.get()));
  } catch (error) { next(error); }
});

app.patch("/api/admin/products/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("products").doc(request.params.id);
    if (!(await reference.get()).exists) return response.status(404).json({ error: "Product not found" });
    const product = validateProductInput(request.body);
    await reference.update({ ...product, updatedAt: new Date() });
    response.json(toProduct(await reference.get()));
  } catch (error) { next(error); }
});

app.delete("/api/admin/products/:id", requireAdmin, async (request, response, next) => {
  try {
    const reference = collection("products").doc(request.params.id);
    if (!(await reference.get()).exists) return response.status(404).json({ error: "Product not found" });
    await reference.delete();
    response.status(204).end();
  } catch (error) { next(error); }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  const status = Number(error.status) >= 400 && Number(error.status) < 500 ? error.status : 500;
  response.status(status).json({ error: status === 500 ? "Server error" : error.message });
});

initializeFirestore()
  .then(() => app.listen(port, () => console.log(`SuperMart API running on http://localhost:${port}`)))
  .catch((error) => {
    const detail = error.code === 5
      ? `Firestore database "${firestoreDatabaseId}" was not found in project "${firebaseConfig.projectId}". Create/enable that database in Firebase Console > Firestore Database, or set FIRESTORE_DATABASE_ID to an existing database ID.`
      : error.message;
    console.error(`Firestore startup failed: ${detail}`);
    process.exit(1);
  });
