import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiActivity,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";

function AdminLogin({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const loggedIn = await onLogin(form);
    if (!loggedIn) {
      setError("Invalid credentials. Access denied.");
      setLoading(false);
      return;
    }
    navigate("/admin");
  };

  return (
    <main className="min-h-screen w-full bg-[#050B14] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />

      {/* Main container */}
      <div className="relative w-full max-w-5xl rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-2xl shadow-2xl shadow-blue-950/40 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Brand Hub & Metrics (Desktop) */}
        <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-blue-950/60 via-slate-900/40 to-slate-950/80 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <img src="/img/logo.svg" alt="Super Mart" className="size-6 object-contain brightness-200" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-[.2em] text-blue-400">Command Hub</span>
                <h2 className="text-xl font-black text-white">Super Mart Bhiwadi</h2>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Enterprise Retail Control Panel
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Central management system for Super Mart Bhiwadi operations, inventory tracking, B2B wholesale partner pricing, and customer orders.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs font-semibold text-slate-300">
                <FiCheckCircle className="size-4 text-emerald-400 shrink-0" />
                <span>Real-Time Inventory & Price Synchronization</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs font-semibold text-slate-300">
                <FiActivity className="size-4 text-amber-400 shrink-0" />
                <span>Automated B2B Partner Pricing & Ban Control</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs font-semibold text-slate-300">
                <FiShield className="size-4 text-blue-400 shrink-0" />
                <span>256-Bit Encrypted Admin Authentication</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-8 mt-8 border-t border-slate-800/80 space-y-2 text-xs text-slate-500">
            <p className="flex items-center gap-1.5 font-semibold text-slate-400">
              <FiMapPin className="size-3.5 text-blue-400 shrink-0" /> F-GF 19-20 12A, Capital High Street, Bhiwadi
            </p>
            <p className="flex items-center gap-1.5 font-semibold text-slate-400">
              <FiPhone className="size-3.5 text-emerald-400 shrink-0" /> Support: +91 96493 74696
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Login Portal */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-8">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 mb-3">
                <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
                Restricted Access Portal
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Admin Sign In</h1>
              <p className="mt-2 text-sm text-slate-400">
                Enter your administrative credentials to unlock store controls.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Admin Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" aria-hidden="true" />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="admin@supermartbhiwadi.com"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" aria-hidden="true" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff className="size-5" /> : <FiEye className="size-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <FiShield className="size-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Authenticating Session…
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <FiArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to storefront link */}
            <div className="pt-2 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors"
              >
                ← Return to Super Mart Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminLogin;
