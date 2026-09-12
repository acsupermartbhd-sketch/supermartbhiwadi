import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const getOrderItems = (order, products) => {
  const storedItems = [order.items, order.orderItems, order.order_items, order.cart, order.products, order.orderedProducts, order.ordered_products].find(Array.isArray) || [];
  if (storedItems.length) return storedItems;
  const matchingProducts = products.filter((product) => Number(product.price) + (Number(product.price) >= 999 ? 0 : 79) === Number(order.total));
  return matchingProducts.length === 1 ? [{ ...matchingProducts[0], quantity: 1 }] : [];
};

function Orders({ orders = [], customer, products = [] }) {
  const [statusNotice, setStatusNotice] = useState("");
  const previousStatuses = useRef(new Map());
  const customerOrders = orders.filter((order) => {
    const email = order.customer?.email || order.customer_email;
    return order.customerId && String(order.customerId) === String(customer?.id) || email?.toLowerCase() === customer?.email?.toLowerCase();
  }).map((order) => ({ ...order, items: getOrderItems(order, products) }));

  useEffect(() => {
    const nextStatuses = new Map(customerOrders.map((order) => [order.id, order.status]));
    const changedOrder = customerOrders.find((order) => previousStatuses.current.has(order.id) && previousStatuses.current.get(order.id) !== order.status);
    if (changedOrder) setStatusNotice(`Order ${changedOrder.id} status updated to ${changedOrder.status}.`);
    previousStatuses.current = nextStatuses;
  }, [customerOrders]);

  return (
    <main className="page-shell">
      <div className="section-wrap">
        <div className="mb-8">
          <p className="eyebrow">Your account</p>
          <h1 className="section-title mt-2">Order history</h1>
          <p className="mt-2 text-slate-600">Track your Super Mart orders and delivery status.</p>
        </div>
        {statusNotice && <div role="status" className="mb-5 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800"><span>🔔 {statusNotice}</span><button onClick={() => setStatusNotice("")} aria-label="Dismiss notification">×</button></div>}
        {customerOrders.length ? <div className="grid gap-4">{customerOrders.map((order) => <article key={order.id} className="surface p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Order {order.id}</p><p className="mt-1 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p></div><span className={`status-pill ${order.status === "Cancelled" ? "bg-rose-50 text-rose-600" : ""}`}>{order.status}</span><strong className="text-lg text-slate-950">{money(order.total)}</strong></div><div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">{(order.items || []).map((rawItem, index) => { const product = products.find((candidate) => String(candidate.id) === String(rawItem.id || rawItem.productId) || (rawItem.productCode && String(candidate.productCode || candidate.code).toLowerCase() === String(rawItem.productCode).toLowerCase()) || (rawItem.name && candidate.name.toLowerCase() === rawItem.name.toLowerCase())); const item = { ...rawItem, name: product?.name || rawItem.name || "Product unavailable", productCode: product?.productCode || product?.code || rawItem.productCode || "", image: product?.image || rawItem.image || "", price: product?.price ?? rawItem.price }; return <div key={`${order.id}-${item.id || index}`} className="flex items-center gap-3 py-3 text-sm"><img src={item.image} alt={item.name} className="size-14 rounded-lg object-cover" /><span className="min-w-0 flex-1"><b className="block">{item.name}</b>{item.productCode && <small className="block font-mono text-xs text-blue-600">{item.productCode}</small>}<small className="block text-slate-500">Qty {item.quantity} · {money(item.price)} each</small></span><b>{money(item.price * item.quantity)}</b></div>; })}</div></article>)}</div> : <section className="surface p-8 text-center"><div className="text-4xl">⌁</div><h2 className="mt-4 text-xl font-black text-slate-950">No orders yet</h2><p className="mt-2 text-slate-600">Your confirmed orders and live status will appear here.</p><Link to="/products" className="button-primary mt-6">Start shopping</Link></section>}
      </div>
    </main>
  );
}

export default Orders;
