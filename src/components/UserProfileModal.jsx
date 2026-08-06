import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { lastSeenText, isUserOnline } from "../lib/helpers";
import Avatar from "./Avatar";
import RoleBadge from "./RoleBadge";

const REPORT_REASONS = [
  "Scam or fraud attempt",
  "Harassment or abuse",
  "Fake identity",
  "Inappropriate content",
  "Spam",
  "Other",
];

export default function UserProfileModal({ uid, onClose }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getDoc(doc(db, "users", uid)).then(s => {
      setProfile(s.exists() ? s.data() : null);
      setLoading(false);
    });
  }, [uid]);

  if (!uid) return null;

  const isMe = uid === currentUser?.uid;
  const isFollowing = userProfile?.following?.includes(uid);
  const isBlocked = userProfile?.blockedUsers?.includes(uid);

  const toggleFollow = async () => {
    await updateDoc(doc(db, "users", currentUser.uid), {
      following: isFollowing ? arrayRemove(uid) : arrayUnion(uid),
    });
    await updateDoc(doc(db, "users", uid), {
      followers: isFollowing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    }).catch(() => {});
    refreshProfile();
  };

  const toggleBlock = async () => {
    const verb = isBlocked ? "Unblock" : "Block";
    if (!window.confirm(verb + " " + (profile?.fullName || "this user") + "?")) return;
    await updateDoc(doc(db, "users", currentUser.uid), {
      blockedUsers: isBlocked ? arrayRemove(uid) : arrayUnion(uid),
    });
    refreshProfile();
    setMsg(isBlocked ? "User unblocked." : "User blocked.");
  };

  const submitReport = async () => {
    if (!reason) return;
    await addDoc(collection(db, "reports"), {
      reportedUid: uid,
      reportedName: profile?.fullName || "",
      reporterUid: currentUser.uid,
      reporterName: userProfile?.fullName || "",
      reason, details: details.trim(),
      status: "open",
      createdAt: serverTimestamp(),
    });
    setShowReport(false); setReason(""); setDetails("");
    setMsg("Report submitted. Administrators will review it.");
  };

  const openChat = () => { onClose(); navigate("/dashboard/messages?to=" + uid); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        {loading && <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>}

        {!loading && !profile && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div>
            <p style={{ color: "var(--text2)", fontSize: 14 }}>This profile is unavailable.</p>
            <button className="btn-secondary" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
          </div>
        )}

        {!loading && profile && (
          <>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Avatar src={profile.photoURL} name={profile.fullName} size={84} ring online={isUserOnline(profile)} />
              <h3 style={{ fontSize: 19, fontWeight: 800, marginTop: 12, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                {profile.fullName}
                {profile.verified && <span className="verified-badge">✓ Verified</span>}
              </h3>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                <RoleBadge role={profile.role} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{lastSeenText(profile)}</div>
            </div>

            {msg && <div className="success-msg">{msg}</div>}

            <div style={{ display: "flex", gap: 10, textAlign: "center", marginBottom: 16 }}>
              <div style={{ flex: 1, background: "var(--bg-input)", padding: "10px 6px", borderRadius: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{profile.followers?.length || 0}</div>
                <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>FOLLOWERS</div>
              </div>
              <div style={{ flex: 1, background: "var(--bg-input)", padding: "10px 6px", borderRadius: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{profile.following?.length || 0}</div>
                <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>FOLLOWING</div>
              </div>
              <div style={{ flex: 1, background: "var(--bg-input)", padding: "10px 6px", borderRadius: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{profile.ratingCount || 0}</div>
                <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>REVIEWS</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "7px 12px", fontSize: 13, marginBottom: 16 }}>
              <span style={{ color: "var(--text2)" }}>Country</span><span>{profile.nationality || "—"}</span>
              <span style={{ color: "var(--text2)" }}>City</span><span>{profile.city || "—"}</span>
              <span style={{ color: "var(--text2)" }}>University</span><span>{profile.university || "—"}</span>
            </div>

            {profile.bio && (
              <div style={{ padding: "10px 14px", background: "var(--bg-input)", borderRadius: 10, fontSize: 13, lineHeight: 1.7, color: "var(--text2)", borderLeft: "3px solid var(--primary)", marginBottom: 16 }}>
                {profile.bio}
              </div>
            )}

            {!isMe && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button className="btn-primary" style={{ margin: 0 }} onClick={openChat}>💬 Message</button>
                  <button className="btn-secondary" style={{ margin: 0 }} onClick={toggleFollow}>
                    {isFollowing ? "✓ Following" : "+ Follow"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-secondary" style={{ margin: 0, fontSize: 12 }} onClick={() => setShowReport(true)}>🚩 Report</button>
                  <button className="btn-secondary" style={{ margin: 0, fontSize: 12, color: isBlocked ? "var(--primary-light)" : "#FCA5A5" }} onClick={toggleBlock}>
                    {isBlocked ? "↩ Unblock" : "🚫 Block"}
                  </button>
                </div>
              </>
            )}

            {isMe && (
              <button className="btn-secondary" onClick={() => { onClose(); navigate("/dashboard/profile"); }}>
                ✏️ Edit My Profile
              </button>
            )}

            {showReport && (
              <div style={{ marginTop: 16, padding: 14, background: "var(--bg-input)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🚩 Report this user</div>
                <select className="form-input" value={reason} onChange={e => setReason(e.target.value)} style={{ marginBottom: 8 }}>
                  <option value="">Select a reason...</option>
                  {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <textarea className="form-input" rows={2} placeholder="Additional details (optional)" value={details} onChange={e => setDetails(e.target.value)} style={{ marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" style={{ margin: 0 }} disabled={!reason} onClick={submitReport}>Submit Report</button>
                  <button className="btn-secondary" style={{ margin: 0 }} onClick={() => setShowReport(false)}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
