import { useState } from "react";
import { api } from "../data/api";

function Contact({ onContactClick }) {
  const [sent, setSent] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await api.submitInquiry(data);
      setSent(true);
      form.reset();
    } catch (submitError) {
      setError(submitError.message || "Unable to send your message. Please try again.");
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

          <form onSubmit={handleSubmit} className="surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Send a message</p><h2 className="mt-2 text-2xl font-black text-slate-950">How can we help?</h2></div><span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 sm:block">Reply in 1 day</span></div>
            {sent && <div role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">Thanks! Your message has been received. Our team will contact you soon.</div>}
            {error && <div role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="field-label">Your name<input required name="name" type="text" className="field" placeholder="Rahul Sharma" /></label>
              <label className="field-label">Email address<input required name="email" type="email" className="field" placeholder="you@example.com" /></label>
              <label className="field-label sm:col-span-2">Phone number<input name="phone" type="tel" className="field" placeholder="10 digit mobile number" /></label>
              <label className="field-label sm:col-span-2">Subject<input required name="subject" type="text" className="field" placeholder="How can we help?" /></label>
              <label className="field-label sm:col-span-2">Message<textarea required name="message" rows="6" className="field resize-y" placeholder="Tell us a little more..." /></label>
            </div>
            <button type="submit" className="button-primary mt-6 w-full py-3.5">Send message →</button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default Contact;