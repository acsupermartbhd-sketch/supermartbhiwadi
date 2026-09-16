import { useEffect, useRef, useState } from "react";
import { FiPrinter, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getOrderItems = (order, products) => {
  let storedItems = [order.items, order.orderItems, order.order_items, order.cart, order.products, order.orderedProducts, order.ordered_products].find(Array.isArray);
  if (!storedItems && typeof order.items === "string") {
    try { storedItems = JSON.parse(order.items); } catch {}
  }
  if (!storedItems && typeof order.orderItems === "string") {
    try { storedItems = JSON.parse(order.orderItems); } catch {}
  }
  if (Array.isArray(storedItems) && storedItems.length) return storedItems;
  // Fallback: if single product matches by total, infer it
  const matchingProducts = products.filter((product) => Number(product.price) + (Number(product.price) >= 999 ? 0 : 79) === Number(order.total));
  return matchingProducts.length === 1 ? [{ ...matchingProducts[0], quantity: 1 }] : [];
};

function OrderInvoiceModal({ order, products, onClose }) {
  const handlePrint = () => window.print();
  const items = getOrderItems(order, products);
  const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
  const deliveryFee = subtotal >= 999 ? 0 : 79;
  const grandTotal = Number(order.total) || subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 no-print">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Tax Invoice / Receipt</p>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition">
              <FiPrinter className="size-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
              <FiX className="size-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice */}
        <div id="customer-invoice" className="p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xl font-black text-slate-950 tracking-tight">SUPER MART BHIWADI</p>
              <p className="text-xs text-slate-500 mt-0.5">FGH 12A, Capital High Street, Bhiwadi, Rajasthan - 301019</p>
              <p className="text-xs text-slate-500">+91 95490 92686 · supermartbhiwadi@gmail.com</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</p>
              <p className="font-black font-mono text-slate-900">{order.id}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
            <div>
              <p className="font-black text-slate-400 uppercase tracking-wider text-[10px] mb-1">Billed To</p>
              <p className="font-bold text-slate-900">{order.customer?.name}</p>
              <p className="text-slate-600">{order.customer?.email}</p>
              <p className="text-slate-600 font-semibold">{order.customer?.phone}</p>
              <p className="text-slate-600 mt-1">{order.customer?.address}, {order.customer?.city} - {order.customer?.pincode}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-slate-400 uppercase tracking-wider text-[10px] mb-1">Payment</p>
              <p className="font-bold text-slate-900 uppercase">{order.payment || "COD"}</p>
              <p className="font-black text-blue-800 uppercase mt-1">{order.status}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                // Use stored price (preserves partner wholesale price)
                const itemPrice = Number.isFinite(Number(item.price)) && Number(item.price) > 0
                  ? Number(item.price)
                  : 0;
                const itemQty = Number(item.quantity || 1);
                return (
                  <tr key={`${item.id || idx}`} className="py-2">
                    <td className="py-2.5 font-bold text-slate-900">{item.name && item.name !== "Product" ? item.name : "Super Mart Product"}</td>
                    <td className="py-2.5 text-center font-bold">{itemQty}</td>
                    <td className="py-2.5 text-right text-slate-700">{money(itemPrice)}</td>
                    <td className="py-2.5 text-right font-black text-slate-950">{money(itemPrice * itemQty)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end border-t-2 border-slate-900 pt-3">
            <div className="w-52 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : ""}>{deliveryFee === 0 ? "FREE" : money(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-950 border-t border-slate-200 pt-2 mt-2">
                <span>Grand Total</span><span>{money(grandTotal)}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
            Thank you for shopping with Super Mart Bhiwadi! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}

function Orders({ orders = [], customer, products = [] }) {
  const [statusNotice, setStatusNotice] = useState("");
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const previousStatuses = useRef(new Map());

  const isPartner = customer?.role === "partner";

  const customerOrders = orders.filter((order) => {
    const email = order.customer?.email || order.customer_email;
    const idMatch = order.customerId && (
      String(order.customerId) === String(customer?.id) ||
      String(order.customerId) === String(customer?.id)?.replace(/^firebase:/, "") ||
      String(order.customerId) === `firebase:${customer?.id}`
    );
    const emailMatch = email && customer?.email && email.toLowerCase() === customer.email.toLowerCase();
    return idMatch || emailMatch;
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
          {isPartner && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-black text-amber-700">
              ★ B2B Partner — Wholesale pricing applies to your orders
            </div>
          )}
        </div>
        {statusNotice && <div role="status" className="mb-5 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800"><span>🔔 {statusNotice}</span><button onClick={() => setStatusNotice("")} aria-label="Dismiss notification">×</button></div>}
        {customerOrders.length ? (
          <div className="grid gap-4">
            {customerOrders.map((order) => (
              <article key={order.id} className={`surface p-5 sm:p-6 ${isPartner ? "border-l-4 border-amber-400" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Order {order.id}</p>
                    <p className="mt-1 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                    {isPartner && <span className="mt-1 inline-block text-[11px] font-black text-amber-600">★ Partner Order</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`status-pill ${order.status === "Cancelled" ? "bg-rose-50 text-rose-600" : ""}`}>{order.status}</span>
                    <strong className="text-lg text-slate-950">{money(order.total)}</strong>
                    <button
                      onClick={() => setInvoiceOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition border border-slate-200"
                    >
                      <FiPrinter className="size-3.5" /> Invoice
                    </button>
                  </div>
                </div>
                <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
                  {(order.items || []).map((rawItem, index) => {
                    // Match product for name/image but USE stored price (preserves partner price)
                    const product = products.find((candidate) =>
                      String(candidate.id) === String(rawItem.id || rawItem.productId) ||
                      (rawItem.productCode && String(candidate.productCode || candidate.code).toLowerCase() === String(rawItem.productCode).toLowerCase()) ||
                      (rawItem.name && rawItem.name !== "Product" && candidate.name.toLowerCase() === rawItem.name.toLowerCase())
                    );
                    const item = {
                      ...rawItem,
                      name: (rawItem.name && rawItem.name !== "Product" ? rawItem.name : null) || product?.name || "Product unavailable",
                      productCode: rawItem.productCode || product?.productCode || product?.code || "",
                      image: rawItem.image || product?.image || "",
                      // Use stored order price to preserve partner wholesale pricing
                      price: Number.isFinite(Number(rawItem.price)) && Number(rawItem.price) > 0
                        ? Number(rawItem.price)
                        : Number(product?.price || 0),
                    };
                    return (
                      <div key={`${order.id}-${item.id || index}`} className="flex items-center gap-3 py-3 text-sm">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="size-14 rounded-lg object-cover bg-slate-50" />
                        ) : (
                          <div className="size-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">IMG</div>
                        )}
                        <span className="min-w-0 flex-1">
                          <b className="block">{item.name}</b>
                          {item.productCode && <small className="block font-mono text-xs text-blue-600">{item.productCode}</small>}
                          <small className="block text-slate-500">
                            Qty {item.quantity} · {money(item.price)} each
                            {isPartner && <span className="ml-1 text-amber-600 font-bold">(Partner Price)</span>}
                          </small>
                        </span>
                        <b>{money(item.price * item.quantity)}</b>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="surface p-8 text-center">
            <div className="text-4xl">⌁</div>
            <h2 className="mt-4 text-xl font-black text-slate-950">No orders yet</h2>
            <p className="mt-2 text-slate-600">Your confirmed orders and live status will appear here.</p>
            <Link to="/products" className="button-primary mt-6">Start shopping</Link>
          </section>
        )}
      </div>
      {invoiceOrder && <OrderInvoiceModal order={invoiceOrder} products={products} onClose={() => setInvoiceOrder(null)} />}
    </main>
  );
}

export default Orders;
