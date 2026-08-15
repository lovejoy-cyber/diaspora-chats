import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { uploadToCloudinary, isValidPhone } from "../lib/helpers";

// Note: there is deliberately no "I am a..." role picker here anymore. Everyone starts
// as a plain user (role: "student" is the base access level internally, not a label
// shown prominently) — self-selecting a role contradicted the actual permission model,
// where only the Commander can ever grant a role via a privilege code. Asking someone
// to pick "Student / Transfer Agent / Ambassador" right after Register's own occupation
// question was confusing and duplicated — this removes that entirely.

export default function ProfileSetup() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [prev, setPrev] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedGuidelines, setAgreedGuidelines] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const pick = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr("Photo must be smaller than 5MB."); return; }
    setErr(""); setPhoto(f); setPrev(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!photo) return setErr("Please add a profile photo — it is required for community verification.");
    if (phone.trim() && !isValidPhone(phone)) return setErr("Please enter your phone number with a country code, e.g. +213 555 123 456.");
    if (!agreedGuidelines) return setErr("Please read and accept the Community Guidelines to continue.");
    setLoading(true);
    try {
      setStatus("uploading");
      const photoURL = await uploadToCloudinary(photo, "image");
      setStatus("saving");
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        photoURL, role: "student",
        phone: phone.trim(), bio: bio.trim(),
        profileComplete: true,
        fullName: userProfile?.fullName || "",
        nationality: userProfile?.nationality || "",
        university: userProfile?.university || "",
        city: userProfile?.city || "",
        gender: userProfile?.gender || "",
        email: currentUser.email || "",
        verified: userProfile?.verified || false,
        suspended: false,
        rating: 0, ratingCount: 0,
        following: userProfile?.following || [],
        followers: userProfile?.followers || [],
        blockedUsers: userProfile?.blockedUsers || [],
        online: true,
        guidelinesAcceptedAt: new Date().toISOString(),
      }, { merge: true });
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (e2) {
      console.error(e2);
      setErr("Upload failed. Check your internet connection and try again.");
    }
    setLoading(false); setStatus("");
  };

  const btn = status === "uploading" ? "Uploading photo…" : status === "saving" ? "Saving profile…" : "Finish & Enter App 🚀";

  return (
    <div className="setup-page">
      <div className="aurora-bg">
        <div className="aurora-blob b1" /><div className="aurora-blob b2" /><div className="aurora-blob b3" />
      </div>
      <div className="setup-card" style={{ position: "relative", zIndex: 1 }}>
        <div className="setup-step-label">Final Step — Profile Setup</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 5 }}>Complete your profile</h2>
        <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 24 }}>
          Visible to embassy administrators and verified community members.
        </p>

        {err && <div className="error-msg">⚠️ {err}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Profile Photo *</label>
            <label htmlFor="ps-photo" style={{ cursor: "pointer", display: "block" }}>
              <div className="photo-upload-area">
                {prev ? <img src={prev} alt="" className="photo-preview" /> : <div className="photo-placeholder">📷</div>}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{prev ? "Tap to change photo" : "Tap to upload your photo"}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>Required for verification · JPG or PNG · Max 5MB</div>
                </div>
              </div>
            </label>
            <input id="ps-photo" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={pick} />
          </div>

          <div className="form-group">
            <label className="form-label">Phone / WhatsApp</label>
            <input type="tel" className="form-input" placeholder="+213 xxx xxx xxx" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Short Bio</label>
            <textarea className="form-input" rows={3} placeholder="Tell the community a little about yourself…" value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 12.5, color: "var(--text2)", lineHeight: 1.6 }}>
              <input type="checkbox" checked={agreedGuidelines} onChange={e => setAgreedGuidelines(e.target.checked)} style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }} />
              <span>
                I have read and agree to the{" "}
                <button type="button" onClick={(e) => { e.preventDefault(); setShowGuidelines(true); }} style={{ background: "none", border: "none", color: "var(--primary-light)", textDecoration: "underline", cursor: "pointer", fontSize: "inherit", padding: 0, fontFamily: "inherit" }}>
                  Community Guidelines
                </button>.
              </span>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>{btn}</button>
        </form>

        {showGuidelines && (
          <div className="modal-overlay" onClick={() => setShowGuidelines(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <h3>📜 Community Guidelines</h3>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8, maxHeight: "50vh", overflowY: "auto", marginBottom: 16 }}>
                <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text)" }}>1. Respect everyone.</strong> No harassment, hate speech, or threats — this is a diverse, global community.</p>
                <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text)" }}>2. Be honest.</strong> Fake profiles, impersonation, and scam attempts (especially around money transfers) will get your account suspended.</p>
                <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text)" }}>3. Money transfers carry risk.</strong> The embassy verification badge helps you judge trust, but always exercise your own caution before sending or receiving funds.</p>
                <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text)" }}>4. Report, don't retaliate.</strong> Use the Report button on anyone who breaks these rules — admins review every report.</p>
                <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text)" }}>5. Your data.</strong> Your profile is visible to embassy administrators for verification purposes. Explicit content and profanity are automatically filtered where possible.</p>
                <p><strong style={{ color: "var(--text)" }}>6. Embassy and admin staff</strong> can verify, suspend, or remove accounts and content that violate these guidelines.</p>
              </div>
              <button className="btn-primary" onClick={() => { setAgreedGuidelines(true); setShowGuidelines(false); }} style={{ margin: 0 }}>I Understand & Agree</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button className="btn-ghost" onClick={() => signOut(auth)}>Sign out instead</button>
        </div>
      </div>
    </div>
  );
}
