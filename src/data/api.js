const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, { headers: { "Content-Type": "application/json", ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, ...options, body: options.body ? JSON.stringify(options.body) : undefined });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || "API request failed");
  return data;
}

export const api = {
  login: (body) => request("/admin/login", { method: "POST", body }),
  customerLogin: (body) => request("/customer/login", { method: "POST", body }),
  customerSignup: (body) => request("/customer/signup", { method: "POST", body }),
  firebaseSync: (body, token) => request("/customer/firebase-sync", { method: "POST", body, token }),
  customerMe: (token) => request("/customer/me", { token }),
  getCustomerOrders: (token) => request("/customer/orders", { token }),
  getProducts: () => request("/products"),
  getReviews: () => request("/reviews"),
  createReview: (body, token) => request("/reviews", { method: "POST", body, token }),
  getAdminReviews: (token) => request("/admin/reviews", { token }),
  saveReview: (body, token, id) => request(id ? `/admin/reviews/${id}` : "/admin/reviews", { method: id ? "PATCH" : "POST", body, token }),
  deleteReview: (id, token) => request(`/admin/reviews/${id}`, { method: "DELETE", token }),
  createRazorpayOrder: (body) => request("/payments/razorpay/order", { method: "POST", body }),
  getOrders: (token) => request("/admin/orders", { token }),
  getContactEvents: (token) => request("/admin/contact-events", { token }),
  logContactEvent: (body) => request("/contact-events", { method: "POST", body }),
  submitInquiry: (body) => request("/inquiries", { method: "POST", body }),
  createOrder: (body, token) => request("/orders", { method: "POST", body, token }),
  saveProduct: (body, token, id) => request(id ? `/admin/products/${id}` : "/admin/products", { method: id ? "PATCH" : "POST", body, token }),
  deleteProduct: (id, token) => request(`/admin/products/${id}`, { method: "DELETE", token }),
  updateOrder: (id, status, token) => request(`/admin/orders/${id}`, { method: "PATCH", body: { status }, token }),
};
