import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../data/api";

const formatPrice = (price) => `₹${price.toLocaleString("en-IN")}`;

function Checkout({ cart, placeOrder, customer, onProfileUpdate }) {
  const navigate = useNavigate();
  const [payment, setPayment] = useState("cod");
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [saveDetails, setSaveDetails] = useState(true);
  const [razorpayReady, setRazorpayReady] = useState(Boolean(window.Razorpay));

  // Load saved address from localStorage as fallback
  const getSavedAddress = () => {
    try {
      const raw = localStorage.getItem("supermart_saved_delivery_address");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const [form, setForm] = useState(() => {
    const saved = getSavedAddress();
    return {
      name: customer?.name || saved?.name || "",
      phone: customer?.phone || saved?.phone || "",
      email: customer?.email || "",
      address: customer?.address || saved?.address || "",
      city: customer?.city || saved?.city || "Bhiwadi",
      state: customer?.state || saved?.state || "Rajasthan",
      pincode: customer?.pincode || saved?.pincode || "",
    };
  });

  // Re-sync when customer session loads (it loads async from Firebase)
  useEffect(() => {
    if (!customer) return;
    const saved = getSavedAddress();
    setForm((prev) => ({
      name: customer.name || prev.name || saved?.name || "",
      phone: customer.phone || prev.phone || saved?.phone || "",
      email: customer.email || prev.email || "",
      address: customer.address || prev.address || saved?.address || "",
      city: customer.city || prev.city || saved?.city || "Bhiwadi",
      state: customer.state || prev.state || saved?.state || "Rajasthan",
      pincode: customer.pincode || prev.pincode || saved?.pincode || "",
    }));
  }, [customer?.id]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal >= 999 ? 0 : 79;
  const total = subtotal + delivery;

  useEffect(() => {
    if (submittedOrder) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [submittedOrder]);

  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setPaymentError("Payment gateway could not load. Please try again.");
    document.body.appendChild(script);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPaymentError("");

    // Always save delivery address to localStorage for future use
    try {
      const addressToSave = { name: form.name, phone: form.phone, address: form.address, city: form.city, state: form.state, pincode: form.pincode };
      localStorage.setItem("supermart_saved_delivery_address", JSON.stringify(addressToSave));
    } catch {}

    if (saveDetails && customer?.token) {
      try {
        const savedCustomer = await api.updateCustomerProfile(form, customer.token);
        onProfileUpdate?.(savedCustomer);
      } catch {
        setPaymentError("Delivery details could not be saved. You can still place the order.");
      }
    }
    if (payment === "cod") {
      const order = await placeOrder({ customer: form, payment });
      setSubmittedOrder(order);
      return;
    }
    if (!customer?.token) {
      setPaymentError("Please log in again before making an online payment.");
      return;
    }
    setIsPaying(true);
    try {
      if (!razorpayReady || !window.Razorpay) throw new Error("Payment gateway is still loading. Please try again.");
      const razorpayOrder = await api.createRazorpayOrder({ amount: total });
      const checkout = new window.Razorpay({
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Super Mart",
        description: "Super Mart order payment",
        order_id: razorpayOrder.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#1458cf" },
        handler: async (response) => {
          try {
            const order = await placeOrder({
              customer: form,
              payment: "online",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSubmittedOrder(order);
          } catch (error) {
            setPaymentError(error.message || "Payment succeeded, but the order could not be saved. Please contact support.");
          } finally {
            setIsPaying(false);
          }
        },
        modal: { ondismiss: () => setIsPaying(false) },
      });
      checkout.on("payment.failed", (response) => {
        setPaymentError(response.error?.description || "Payment failed. Please try again.");
        setIsPaying(false);
      });
      checkout.open();
    } catch (error) {
      setPaymentError(error.message || "Unable to start online payment.");
      setIsPaying(false);
    }
  };

  if (submittedOrder) {
    return (
      <main className="page-shell flex items-center justify-center">
        <section className="surface max-w-xl p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
          <p className="eyebrow mt-6">Order confirmed</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Thanks, {form.name || "customer"}.</h1>
          <p className="mt-3 text-slate-600">Your order <strong>{submittedOrder.id}</strong> is being prepared. We will contact you before delivery.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/products" className="button-primary">Continue shopping</Link>
            <button onClick={() => navigate("/")} className="button-secondary">Back home</button>
          </div>
        </section>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="page-shell flex items-center justify-center">
        <section className="surface max-w-lg p-10 text-center">
          <div className="text-5xl">🛒</div>
          <h1 className="mt-4 text-2xl font-black text-slate-950">Your cart is empty</h1>
          <p className="mt-2 text-slate-600">Add something you love before checking out.</p>
          <Link to="/products" className="button-primary mt-6">Browse products</Link>
        </section>
      </main>
    );
  }

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <main className="page-shell">
      <div className="section-wrap">
        <div className="mb-8">
          <p className="eyebrow">Secure checkout</p>
          <h1 className="section-title mt-2">Complete your order</h1>
          <p className="mt-2 text-slate-600">Free delivery on orders above ₹999. Cash on delivery is available in Bhiwadi.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit} className="surface p-6 sm:p-8">
            <h2 className="text-xl font-black text-slate-950">Delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="field-label">Full name<input required value={form.name} onChange={(e) => update("name", e.target.value)} className="field" placeholder="Your name" /></label>
              <label className="field-label">Phone number<input required pattern="[0-9]{10}" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="field" placeholder="10 digit mobile number" /></label>
              <label className="field-label sm:col-span-2">Email address<input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="field" placeholder="you@example.com" /></label>
              <label className="field-label sm:col-span-2">Address<textarea required value={form.address} onChange={(e) => update("address", e.target.value)} className="field min-h-24 resize-y" placeholder="House no., street, landmark" /></label>
              <label className="field-label">City<input required value={form.city} onChange={(e) => update("city", e.target.value)} className="field" /></label>
              <label className="field-label">State<input required value={form.state} onChange={(e) => update("state", e.target.value)} className="field" /></label>
              <label className="field-label">Pincode<input required pattern="[0-9]{6}" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} className="field" placeholder="123456" /></label>
            </div>
            {customer?.token && <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={saveDetails} onChange={(event) => setSaveDetails(event.target.checked)} /> Save delivery details for next time</label>}

            <h2 className="mt-8 text-xl font-black text-slate-950">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[{ id: "cod", title: "Cash on delivery", icon: "💵" }, { id: "online", title: "Pay securely with UPI", image: "/img/upi.webp" }].map((option) => (
                <label key={option.id} className={`cursor-pointer rounded-xl border p-4 transition ${payment === option.id ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}>
                  <input type="radio" name="payment" value={option.id} checked={payment === option.id} onChange={(e) => setPayment(e.target.value)} className="sr-only" />
                  {option.image ? <img src={option.image} alt="UPI" className="payment-method-logo" /> : <span className="text-2xl">{option.icon}</span>}
                  <span className="mt-2 block text-sm font-bold text-slate-800">{option.title}</span>
                </label>
              ))}
            </div>
            {paymentError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{paymentError}</p>}
            <button type="submit" disabled={isPaying} className="button-primary mt-8 w-full py-3.5 disabled:cursor-wait disabled:opacity-60">{isPaying ? "Opening Razorpay..." : payment === "cod" ? `Place order · ${formatPrice(total)}` : `Pay securely · ${formatPrice(total)}`}</button>
          </form>

          <aside className="surface h-fit p-6 lg:sticky lg:top-28">
            <h2 className="text-xl font-black text-slate-950">Order summary</h2>
            <div className="mt-5 space-y-4">
              {cart.map((item) => <div key={item.id} className="flex gap-3"><img src={item.image} alt="" className="cart-product-image size-14 rounded-lg object-contain" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.quantity} × {formatPrice(item.price)}</p></div><strong className="text-sm">{formatPrice(item.price * item.quantity)}</strong></div>)}
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span className={delivery ? "" : "text-emerald-600"}>{delivery ? formatPrice(delivery) : "FREE"}</span></div><div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-950"><span>Total</span><span>{formatPrice(total)}</span></div></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Checkout;
