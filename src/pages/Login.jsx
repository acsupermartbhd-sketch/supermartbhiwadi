import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseAuth } from "../data/firebase";

function Login({ onLogin, onSignup }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestedMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(requestedMode);

  const readableAuthError = (authError) => ({
    "auth/email-already-in-use": "This email is already registered. Please log in.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/operation-not-allowed": "Email/password sign up is not enabled in Firebase Console.",
    "auth/configuration-not-found": "Firebase Authentication is not configured. Enable Email/Password in Firebase Console > Authentication > Sign-in method, then add this website domain under Settings > Authorized domains.",
    "auth/admin-restricted-operation": "Email/password sign-in is disabled. Enable Email/Password in Firebase Console > Authentication > Sign-in method.",
    "auth/invalid-api-key": "Firebase API key is invalid. Check the new project configuration in the frontend .env file.",
    "auth/app-not-authorized": "This website is not authorized for the Firebase project. Add its domain in Authentication > Settings > Authorized domains.",
    "auth/too-many-requests": "Too many login attempts. Wait a few minutes and try again.",
    "auth/user-disabled": "This account has been disabled in Firebase Authentication.",
    "auth/network-request-failed": "Network error. Check your internet connection and try again.",
    "auth/user-not-found": "No account was found for this email.",
  }[authError.code] || authError.message || "Unable to create your account.");

  const resetPassword = async () => {
    setError("");
    setResetSent(false);
    if (!form.email) {
      setError("Enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, form.email);
      setResetSent(true);
    } catch (resetError) {
      setError(readableAuthError(resetError));
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const credential = mode === "login" ? await signInWithEmailAndPassword(firebaseAuth, form.email, form.password) : await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
      if (mode === "signup") await updateProfile(credential.user, { displayName: form.name });
      const success = mode === "login" ? await onLogin({ user: credential.user }) : await onSignup({ user: credential.user, name: form.name, phone: form.phone });
      if (!success) throw new Error("Unable to authenticate with these details");
      navigate("/");
    } catch (submitError) {
      setError(readableAuthError(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex items-center justify-center">
      <div className="surface w-full max-w-md p-7 sm:p-9">
        <div className="text-center"><img src="/img/logo.svg" alt="" className="mx-auto size-12" /><p className="eyebrow mt-5">Super Mart </p><h1 className="mt-2 text-3xl font-black text-slate-950">{mode === "login" ? "Welcome back" : "Create your account"}</h1><p className="mt-2 text-sm text-slate-500">Save your details and track every order.</p></div>
        <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => { setMode("login"); setError(""); }} className={`rounded-lg py-2 text-sm font-bold ${mode === "login" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Login</button><button type="button" onClick={() => { setMode("signup"); setError(""); }} className={`rounded-lg py-2 text-sm font-bold ${mode === "signup" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Sign up</button></div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && <><label className="field-label">Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" placeholder="Your name" /></label><label className="field-label">Phone number<input required pattern="[0-9]{10}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" placeholder="10 digit mobile number" /></label></>}
          <label className="field-label">Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" placeholder="you@example.com" /></label>
          <label className="field-label">Password<input required minLength="6" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field" placeholder="At least 6 characters" /></label>
          {mode === "login" && <button type="button" onClick={resetPassword} className="text-left text-sm font-bold text-blue-700 hover:text-blue-900">Forgot password?</button>}
          {resetSent && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">Password reset email sent. Check your inbox.</p>}
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
          <button disabled={loading} className="button-primary w-full py-3.5 disabled:opacity-60">{loading ? "Please wait..." : mode === "login" ? "Login to account" : "Create account"}</button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm font-bold text-slate-500 hover:text-blue-600">← Continue shopping</Link>
      </div>
    </main>
  );
}

export default Login;