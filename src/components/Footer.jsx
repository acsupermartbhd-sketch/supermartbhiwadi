import { Link } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FaClock, FaPhone } from "react-icons/fa";
import { BiLogoGmail } from "react-icons/bi";
import { FiCode, FiExternalLink } from "react-icons/fi";

function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#091426] text-slate-300">
      {/* CTA Banner */}
      <div className="bg-[#102d5a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Need help choosing?</p><p className="mt-1 text-lg font-black text-white">Talk to our Bhiwadi support team.</p></div>
          <div className="flex flex-wrap gap-2"><a href="tel:+919649374696" className="footer-cta">☎ Call us</a><a href="https://wa.me/919649374696" target="_blank" rel="noreferrer" className="footer-cta footer-cta-green"><img src="/img/whatsapp.png" alt="" className="size-4" /> WhatsApp</a></div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-black tracking-[-.07em] text-white"><img src="/img/logo.svg" alt="" className="size-10 object-contain" />Super <span className="text-blue-400">Mart</span></Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Reliable electronics, practical accessories and helpful local support for homes and businesses.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs font-bold text-slate-300"><FaLocationDot className="footer-icon" aria-hidden="true" /> F-GF 19-20 12A, Capital High Street, Bhiwadi, Alwar, Rajasthan 301019</div>
        </div>

        <div><h3 className="footer-heading">Explore</h3><div className="footer-links"><Link to="/">Home</Link><Link to="/products">All products</Link><Link to="/wishlist">Wishlist</Link><Link to="/contact">Contact us</Link></div></div>
        <div><h3 className="footer-heading">Categories</h3><div className="footer-links"><Link to="/products/Laptops">Laptops &amp; PC</Link><Link to="/products/Printers">Printers &amp; parts</Link><Link to="/products/CCTV-Cameras">CCTV cameras</Link><Link to="/products/Accessories">Accessories</Link></div></div>

        <div>
          <h3 className="footer-heading">Customer care</h3>
          <div className="footer-contact">
            <a href="tel:+919649374696"><FaPhone className="footer-icon" aria-hidden="true" /> <span>+91 96493 74696</span></a>
            <a href="mailto:supermartbhiwadi@gmail.com"><BiLogoGmail className="footer-icon" aria-hidden="true" /> <span>supermartbhiwadi@gmail.com</span></a>
            <div className="mt-1 space-y-0.5">
              <p><FaClock className="footer-icon" aria-hidden="true" /> <span>Mon–Sat: 10:00 AM – 7:00 PM</span></p>
              <p className="pl-5 text-xs text-slate-500">Sun: 10:00 AM – 2:00 PM</p>
            </div>
          </div>
          <a
            href="https://wa.me/919649374696?text=Hello%20Super%20Mart%20Support"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-900/60 hover:scale-[1.02] shadow-lg shadow-emerald-950/40"
          >
            <img src="/img/whatsapp.png" alt="" className="size-4 shrink-0 object-contain" />
            <span>WhatsApp Support: <strong>96493 74696</strong></span>
          </a>
        </div>
      </div>

      {/* Bottom Bar — Safe Padding to prevent floating overlap */}
      <div className="border-t border-slate-800/80 bg-[#060e1b]">
        <div className="mx-auto max-w-7xl px-5 py-6 pb-24 sm:pb-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Copyright */}
            <p className="text-xs font-medium text-slate-400">© 2026 Super Mart Bhiwadi. All rights reserved.</p>

            {/* Trust Badges */}
            <p className="text-xs text-slate-500 hidden md:block">Secure shopping · Fast delivery · Local support</p>

            {/* Developer Credit — Pro High-Visibility Design */}
            <a
              href="https://developerabhishek.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2.5 self-start rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 px-4 py-2 text-xs font-black text-white shadow-xl shadow-blue-950/50 transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:shadow-blue-500/20 sm:self-auto"
              aria-label="Visit Developer Abhishek's portfolio"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-md shadow-blue-900/60 group-hover:rotate-12 transition-transform duration-300">
                <FiCode className="size-3.5 text-white" aria-hidden="true" />
              </span>
              <span className="leading-none text-xs">
                Crafted by <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent font-black">Developer Abhishek</span>
              </span>
              <FiExternalLink className="size-3.5 text-blue-400 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;