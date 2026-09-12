import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminLogin({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const loggedIn = await onLogin(form);
    if (!loggedIn) {
      setError("Invalid admin email or password.");
      setLoading(false);
      return;
    }
    navigate("/admin");
  };

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <div className="mb-8 text-center">
          <span className="admin-login-mark">SM</span>
          <p className="eyebrow mt-6">Private store area</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Admin sign in</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your SuperMart store securely.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="field-label">Admin email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="field" placeholder="admin@supermart.com" /></label>
          <label className="field-label">Password<input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="field" placeholder="Enter password" /></label>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="button-primary w-full py-3.5 disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in..." : "Sign in to dashboard"}</button>
        </form>
        {import.meta.env.DEV && <div className="mt-6 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-800"><b>Development demo access</b><br />admin@supermart.com · admin123</div>}
        <Link to="/" className="mt-6 block text-center text-sm font-bold text-slate-500 hover:text-blue-600">← Back to storefront</Link>
      </section>
    </main>
  );
}

export default AdminLogin;
