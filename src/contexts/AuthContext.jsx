import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export const ROLE_LEVELS = {
  superadmin: 100, admin: 90, embassy: 80, president: 70,
  vicepresident: 65, secretary: 60, treasurer: 60, governor: 55,
  ambassador: 40, sender: 30, student: 20,
};

export const ROLE_INFO = {
  superadmin:    { label: "Super Admin",      icon: "👑", color: "#EF4444" },
  admin:         { label: "Administrator",    icon: "🛡️", color: "#EF4444" },
  embassy:       { label: "Embassy Delegate", icon: "🏛️", color: "#8B5CF6" },
  president:     { label: "President",        icon: "⭐",  color: "#3B82F6" },
  vicepresident: { label: "Vice President",   icon: "✦",  color: "#3B82F6" },
  secretary:     { label: "Secretary",        icon: "📋", color: "#06B6D4" },
  treasurer:     { label: "Treasurer",        icon: "💰", color: "#06B6D4" },
  governor:      { label: "Governor",         icon: "🏙️", color: "#06B6D4" },
  ambassador:    { label: "Ambassador",       icon: "🤝", color: "#F59E0B" },
  sender:        { label: "Transfer Agent",   icon: "💸", color: "#10B981" },
  student:       { label: "Student",          icon: "🎓", color: "#94A3B8" },
};

export function roleLevel(role) { return ROLE_LEVELS[role] || 0; }
export function isStaffRole(role) { return roleLevel(role) >= 55; }
export function isAdminRole(role) { return roleLevel(role) >= 80; }

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const heartbeatRef = useRef(null);
  const profileUnsubRef = useRef(null);

  const setOnline = async (uid, isOnline) => {
    try {
      await updateDoc(doc(db, "users", uid), { online: isOnline, lastSeen: serverTimestamp() });
    } catch (e) {}
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setProfileLoading(true);
        if (profileUnsubRef.current) profileUnsubRef.current();
        profileUnsubRef.current = onSnapshot(
          doc(db, "users", user.uid),
          (snap) => { setUserProfile(snap.exists() ? snap.data() : null); setProfileLoading(false); },
          () => { setUserProfile(null); setProfileLoading(false); }
        );
        setOnline(user.uid, true);
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = setInterval(() => setOnline(user.uid, true), 45000);
      } else {
        clearInterval(heartbeatRef.current);
        if (profileUnsubRef.current) profileUnsubRef.current();
        setCurrentUser(null);
        setUserProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    const onUnload = () => { if (auth.currentUser) setOnline(auth.currentUser.uid, false); };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      unsub();
      clearInterval(heartbeatRef.current);
      if (profileUnsubRef.current) profileUnsubRef.current();
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const refreshProfile = async () => {
    if (!currentUser) return;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (snap.exists()) setUserProfile(snap.data());
  };

  const role = userProfile?.role || "student";

  return (
    <AuthContext.Provider value={{
      currentUser, userProfile, loading, profileLoading, refreshProfile,
      role, level: roleLevel(role),
      isStaff: isStaffRole(role), isAdmin: isAdminRole(role),
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
