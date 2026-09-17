import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiExternalLink,
  FiLogOut,
  FiPrinter,
  FiPhoneCall,
  FiStar,
  FiTag,
  FiCopy,
  FiCheck,
  FiX,
  FiChevronRight,
  FiEye,
  FiShield,
  FiArrowRight,
  FiClock,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
  FiMessageSquare,
  FiSliders,
} from "react-icons/fi";
import { api } from "../data/api";
import { categoryOptions } from "../data/categories";
import { readCollection, writeCollection } from "../data/database";

const blankProduct = {
  name: "",
  productCode: "",
  category: "",
  price: "",
  customerPrice: "",
  partnerPrice: "",
  oldPrice: "",
  rating: "4.5",
  stock: "25",
  image: "",
  imagesText: "",
  description: "",
  seoKeywords: "",
};

const ORDER_STATUSES = [
  "Processing",
  "Payment pending",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const autoSeoKeywords = (product) =>
  [
    product.name,
    product.category,
    `${product.name} Bhiwadi`,
    `best ${product.category} in Super Mart Bhiwadi`,
    "Super Mart Bhiwadi",
    "Super Mart",
    "best electronics shop Bhiwadi",
  ]
    .filter(Boolean)
    .join(", ");

const canUseLocalProductFallback = (error) =>
  error?.message === "Failed to fetch" || error?.message === "Product not found";

const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const getOrderItems = (order, products = []) => {
  let storedItems =
    [
      order.items,
      order.orderItems,
      order.order_items,
      order.cart,
      order.products,
      order.orderedProducts,
      order.ordered_products,
    ].find(Array.isArray);
  if (!storedItems && typeof order.items === "string") {
    try { storedItems = JSON.parse(order.items); } catch {}
  }
  if (!storedItems && typeof order.orderItems === "string") {
    try { storedItems = JSON.parse(order.orderItems); } catch {}
  }
  if (Array.isArray(storedItems) && storedItems.length) return storedItems;
  if (!products.length) return [];
  const matchingProducts = products.filter(
    (product) =>
      Number(product.price) + (Number(product.price) >= 999 ? 0 : 79) ===
      Number(order.total)
  );
  return matchingProducts.length === 1
    ? [{ ...matchingProducts[0], quantity: 1 }]
    : [];
};

function AdminPanel({
  products = [],
  setProducts,
  orders = [],
  setOrders,
  reviews = [],
  setReviews,
  onSaveReview,
  onDeleteReview,
  contactEvents = [],
  registeredCustomers = [],
  setRegisteredCustomers,
  customersError,
  refreshCustomers,
  onLogout,
  token,
  refreshOrders,
  customerSession,
  setCustomerSession,
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [productForm, setProductForm] = useState(blankProduct);
  const [editingId, setEditingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [toasts, setToasts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seenOrderIds, setSeenOrderIds] = useState(() =>
    JSON.parse(localStorage.getItem("supermart-admin-seen-orders") || "[]")
  );
  const [seenContactIds, setSeenContactIds] = useState(() =>
    JSON.parse(localStorage.getItem("supermart-admin-seen-contacts") || "[]")
  );
  const [seenReviewIds, setSeenReviewIds] = useState(() =>
    JSON.parse(localStorage.getItem("supermart-admin-seen-reviews") || "[]")
  );
  const [customCategories, setCustomCategories] = useState(() =>
    readCollection("admin-product-categories", [])
  );
  const editorRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const allCategoryOptions = useMemo(
    () => [...new Set([...categoryOptions, ...customCategories])],
    [customCategories]
  );

  const uniqueOrders = useMemo(
    () => [...new Map(orders.map((order) => [String(order.id), order])).values()],
    [orders]
  );

  useEffect(() => {
    writeCollection("admin-product-categories", customCategories);
  }, [customCategories]);

  useEffect(() => {
    refreshOrders();
    // Auto-refresh every 30 seconds so new partner/customer orders appear quickly
    const refreshTimer = window.setInterval(refreshOrders, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [refreshOrders]);

  // Overall Financial & Store Analytics
  const revenue = useMemo(
    () => uniqueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [uniqueOrders]
  );

  const pendingOrdersCount = useMemo(
    () =>
      uniqueOrders.filter(
        (o) =>
          o.status === "Processing" ||
          o.status === "Payment pending" ||
          o.status === "Shipped"
      ).length,
    [uniqueOrders]
  );

  const deliveredOrdersCount = useMemo(
    () => uniqueOrders.filter((o) => o.status === "Delivered").length,
    [uniqueOrders]
  );

  const partnerCustomersCount = useMemo(
    () => registeredCustomers.filter((c) => c.role === "partner").length,
    [registeredCustomers]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => Number(p.stock ?? 0) < 10).length,
    [products]
  );

  const newOrderCount = uniqueOrders.filter(
    (order) => !seenOrderIds.includes(order.id)
  ).length;
  const newContactCount = contactEvents.filter(
    (event) => !seenContactIds.includes(event.id)
  ).length;
  const newReviewCount = reviews.filter(
    (review) => !seenReviewIds.includes(review.id)
  ).length;

  const customersWithStats = useMemo(() => {
    const customerMap = new Map();

    // First populate from registeredCustomers
    registeredCustomers.forEach((rc) => {
      const key = (rc.email || rc.phone || rc.id || "").toLowerCase();
      if (key) {
        customerMap.set(key, {
          ...rc,
          ordersCount: rc.orders || 0,
          totalSpent: rc.spent || 0,
        });
      }
    });

    // Then enrich with actual orders
    uniqueOrders.forEach((order) => {
      const customer = order.customer || {};
      const key = (customer.email || customer.phone || order.customerId || "").toLowerCase();
      if (!key) return;

      const existing = customerMap.get(key) || {
        id: order.customerId || `cust-${key}`,
        name: customer.name || "Customer",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "Bhiwadi",
        state: customer.state || "Rajasthan",
        pincode: customer.pincode || "",
        role: "customer",
        ordersCount: 0,
        totalSpent: 0,
      };

      existing.ordersCount = (existing.ordersCount || 0) + 1;
      existing.totalSpent = (existing.totalSpent || 0) + Number(order.total || 0);
      existing.lastOrderAt = order.createdAt;

      customerMap.set(key, existing);
    });

    return [...customerMap.values()];
  }, [registeredCustomers, uniqueOrders]);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refreshOrders(),
        refreshCustomers(),
        api.getProducts().then(setProducts).catch(() => undefined),
        api.getReviews().then(setReviews).catch(() => undefined),
      ]);
      showToast("Store data refreshed successfully.", "success");
    } catch {
      showToast("Data refresh encountered minor issues.", "info");
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (busyAction) return;
    setBusyAction("save-product");
    const customerPrice = Number(productForm.customerPrice);
    const partnerPrice = Number(
      productForm.partnerPrice || productForm.customerPrice
    );
    const product = {
      ...productForm,
      id: editingId && editingId !== "new" ? editingId : Date.now(),
      price: customerPrice,
      customerPrice,
      partnerPrice,
      oldPrice: Number(productForm.oldPrice || customerPrice),
      rating: Number(productForm.rating || 4.5),
      stock: Number(productForm.stock || 25),
      images: productForm.imagesText
        .split(/\n|,/)
        .map((img) => img.trim())
        .filter(Boolean)
        .slice(0, 6),
      seoKeywords:
        productForm.seoKeywords.trim() || autoSeoKeywords(productForm),
    };

    let savedProduct = product;
    try {
      savedProduct = await api.saveProduct(
        product,
        token || "",
        editingId !== "new" ? editingId : null
      );
      showToast(
        editingId === "new"
          ? "New product created successfully!"
          : "Product updated successfully!",
        "success"
      );
    } catch (error) {
      if (!canUseLocalProductFallback(error)) {
        setBusyAction("");
        showToast(error.message || "Failed to save product.", "error");
        return;
      }
      showToast("Saved to local browser database.", "info");
    }

    setProducts((current) =>
      editingId && editingId !== "new"
        ? current.map((item) => (item.id === editingId ? savedProduct : item))
        : [...current, savedProduct]
    );
    setProductForm(blankProduct);
    setEditingId(null);
    setBusyAction("");
  };

  const deleteProduct = async (id) => {
    if (busyAction || !window.confirm("Permanently delete this product?")) return;
    setBusyAction(`delete-${id}`);
    try {
      await api.deleteProduct(id, token || "");
      showToast("Product deleted from catalog.", "success");
    } catch (error) {
      if (!canUseLocalProductFallback(error)) {
        setBusyAction("");
        showToast(error.message || "Unable to delete product.", "error");
        return;
      }
      showToast("Product deleted locally.", "info");
    }
    setProducts((current) => current.filter((p) => p.id !== id));
    setBusyAction("");
  };

  const openOrders = (statusFilter = "all") => {
    const ids = orders.map((order) => order.id);
    setSeenOrderIds(ids);
    localStorage.setItem("supermart-admin-seen-orders", JSON.stringify(ids));
    setTab("orders");
  };

  const openContacts = () => {
    const ids = contactEvents.map((event) => event.id);
    setSeenContactIds(ids);
    localStorage.setItem("supermart-admin-seen-contacts", JSON.stringify(ids));
    setTab("contacts");
  };

  const openReviews = () => {
    const ids = reviews.map((review) => review.id);
    setSeenReviewIds(ids);
    localStorage.setItem("supermart-admin-seen-reviews", JSON.stringify(ids));
    setTab("reviews");
  };

  const editProduct = (product) => {
    setProductForm({
      ...product,
      productCode: product.productCode || product.code || "",
      customerPrice: product.customerPrice ?? product.price,
      partnerPrice:
        product.partnerPrice ?? product.customerPrice ?? product.price,
      oldPrice: product.oldPrice ?? product.price,
      stock: product.stock ?? 25,
      imagesText: (product.images || []).join("\n"),
      seoKeywords: product.seoKeywords || "",
    });
    setEditingId(product.id);
    setTab("products");
    window.requestAnimationFrame(() =>
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const startNewProduct = () => {
    setEditingId("new");
    setProductForm(blankProduct);
    setTab("products");
    window.requestAnimationFrame(() =>
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  // 1. FIXED & ROBUST: Order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (busyAction) return;
    setBusyAction(`order-${orderId}`);

    // Optimistically update order in state
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
    );

    // Save to local storage
    const updatedLocally = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    writeCollection("orders", updatedLocally);

    if (token) {
      try {
        const savedOrder = await api.updateOrder(orderId, newStatus, token);
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? { ...order, ...savedOrder, status: newStatus } : order
          )
        );
        showToast(`Order #${orderId} marked as ${newStatus}`, "success");
      } catch (error) {
        showToast(
          `Status updated locally. API: ${error.message || "Offline sync queued"}`,
          "info"
        );
      } finally {
        setBusyAction("");
      }
    } else {
      showToast(`Order #${orderId} updated locally (dev mode)`, "success");
      setBusyAction("");
    }
  };

  // 2. FIXED & ROBUST: Customer role update
  const handleUpdateCustomerRole = async (customer, newRole) => {
    const customerId = customer.id || customer.firebaseUid || customer.email;
    if (!customerId) return;

    // Optimistic update in registeredCustomers
    setRegisteredCustomers((current) =>
      current.map((item) => {
        const matches =
          item.id === customer.id ||
          (item.email &&
            customer.email &&
            item.email.toLowerCase() === customer.email.toLowerCase()) ||
          (item.firebaseUid && item.firebaseUid === customer.firebaseUid);
        return matches ? { ...item, role: newRole } : item;
      })
    );

    // Update active customerSession if matching
    if (
      customerSession &&
      setCustomerSession &&
      (customerSession.id === customer.id ||
        (customerSession.email &&
          customer.email &&
          customerSession.email.toLowerCase() === customer.email.toLowerCase()))
    ) {
      setCustomerSession((curr) =>
        curr ? { ...curr, role: newRole } : curr
      );
    }

    if (token) {
      try {
        await api.updateCustomerRole(customerId, newRole, token, {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        });
        showToast(
          `User ${customer.name || customer.email} updated to ${
            newRole === "partner" ? "★ B2B Partner" : "Customer"
          }!`,
          "success"
        );
      } catch (error) {
        showToast(
          `Role updated locally. Server: ${error.message || "Sync queued"}`,
          "info"
        );
      }
    } else {
      showToast(
        `Role updated to ${newRole === "partner" ? "★ B2B Partner" : "Customer"} in local session`,
        "success"
      );
    }
  };

  const handleToggleBanCustomer = async (customer) => {
    const customerId = customer.id || customer.firebaseUid || customer.email;
    if (!customerId) return;
    const targetBanState = !customer.isBanned;

    if (targetBanState && !window.confirm(`Are you sure you want to BAN ${customer.name || customer.email}? Banned users will be blocked from logging in or placing orders.`)) {
      return;
    }

    setRegisteredCustomers((current) =>
      current.map((item) => {
        const matches =
          item.id === customer.id ||
          (item.email &&
            customer.email &&
            item.email.toLowerCase() === customer.email.toLowerCase()) ||
          (item.firebaseUid && item.firebaseUid === customer.firebaseUid);
        return matches ? { ...item, isBanned: targetBanState } : item;
      })
    );

    if (token) {
      try {
        await api.updateCustomerRole(customerId, customer.role || "customer", token, {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          isBanned: targetBanState,
        });
        showToast(
          `User ${customer.name || customer.email} is now ${targetBanState ? "BANNED 🚫" : "ACTIVE ✅"}`,
          targetBanState ? "warning" : "success"
        );
      } catch (error) {
        showToast(`Ban update error: ${error.message}`, "error");
      }
    } else {
      showToast(`User set to ${targetBanState ? "Banned" : "Active"} (local session)`, "info");
    }
  };

  const exportOrdersCSV = () => {
    const header =
      "Order ID,Customer,Email,Phone,City,Pincode,Payment,Total,Status,Date,Items Count";
    const rows = uniqueOrders.map((order) =>
      [
        order.id,
        order.customer?.name,
        order.customer?.email,
        order.customer?.phone,
        order.customer?.city,
        order.customer?.pincode,
        order.payment,
        order.total,
        order.status,
        order.createdAt,
        (order.items || []).length,
      ]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supermart-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Orders exported to CSV", "success");
  };

  const exportCustomersCSV = () => {
    const header = "Name,Email,Phone,City,Pincode,Role,Total Orders,Total Spent";
    const rows = customersWithStats.map((c) =>
      [
        c.name,
        c.email,
        c.phone,
        c.city,
        c.pincode,
        c.role,
        c.ordersCount || 0,
        c.totalSpent || 0,
      ]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supermart-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Customers exported to CSV", "success");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md animate-toast ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/30 text-rose-100"
                : "bg-blue-950/90 border-blue-500/30 text-blue-100"
            }`}
          >
            {toast.type === "success" ? (
              <FiCheckCircle className="size-5 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <FiAlertCircle className="size-5 text-rose-400 shrink-0" />
            ) : (
              <FiCheck className="size-5 text-blue-400 shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-1"
            >
              <FiX className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Executive Top Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
              <p className="text-xs uppercase font-bold tracking-widest text-blue-400">
                Super Mart Bhiwadi · Command Hub
              </p>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO ADMIN v2.5
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Store Control & Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time catalog sync, order fulfillment, B2B partner management &
              analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FiRefreshCw className={`size-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm cursor-pointer"
            >
              <FiExternalLink className="size-4 text-slate-400" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            <button
              onClick={() => {
                onLogout();
                navigate("/admin-login");
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition shadow-sm cursor-pointer"
            >
              <FiLogOut className="size-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Executive KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FiDollarSign className="size-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {money(revenue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Avg {money(uniqueOrders.length ? revenue / uniqueOrders.length : 0)} / order
            </p>
          </div>

          <div
            onClick={() => openOrders("all")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Orders</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                <FiPackage className="size-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {uniqueOrders.length}
            </p>
            <p className="text-[11px] text-amber-400 font-medium mt-0.5">
              {pendingOrdersCount} pending fulfillment
            </p>
          </div>

          <div
            onClick={() => setTab("customers")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Customers</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
                <FiUsers className="size-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {customersWithStats.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registered buyers
            </p>
          </div>

          <div
            onClick={() => setTab("partners")}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900/90 border border-amber-500/30 hover:border-amber-500/50 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-bold uppercase tracking-wider">B2B Partners</span>
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <FiShield className="size-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-200 mt-2">
              {partnerCustomersCount}
            </p>
            <p className="text-[11px] text-amber-400/80 font-medium mt-0.5">
              Wholesale tier active
            </p>
          </div>

          <div
            onClick={() => setTab("products")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Catalog</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition">
                <FiTag className="size-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {products.length}
            </p>
            <p className={`text-[11px] font-semibold mt-0.5 ${lowStockCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {lowStockCount > 0 ? `${lowStockCount} low in stock` : "Healthy stock"}
            </p>
          </div>

          <div
            onClick={openContacts}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Call Leads</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition">
                <FiPhoneCall className="size-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {contactEvents.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Website call taps
            </p>
          </div>
        </div>

        {/* Main Workspace: Sidebar Tabs + Content Area */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Navigation Sidebar */}
          <nav className="h-fit rounded-2xl bg-slate-900/80 border border-slate-800 p-2.5 space-y-1.5 shadow-sm">
            {[
              { id: "overview", label: "Overview", icon: FiTrendingUp },
              { id: "orders", label: "Orders", icon: FiPackage, count: newOrderCount || pendingOrdersCount },
              { id: "customers", label: "Customers & Users", icon: FiUsers, count: customersWithStats.length },
              { id: "partners", label: "B2B Partners", icon: FiShield, count: partnerCustomersCount, isGold: true },
              { id: "products", label: "Products & Stock", icon: FiTag, alert: lowStockCount },
              { id: "reviews", label: "Reviews", icon: FiStar, count: newReviewCount },
              { id: "contacts", label: "Call Activity", icon: FiPhoneCall, count: newContactCount },
            ].map(({ id, label, icon: Icon, count, alert, isGold }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (id === "orders") openOrders();
                    else if (id === "contacts") openContacts();
                    else if (id === "reviews") openReviews();
                    else setTab(id);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    active
                      ? isGold
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold shadow-md shadow-amber-500/20"
                        : "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`size-4.5 ${active ? "text-white" : isGold ? "text-amber-400" : "text-slate-400"}`} />
                    <span>{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {alert > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                        {alert}!
                      </span>
                    )}
                    {count !== undefined && count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          active
                            ? "bg-white/20 text-white"
                            : isGold
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Tab Content Section */}
          <section className="min-w-0">
            {tab === "overview" && (
              <OverviewView
                orders={uniqueOrders}
                customers={customersWithStats}
                revenue={revenue}
                products={products}
                onGoToOrders={() => setTab("orders")}
                onGoToProducts={() => setTab("products")}
                onGoToPartners={() => setTab("partners")}
              />
            )}

            {tab === "orders" && (
              <OrdersManager
                orders={uniqueOrders}
                products={products}
                registeredCustomers={registeredCustomers}
                busyAction={busyAction}
                onUpdateStatus={handleUpdateOrderStatus}
                onSelectOrder={setSelectedOrder}
                onExportCSV={exportOrdersCSV}
              />
            )}

            {tab === "customers" && (
              <CustomersManager
                customers={customersWithStats}
                onUpdateRole={handleUpdateCustomerRole}
                onToggleBan={handleToggleBanCustomer}
                error={customersError}
                onRefresh={refreshCustomers}
                onExportCSV={exportCustomersCSV}
                partnerOnly={false}
              />
            )}

            {tab === "partners" && (
              <CustomersManager
                customers={customersWithStats.filter((c) => c.role === "partner")}
                onUpdateRole={handleUpdateCustomerRole}
                onToggleBan={handleToggleBanCustomer}
                error={customersError}
                onRefresh={refreshCustomers}
                onExportCSV={exportCustomersCSV}
                partnerOnly={true}
              />
            )}

            {tab === "products" && (
              <ProductsManager
                products={products}
                form={productForm}
                setForm={setProductForm}
                editingId={editingId}
                busyAction={busyAction}
                editorRef={editorRef}
                onSubmit={saveProduct}
                onEdit={editProduct}
                onDelete={deleteProduct}
                onNew={startNewProduct}
                onCancel={() => {
                  setEditingId(null);
                  setProductForm(blankProduct);
                }}
                categoryOptions={allCategoryOptions}
                customCategories={customCategories}
                onAddCategory={(cat) =>
                  setCustomCategories((curr) =>
                    curr.includes(cat) ? curr : [...curr, cat]
                  )
                }
                onDeleteCategory={(cat) =>
                  setCustomCategories((curr) =>
                    curr.filter((item) => item !== cat)
                  )
                }
              />
            )}

            {tab === "reviews" && (
              <ReviewsManager
                reviews={reviews}
                products={products}
                onSaveReview={async (rev, id) => {
                  await onSaveReview(rev, id);
                  showToast("Review saved successfully.", "success");
                }}
                onDeleteReview={async (id) => {
                  await onDeleteReview(id);
                  showToast("Review deleted.", "info");
                }}
              />
            )}

            {tab === "contacts" && <ContactEventsManager events={contactEvents} />}
          </section>
        </div>
      </div>

      {/* Pro Order Detail & Printable Tax Invoice Modal */}
      {selectedOrder && (
        <OrderInvoiceModal
          order={selectedOrder}
          products={products}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}
    </main>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: OVERVIEW DASHBOARD
// -------------------------------------------------------------
function OverviewView({
  orders = [],
  customers = [],
  revenue,
  products = [],
  onGoToOrders,
  onGoToProducts,
  onGoToPartners,
}) {
  const recentOrders = orders.slice(0, 6);
  const lowStockItems = products.filter((p) => Number(p.stock ?? 0) < 10);

  return (
    <div className="space-y-6">
      {/* Low Stock Urgent Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <FiAlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Low Inventory Alert: {lowStockItems.length} items require restocking
              </p>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {lowStockItems.slice(0, 3).map((p) => `${p.name} (${p.stock} left)`).join(", ")}
                {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more...` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onGoToProducts}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition shrink-0 cursor-pointer"
          >
            Manage Inventory →
          </button>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live order feed from Super Mart storefront
            </p>
          </div>
          <button
            onClick={onGoToOrders}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer"
          >
            <span>View all {orders.length} orders</span>
            <FiArrowRight className="size-3.5" />
          </button>
        </div>

        {recentOrders.length ? (
          <div className="divide-y divide-slate-800 mt-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs shrink-0 mt-0.5">
                    <FiPackage className="size-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {order.id}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {order.customer?.name || "Guest"} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {(order.payment || "cod").toUpperCase()}
                  </span>
                  <span className="text-sm font-black text-white">
                    {money(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No orders yet. They will appear here when a customer checks out." />
        )}
      </div>

      {/* Quick Insights Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Base
            </span>
            <button
              onClick={onGoToPartners}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              Manage Partners →
            </button>
          </div>
          <p className="text-3xl font-black text-white mt-2">{customers.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            Registered retail accounts and verified B2B partners across Bhiwadi & NCR.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gross Store Volume
            </span>
            <span className="text-xs font-bold text-emerald-400">100% Verified</span>
          </div>
          <p className="text-3xl font-black text-white mt-2">{money(revenue)}</p>
          <p className="text-xs text-slate-400 mt-1">
            Cumulative total value of confirmed online and COD orders.
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: ORDERS MANAGER
// -------------------------------------------------------------
function OrdersManager({
  orders = [],
  products = [],
  registeredCustomers = [],
  busyAction,
  onUpdateStatus,
  onSelectOrder,
  onExportCSV,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const matchingProduct = (item) =>
    products.find(
      (product) =>
        String(product.id) === String(item.id || item.productId) ||
        (item.productCode &&
          String(product.productCode || product.code).toLowerCase() ===
            String(item.productCode).toLowerCase()) ||
        (item.name && product.name.toLowerCase() === item.name.toLowerCase())
    );

  const orderItem = (item) => {
    const product = matchingProduct(item) || {};
    // Always use stored item.price first — this preserves partner wholesale price
    const resolvedPrice = Number.isFinite(Number(item.price)) && Number(item.price) > 0
      ? Number(item.price)
      : Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
    return {
      ...item,
      name:
        (item.name && item.name !== "Product" ? item.name : null) ||
        product.name ||
        item.productName ||
        item.title ||
        "Product unavailable",
      productCode:
        item.productCode || item.code || product.productCode || product.code || "",
      image: item.image || item.imageUrl || product.image || "",
      price: resolvedPrice,
    };
  };

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders
      .filter((order) => {
        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter;
        const matchesSearch =
          !query ||
          [
            order.id,
            order.customer?.name,
            order.customer?.email,
            order.customer?.phone,
            order.customer?.city,
            order.payment,
            ...(order.items || []).map((i) => i.name || i.productName),
          ].some((val) => String(val || "").toLowerCase().includes(query));

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "highest") {
          return Number(b.total) - Number(a.total);
        }
        if (sortBy === "lowest") {
          return Number(a.total) - Number(b.total);
        }
        return 0;
      });
  }, [orders, statusFilter, searchQuery, sortBy]);

  const countByStatus = useMemo(() => {
    const counts = { all: orders.length };
    ORDER_STATUSES.forEach((st) => {
      counts[st] = orders.filter((o) => o.status === st).length;
    });
    return counts;
  }, [orders]);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Orders Pipeline</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track fulfillment, update shipping milestones, and generate invoices.
          </p>
        </div>
        <button
          onClick={onExportCSV}
          disabled={!orders.length}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <FiDownload className="size-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span>All Orders</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
            {countByStatus.all}
          </span>
        </button>

        {ORDER_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === st
                ? "bg-blue-600 text-white"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>{st}</span>
            {countByStatus[st] > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
                {countByStatus[st]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Sort Tool Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer name, phone, city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isProcessing = order.status === "Processing";
            const isShipped = order.status === "Shipped";
            const isPaymentPending = order.status === "Payment pending";
            // Detect if this is a B2B partner order
            const isPartnerOrder = registeredCustomers.some((c) =>
              c.role === "partner" && (
                (order.customerId && String(c.id) === String(order.customerId)) ||
                (order.customer?.email && c.email?.toLowerCase() === order.customer.email.toLowerCase())
              )
            );

            return (
              <div
                key={order.id}
                className={`p-5 rounded-2xl transition space-y-4 ${
                  isPartnerOrder
                    ? "bg-amber-950/20 border border-amber-500/40 hover:border-amber-400/60 ring-1 ring-amber-500/20"
                    : "bg-slate-950/70 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Partner Order Golden Banner */}
                {isPartnerOrder && (
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-400 uppercase tracking-widest -mb-1">
                    <FiShield className="size-3.5" />
                    <span>B2B Wholesale Partner Order</span>
                  </div>
                )}
                {/* Order Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className={`text-base font-black transition font-mono flex items-center gap-1.5 cursor-pointer ${
                        isPartnerOrder ? "text-amber-300 hover:text-amber-200" : "text-white hover:text-blue-400"
                      }`}
                    >
                      <span>{order.id}</span>
                      <FiEye className="size-3.5 text-slate-400" />
                    </button>
                    <OrderStatusBadge status={order.status} />
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 uppercase">
                      {order.payment || "cod"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                    <span className="text-lg font-black text-white">
                      {money(order.total)}
                    </span>
                  </div>
                </div>

                {/* Customer & Address Details */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-sm">
                      {order.customer?.name || "Guest Customer"}
                    </p>
                    <p className="text-slate-400">
                      {order.customer?.email} · {order.customer?.phone}
                    </p>
                    <p className="text-slate-400">
                      {order.customer?.address}, {order.customer?.city},{" "}
                      {order.customer?.state} - {order.customer?.pincode}
                    </p>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto pt-2 md:pt-0">
                    {/* Quick Action Button */}
                    {isProcessing && (
                      <button
                        onClick={() => onUpdateStatus(order.id, "Shipped")}
                        disabled={Boolean(busyAction)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <FiTruck className="size-3.5" />
                        <span>Mark Shipped</span>
                      </button>
                    )}
                    {isShipped && (
                      <button
                        onClick={() => onUpdateStatus(order.id, "Delivered")}
                        disabled={Boolean(busyAction)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <FiCheck className="size-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}
                    {isPaymentPending && (
                      <button
                        onClick={() => onUpdateStatus(order.id, "Processing")}
                        disabled={Boolean(busyAction)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <FiCheck className="size-3.5" />
                        <span>Confirm Payment</span>
                      </button>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={order.status}
                      disabled={Boolean(busyAction)}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => onSelectOrder(order)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                    >
                      Invoice & Details
                    </button>
                  </div>
                </div>

                {/* Products Thumbnails Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {getOrderItems(order, products).map((rawItem, idx) => {
                    const item = orderItem(rawItem);
                    return (
                      <div
                        key={`${item.id || idx}-${idx}`}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-11 rounded-lg object-cover bg-slate-800 shrink-0"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-200 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Qty: {item.quantity} × {money(item.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState text="No orders match your filter criteria." />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: CUSTOMERS & B2B PARTNERS MANAGER
// -------------------------------------------------------------
function CustomersManager({
  customers = [],
  onUpdateRole,
  onToggleBan,
  error,
  onRefresh,
  onExportCSV,
  partnerOnly = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesRole =
        partnerOnly
          ? customer.role === "partner"
          : roleFilter === "all" || customer.role === roleFilter;

      const matchesSearch =
        !query ||
        [
          customer.name,
          customer.email,
          customer.phone,
          customer.city,
          customer.pincode,
          customer.role,
        ].some((val) => String(val || "").toLowerCase().includes(query));

      return matchesRole && matchesSearch;
    });
  }, [customers, searchQuery, roleFilter, partnerOnly]);

  return (
    <div
      className={`p-6 rounded-2xl bg-slate-900/80 border ${
        partnerOnly ? "border-amber-500/30" : "border-slate-800"
      } space-y-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {partnerOnly && <FiShield className="size-5 text-amber-400" />}
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {partnerOnly ? "B2B Wholesale Partners" : "Users & Customer Accounts"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {partnerOnly
              ? "Verified business partners enjoy wholesale rates across the entire Super Mart catalog."
              : "Promote business buyers to B2B Partner or ban problematic users from accessing the storefront."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <FiRefreshCw className="size-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <FiDownload className="size-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {!partnerOnly && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="customer">Regular Customers</option>
            <option value="partner">B2B Partners Only</option>
          </select>
        )}
      </div>

      {/* Customer Accounts Table */}
      {filteredCustomers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
                <th className="pb-3 px-3">User & Contact</th>
                <th className="pb-3 px-3">Joined / Signup</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Role & Status</th>
                <th className="pb-3 px-3">Orders</th>
                <th className="pb-3 px-3">Lifetime Spend</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.map((c) => {
                const isPartner = c.role === "partner";
                const isBanned = Boolean(c.isBanned);
                return (
                  <tr
                    key={c.id || c.email || c.phone}
                    className={`hover:bg-slate-800/30 transition ${
                      isBanned
                        ? "bg-rose-950/20"
                        : isPartner
                        ? "bg-amber-950/10"
                        : ""
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                            isBanned
                              ? "bg-rose-950 text-rose-300 border border-rose-700"
                              : isPartner
                              ? "bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950"
                              : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {(c.name || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span>{c.name || "User"}</span>
                            {isPartner && (
                              <span className="text-amber-400 text-xs" title="B2B Partner">
                                ★
                              </span>
                            )}
                            {isBanned && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-300 font-bold border border-rose-700">
                                BANNED
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">
                            {c.email}
                          </p>
                          {c.phone && (
                            <p className="text-xs text-slate-500 font-mono">
                              {c.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-xs text-slate-300">
                      {c.createdAt ? formatDateTime(c.createdAt) : "First visit customer"}
                    </td>

                    <td className="py-3.5 px-3 text-xs text-slate-300">
                      {c.city || "Bhiwadi"}
                      {c.pincode ? `, ${c.pincode}` : ""}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPartner
                              ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {isPartner ? "★ B2B Partner" : "Customer"}
                        </span>
                        {isBanned ? (
                          <span className="text-[11px] font-bold text-rose-400">🚫 Access Blocked</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-400">✓ Account Active</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-sm font-semibold text-slate-200">
                      {c.ordersCount || 0}
                    </td>

                    <td className="py-3.5 px-3 text-sm font-black text-white">
                      {money(c.totalSpent)}
                    </td>

                    {/* Actions: Role Switch & Ban Button */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="inline-flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
                          <button
                            type="button"
                            onClick={() => onUpdateRole(c, "customer")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              !isPartner
                                ? "bg-slate-700 text-white shadow"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Customer
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateRole(c, "partner")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                              isPartner
                                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black shadow"
                                : "text-amber-400 hover:text-amber-300"
                            }`}
                          >
                            <span>★ Partner</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleBan && onToggleBan(c)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                            isBanned
                              ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700"
                              : "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800"
                          }`}
                          title={isBanned ? "Unban user account" : "Ban user from website"}
                        >
                          {isBanned ? "Unban User" : "🚫 Ban"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          text={
            partnerOnly
              ? "No B2B Partners found. Switch any customer to '★ Partner' from the Users section."
              : "No registered users match your search."
          }
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: PRODUCTS & INVENTORY MANAGER
// -------------------------------------------------------------
function ProductsManager({
  products = [],
  form,
  setForm,
  editingId,
  busyAction,
  editorRef,
  onSubmit,
  onEdit,
  onDelete,
  onNew,
  onCancel,
  categoryOptions = [],
  customCategories = [],
  onAddCategory,
  onDeleteCategory,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [newCatInput, setNewCatInput] = useState("");

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        !query ||
        [p.name, p.productCode, p.code, p.category].some((val) =>
          String(val || "").toLowerCase().includes(query)
        );
      return matchCat && matchSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    const cat = newCatInput.trim();
    if (!cat) return;
    onAddCategory(cat);
    setNewCatInput("");
  };

  return (
    <div className="space-y-6">
      {/* Custom Category Quick Manager (Moved to Top) */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Custom Categories
            </p>
            <p className="text-[11px] text-slate-500">
              Add special categories for new product collections.
            </p>
          </div>

          <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="Category name..."
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
            >
              + Add
            </button>
          </form>
        </div>

        {customCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {customCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat)}
                  className="text-slate-500 hover:text-rose-400 p-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Product Catalog Table Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Inventory & Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Control retail and B2B wholesale prices, SKU stock, and product details.
            </p>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product name or SKU code..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
                  <th className="pb-3 px-3">Product</th>
                  <th className="pb-3 px-3">SKU</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Stock</th>
                  <th className="pb-3 px-3">Retail Price</th>
                  <th className="pb-3 px-3">Partner Price</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const stock = Number(p.stock ?? 0);
                  const isLow = stock < 10;
                  const isOut = stock <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="size-11 rounded-lg object-cover bg-slate-800 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100";
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate max-w-[200px]">
                              {p.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              ★ {p.rating || 4.5}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs text-blue-400 font-bold">
                        {p.productCode || p.code || "—"}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-300 font-medium">
                        {p.category}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            isOut
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : isLow
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {stock} in stock
                        </span>
                      </td>

                      <td className="py-3 px-3 font-bold text-white">
                        {money(p.customerPrice ?? p.price)}
                      </td>

                      <td className="py-3 px-3 font-black text-amber-400">
                        {money(p.partnerPrice ?? p.customerPrice ?? p.price)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => onEdit(p)}
                            disabled={Boolean(busyAction)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition cursor-pointer"
                            title="Edit product"
                          >
                            <FiEdit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            disabled={Boolean(busyAction)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                            title="Delete product"
                          >
                            <FiTrash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No products found matching your search." />
        )}

        {/* Add Product Button (Moved to Bottom of Product Section) */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Total items in list: <strong className="text-white">{filteredProducts.length}</strong>
          </p>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <FiPlus className="size-4" />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Product Form Drawer */}
      {editingId !== null && (
        <form
          ref={editorRef}
          onSubmit={onSubmit}
          className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-5 shadow-2xl animate-toast"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingId === "new" ? "Create New Product" : "Edit Product Details"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set customer and B2B wholesale prices, inventory and images.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <FiX className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 text-xs font-bold text-slate-300">
              <span>Product Title *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. HP 15s Ryzen 5 Laptop"
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300">
              <span>SKU / Product Code *</span>
              <input
                required
                value={form.productCode}
                onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="e.g. LAP-HP-15S"
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300">
              <span>Category *</span>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Select Category</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300">
              <span>Inventory Stock Units *</span>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300">
              <span>Customer Price (₹ Retail) *</span>
              <input
                required
                type="number"
                min="1"
                value={form.customerPrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerPrice: e.target.value,
                    price: e.target.value,
                    partnerPrice: form.partnerPrice || e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="49999"
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-amber-400">
              <span>B2B Partner Price (₹ Wholesale) *</span>
              <input
                required
                type="number"
                min="1"
                value={form.partnerPrice}
                onChange={(e) => setForm({ ...form, partnerPrice: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-500/30 text-sm text-amber-200 focus:outline-none focus:border-amber-500"
                placeholder="45999"
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300">
              <span>MRP / Old Price (₹)</span>
              <input
                type="number"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="54999"
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300">
              <span>Rating (1.0 to 5.0)</span>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300 sm:col-span-2">
              <span>Main Image URL *</span>
              <input
                required
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="https://images.unsplash.com/..."
              />
            </label>

            {form.image && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                <img
                  src={form.image}
                  alt="Preview"
                  className="size-16 rounded-lg object-cover bg-slate-800"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div>
                  <p className="text-xs font-bold text-slate-300">Image Preview</p>
                  <p className="text-[11px] text-slate-500">
                    Verify that image loads properly before saving.
                  </p>
                </div>
              </div>
            )}

            <label className="space-y-1 text-xs font-bold text-slate-300 sm:col-span-2">
              <span>Product Description *</span>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Describe product features, warranty, and specifications..."
              />
            </label>

            <label className="space-y-1 text-xs font-bold text-slate-300 sm:col-span-2">
              <span>SEO Keywords (comma separated)</span>
              <input
                value={form.seoKeywords}
                onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Super Mart Bhiwadi, best laptop in Bhiwadi..."
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={Boolean(busyAction)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {busyAction === "save-product"
                ? "Saving to Catalog..."
                : editingId === "new"
                ? "Add Product"
                : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: REVIEWS MANAGER
// -------------------------------------------------------------
function ReviewsManager({
  reviews = [],
  products = [],
  onSaveReview,
  onDeleteReview,
}) {
  const blankReview = {
    type: "shop",
    productId: "",
    name: "Super Mart Bhiwadi",
    rating: "5",
    text: "",
  };
  const [form, setForm] = useState(blankReview);
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const review = {
      ...form,
      productId: form.type === "product" ? form.productId : null,
      rating: Number(form.rating),
      updatedAt: new Date().toISOString(),
    };
    await onSaveReview(review, editingId);
    setForm(blankReview);
    setEditingId(null);
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Customer Reviews</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage storefront feedback, product ratings, and customer testimonials.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {reviews.length} total reviews
        </span>
      </div>

      {/* Add / Edit Review Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {editingId ? "Edit Review" : "Publish Customer Testimonial"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value, productId: "" })
            }
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
          >
            <option value="shop">Storefront Review</option>
            <option value="product">Product Specific Review</option>
          </select>

          {form.type === "product" ? (
            <select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
            >
              <option value="">Select Target Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value="Super Mart Bhiwadi"
              disabled
              className="px-3.5 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 font-semibold"
            />
          )}

          <select
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
          >
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
            <option value="2">★★☆☆☆ (2 Stars)</option>
            <option value="1">★☆☆☆☆ (1 Star)</option>
          </select>
        </div>

        <input
          required
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Reviewer Name (e.g. Rahul Sharma, Bhiwadi)"
          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />

        <textarea
          required
          rows={2}
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          placeholder="Review feedback description..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
          >
            {editingId ? "Update Review" : "Save Review"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(blankReview);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">
                  {"★".repeat(r.rating || 5)}
                </span>
                <span className="text-sm font-bold text-white">
                  {r.name || "Customer"}
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                  {r.type === "shop" ? "Shop Review" : "Product Review"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{r.text}</p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  setForm({ ...r, rating: String(r.rating) });
                  setEditingId(r.id);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 cursor-pointer"
                title="Edit review"
              >
                <FiEdit2 className="size-3.5" />
              </button>
              <button
                onClick={() => onDeleteReview(r.id)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 cursor-pointer"
                title="Delete review"
              >
                <FiTrash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: CALL EVENTS & INQUIRIES
// -------------------------------------------------------------
function ContactEventsManager({ events = [] }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Call Button Leads</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log of visitors who tapped the click-to-call button on the website.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300">
          {events.length} Call Clicks
        </span>
      </div>

      {events.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
                <th className="pb-3 px-3">Target Contact</th>
                <th className="pb-3 px-3">Source Channel</th>
                <th className="pb-3 px-3">Timestamp</th>
                <th className="pb-3 px-3 text-right">Direct Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-mono font-bold text-white text-xs">
                    {ev.contact_number || ev.contactNumber || "Store Number"}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ev.source || "website-call-button"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-300">
                    {formatDateTime(ev.created_at || ev.createdAt)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={`tel:${ev.contact_number || "9896459345"}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
                    >
                      <FiPhoneCall className="size-3" />
                      <span>Call Back</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState text="No call events logged yet." />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: ORDER DETAIL & INVOICE MODAL
// -------------------------------------------------------------
function OrderInvoiceModal({ order, products = [], onClose, onUpdateStatus }) {
  const match = (item) =>
    products.find(
      (p) =>
        String(p.id) === String(item.id || item.productId) ||
        (item.productCode &&
          String(p.productCode || p.code).toLowerCase() ===
            String(item.productCode).toLowerCase()) ||
        (item.name && p.name.toLowerCase() === item.name.toLowerCase())
    );

  const items = getOrderItems(order, products);
  const subtotal = items.reduce(
    (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1),
    0
  );
  const deliveryFee = subtotal >= 999 ? 0 : 79;
  const grandTotal = Number(order.total) || subtotal + deliveryFee;

  const handlePrint = () => {
    window.print();
  };

  const copyAddress = () => {
    const text = `${order.customer?.name}\n${order.customer?.phone}\n${order.customer?.address}, ${order.customer?.city}, ${order.customer?.state} - ${order.customer?.pincode}`;
    navigator.clipboard.writeText(text);
    alert("Address copied to clipboard!");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto animate-modal">
        {/* Modal Top Controls (Hidden when printing) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Tax Invoice & Receipt
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow"
            >
              <FiPrinter className="size-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <FiX className="size-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Container */}
        <div id="printable-invoice" className="space-y-6 pt-4 text-slate-900 bg-white p-6 rounded-xl sm:rounded-none">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                SUPER MART BHIWADI
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Electronics, Appliances, Laptops & Home Essentials
              </p>
              <p className="text-xs text-slate-600">
                F-GF 19-20 12A, Capital High Street, Bhiwadi, Rajasthan - 301019
              </p>
              <p className="text-xs text-slate-600 font-semibold">
                Phone: +91 96493 74696 · supermartbhiwadi@gmail.com
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase text-slate-500">Invoice / Order ID</p>
              <p className="text-lg font-black font-mono text-slate-900">{order.id}</p>
              <p className="text-xs text-slate-500 mt-1">
                Date: {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 uppercase">
                Payment: {order.payment || "COD"}
              </span>
            </div>
          </div>

          {/* Customer Bill To Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Billed / Shipped To
              </p>
              <p className="font-bold text-sm text-slate-950 mt-1">
                {order.customer?.name || "Customer"}
              </p>
              <p className="text-slate-700 mt-0.5">{order.customer?.email}</p>
              <p className="text-slate-700 font-semibold">{order.customer?.phone}</p>
              <p className="text-slate-700 mt-1">
                {order.customer?.address}, {order.customer?.city || "Bhiwadi"},{" "}
                {order.customer?.state || "Rajasthan"} - {order.customer?.pincode}
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Order Status
              </p>
              <p className="font-black text-sm text-blue-800 uppercase">
                {order.status}
              </p>
              <div className="no-print pt-2 flex sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={copyAddress}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded"
                >
                  <FiCopy className="size-3" />
                  <span>Copy Address</span>
                </button>
                {order.customer?.phone && (
                  <a
                    href={`https://wa.me/91${order.customer?.phone?.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(order.customer?.name || "")},%20regarding%20your%20Super%20Mart%20order%20${order.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded"
                  >
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase">
                  <th className="pb-2">Item Description</th>
                  <th className="pb-2">SKU Code</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((rawItem, idx) => {
                  const matchedProduct = match(rawItem);
                  const item = {
                    ...rawItem,
                    name: rawItem.name && rawItem.name !== "Product" ? rawItem.name : (matchedProduct?.name || rawItem.name || "Super Mart Product"),
                    productCode: rawItem.productCode || rawItem.code || matchedProduct?.productCode || matchedProduct?.code || "—",
                    price: Number(rawItem.price || matchedProduct?.price || 0),
                    quantity: Number(rawItem.quantity || 1),
                  };
                  const itemPrice = item.price;
                  const itemQty = item.quantity;
                  return (
                    <tr key={`${item.id || idx}-${idx}`} className="py-2.5">
                      <td className="py-2.5 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-2.5 font-mono text-slate-600">
                        {item.productCode}
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-800">
                        {itemQty}
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {money(itemPrice)}
                      </td>
                      <td className="py-2.5 text-right font-black text-slate-950">
                        {money(itemPrice * itemQty)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation */}
          <div className="border-t-2 border-slate-900 pt-4 flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery (Bhiwadi Delivery Hub)</span>
                <span>{deliveryFee === 0 ? "FREE" : money(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-300">
                <span>Grand Total</span>
                <span>{money(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="border-t border-slate-200 pt-4 text-center text-[11px] text-slate-500">
            <p>Thank you for choosing Super Mart Bhiwadi! For support or returns, call +91 98964 59345.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              This is a computer-generated invoice. No signature required.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer (Hidden when printing) */}
        <div className="no-print pt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Change Status:</span>
            <select
              value={order.status}
              onChange={(e) => {
                onUpdateStatus(order.id, e.target.value);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// HELPER BADGE & EMPTY STATES
// -------------------------------------------------------------
function OrderStatusBadge({ status }) {
  const badgeStyles = {
    Delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Shipped: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    Processing: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    "Payment pending": "bg-purple-500/10 text-purple-400 border-purple-500/30",
    Cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        badgeStyles[status] || "bg-slate-800 text-slate-300 border-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
      <div className="text-3xl">📦</div>
      <p className="text-sm font-semibold text-slate-400">{text}</p>
    </div>
  );
}

export default AdminPanel;
