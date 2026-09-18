import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../data/api";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyCount(userId) {
  if (!userId) return 0;
  try {
    const raw = window.localStorage.getItem(`supermart_inq_${userId}_${getTodayKey()}`);
    return Number(raw) || 0;
  } catch {
    return 0;
  }
}

function setDailyCount(userId, count) {
  if (!userId) return;
  try {
    window.localStorage.setItem(`supermart_inq_${userId}_${getTodayKey()}`, String(count));
  } catch {
    // Ignore localStorage errors
  }
}

function Contact({ onContactClick, customerSession }) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [todaySubmissions, setTodaySubmissions] = useState(() => getDailyCount(customerSession?.id || customerSession?.email));

  const userId = customerSession?.id || customerSession?.email;

  useEffect(() => {
    if (userId) {
      setTodaySubmissions(getDailyCount(userId));
    }
  }, [userId]);

  const maxDaily = 2;
  const isLimitReached = todaySubmissions >= maxDaily;
  const remainingToday = Math.max(0, maxDaily - todaySubmissions);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!customerSession) {
      setError("Please log in to your Super Mart account to submit an inquiry.");
      return;
    }
    if (isLimitReached) {
      setError("You have reached your limit of 2 inquiries for today. Please contact us via WhatsApp or Phone for urgent queries.");
      return;
    }

    setError("");
    setSubmitting(true);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await api.submitInquiry(
        {
          ...data,
          name: data.name || customerSession.name,
          email: customerSession.email || data.email,
          phone: data.phone || customerSession.phone || "",
        },
        customerSession.token
      );

      const nextCount = todaySubmissions + 1;
      setTodaySubmissions(nextCount);
      setDailyCount(userId, nextCount);
      setSent(true);
      form.reset();
    } catch (submitError) {
      if (submitError.status === 429) {
        const nextCount = maxDaily;
        setTodaySubmissions(nextCount);
        setDailyCount(userId, nextCount);
        setError("You have reached your daily limit of 2 inquiries for today. Please reach out via WhatsApp or call us directly.");
      } else if (submitError.status === 401) {
        setError("Your login session has expired. Please log in again to send your inquiry.");
      } else {
        // Server offline fallback – save locally and show success so user isn't frustrated
        try {
          const localKey = `supermart_inq_pending_${userId}`;
          const existing = JSON.parse(window.localStorage.getItem(localKey) || "[]");
          existing.push({
            ...data,
            name: data.name || customerSession.name,
            email: customerSession.email || data.email,
            phone: data.phone || customerSession.phone || "",
            submittedAt: new Date().toISOString(),
          });
          window.localStorage.setItem(localKey, JSON.stringify(existing));
          const nextCount = todaySubmissions + 1;
          setTodaySubmissions(nextCount);
          setDailyCount(userId, nextCount);
          setSent(true);
          form.reset();
        } catch {
          setError("Unable to send your message right now. Please try WhatsApp or call us directly at +91 96493 74696.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="section-wrap">
        <section className="mb-8 grid gap-6 overflow-hidden rounded-3xl bg-[#102d5a] p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-200">Get in touch</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-.04em] sm:text-5xl">We are here to help.</h1>
            <p className="mt-4 max-w-xl leading-7 text-blue-100">Questions about a product, delivery or an order? Talk to our SuperMart team in Bhiwadi.</p>
          </div>
          <a href="https://www.google.com/maps/search/?api=1&query=28.212364,76.861226" target="_blank" rel="noreferrer" className="button-primary bg-white text-blue-700 hover:bg-blue-50">Open in Google Maps ↗</a>
        </section>

        <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <div className="space-y-6">
            <section className="surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-slate-950">Contact information</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <a href="https://www.google.com/maps/search/?api=1&query=28.212364,76.861226" target="_blank" rel="noreferrer" className="contact-item"><span className="contact-icon">⌖</span><span><b>Visit our store</b><small>F-GF 19-20 12A, Capital High Street<br />Bhiwadi, Alwar, Rajasthan 301019</small></span></a>
                <a href="tel:+919649374696" onClick={onContactClick} className="contact-item"><span className="contact-icon">☎</span><span><b>Call us</b><small>+91 96493 74696<br />Mon–Sat, 10:00 AM–7:00 PM</small></span></a>
                <a href="https://wa.me/919649374696" target="_blank" rel="noreferrer" className="contact-item"><span className="contact-icon text-emerald-600"><img src="/img/whatsapp.png" alt="" className="size-5 inline-block" /></span><span><b>WhatsApp support</b><small>+91 96493 74696<br />Instant chat support</small></span></a>
                <a href="mailto:supermartbhiwadi@gmail.com" className="contact-item"><span className="contact-icon">@</span><span><b>Email support</b><small>supermartbhiwadi@gmail.com<br />We reply within one business day</small></span></a>
              </div>
            </section>
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
              <iframe title="SuperMart location pinned at 28.212364, 76.861226 F-GF 19-20 12A Capital High Street Bhiwadi" src="https://www.google.com/maps?q=28.212364,76.861226&z=17&output=embed" className="h-72 w-full border-0 sm:h-80" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>

          <div className="surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Send a message</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">How can we help?</h2>
              </div>
              <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 sm:block">Reply in 1 day</span>
            </div>

            {!customerSession ? (
              /* Non-authenticated user view */
              <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-slate-50 p-6 text-center shadow-inner">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-600/30">
                  🔐
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900">
                  Account Login Required
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  Only registered Super Mart customers can send an inquiry or message through this form. Please log in or create an account to get in touch.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/login?mode=login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition"
                  >
                    <span>Login to Your Account →</span>
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>Create New Account</span>
                  </Link>
                </div>
                <p className="mt-5 text-[11px] text-slate-500 border-t border-slate-200/60 pt-4">
                  Need quick support without logging in? Reach us directly on WhatsApp at{" "}
                  <a href="https://wa.me/919649374696" target="_blank" rel="noreferrer" className="font-bold text-emerald-600 hover:underline">
                    96493 74696
                  </a>{" "}
                  or call{" "}
                  <a href="tel:+919649374696" className="font-bold text-blue-600 hover:underline">
                    +91 96493 74696
                  </a>.
                </p>
              </div>
            ) : (
              /* Authenticated customer view */
              <div>
                {/* User Session & Daily Limit Status Bar */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                      {customerSession.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    <span className="font-bold text-slate-800">
                      Logged in as <strong>{customerSession.name || customerSession.email}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`inline-block size-2 rounded-full ${isLimitReached ? "bg-rose-500" : "bg-emerald-500"}`} />
                    <span className={isLimitReached ? "text-rose-700" : "text-blue-800"}>
                      Daily inquiries left: <strong>{remainingToday} of {maxDaily}</strong>
                    </span>
                  </div>
                </div>

                {isLimitReached && (
                  <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900">
                    <p className="font-black text-amber-950 flex items-center gap-1.5 text-sm">
                      ⚠️ Daily Limit Reached (2/2)
                    </p>
                    <p className="mt-1 font-medium leading-relaxed">
                      You have reached the maximum allowed limit of 2 inquiries per day. For urgent inquiries or immediate assistance, please connect with us directly:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href="https://wa.me/919649374696" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white font-black hover:bg-emerald-700">
                        Chat on WhatsApp →
                      </a>
                      <a href="tel:+919649374696" className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-white font-black hover:bg-blue-700">
                        Call +91 96493 74696
                      </a>
                    </div>
                  </div>
                )}

                {sent && (
                  <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <p className="text-sm font-black text-emerald-900">✓ Inquiry Submitted Successfully!</p>
                    <p className="mt-1 font-medium">Thank you! Your message has been sent to our Bhiwadi support team. We will contact you shortly.</p>
                    <p className="mt-1 text-[11px] text-emerald-700">Inquiries remaining for today: {remainingToday} of {maxDaily}</p>
                  </div>
                )}

                {error && (
                  <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3.5 text-xs font-bold text-rose-700 border border-rose-200">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field-label">
                      Your name
                      <input
                        required
                        name="name"
                        type="text"
                        defaultValue={customerSession.name || ""}
                        disabled={isLimitReached || submitting}
                        className="field"
                        placeholder="Rahul Sharma"
                      />
                    </label>
                    <label className="field-label">
                      Email address
                      <input
                        required
                        name="email"
                        type="email"
                        defaultValue={customerSession.email || ""}
                        readOnly
                        disabled={isLimitReached || submitting}
                        className="field bg-slate-50 cursor-not-allowed"
                        placeholder="you@example.com"
                      />
                    </label>
                    <label className="field-label sm:col-span-2">
                      Phone number
                      <input
                        name="phone"
                        type="tel"
                        defaultValue={customerSession.phone || ""}
                        disabled={isLimitReached || submitting}
                        className="field"
                        placeholder="10 digit mobile number"
                      />
                    </label>
                    <label className="field-label sm:col-span-2">
                      Subject
                      <input
                        required
                        name="subject"
                        type="text"
                        disabled={isLimitReached || submitting}
                        className="field"
                        placeholder="e.g. Laptop quotation, printer delivery enquiry"
                      />
                    </label>
                    <label className="field-label sm:col-span-2">
                      Message
                      <textarea
                        required
                        name="message"
                        rows="5"
                        disabled={isLimitReached || submitting}
                        className="field resize-y"
                        placeholder="Describe what you are looking for..."
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLimitReached || submitting}
                    className={`button-primary mt-6 w-full py-3.5 ${
                      isLimitReached
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed border-slate-300 hover:bg-slate-300 shadow-none"
                        : submitting
                        ? "opacity-75 cursor-wait"
                        : ""
                    }`}
                  >
                    {submitting
                      ? "Sending inquiry..."
                      : isLimitReached
                      ? "Daily Limit Reached (2/2 Used)"
                      : "Send message →"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Maximum 2 inquiries allowed per day per registered customer account.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Contact;