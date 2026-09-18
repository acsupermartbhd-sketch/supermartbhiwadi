const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const readCache = new Map();
const pendingReads = new Map();
const readCacheTtl = 30 * 60 * 1000;
const cacheableReads = new Set(["/reviews"]);
const persistentCachePrefix = `supermart-api-cache:${import.meta.env.VITE_FIREBASE_PROJECT_ID || "local"}`;

function persistentCacheKey(path) {
  return `${persistentCachePrefix}:${path}`;
}

function invalidateRead(path) {
  readCache.delete(path);
  localStorage.removeItem(persistentCacheKey(path));
}

export function clearCatalogCache() {
  invalidateRead("/products");
  invalidateRead("/reviews");
}

async function request(path, options = {}) {
  const method = options.method || "GET";
  const cacheable = method === "GET" && cacheableReads.has(path);
  const inFlightKey = `${method}:${path}:${options.token || ""}`;

  if (cacheable) {
    const cached = readCache.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
      const stored = JSON.parse(localStorage.getItem(persistentCacheKey(path)) || "null");
      if (stored?.expiresAt > Date.now()) {
        readCache.set(path, stored);
        return stored.value;
      }
    } catch {
      localStorage.removeItem(persistentCacheKey(path));
    }
  }

  if (method === "GET" && pendingReads.has(inFlightKey)) {
    return pendingReads.get(inFlightKey);
  }

  const requestPromise = (async () => {
    const response = await fetch(`${apiBase}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      const error = new Error(data?.error || "API request failed");
      error.status = response.status;
      throw error;
    }
    if (cacheable) {
      const cached = { value: data, expiresAt: Date.now() + readCacheTtl };
      readCache.set(path, cached);
      localStorage.setItem(persistentCacheKey(path), JSON.stringify(cached));
    }
    return data;
  })();

  if (method === "GET") {
    pendingReads.set(inFlightKey, requestPromise);
    requestPromise.finally(() => pendingReads.delete(inFlightKey));
  }

  return requestPromise;
}

export const api = {
  login: (body) => request("/admin/login", { method: "POST", body }),
  customerLogin: (body) => request("/customer/login", { method: "POST", body }),
  customerSignup: (body) => request("/customer/signup", { method: "POST", body }),
  firebaseSync: (body, token) => request("/customer/firebase-sync", { method: "POST", body, token }),
  customerMe: (token) => request("/customer/me", { token }),
  updateCustomerProfile: (body, token) => request("/customer/me", { method: "PATCH", body, token }),
  getCustomerOrders: (token) => request("/customer/orders", { token }),
  getProducts: () => request("/products"),
  getReviews: () => request("/reviews"),
  createReview: (body, token) => request("/reviews", { method: "POST", body, token }),
  getAdminReviews: (token) => request("/admin/reviews", { token }),
  saveReview: (body, token, id) => request(id ? `/admin/reviews/${id}` : "/admin/reviews", { method: id ? "PATCH" : "POST", body, token }).then((result) => { invalidateRead("/reviews"); return result; }),
  deleteReview: (id, token) => request(`/admin/reviews/${id}`, { method: "DELETE", token }).then((result) => { invalidateRead("/reviews"); return result; }),
  createRazorpayOrder: (body) => request("/payments/razorpay/order", { method: "POST", body }),
  getOrders: (token) => request("/admin/orders", { token }),
  getAdminCustomers: (token) => request("/admin/customers", { token }),
  updateCustomerRole: (id, role, token, meta = {}) => request(`/admin/customers/${encodeURIComponent(id)}`, { method: "PATCH", body: { role, ...meta }, token }),
  getContactEvents: (token) => request("/admin/contact-events", { token }),
  logContactEvent: (body) => request("/contact-events", { method: "POST", body }),
  submitInquiry: (body, token) => request("/inquiries", { method: "POST", body, token }),
  createOrder: (body, token) => request("/orders", { method: "POST", body, token }),
  saveProduct: (body, token, id) => request(id ? `/admin/products/${encodeURIComponent(id)}` : "/admin/products", { method: id ? "PATCH" : "POST", body, token }).then((result) => { clearCatalogCache(); localStorage.setItem("supermart-catalog-updated", String(Date.now())); return result; }),
  deleteProduct: (id, token) => request(`/admin/products/${encodeURIComponent(id)}`, { method: "DELETE", token }).then((result) => { clearCatalogCache(); localStorage.setItem("supermart-catalog-updated", String(Date.now())); return result; }),
  updateOrder: (id, status, token) => request(`/admin/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: { status }, token }),
  getInquiries: (token) => request("/admin/inquiries", { token }),
};
