import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import Navbar from "./components/NavbarResponsive";
import Footer from "./components/Footer";
import ProfileModal from "./components/ProfileModal";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));
import productsData from "./data/products";
import { readCollection, writeCollection } from "./data/database";
import { api, clearCatalogCache } from "./data/api";
import { firebaseAuth } from "./data/firebase";

const starterShopReviews = [
  ["Riya Mehta", 5, "Smooth ordering, quick delivery and very helpful support."],
  ["Amit Sharma", 5, "Good prices and the product arrived safely packed."],
  ["Neha Gupta", 5, "The team answered my questions patiently. Great local service."],
  ["Rahul Verma", 4, "Easy checkout and delivery was right on time."],
  ["Pooja Jain", 5, "Very professional experience from order to delivery."],
  ["Karan Singh", 5, "The product quality was exactly as shown on the website."],
  ["Simran Kaur", 4, "Fast response on WhatsApp and a hassle-free purchase."],
  ["Vikas Yadav", 5, "Best electronics shopping experience in Bhiwadi so far."],
  ["Anjali Saini", 5, "Clean packaging, polite delivery and a great product."],
  ["Mohit Kumar", 4, "The order tracking and updates were very useful."],
  ["Shweta Sharma", 5, "Super Mart made buying electronics feel simple."],
  ["Deepak Arora", 5, "Excellent value and the item reached me in perfect condition."],
  ["Nisha Rawat", 4, "Friendly team and a simple, reliable shopping experience."],
  ["Arjun Bansal", 5, "Loved the quick delivery and genuine product."],
  ["Priya Choudhary", 5, "The website was easy to use and support was responsive."],
  ["Sahil Khan", 4, "Good service, good communication and fair pricing."],
  ["Meena Joshi", 5, "A dependable local store for laptops and accessories."],
  ["Tarun Goyal", 5, "Everything was smooth. I will shop here again."],
].map(([name, rating, text], index) => ({ id: `seed-shop-${index + 1}`, type: "shop", name, rating, text, createdAt: "2026-09-01T10:00:00.000Z" }));

function readReviews() {
  const storedReviews = readCollection("reviews", []);
  return storedReviews.some((review) => String(review.id).startsWith("seed-shop-")) ? storedReviews : [...starterShopReviews, ...storedReviews];
}

function hasSeenLaunchScreen() {
  try {
    return window.localStorage.getItem("supermart-launch-seen") === "true";
  } catch {
    return false;
  }
}

function App() {
  const [products, setProducts] = useState(() => readCollection("products", productsData));
  const [cart, setCart] = useState(() => readCollection("cart", []));
  const [wishlist, setWishlist] = useState(() => readCollection("wishlist", []));
  const [orders, setOrders] = useState(() => readCollection("orders", []));
  const [reviews, setReviews] = useState(readReviews);
  const [contactEvents, setContactEvents] = useState(() => readCollection("contact-events", []));
  const [adminSession, setAdminSession] = useState(() => {
    const session = readCollection("admin-session", null);
    return session?.token ? session : null;
  });
  const [customerSession, setCustomerSession] = useState(() => readCollection("customer-session", null));
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [adminCustomers, setAdminCustomers] = useState([]);
  const [adminCustomersError, setAdminCustomersError] = useState("");
  const [showLaunchScreen, setShowLaunchScreen] = useState(() => !hasSeenLaunchScreen());

  const refreshAdminCustomers = useCallback(async () => {
    if (!adminSession?.token) {
      setAdminCustomers(customerSession ? [{ ...customerSession, orders: 0, spent: 0 }] : []);
      setAdminCustomersError("Admin API session is unavailable. Start the server and sign in through the API to view all users.");
      return;
    }
    try {
      setAdminCustomersError("");
      setAdminCustomers(await api.getAdminCustomers(adminSession.token));
    } catch (error) {
      setAdminCustomersError(error.message || "Unable to load registered users.");
    }
  }, [adminSession?.token]);

  useEffect(() => {
    if (!showLaunchScreen) return undefined;
    try {
      window.localStorage.setItem("supermart-launch-seen", "true");
    } catch {
      // Continue without persistence when browser storage is unavailable.
    }
    const timer = window.setTimeout(() => setShowLaunchScreen(false), 1800);
    return () => window.clearTimeout(timer);
  }, [showLaunchScreen]);

  useEffect(() => writeCollection("products", products), [products]);
  useEffect(() => writeCollection("cart", cart), [cart]);
  useEffect(() => writeCollection("wishlist", wishlist), [wishlist]);
  useEffect(() => writeCollection("orders", orders), [orders]);
  useEffect(() => writeCollection("reviews", reviews), [reviews]);
  useEffect(() => writeCollection("contact-events", contactEvents), [contactEvents]);
  useEffect(() => writeCollection("admin-session", adminSession), [adminSession]);
  useEffect(() => writeCollection("customer-session", customerSession), [customerSession]);
  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => undefined);
    api.getReviews().then(setReviews).catch(() => undefined);
  }, []);
  useEffect(() => {
    const refreshCatalogAfterAdminUpdate = (event) => {
      if (event.key !== "supermart-catalog-updated") return;
      clearCatalogCache();
      api.getProducts().then(setProducts).catch(() => undefined);
    };
    window.addEventListener("storage", refreshCatalogAfterAdminUpdate);
    return () => window.removeEventListener("storage", refreshCatalogAfterAdminUpdate);
  }, []);
  useEffect(() => {
    if (!adminSession?.token) {
      return;
    }
    api.getOrders(adminSession.token).then((remoteOrders) => {
      setOrders(remoteOrders);
    }).catch((error) => {
      if (error.status === 401) setAdminSession(null);
    });
    api.getContactEvents(adminSession.token).then(setContactEvents).catch(() => undefined);
    api.getAdminReviews(adminSession.token).then(setReviews).catch(() => undefined);
    refreshAdminCustomers();
  }, [adminSession?.token, refreshAdminCustomers]);
  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setCustomerSession(null);
        return;
      }
      const existing = readCollection("customer-session", null);
      const isSameUser = existing && (existing.id === user.uid || existing.id === `firebase:${user.uid}` || existing.email === user.email);
      if (isSameUser && existing.token) {
        setCustomerSession(existing);
      }
      try {
        const token = await user.getIdToken();
        if (!isSameUser || !existing?.syncedAt || (Date.now() - Number(existing.syncedAt)) > 30 * 60 * 1000) {
          const result = await api.firebaseSync({ name: user.displayName, phone: user.phoneNumber || "" }, token);
          setCustomerSession({ ...result.customer, token: result.token, syncedAt: Date.now() });
        }
      } catch {
        // Offline/server-down fallback: try to read role from existing session or Firebase claims
        const existingSession = readCollection("customer-session", null);
        let role = "customer";
        try {
          const claims = (await user.getIdTokenResult()).claims;
          if (claims?.role === "partner") role = "partner";
        } catch {
          // claims unavailable – check localStorage
          if (existingSession?.email === user.email && existingSession?.role === "partner") {
            role = "partner";
          }
        }
        const fallbackSession = {
          id: `firebase:${user.uid}`,
          name: user.displayName || user.email?.split("@")[0],
          email: user.email,
          phone: user.phoneNumber || "",
          role,
          token: await user.getIdToken(),
        };
        setCustomerSession(fallbackSession);
      }
    });
  }, []);
  useEffect(() => {
    if (!customerSession?.token) return;
    const token = customerSession.token;
    let isCancelled = false;

    const refreshCustomerRole = () => api.customerMe(token).then((customer) => {
      if (isCancelled) return;
      setCustomerSession((current) => {
        if (!current) return current;
        const keys = Object.keys(customer);
        const hasDiff = keys.some((k) => current[k] !== customer[k]);
        return hasDiff ? { ...current, ...customer, token: current.token } : current;
      });
    }).catch((error) => {
      if (!isCancelled && error.status === 401) setCustomerSession(null);
    });

    const loadCustomerOrders = () => api.getCustomerOrders(token).then((customerOrders) => {
      if (!isCancelled) setOrders(customerOrders);
    }).catch(() => undefined);

    refreshCustomerRole();
    loadCustomerOrders();
    return () => {
      isCancelled = true;
    };
  }, [customerSession?.token]);

  // Add product to cart
  const addToCart = (product) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  // Update quantity
  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Remove cart item
  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  // Wishlist
  const addToWishlist = (product) => {
    setWishlist((currentWishlist) => {
      const exists = currentWishlist.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return currentWishlist.filter(
          (item) => item.id !== product.id
        );
      }

      return [...currentWishlist, product];
    });
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const wishlistCount = wishlist.length;
  const addReview = async (review) => {
    const savedReview = await api.createReview(review, customerSession?.token);
    setReviews((current) => [savedReview, ...current.filter((item) => item.id !== savedReview.id)]);
    return savedReview;
  };

  const saveAdminReview = async (review, id) => {
    const savedReview = await api.saveReview(review, adminSession?.token, id);
    setReviews((current) => id ? current.map((item) => item.id === id ? savedReview : item) : [savedReview, ...current]);
    return savedReview;
  };

  const deleteAdminReview = async (id) => {
    await api.deleteReview(id, adminSession?.token);
    setReviews((current) => current.filter((review) => review.id !== id));
  };

  const logContact = (source = "website-call-button") => {
    const event = { id: Date.now(), contact_number: "+91 96493 74696", source, created_at: new Date().toISOString() };
    setContactEvents((current) => [event, ...current]);
    api.logContactEvent({ contactNumber: event.contact_number, source: event.source }).catch(() => undefined);
  };

  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  const loginAdmin = async ({ email, password }) => {
    try {
      const result = await api.login({ email, password });
      setAdminSession({ ...result.admin, token: result.token, loggedInAt: new Date().toISOString() });
      return true;
    } catch {
      if (email !== "admin@supermart.com" || password !== "admin123") return false;
      setAdminSession({ email, role: "admin", token: null, loggedInAt: new Date().toISOString() });
      return true;
    }
  };

  const loginCustomer = async (credentials) => {
    const token = await credentials.user.getIdToken();
    try {
      const result = await api.firebaseSync({ name: credentials.user.displayName, phone: credentials.user.phoneNumber || "" }, token);
      setCustomerSession({ ...result.customer, token: result.token });
    } catch {
      setCustomerSession({ id: `firebase:${credentials.user.uid}`, name: credentials.user.displayName || credentials.user.email?.split("@")[0], email: credentials.user.email, phone: credentials.user.phoneNumber || "", role: "customer", token });
    }
    return true;
  };

  const signupCustomer = async (details) => {
    const token = await details.user.getIdToken();
    try {
      const result = await api.firebaseSync({ name: details.name, phone: details.phone }, token);
      setCustomerSession({ ...result.customer, token: result.token });
    } catch {
      setCustomerSession({ id: `firebase:${details.user.uid}`, name: details.name, email: details.user.email, phone: details.phone, role: "customer", token });
    }
    return true;
  };

  const refreshOrders = useCallback(async () => {
    if (!adminSession?.token) {
      return;
    }
    try {
      const remoteOrders = await api.getOrders(adminSession.token);
      setOrders(remoteOrders);
    } catch {
      // Keep locally saved orders visible when the API is temporarily unavailable.
    }
  }, [adminSession?.token]);

  const placeOrder = async (orderDetails) => {
    try {
      const savedOrder = await api.createOrder({ ...orderDetails, customerId: customerSession?.id, items: cart }, customerSession?.token);
      const order = { ...orderDetails, ...savedOrder, items: savedOrder.items?.length ? savedOrder.items : cart, createdAt: savedOrder.createdAt || new Date().toISOString() };
      setOrders((currentOrders) => [order, ...currentOrders]);
      setCart([]);
      return order;
    } catch (error) {
      if (orderDetails.payment === "online") throw error;
      // Keep the demo storefront usable when the API is not running locally.
    }
    const order = {
      ...orderDetails,
      id: `SM-${Date.now().toString().slice(-6)}`,
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
      status: "Processing",
    };
    setOrders((currentOrders) => [order, ...currentOrders]);
    setCart([]);
    return order;
  };

  return (
    <div className="flex min-h-screen flex-col">

      {showLaunchScreen && <div className="launch-screen" role="status" aria-label="Loading Super Mart">
        <div className="launch-brand">
          <img src="/img/logo.svg" alt="" className="launch-mark" />
          <span>Super <b>Mart</b></span>
        </div>
        <div className="launch-progress" aria-hidden="true"><i /></div>
      </div>}

      {!isAdminArea && <Navbar customerSession={customerSession} onLogout={() => setCustomerSession(null)} cartCount={cartCount} wishlistCount={wishlistCount} onContactClick={() => logContact()} onWhatsAppClick={() => logContact("whatsapp-button")} onEditProfile={() => setShowProfileModal(true)} />}
      {showProfileModal && customerSession && (
        <ProfileModal
          customer={customerSession}
          onClose={() => setShowProfileModal(false)}
          onSave={(updated) => {
            setCustomerSession((current) => current ? { ...current, ...updated, token: current.token } : current);
            setShowProfileModal(false);
          }}
        />
      )}

      <div className="flex-1">
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm font-bold text-slate-500">Loading Super Mart...</div>}>
          <Routes>

          <Route
            path="/"
            element={
              <Home
                products={products}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                reviews={reviews}
                addReview={addReview}
                orders={orders}
                customerSession={customerSession}
              />
            }
          />

          <Route
            path="/products"
            element={
              <Products
                products={products}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                customerSession={customerSession}
              />
            }
          />

          <Route
            path="/products/:category"
            element={
              <Products
                products={products}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                customerSession={customerSession}
              />
            }
          />

          <Route
            path="/product/:id"
            element={
              <ProductDetails
                products={products}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                wishlist={wishlist}
                reviews={reviews}
                addReview={addReview}
                orders={orders}
                customerSession={customerSession}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
              />
            }
          />

          <Route
            path="/wishlist"
            element={
              <Wishlist
                wishlist={wishlist}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
              />
            }
          />

          <Route
            path="/contact"
            element={<Contact onContactClick={logContact} />}
          />

          <Route
            path="/login"
            element={<Login onLogin={loginCustomer} onSignup={signupCustomer} />}
          />

          <Route
            path="/checkout"
            element={customerSession ? <Checkout cart={cart} placeOrder={placeOrder} customer={customerSession} onProfileUpdate={(profile) => setCustomerSession((current) => current ? { ...current, ...profile, token: current.token } : current)} /> : <Login onLogin={loginCustomer} onSignup={signupCustomer} />}
          />

          <Route
            path="/orders"
            element={customerSession ?             <Orders orders={orders} customer={customerSession} products={products} /> : <Login onLogin={loginCustomer} onSignup={signupCustomer} />}
          />

          <Route
            path="/admin"
            element={
              adminSession ? (
                <AdminPanel
                  products={products}
                  setProducts={setProducts}
                  orders={orders}
                  setOrders={setOrders}
                  reviews={reviews}
                  setReviews={setReviews}
                  onSaveReview={saveAdminReview}
                  onDeleteReview={deleteAdminReview}
                  contactEvents={contactEvents}
                  registeredCustomers={adminCustomers}
                  setRegisteredCustomers={setAdminCustomers}
                  customersError={adminCustomersError}
                  refreshCustomers={refreshAdminCustomers}
                  token={adminSession.token}
                  refreshOrders={refreshOrders}
                  onLogout={() => setAdminSession(null)}
                  customerSession={customerSession}
                  setCustomerSession={setCustomerSession}
                />
              ) : (
                <AdminLogin onLogin={loginAdmin} />
              )
            }
          />

            <Route path="/admin-login" element={<AdminLogin onLogin={loginAdmin} />} />

            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </div>

      {!isAdminArea && <Footer />}

    </div>
  );
}

export default App;