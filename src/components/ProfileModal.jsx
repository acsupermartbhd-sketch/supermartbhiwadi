import { useEffect, useState } from "react";
import { FiX, FiCheck, FiMapPin, FiUser, FiPhone, FiHome } from "react-icons/fi";
import { api } from "../data/api";

// Supports both APIs:
// Old: { isOpen, customerSession, onProfileUpdate, onClose }
// New: { customer, onSave, onClose }
export default function ProfileModal({ isOpen, onClose, customer, customerSession, onProfileUpdate, onSave }) {
  // Resolve which API style is being used
  const session = customer || customerSession;
  // When using new API (no isOpen), always render (caller controls mounting)
  const isVisible = isOpen !== undefined ? isOpen : true;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "Bhiwadi",
    state: "Rajasthan",
    pincode: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen === false) {
      setError("");
      setSuccess(false);
      return;
    }

    let localSaved = null;
    try {
      const raw = localStorage.getItem("supermart_saved_delivery_address");
      if (raw) localSaved = JSON.parse(raw);
    } catch {}

    setFormData({
      name: session?.name || localSaved?.name || "",
      phone: session?.phone || localSaved?.phone || "",
      address: session?.address || localSaved?.address || "",
      city: session?.city || localSaved?.city || "Bhiwadi",
      state: session?.state || localSaved?.state || "Rajasthan",
      pincode: session?.pincode || localSaved?.pincode || "",
    });
  }, [isOpen, session?.id]);

  if (!isVisible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const cleanPhone = String(formData.phone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const cleanPincode = String(formData.pincode || "").replace(/\D/g, "");
    if (cleanPincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: cleanPhone,
        address: formData.address.trim(),
        city: formData.city.trim() || "Bhiwadi",
        state: formData.state.trim() || "Rajasthan",
        pincode: cleanPincode,
      };

      // Always save to localStorage so address is remembered locally
      localStorage.setItem("supermart_saved_delivery_address", JSON.stringify(payload));

      // If customer has an active auth token, sync to server
      if (session?.token) {
        const updated = await api.updateCustomerProfile(payload, session.token);
        onProfileUpdate?.(updated);
        onSave?.(updated);
      } else {
        onProfileUpdate?.(payload);
        onSave?.(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiMapPin className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight">Edit Profile & Address</h2>
              <p className="text-xs text-slate-500">Update your default delivery address and contact info</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <FiX className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700">
            <FiCheck className="size-4 shrink-0" />
            <span>Profile and address saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
              Mobile Number (10 digits) *
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                placeholder="10 digit mobile number"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
              Complete Delivery Address *
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House no., Building / Society name, Street, Landmark"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                Pincode *
              </label>
              <input
                type="text"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                placeholder="301019"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
