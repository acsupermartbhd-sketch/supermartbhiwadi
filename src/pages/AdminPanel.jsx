import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../data/api";
import { categoryOptions } from "../data/categories";

const blankProduct = { name: "", productCode: "", category: "", price: "", oldPrice: "", rating: "4.5", stock: "25", image: "", imagesText: "", description: "", seoKeywords: "" };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const autoSeoKeywords = (product) => [product.name, product.category, `${product.name} Bhiwadi`, `best ${product.category} in Super Mart Bhiwadi`, "Super Mart Bhiwadi", "Super Mart", "best electronics shop Bhiwadi"].filter(Boolean).join(", ");
const canUseLocalProductFallback = (error) => error?.message === "Failed to fetch" || error?.message === "Product not found";
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};
const getOrderItems = (order, products = []) => {
  const storedItems = [order.items, order.orderItems, order.order_items, order.cart, order.products, order.orderedProducts, order.ordered_products].find(Array.isArray) || [];
  if (storedItems.length || !products.length) return storedItems;
  const matchingProducts = products.filter((product) => Number(product.price) + (Number(product.price) >= 999 ? 0 : 79) === Number(order.total));
  return matchingProducts.length === 1 ? [{ ...matchingProducts[0], quantity: 1 }] : [];
};

function AdminPanel({ products, setProducts, orders, setOrders, reviews, onSaveReview, onDeleteReview, contactEvents, onLogout, token, refreshOrders }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [productForm, setProductForm] = useState(blankProduct);
  const [editingId, setEditingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [seenOrderIds, setSeenOrderIds] = useState(() => JSON.parse(localStorage.getItem("supermart-admin-seen-orders") || "[]"));
  const [seenContactIds, setSeenContactIds] = useState(() => JSON.parse(localStorage.getItem("supermart-admin-seen-contacts") || "[]"));
  const [seenReviewIds, setSeenReviewIds] = useState(() => JSON.parse(localStorage.getItem("supermart-admin-seen-reviews") || "[]"));
  const editorRef = useRef(null);

  useEffect(() => {
    refreshOrders();
    const refreshTimer = window.setInterval(refreshOrders, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [refreshOrders]);

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const newOrderCount = orders.filter((order) => !seenOrderIds.includes(order.id)).length;
  const newContactCount = contactEvents.filter((event) => !seenContactIds.includes(event.id)).length;
  const newReviewCount = reviews.filter((review) => !seenReviewIds.includes(review.id)).length;
  const customers = useMemo(() => {
    const customerMap = new Map();
    orders.forEach((order) => {
      const customer = order.customer || {};
      const key = customer.email || customer.phone || order.id;
      const existing = customerMap.get(key);
      customerMap.set(key, { ...customer, orders: (existing?.orders || 0) + 1, spent: (existing?.spent || 0) + Number(order.total || 0), lastOrder: order.createdAt });
    });
    return [...customerMap.values()];
  }, [orders]);

  const saveProduct = async (event) => {
    event.preventDefault();
    if (busyAction) return;
    setBusyAction("save");
    setNotice("");
    const product = { ...productForm, id: editingId && editingId !== "new" ? editingId : Date.now(), price: Number(productForm.price), oldPrice: Number(productForm.oldPrice || productForm.price), rating: Number(productForm.rating), stock: Number(productForm.stock), images: productForm.imagesText.split(/\n|,/).map((image) => image.trim()).filter(Boolean).slice(0, 4), seoKeywords: productForm.seoKeywords.trim() || autoSeoKeywords(productForm) };
    let savedProduct = product;
    if (token) {
      try {
        savedProduct = await api.saveProduct(product, token, editingId !== "new" ? editingId : null);
      } catch (error) {
        if (!canUseLocalProductFallback(error)) {
          setBusyAction("");
          setNotice(error.message || "Unable to save product. Please try again.");
          return;
        }
        setNotice("API unavailable. Product saved in this browser only.");
      }
    } else {
      setNotice("Product saved in this browser only.");
    }
    setProducts((current) => editingId && editingId !== "new" ? current.map((item) => item.id === editingId ? savedProduct : item) : [...current, savedProduct]);
    setProductForm(blankProduct);
    setEditingId(null);
    setNotice("Product saved successfully.");
    setBusyAction("");
  };

  const openOrders = () => {
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
    setProductForm({ ...product, productCode: product.productCode || product.code || "", stock: product.stock ?? 25, imagesText: (product.images || []).join("\n"), seoKeywords: product.seoKeywords || "" });
    setEditingId(product.id);
    setTab("products");
    window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const startNewProduct = () => {
    setEditingId("new");
    setProductForm(blankProduct);
    setTab("products");
    window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const deleteProduct = async (id) => {
    if (busyAction || !window.confirm("Delete this product from the catalog?")) return;
    setBusyAction(`delete-${id}`);
    setNotice("");
    if (token) {
      try {
        await api.deleteProduct(id, token);
      } catch (error) {
        if (!canUseLocalProductFallback(error)) {
          setBusyAction("");
          setNotice(error.message || "Unable to delete product. Please try again.");
          return;
        }
        setNotice("API unavailable. Product removed from this browser only.");
      }
    } else {
      setNotice("Product removed from this browser only.");
    }
    setProducts((current) => current.filter((product) => product.id !== id));
    setNotice("Product removed from catalog.");
    setBusyAction("");
  };

  const updateOrder = async (id, status) => {
    if (busyAction) return;
    if (!token) {
      setNotice("Admin API session is missing. Please log in again before updating orders.");
      return;
    }
    setBusyAction(`order-${id}`);
    setNotice("");
    try {
      const savedOrder = await api.updateOrder(id, status, token);
      setOrders((current) => current.map((order) => order.id === id ? { ...order, ...savedOrder } : order));
      setNotice(`Order ${id} marked as ${status}.`);
      await refreshOrders();
    } catch (error) {
      setNotice(error.message || "Unable to update order status. Please try again.");
    } finally {
      setBusyAction("");
    }
  };

  const exportOrders = () => {
    const header = "Order ID,Customer,Email,Phone,City,Payment,Total,Status,Date";
    const rows = orders.map((order) => [order.id, order.customer?.name, order.customer?.email, order.customer?.phone, order.customer?.city, order.payment, order.total, order.status, order.createdAt].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supermart-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    ["Products", products.length, "▦"],
    ["Orders", orders.length, "⌁"],
    ["Customers", customers.length, "♙"],
    ["Contacts", contactEvents.length, "☎"],
  ];

  return (
    <main className="admin-shell">
      <div className="admin-wrap">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Store control center</p><h1 className="section-title mt-2">Admin dashboard</h1><p className="mt-2 text-slate-600">Manage your catalog, customers and orders from one place.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={refreshOrders} className="button-secondary">↻ Refresh orders</button><button onClick={() => navigate("/")} className="button-secondary">View storefront</button><button onClick={() => { onLogout(); navigate("/admin-login"); }} className="button-secondary text-rose-600">Log out</button></div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value, icon]) => <div key={label} className="stat-card"><span className="stat-icon">{icon}</span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>)}</div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="surface h-fit p-3">{[["overview", "▥ Overview"], ["orders", "⌁ Orders", newOrderCount], ["customers", "♙ Customers"], ["contacts", "☎ Contact activity", newContactCount], ["reviews", "★ Reviews", newReviewCount], ["products", "▦ Products"]].map(([id, label, count]) => <button key={id} onClick={() => id === "orders" ? openOrders() : id === "contacts" ? openContacts() : id === "reviews" ? openReviews() : setTab(id)} className={`admin-tab relative flex items-center justify-between ${tab === id ? "active" : ""} ${count > 0 ? "admin-tab-unread" : ""}`}><span>{label}</span>{count > 0 && <span className="nav-badge !right-2 !top-1 bg-rose-500">{count > 9 ? "9+" : count}</span>}</button>)}</nav>
          <section className="min-w-0">
            {notice && <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
            {tab === "overview" && <Overview orders={orders} customers={customers} revenue={revenue} onOrders={openOrders} />}
            {tab === "orders" && <Orders orders={orders} products={products} busyAction={busyAction} onStatus={updateOrder} onSelect={setSelectedOrder} onExport={exportOrders} />}
            {tab === "customers" && <Customers customers={customers} />}
            {tab === "contacts" && <ContactEvents events={contactEvents} />}
            {tab === "reviews" && <Reviews reviews={reviews} products={products} onSaveReview={onSaveReview} onDeleteReview={onDeleteReview} />}
            {tab === "products" && <Products products={products} form={productForm} setForm={setProductForm} editingId={editingId} busyAction={busyAction} editorRef={editorRef} onSubmit={saveProduct} onEdit={editProduct} onDelete={deleteProduct} onNew={startNewProduct} onCancel={() => { setEditingId(null); setProductForm(blankProduct); }} />}
          </section>
        </div>
      </div>
      {selectedOrder && <OrderModal order={selectedOrder} products={products} onClose={() => setSelectedOrder(null)} />}
    </main>
  );
}

function Overview({ orders, customers, revenue, onOrders }) {
  return <div className="space-y-6"><div className="surface p-6"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Live store data</p><h2 className="mt-2 text-xl font-black text-slate-950">Recent orders</h2></div><button onClick={onOrders} className="text-sm font-black text-blue-600">View all →</button></div>{orders.length ? <div className="mt-5 divide-y divide-slate-100">{orders.slice(0, 5).map((order) => <OrderRow key={order.id} order={order} />)}</div> : <Empty text="Orders will appear here after a customer checks out." />}</div><div className="grid gap-6 sm:grid-cols-2"><div className="surface p-6"><p className="eyebrow">Customers</p><p className="mt-2 text-3xl font-black text-slate-950">{customers.length}</p><p className="mt-1 text-sm text-slate-500">Unique buyers with orders</p></div><div className="surface p-6"><p className="eyebrow">Revenue</p><p className="mt-2 text-3xl font-black text-slate-950">{money(revenue)}</p><p className="mt-1 text-sm text-slate-500">Total order value</p></div></div></div>;
}

function Orders({ orders, products, busyAction, onStatus, onSelect, onExport }) {
  const matchingProduct = (item) => products.find((product) => String(product.id) === String(item.id || item.productId) || (item.productCode && String(product.productCode || product.code).toLowerCase() === String(item.productCode).toLowerCase()) || (item.name && product.name.toLowerCase() === item.name.toLowerCase()));
  const orderItem = (item) => {
    const product = matchingProduct(item) || {};
    return {
      ...item,
      name: product.name || item.name || item.productName || item.title || "Product unavailable",
      productCode: product.productCode || product.code || item.productCode || item.code || "",
      image: product.image || item.image || item.imageUrl || "",
      price: Number.isFinite(Number(product.price)) ? Number(product.price) : Number(item.price || 0),
    };
  };
  return <div className="surface p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Customer purchases</p><h2 className="mt-2 text-xl font-black text-slate-950">All orders</h2><p className="mt-1 text-sm text-slate-500">Click an order to inspect customer and product details.</p></div><button onClick={onExport} disabled={!orders.length || Boolean(busyAction)} className="button-secondary disabled:cursor-not-allowed disabled:opacity-50">Export CSV ↓</button></div>{orders.length ? <div className="mt-5 space-y-3">{orders.map((order) => <div key={order.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><button onClick={() => onSelect(order)} className="text-left"><p className="font-black text-slate-900">{order.id} · {order.customer?.name || "Guest"}</p><p className="mt-1 text-sm text-slate-500">{formatDateTime(order.createdAt)}</p><p className="mt-1 text-sm text-slate-500">{order.customer?.email} · {order.customer?.phone}</p></button><strong>{money(order.total)}</strong><select value={order.status} disabled={Boolean(busyAction)} onChange={(event) => onStatus(order.id, event.target.value)} className="field w-auto py-2 disabled:opacity-60"><option>Processing</option><option>Payment pending</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{order.items?.map((rawItem, index) => { const item = orderItem(rawItem); return <div key={`${item.id || item.productCode || item.name}-${index}`} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2"><img src={item.image} alt={item.name} className="size-12 rounded-md object-cover" /><p className="min-w-0 text-xs font-bold text-slate-700">{item.name}{item.productCode && <span className="block font-mono text-blue-600">{item.productCode}</span>}<span className="block text-slate-500">Qty {item.quantity} · {money(item.price)} each · {money(item.price * item.quantity)}</span></p></div>; })}</div><p className="mt-3 text-xs text-slate-500">{order.customer?.address}, {order.customer?.city}, {order.customer?.pincode} · {order.payment?.toUpperCase()}</p></div>)}</div> : <Empty text="No customer orders yet." />}</div>;
}

function Customers({ customers }) {
  return <div className="surface p-6"><p className="eyebrow">Buyer directory</p><h2 className="mt-2 text-xl font-black text-slate-950">Customer details</h2>{customers.length ? <div className="mt-5 overflow-x-auto"><table className="admin-table"><thead><tr><th>Name</th><th>Contact</th><th>Location</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.email || customer.phone}><td className="font-bold text-slate-900">{customer.name || "Guest"}</td><td>{customer.email}<br />{customer.phone}</td><td>{customer.city}, {customer.pincode}</td><td>{customer.orders}</td><td>{money(customer.spent)}</td></tr>)}</tbody></table></div> : <Empty text="Customer details will appear after the first order." />}</div>;
}

function ContactEvents({ events = [] }) {
  return <div className="surface p-6"><p className="eyebrow">Website call tracking</p><h2 className="mt-2 text-xl font-black text-slate-950">Contact activity</h2><p className="mt-2 text-sm text-slate-500">Shows when a visitor taps the website call button. The browser cannot confirm whether the phone call was answered.</p>{events.length ? <div className="mt-5 overflow-x-auto"><table className="admin-table"><thead><tr><th>Contact number</th><th>Source</th><th>Date & time</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td className="font-bold text-slate-900">{event.contact_number || event.contactNumber}</td><td>{event.source}</td><td>{formatDateTime(event.created_at || event.createdAt)}</td></tr>)}</tbody></table></div> : <Empty text="No website call activity yet." />}</div>;
}

function Reviews({ reviews = [], products, onSaveReview, onDeleteReview }) {
  const blankReview = { type: "shop", productId: "", name: "Super Mart team", rating: "5", text: "" };
  const [form, setForm] = useState(blankReview);
  const [editingId, setEditingId] = useState(null);
  const productName = (id) => products.find((product) => String(product.id) === String(id))?.name || "Deleted product";
  const saveReview = async (event) => {
    event.preventDefault();
    const review = { ...form, productId: form.type === "product" ? form.productId : null, rating: Number(form.rating), updatedAt: new Date().toISOString() };
    await onSaveReview(review, editingId);
    setForm(blankReview);
    setEditingId(null);
  };
  const editReview = (review) => { setForm({ ...blankReview, ...review, rating: String(review.rating), type: review.type || (review.productId ? "product" : "shop") }); setEditingId(review.id); };
  return <div className="surface p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Customer feedback</p><h2 className="mt-2 text-xl font-black text-slate-950">Manage reviews</h2><p className="mt-1 text-sm text-slate-500">Add, edit or remove product and shop reviews.</p></div><span className="status-pill">{reviews.length} total</span></div><form onSubmit={saveReview} className="review-form mt-6 rounded-2xl bg-slate-50 p-4"><div className="grid gap-3 sm:grid-cols-2"><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, productId: "" })} className="field"><option value="shop">Shop review</option><option value="product">Product review</option></select>{form.type === "product" ? <select required value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} className="field"><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select> : <div />}</div><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]"><select value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} className="field"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" placeholder="Reviewer name" /></div><textarea required value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} className="field mt-3 min-h-24" placeholder="Review text" /><div className="mt-3 flex gap-2"><button className="button-primary">{editingId ? "Update review" : "Add review"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blankReview); }} className="button-secondary">Cancel</button>}</div></form>{reviews.length ? <div className="mt-6 space-y-3">{reviews.map((review) => <article key={review.id} className="review-card rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-slate-900">{review.name} · <span className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></p><p className="mt-1 text-xs font-bold text-blue-600">{review.type === "shop" || !review.productId ? "Super Mart shop review" : productName(review.productId)}</p></div><div className="flex gap-3"><button onClick={() => editReview(review)} className="font-bold text-blue-600">Edit</button><button onClick={async () => { await onDeleteReview(review.id); }} className="font-bold text-rose-600">Delete</button></div></div><p className="mt-3 text-sm text-slate-600">{review.text}</p></article>)}</div> : <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No reviews yet.</p>}</div>;
}

function Products({ products, form, setForm, editingId, busyAction, editorRef, onSubmit, onEdit, onDelete, onNew, onCancel }) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const fields = [["name", "Product name"], ["productCode", "Product code / SKU"], ["category", "Category"], ["price", "Price"], ["oldPrice", "Old price"], ["rating", "Rating"], ["stock", "Stock"], ["image", "Main image URL"]];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === "All" || product.category === categoryFilter;
    const matchesSearch = !normalizedSearch || [product.name, product.productCode, product.code, product.category].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Catalog and inventory</p><h2 className="mt-2 text-xl font-black text-slate-950">Products by category</h2></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="field min-w-56 flex-1 py-2 sm:w-64" placeholder="Search name or product code..." aria-label="Search products by name or product code" /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="field w-auto py-2"><option>All</option>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select><button type="button" onClick={onNew} className="admin-action button-primary">+ New product</button></div></div>
        <div className="mt-5 overflow-x-auto"><table className="admin-table"><thead><tr><th>Product</th><th>Code</th><th>Category</th><th>Stock</th><th>Price</th><th>Action</th></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product.id}><td><div className="flex min-w-52 items-center gap-3"><img src={product.image} alt="" className="size-11 rounded-lg object-cover" /><span className="font-bold text-slate-900">{product.name}</span></div></td><td className="font-mono text-xs font-bold text-blue-700">{product.productCode || product.code || "—"}</td><td>{product.category}</td><td className={product.stock < 10 ? "font-black text-rose-600" : ""}>{product.stock ?? "—"}</td><td>{money(product.price)}</td><td><button type="button" onClick={() => onEdit(product)} disabled={Boolean(busyAction)} className="admin-action font-bold text-blue-600 disabled:opacity-50">✎ Edit</button><button type="button" onClick={() => onDelete(product.id)} disabled={Boolean(busyAction)} className="admin-action ml-4 font-bold text-rose-600 disabled:opacity-50">{busyAction === `delete-${product.id}` ? "Deleting..." : "♲ Delete"}</button></td></tr>)}</tbody></table></div>
        {!visibleProducts.length && <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No products match your search.</p>}
      </div>
      {editingId !== null && <form ref={editorRef} onSubmit={onSubmit} className="surface admin-editor p-6"><h2 className="text-xl font-black text-slate-950">{editingId === "new" ? "Add product" : "Edit product"}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="field-label">{label}{key === "category" ? <select required value={form[key] ?? ""} onChange={(event) => setForm({ ...form, category: event.target.value })} className="field"><option value="">Select category</option>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select> : <input required={key !== "oldPrice"} value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="field" />}</label>)}<div className="field-label sm:col-span-2"><span>Main image preview</span>{form.image ? <div className="image-preview"><img src={form.image} alt="Product preview" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling.hidden = false; }} /><span hidden>Image URL could not be loaded.</span></div> : <div className="image-preview image-preview-empty">Paste a main image URL above to preview it.</div>}</div><label className="field-label sm:col-span-2">SEO keywords<textarea value={form.seoKeywords ?? ""} onChange={(event) => setForm({ ...form, seoKeywords: event.target.value })} className="field min-h-24" placeholder="Leave blank for automatic keywords: Super Mart Bhiwadi, best laptop in Bhiwadi..." /></label><label className="field-label sm:col-span-2">Additional image URLs<textarea value={form.imagesText ?? ""} onChange={(event) => setForm({ ...form, imagesText: event.target.value })} className="field min-h-28" placeholder="One image URL per line (up to 4)" /></label><label className="field-label sm:col-span-2">Description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="field min-h-24" /></label></div><div className="mt-6 flex gap-3"><button disabled={Boolean(busyAction)} className="admin-action button-primary disabled:cursor-wait disabled:opacity-60">{busyAction === "save" ? "Saving..." : editingId === "new" ? "Add product" : "Save changes"}</button><button type="button" onClick={onCancel} disabled={Boolean(busyAction)} className="admin-action button-secondary disabled:opacity-60">Cancel</button></div></form>}
    </div>
  );
}

function OrderRow({ order }) { return <div className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold text-slate-900">{order.id}</p><p className="text-sm text-slate-500">{order.customer?.name} · {formatDateTime(order.createdAt)}</p></div><strong>{money(order.total)}</strong><span className="status-pill">{order.status}</span></div>; }
function Empty({ text }) { return <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</p>; }
function OrderModal({ order, products, onClose }) {
  const match = (item) => products.find((product) => String(product.id) === String(item.id || item.productId)
    || (item.productCode && String(product.productCode || product.code).toLowerCase() === String(item.productCode).toLowerCase())
    || (item.name && product.name.toLowerCase() === item.name.toLowerCase()));
  const items = getOrderItems(order, products);
  return <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true"><div className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Order details</p><h2 className="mt-1 text-xl font-black">{order.id}</h2><p className="mt-1 text-xs text-slate-500">{formatDateTime(order.createdAt)}</p></div><button onClick={onClose} className="text-2xl text-slate-400" aria-label="Close">×</button></div><div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm"><p><b>Customer:</b> {order.customer?.name}</p><p><b>Email:</b> {order.customer?.email}</p><p><b>Phone:</b> {order.customer?.phone}</p><p><b>Address:</b> {order.customer?.address}, {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}</p><p><b>Payment:</b> {order.payment?.toUpperCase()}</p><p><b>Status:</b> {order.status}</p></div><div className="mt-5"><h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Ordered products ({items.length})</h3>{items.length ? <div className="space-y-3">{items.map((item, index) => { const product = match(item); const name = product?.name || item.name || item.productName || "Product unavailable"; const image = product?.image || item.image || item.imageUrl || ""; const code = product?.productCode || product?.code || item.productCode || item.code; const price = Number(product?.price ?? item.price ?? 0); return <div key={`${item.id || code || name}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><img src={image} alt={name} className="size-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="font-bold">{name}</p>{code && <p className="font-mono text-xs text-blue-600">{code}</p>}<p className="text-xs text-slate-500">Qty {item.quantity} · {money(price)} each · {money(price * item.quantity)}</p></div><b>{money(price * item.quantity)}</b></div>; })}</div> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Product details are not available in this stored order.</p>}</div><button onClick={onClose} className="button-secondary mt-6 w-full">Close</button></div></div>;
}

export default AdminPanel;
