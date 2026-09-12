import { Link } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FaClock, FaPhone } from "react-icons/fa";
import { BiLogoGmail } from "react-icons/bi";

function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#091426] text-slate-300">
      <div className="bg-[#102d5a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Need help choosing?</p><p className="mt-1 text-lg font-black text-white">Talk to our Bhiwadi support team.</p></div>
          <div className="flex flex-wrap gap-2"><a href="tel:+919549092686" className="footer-cta">☎ Call us</a><a href="https://wa.me/919549092686" target="_blank" rel="noreferrer" className="footer-cta footer-cta-green"><img src="/img/whatsapp.png" alt="" className="size-4" /> WhatsApp</a></div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-black tracking-[-.07em] text-white"><img src="/img/logo.svg" alt="" className="size-10 object-contain" />Super <span className="text-blue-400">Mart</span></Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Reliable electronics, practical accessories and helpful local support for homes and businesses.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs font-bold text-slate-300"><FaLocationDot className="footer-icon" aria-hidden="true" /> FGF 19-20, Capital High Street, Bhiwadi, Alwar, Rajasthan 301019</div>
        </div>

        <div><h3 className="footer-heading">Explore</h3><div className="footer-links"><Link to="/">Home</Link><Link to="/products">All products</Link><Link to="/wishlist">Wishlist</Link><Link to="/contact">Contact us</Link></div></div>
        <div><h3 className="footer-heading">Categories</h3><div className="footer-links"><Link to="/products/Laptops">Laptops &amp; PC</Link><Link to="/products/Printers">Printers &amp; parts</Link><Link to="/products/CCTV-Cameras">CCTV cameras</Link><Link to="/products/Accessories">Accessories</Link></div></div>
        <div><h3 className="footer-heading">Customer care</h3><div className="footer-contact"><a href="tel:+919549092686"><FaPhone className="footer-icon" aria-hidden="true" /> <span>+91 95490 92686</span></a><a href="mailto:supermartbhiwadi@gmail.com"><BiLogoGmail className="footer-icon" aria-hidden="true" /> <span>supermartbhiwadi@gmail.com</span></a><p><FaClock className="footer-icon" aria-hidden="true" /> <span>Mon–Sat, 10:00 AM–7:00 PM</span></p></div></div>
      </div>

      <div className="border-t border-slate-800"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p>© 2026 Super Mart. All rights reserved.</p><p>Secure shopping · Fast delivery · Local support</p></div></div>
    </footer>
  );
}

export default Footer;