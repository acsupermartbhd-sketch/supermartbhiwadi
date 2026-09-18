import { useState } from "react";
import { Link } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FaClock, FaPhone } from "react-icons/fa";
import { BiLogoGmail } from "react-icons/bi";
import { FiCode, FiExternalLink, FiCopy, FiCheck, FiX, FiDownload } from "react-icons/fi";
import { MdQrCodeScanner } from "react-icons/md";

function Footer() {
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    window.setTimeout(() => setCopiedField(""), 2000);
  };

  return (
    <footer className="border-t border-slate-800 bg-[#070f1e] text-slate-300">
      {/* Main Footer Grid */}
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Address */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-[-.07em] text-white">
            <img src="/img/logo.svg" alt="" className="size-9 sm:size-10 object-contain" />
            <span>Super <span className="text-blue-400">Mart</span></span>
          </Link>
          <p className="mt-3 max-w-xs text-xs sm:text-sm leading-6 text-slate-400">
            Reliable electronics, genuine laptops, printers, CCTV systems, cables and local repair support for Bhiwadi & NCR.
          </p>
          <div className="mt-5 inline-flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs font-medium text-slate-300">
            <FaLocationDot className="footer-icon mt-0.5 text-blue-400 shrink-0" aria-hidden="true" />
            <span>F-GF 19-20 12A, Capital High Street, Bhiwadi, Alwar, Rajasthan 301019</span>
          </div>
        </div>

        {/* Quick Links & Categories */}
        <div>
          <h3 className="footer-heading text-sm font-black uppercase tracking-wider text-white">Explore Categories</h3>
          <div className="footer-links mt-3 flex flex-col gap-2 text-xs sm:text-sm text-slate-400">
            <Link to="/products/Laptop" className="hover:text-blue-400 transition">Laptops &amp; Notebooks</Link>
            <Link to="/products/Printer" className="hover:text-blue-400 transition">Printers &amp; Ink Tanks</Link>
            <Link to="/products/Desktop" className="hover:text-blue-400 transition">Desktops &amp; Computer Parts</Link>
            <Link to="/products/Security" className="hover:text-blue-400 transition">CCTV &amp; Wi-Fi Cameras</Link>
            <Link to="/products/Cables" className="hover:text-blue-400 transition">Cables &amp; Connectors</Link>
            <Link to="/products/Accessories" className="hover:text-blue-400 transition">Keyboard, Mouse &amp; Audio</Link>
          </div>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="footer-heading text-sm font-black uppercase tracking-wider text-white">Customer Care</h3>
          <div className="footer-contact mt-3 space-y-2.5 text-xs sm:text-sm text-slate-400">
            <a href="tel:+919649374696" className="flex items-center gap-2 hover:text-blue-400 transition">
              <FaPhone className="footer-icon text-blue-400 shrink-0" aria-hidden="true" />
              <span>+91 96493 74696</span>
            </a>
            <a href="mailto:supermartbhiwadi@gmail.com" className="flex items-center gap-2 hover:text-blue-400 transition break-all">
              <BiLogoGmail className="footer-icon text-red-400 shrink-0" aria-hidden="true" />
              <span>supermartbhiwadi@gmail.com</span>
            </a>
            <div className="pt-1 text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-2">
                <FaClock className="footer-icon text-blue-400 shrink-0" aria-hidden="true" />
                <span>Mon–Sat: 10:00 AM – 7:00 PM</span>
              </p>
              <p className="pl-5 text-slate-500">Sun: 10:00 AM – 2:00 PM</p>
            </div>
          </div>
          <a
            href="https://wa.me/919649374696?text=Hello%20Super%20Mart%20Support"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-900/60 hover:scale-[1.02] shadow-lg shadow-emerald-950/40"
          >
            <img src="/img/whatsapp.png" alt="" className="size-4 shrink-0 object-contain" />
            <span>WhatsApp: <strong>96493 74696</strong></span>
          </a>
        </div>

        {/* Bank Details & QR Code Pay */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-black">
              ₹
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Official Bank Details
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            For direct RTGS/NEFT/IMPS and UPI payments.
          </p>

          <div className="mt-3 space-y-2 text-xs">
            {/* Bank Name */}
            <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/60">
              <span className="text-slate-400 text-[11px]">Bank:</span>
              <span className="font-bold text-white">HDFC Bank</span>
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/60">
              <span className="text-slate-400 text-[11px]">A/c No:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-blue-300 text-[11px]">50200036020517</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("50200036020517", "acc")}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedField === "acc" ? <FiCheck className="size-3 text-emerald-400" /> : <FiCopy className="size-3" />}
                </button>
              </div>
            </div>

            {/* IFSC Code */}
            <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/60">
              <span className="text-slate-400 text-[11px]">IFSC Code:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-blue-300 text-[11px]">HDFC0000168</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("HDFC0000168", "ifsc")}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  title="Copy IFSC Code"
                >
                  {copiedField === "ifsc" ? <FiCheck className="size-3 text-emerald-400" /> : <FiCopy className="size-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Show QR Code Button */}
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-3 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-900/40 transition hover:scale-[1.02] hover:brightness-110 cursor-pointer"
          >
            <MdQrCodeScanner className="size-4" />
            <span>Show UPI QR Code</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar with Pro-Level Developer Credit */}
      <div className="border-t border-slate-800/80 bg-[#040a15]">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Copyright */}
            <p className="text-xs font-medium text-slate-400 text-center sm:text-left">
              © 2026 Super Mart Bhiwadi. All rights reserved.
            </p>

            {/* Trust Badges */}
            <p className="text-xs text-slate-500 hidden md:block">
              Official Warranty · 100% Genuine Products · Local Store Support
            </p>

            {/* Developer Credit — Pro Animated Component */}
            <div className="flex justify-center sm:justify-end">
              <a
                href="https://developerabhishek.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl border border-blue-500/40 bg-gradient-to-r from-slate-900 via-blue-950/80 to-indigo-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-950/60 transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:shadow-blue-500/25"
                aria-label="Visit Developer Abhishek portfolio"
              >
                {/* Pro Shimmer Sweep Effect */}
                <span className="pointer-events-none absolute -inset-full top-0 block -rotate-45 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-all duration-1000 group-hover:translate-x-full animate-shimmer" />

                <span className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-md shadow-blue-900/60 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <FiCode className="size-3.5 text-white" aria-hidden="true" />
                </span>
                <span className="relative leading-none text-xs font-bold text-slate-300">
                  Made by{" "}
                  <span className="bg-gradient-to-r from-blue-300 via-teal-200 to-indigo-200 bg-clip-text font-black text-transparent group-hover:from-white group-hover:to-blue-200 transition-colors">
                    Developer Abhishek
                  </span>
                </span>
                <FiExternalLink className="relative size-3.5 text-blue-400 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-modal"
          onClick={() => setShowQrModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="SuperMart UPI Payment QR Code"
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              aria-label="Close QR Code Modal"
            >
              <FiX className="size-5" />
            </button>

            {/* QR Modal Header */}
            <div className="flex items-center justify-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                ₹
              </span>
              <h2 className="text-lg font-black text-white">
                Scan &amp; Pay via UPI
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Super Mart Bhiwadi Official QR Code
            </p>

            {/* QR Code Image Container */}
            <div className="mt-5 overflow-hidden rounded-2xl border-2 border-dashed border-blue-500/40 bg-white p-3 shadow-inner">
              <img
                src="/image/qrcode.jpeg"
                alt="Super Mart Official Payment QR Code"
                className="mx-auto aspect-square w-full max-w-[260px] object-contain rounded-lg"
              />
            </div>

            {/* Accepted Apps Pills */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="rounded-md bg-slate-800 px-2 py-0.5">Google Pay</span>
              <span className="rounded-md bg-slate-800 px-2 py-0.5">PhonePe</span>
              <span className="rounded-md bg-slate-800 px-2 py-0.5">Paytm</span>
              <span className="rounded-md bg-slate-800 px-2 py-0.5">BHIM</span>
            </div>

            {/* Bank detail reminder */}
            <div className="mt-4 rounded-xl bg-slate-950/80 p-3 text-left text-xs border border-slate-800/80">
              <div className="flex justify-between items-center text-slate-400">
                <span>HDFC A/c:</span>
                <span className="font-mono font-bold text-blue-300">50200036020517</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 mt-1">
                <span>IFSC Code:</span>
                <span className="font-mono font-bold text-blue-300">HDFC0000168</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href="/image/qrcode.jpeg"
                download="supermart-qr-code.jpeg"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                <FiDownload className="size-3.5" />
                <span>Save QR</span>
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;