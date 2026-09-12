import { useState } from "react";

const emptyProduct = { name: "", category: "", price: "", oldPrice: "", rating: "4.5", stock: "25", image: "", description: "" };
const money = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

function Admin({ products, setProducts, orders, setOrders }) {
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [notice, setNotice] = useState("");
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  const openEditor = (product) => {
    setEditing(product?.id ?? "new");
    setForm(product ? { ...product } : emptyProduct);
    setTab("products");
  };

  const saveProduct = (event) => {
    event.preventDefault();
    const product = { ...form, id: editing === "new" ? Date.now() : editing, price: Number(form.price), oldPrice: Number(form.oldPrice || form.price), rating: Number(form.rating), stock: Number(form.stock) };
    setProducts((current) => editing === "new" ? [...current, product] : current.map((item) => item.id === editing ? product : item));
    setEditing(null);
    setForm(emptyProduct);
    setNotice("Product saved successfully.");
  };

  const deleteProduct = (id) => setProducts((current) => current.filter((item) => item.id !== id));
  const updateOrderStatus = (id, status) => setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));

  return (
    <main className="admin-shell">
      <div className="admin-wrap">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Store control center</p><h1 className="section-title mt-2">Admin dashboard</h1><p className="mt-2 text-slate-600">Manage products, inventory and orders from one place.</p></div>
          <a href="/" className="button-secondary">← View storefront</a>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: "Products", value: products.length, icon: "▦" }, { label: "Orders", value: orders.length, icon: "⌁" }, { label: "Revenue", value: money(revenue), icon: "₹" }, { label: "Low stock", value: products.filter((item) => item.stock && item.stock < 10).length, icon: "!" }].map((stat) => <div key={stat.label} className="stat-card"><span className="stat-icon">{stat.icon}</span><p className="mt-4 text-sm font-semibold text-slate-500">{stat.label}</p><p className="mt-1 text-2xl font-black text-slate-950">{stat.value}</p></div>)}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="surface h-fit p-3"><button onClick={() => setTab("overview")} className={`admin-tab ${tab === "overview" ? "active" : ""}`}>▥ Overview</button><button onClick={() => setTab("products")} className={`admin-tab ${tab === "products" ? "active" : ""}`}>▦ Products</button><button onClick={() => setTab("orders")} className={`admin-tab ${tab === "orders" ? "active" : ""}`}>⌁ Orders</button></nav>
          <section className="min-w-0">
            {notice && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
            {tab === "overview" && <div className="surface p-6"><h2 className="text-xl font-black text-slate-950">Recent orders</h2>{orders.length ? <div className="mt-5 divide-y divide-slate-100">{orders.slice(0, 5).map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold text-slate-900">{order.id}</p><p className="text-sm text-slate-500">{order.customer.name} · {new Date(order.createdAt).toLocaleDateString("en-IN")}</p></div><strong>{money(order.total)}</strong><span className="status-pill">{order.status}</span></div>)}</div> : <p className="mt-6 text-slate-500">Orders will appear here after the first checkout.</p>}</div>}
            {tab === "products" && <div className="space-y-6"><div className="surface p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">Catalog</h2><p className="mt-1 text-sm text-slate-500">Your changes are saved in this browser.</p></div><button onClick={() => openEditor()} className="button-primary">+ Add product</button></div><div className="mt-5 overflow-x-auto"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Action</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="flex min-w-52 items-center gap-3"><img src={product.image} alt="" className="size-11 rounded-lg object-cover" /><span className="font-bold">{product.name}</span></div></td><td>{product.category}</td><td>{money(product.price)}</td><td><button onClick={() => openEditor(product)} className="text-sm font-bold text-blue-600">Edit</button><button onClick={() => deleteProduct(product.id)} className="ml-4 text-sm font-bold text-red-600">Delete</button></td></tr>)}</tbody></table></div></div>{editing !== null && <form onSubmit={saveProduct} className="surface p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">{editing === "new" ? "Add product" : "Edit product"}</h2><button type="button" onClick={() => setEditing(null)} className="text-xl text-slate-400">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{[["name", "Product name"], ["category", "Category"], ["price", "Price"], ["oldPrice", "Old price"], ["rating", "Rating"], ["image", "Image URL"]].map(([key, label]) => <label key={key} className="field-label">{label}<input required={key !== "oldPrice"} value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} className="field" /></label>)}<label className="field-label sm:col-span-2">Description<textarea required value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="field min-h-24" /></label></div><button className="button-primary mt-6">Save product</button></form>}</div>}
            {tab === "orders" && <div className="surface p-6"><h2 className="text-xl font-black text-slate-950">All orders</h2><div className="mt-5 space-y-3">{orders.length ? orders.map((order) => <div key={order.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black">{order.id} · {order.customer.name}</p><p className="mt-1 text-sm text-slate-500">{order.customer.city}, {order.customer.pincode} · {order.payment.toUpperCase()}</p></div><strong>{money(order.total)}</strong><select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="field w-auto py-2"><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></div></div>) : <p className="mt-6 text-slate-500">No orders yet.</p>}</div></div>}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Admin;
