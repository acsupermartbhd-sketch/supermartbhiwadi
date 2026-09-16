import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiEye, FiEyeOff, FiShield } from "react-icons/fi";

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
    <main className="admin-login-shell">
      <section className="admin-login-card">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-900/30">
            <FiShield className="size-8 text-white" aria-hidden="true" />
          </div>
          <p className="text-xs font-black uppercase tracking-[.15em] text-blue-500">Super Mart Bhiwadi</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Admin Sign In</h1>
          <p className="mt-1.5 text-sm text-slate-500">Authorised personnel only. All access is logged.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="field-label">
            Admin Email
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field pl-9"
                placeholder="admin@supermart.com"
                autoComplete="username"
              />
            </div>
          </label>

          <label className="field-label">
            Password
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field pl-9 pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
              </button>
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              🔒 {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full py-3.5 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying…
              </span>
            ) : (
              "Sign in to Dashboard"
            )}
          </button>
        </form>

        <Link to="/" className="mt-6 block text-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
          ← Back to storefront
        </Link>
      </section>
    </main>
  );
}

export default AdminLogin;
