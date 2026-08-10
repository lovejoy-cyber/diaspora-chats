import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const ROLES = [
  { value: "student", label: "🎓 Student", desc: "I am a foreign student studying in Algeria" },
  { value: "sender", label: "💸 Money Sender / Receiver", desc: "I help the community send or receive money" },
  { value: "ambassador", label: "🏛️ Community Ambassador", desc: "I represent a national community" },
];

export default function ProfileSetup() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile && userProfile.profileComplete === true) {
      navigate("/dashboard", { replace: true });
    }
  }, [userProfile, navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be less than 5MB."); return; }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    const url = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";
    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!photoFile) {
      return setError("Please upload a profile photo.");
    }
    setLoading(true);
    try {
      setStatus("uploading");
      const photoURL = await uploadToCloudinary(photoFile);
      setStatus("saving");
      await setDoc(doc(db, "users", currentUser.uid), {
        photoURL,
        role,
        phone: phone.trim(),
        bio: bio.trim(),
        profileComplete: true,
        fullName: userProfile?.fullName || "",
        nationality: userProfile?.nationality || "",
        university: userProfile?.university || "",
        email: currentUser.email || "",
        verified: false,
        rating: 0,
        ratingCount: 0,
        online: true,
        uid: currentUser.uid,
      }, { merge: true });
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Upload failed. Make sure your internet is working and try again.");
    }
    setLoading(false);
    setStatus("");
  };

  const btnText = status === "uploading" ? "Uploading photo..."
    : status === "saving" ? "Saving profile..."
    : "Complete Profile & Enter App";

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-step-label">Step 2 of 2 — Profile Setup</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>
          Complete your profile
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "28px" }}>
          Visible to embassy administrators and verified members only.
        </p>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Profile Photo *</label>
            <label htmlFor="photo-input" style={{ cursor: "pointer", display: "block" }}>
              <div className="photo-upload-area">
                {photoPreview
                  ? <img src={photoPreview} alt="Preview" className="photo-preview" />
                  : <div className="photo-placeholder">📷</div>
                }
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>
                    {photoPreview ? "Tap to change photo" : "Tap to upload photo"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Required for verification · JPG or PNG · Max 5MB
                  </div>
                </div>
              </div>
            </label>
            <input
              id="photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">I am a</label>
            {ROLES.map(r => (
              <div
                key={r.value}
                className={"role-option" + (role === r.value ? " selected" : "")}
                onClick={() => setRole(r.value)}
              >
                <div className="role-option-title">{r.label}</div>
                <div className="role-option-desc">{r.desc}</div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Phone / WhatsApp</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+213 xxx xxx xxx"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Bio</label>
            <textarea
              className="form-input"
              placeholder="Tell the community about yourself..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {btnText}
          </button>
        </form>
      </div>
    </div>
  );
}
