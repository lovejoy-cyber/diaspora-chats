import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import ReactiveAvatar from "../components/ReactiveAvatar";
import { useSpotlight } from "../lib/useSpotlight";

const MAX = 6;
const LOCK = 5 * 60 * 1000;

export default function Login() {
  const spot = useSpotlight();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [tries, setTries] = useState(0);
  const [focusedField, setFocusedField] = useState("none");
  const [lockUntil, setLockUntil] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!lockUntil) return;
    const i = setInterval(() => {
      const left = Math.ceil((lockUntil - Date.now()) / 1000);
      if (left <= 0) { setLockUntil(null); setTries(0); setCount(0); clearInterval(i); }
      else setCount(left);
    }, 500);
    return () => clearInterval(i);
  }, [lockUntil]);

  const locked = lockUntil && Date.now() < lockUntil;

  const submit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setErr(""); setOk(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      setTries(0);
    } catch (e2) {
      const n = tries + 1; setTries(n);
      if (n >= MAX) { setLockUntil(Date.now() + LOCK); setErr("Too many failed attempts. Locked for 5 minutes."); }
      else {
        const c = e2.code;
        if (c === "auth/user-not-found" || c === "auth/wrong-password" || c === "auth/invalid-credential")
          setErr("Wrong email or password. " + (MAX - n) + " attempts left.");
        else if (c === "auth/network-request-failed") setErr("No internet connection.");
        else if (c === "auth/too-many-requests") setErr("Too many requests. Please wait a moment.");
        else setErr("Could not sign in. Please try again.");
      }
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) return setErr("Enter your email address first, then tap this again.");
    try { await sendPasswordResetEmail(auth, email.trim()); setErr(""); setOk("Password reset link sent to " + email.trim()); }
    catch { setErr("Could not send reset email. Check the address."); }
  };

  return (
    <div className="auth-page">
      <div className="aurora-bg">
        <div className="aurora-blob b1" /><div className="aurora-blob b2" /><div className="aurora-blob b3" />
      </div>
      <div ref={spot.ref} className="auth-card spotlight spotlight-border" style={{ position: "relative", zIndex: 1 }} onMouseMove={spot.onMouseMove} onTouchMove={spot.onTouchMove} onTouchStart={spot.onTouchStart}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🌍</span>
          <h1>DiasporaLink</h1>
          <p>Global Community Platform</p>
        </div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account</p>

        {err && <div className="error-msg">⚠️ {err}{locked ? " (" + count + "s)" : ""}</div>}
        {ok && <div className="success-msg">✅ {ok}</div>}

        <ReactiveAvatar focusedField={focusedField} />

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField("none")} required autoComplete="email" disabled={locked} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Your password" value={pw}
              onChange={e => setPw(e.target.value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField("none")} required autoComplete="current-password" disabled={locked} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || locked}>
            {locked ? "Locked (" + count + "s)" : loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button className="btn-ghost" onClick={forgot} type="button">Forgot your password?</button>
        </div>
        <div className="auth-link">New here? <Link to="/register">Create an account</Link></div>
        <div style={{ marginTop: 18, padding: "11px 14px", background: "rgba(6,182,212,.05)", border: "1px solid rgba(6,182,212,.14)", borderRadius: 12, fontSize: 12, color: "var(--text2)", textAlign: "center", lineHeight: 1.65 }}>
          🔒 Accounts are reviewed by embassy administrators. Your details stay visible only to verified members.
        </div>
      </div>
    </div>
  );
}
