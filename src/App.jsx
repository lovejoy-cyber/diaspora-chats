import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import SplashScreen from "./components/SplashScreen";
import { unlockAudio } from "./lib/sounds";

const IDLE_MS = 45 * 60 * 1000;

function IdleLogout() {
  const t = useRef(null);
  useEffect(() => {
    const reset = () => {
      clearTimeout(t.current);
      t.current = setTimeout(() => { if (auth.currentUser) signOut(auth); }, IDLE_MS);
    };
    const evts = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    evts.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(t.current); evts.forEach(e => window.removeEventListener(e, reset)); };
  }, []);
  return null;
}

function Loading() {
  return <div className="loading-screen"><div className="spinner" /><span>Loading…</span></div>;
}

function Protected({ children }) {
  const { currentUser, userProfile, loading, profileLoading } = useAuth();
  if (loading || profileLoading) return <Loading />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!userProfile) return <Navigate to="/setup" replace />;
  if (!userProfile.profileComplete) return <Navigate to="/setup" replace />;
  if (userProfile.suspended) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🚫</div>
          <h2 className="auth-title">Account Suspended</h2>
          <p className="auth-subtitle">Your account has been suspended by an administrator. Please contact the embassy delegate for assistance.</p>
          <button className="btn-secondary" onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </div>
    );
  }
  return children;
}

function PublicOnly({ children }) {
  const { currentUser, userProfile, loading, profileLoading } = useAuth();
  if (loading || profileLoading) return null;
  if (currentUser && userProfile?.profileComplete) return <Navigate to="/dashboard" replace />;
  if (currentUser && userProfile && !userProfile.profileComplete) return <Navigate to="/setup" replace />;
  return children;
}

function SetupOnly({ children }) {
  const { currentUser, userProfile, loading, profileLoading } = useAuth();
  if (loading || profileLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userProfile?.profileComplete) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <IdleLogout />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/setup" element={<SetupOnly><ProfileSetup /></SetupOnly>} />
        <Route path="/dashboard/*" element={<Protected><Dashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  // Real browser limit, not a bug: audio can't play automatically until the user has
  // interacted with the page at least once (a security policy in every major browser).
  // This listens for the very first tap/click/keypress anywhere and "unlocks" audio
  // for the rest of the session — this is what actually makes sounds work reliably,
  // not just removing "muted" from individual elements.
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <SplashScreen />
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
