import { useState } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { useAuth, ROLE_INFO } from "../contexts/AuthContext";
import { uploadToCloudinary } from "../lib/helpers";
import { redeemPrivilegeCode } from "../lib/privilegeCodes";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";
import ProfileQR from "../components/ProfileQR";
import { useTranslation } from "../lib/useTranslation";
import { LANGUAGES } from "../lib/translations";

const NATIONALITIES = ["Zimbabwean","Nigerian","Cameroonian","Congolese (DRC)","Congolese (ROC)","Ivorian","Senegalese","Malian","Burkinabe","Guinean","Ghanaian","Kenyan","Ethiopian","South African","Mozambican","Zambian","Tanzanian","Ugandan","Rwandan","Togolese","Beninese","Nigerien","Chadian","Sudanese","Libyan","Moroccan","Tunisian","Mauritanian","Algerian","Namibian","Botswanan","Angolan","Sierra Leonean","Liberian","Gambian","Malawian","Egyptian","Somali","Eritrean","Gabonese","Other"];
const UNIVERSITIES = ["USTO-MB (Oran)","Université d'Oran 1","Université d'Oran 2","ENPO (Oran)","Université de Mostaganem","Université d'Alger 1","Université d'Alger 2","Université d'Alger 3","USTHB (Alger)","Université de Constantine 1","Université de Constantine 2","Université de Constantine 3","Université de Annaba","Université de Sétif","Université de Tlemcen","Université de Béjaïa","Université de Tizi Ouzou","Université de Blida","Université de Batna","Other"];
const CITIES = ["Oran","Alger","Constantine","Annaba","Sétif","Tlemcen","Béjaïa","Tizi Ouzou","Blida","Batna","Mostaganem","Sidi Bel Abbès","Other"];
const GENDERS = [
  { value: "male", icon: "👨", label: "Male" },
  { value: "female", icon: "👩", label: "Female" },
  { value: "other", icon: "🧑", label: "Other" },
  { value: "prefer_not", icon: "🔒", label: "Private" },
];
const PRESENCE_OPTIONS = [
  { value: "online", icon: "🟢", label: "Online", desc: "Visible as active to everyone" },
  { value: "away", icon: "🟡", label: "Away", desc: "Shows a yellow status, still reachable" },
  { value: "busy", icon: "🔴", label: "Busy", desc: "Shows red, please don't disturb" },
  { value: "invisible", icon: "⚪", label: "Invisible", desc: "Appears offline to others" },
];

export default function Profile() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const { lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [pcInput, setPcInput] = useState("");
  const [pcRedeeming, setPcRedeeming] = useState(false);
  const [pcErr, setPcErr] = useState("");
  const [pcOk, setPcOk] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    fullName: userProfile?.fullName || "",
    nationality: userProfile?.nationality || "",
    university: userProfile?.university || "",
    city: userProfile?.city || "",
    gender: userProfile?.gender || "",
    phone: userProfile?.phone || "",
    bio: userProfile?.bio || "",
  });
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [delPw, setDelPw] = useState("");
  const [showDel, setShowDel] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const updatePresence = async (value) => {
    await setDoc(doc(db, "users", currentUser.uid), { presence: value }, { merge: true });
    await refreshProfile();
    setSettingsMsg("Status updated to " + value);
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const toggleReadReceipts = async () => {
    const currentlyEnabled = userProfile?.readReceiptsEnabled !== false; // undefined = enabled by default
    await setDoc(doc(db, "users", currentUser.uid), { readReceiptsEnabled: !currentlyEnabled }, { merge: true });
    await refreshProfile();
  };

  // Redeeming a privilege code — this is the only way anyone's role ever changes upward
  // besides an admin directly editing it in the Admin panel. Nobody can grant themselves
  // a role; they can only enter a code someone above them already issued.
  const redeemCode = async (e) => {
    e.preventDefault();
    setPcErr(""); setPcOk("");
    if (!pcInput.trim()) return;
    setPcRedeeming(true);
    try {
      const result = await redeemPrivilegeCode({ code: pcInput.trim(), userId: currentUser.uid, userEmail: currentUser.email });
      const updates = { role: result.role };
      if (result.scopeCity) updates.city = result.scopeCity; // governor codes can also (re)assign the city they're scoped to
      await setDoc(doc(db, "users", currentUser.uid), updates, { merge: true });
      await refreshProfile();
      setPcOk("Success! You are now " + (ROLE_INFO[result.role]?.label || result.role) + ". Granted by " + result.issuerName + ".");
      setPcInput("");
    } catch (err) {
      setPcErr(err.message || "Could not redeem code.");
    }
    setPcRedeeming(false);
  };

  const startEdit = () => {
    setForm({
      fullName: userProfile?.fullName || "", nationality: userProfile?.nationality || "",
      university: userProfile?.university || "", city: userProfile?.city || "",
      gender: userProfile?.gender || "", phone: userProfile?.phone || "", bio: userProfile?.bio || "",
    });
    setEditing(true); setOk(""); setErr("");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setErr("Full name is required."); return; }
    setSaving(true); setErr(""); setOk("");
    try {
      let photoURL = userProfile?.photoURL || "";
      if (photo) photoURL = await uploadToCloudinary(photo, "image");
      await setDoc(doc(db, "users", currentUser.uid), {
        fullName: form.fullName.trim(),
        nationality: form.nationality,
        university: form.university,
        city: form.city,
        gender: form.gender,
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        photoURL,
      }, { merge: true });
      await refreshProfile();
      setOk("Profile updated successfully.");
      setEditing(false); setPhoto(null); setPreview("");
    } catch (e2) { setErr("Could not save. Check your connection and try again."); }
    setSaving(false);
  };

  const changePw = async (e) => {
    e.preventDefault(); setErr(""); setOk("");
    if (newPw !== confPw) return setErr("New passwords do not match.");
    if (newPw.length < 6) return setErr("Password must be at least 6 characters.");
    try {
      await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, curPw));
      await updatePassword(currentUser, newPw);
      setOk("Password changed successfully.");
      setCurPw(""); setNewPw(""); setConfPw("");
    } catch (e2) {
      setErr(e2.code === "auth/wrong-password" || e2.code === "auth/invalid-credential"
        ? "Current password is incorrect." : "Could not change password.");
    }
  };

  const resetEmail = async () => {
    try { await sendPasswordResetEmail(auth, currentUser.email); setOk("Reset email sent to " + currentUser.email); }
    catch { setErr("Could not send reset email."); }
  };

  const removeAccount = async () => {
    setErr("");
    try {
      await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, delPw));
      await deleteDoc(doc(db, "users", currentUser.uid));
      await deleteUser(currentUser);
      navigate("/login");
    } catch (e2) {
      setErr(e2.code === "auth/wrong-password" || e2.code === "auth/invalid-credential"
        ? "Password is incorrect." : "Could not delete account.");
    }
  };

  const logout = async () => { await signOut(auth); navigate("/login"); };

  const tabBtn = (t) => ({
    padding: "8px 16px", borderRadius: 10, border: "1px solid " + (tab === t ? "var(--primary)" : "var(--border)"),
    background: tab === t ? "rgba(59,130,246,.14)" : "transparent",
    color: tab === t ? "var(--primary-light)" : "var(--text2)",
    fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  });

  const roleInfo = ROLE_INFO[userProfile?.role] || ROLE_INFO.student;

  return (
    <div className="main-body">
      {ok && <div className="success-msg">✅ {ok}</div>}
      {err && <div className="error-msg">⚠️ {err}</div>}

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Avatar src={preview || userProfile?.photoURL} name={userProfile?.fullName} size={80} ring />
            {editing && (
              <label htmlFor="pf-photo" style={{ position: "absolute", bottom: 0, right: 0, background: "var(--primary)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, border: "2px solid var(--bg-card)" }}>
                📷
                <input id="pf-photo" type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) { setPhoto(f); setPreview(URL.createObjectURL(f)); } }} />
              </label>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 5, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {userProfile?.fullName || "Your Name"}
              {userProfile?.verified && <span className="verified-badge">✓ Verified</span>}
            </h2>
            <div style={{ marginBottom: 6 }}><RoleBadge role={userProfile?.role} /></div>
            <div style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.7 }}>
              🌍 {userProfile?.nationality || "—"} · 🏙️ {userProfile?.city || "—"}<br />
              🏫 {userProfile?.university || "—"}
            </div>
          </div>
          {!editing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={startEdit} style={{ padding: "9px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ✏️ Edit Profile
              </button>
              <ProfileQR uid={currentUser.uid} name={userProfile?.fullName} />
            </div>
          )}
        </div>
        {!editing && userProfile?.bio && (
          <div style={{ marginTop: 14, padding: "11px 14px", background: "var(--bg-input)", borderRadius: 10, fontSize: 13, color: "var(--text2)", lineHeight: 1.7, borderLeft: "3px solid var(--primary)" }}>
            {userProfile.bio}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        <button style={tabBtn("profile")} onClick={() => setTab("profile")}>👤 Profile</button>
        <button style={tabBtn("settings")} onClick={() => setTab("settings")}>⚙️ Settings</button>
        <button style={tabBtn("privileges")} onClick={() => setTab("privileges")}>🔑 Privileges</button>
        <button style={tabBtn("security")} onClick={() => setTab("security")}>🔒 Security</button>
        <button style={tabBtn("account")} onClick={() => setTab("account")}>🗑️ Account</button>
      </div>

      {tab === "profile" && editing && (
        <div className="card">
          <div className="card-title">✏️ Edit Your Profile</div>
          <form onSubmit={save}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone / WhatsApp</label>
                <input className="form-input" placeholder="+213 xxx xxx xxx" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <select className="form-input" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}>
                  <option value="">Select...</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                  <option value="">Select...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">University</label>
              <select className="form-input" value={form.university} onChange={e => setForm({ ...form, university: e.target.value })}>
                <option value="">Select...</option>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <div className="gender-select">
                {GENDERS.map(g => (
                  <div key={g.value} className={"gender-option" + (form.gender === g.value ? " selected" : "")} onClick={() => setForm({ ...form, gender: g.value })}>
                    {g.icon}<span>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="Tell the community about yourself..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn-primary" style={{ margin: 0 }} disabled={saving}>{saving ? "Saving..." : "💾 Save Changes"}</button>
              <button type="button" className="btn-secondary" style={{ margin: 0 }} onClick={() => { setEditing(false); setPhoto(null); setPreview(""); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {tab === "profile" && !editing && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-number">{userProfile?.followers?.length || 0}</div><div className="stat-label">Followers</div></div>
          <div className="stat-card"><div className="stat-number">{userProfile?.following?.length || 0}</div><div className="stat-label">Following</div></div>
          <div className="stat-card"><div className="stat-number">{userProfile?.verified ? "✓" : "⏳"}</div><div className="stat-label">{userProfile?.verified ? "Verified" : "Pending"}</div></div>
          <div className="stat-card"><div className="stat-number" style={{ fontSize: 24 }}>{roleInfo.icon}</div><div className="stat-label">{roleInfo.label}</div></div>
        </div>
      )}

      {tab === "settings" && (
        <>
          <div className="card">
            <div className="card-title">🌐 Language</div>
            <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
              Translates the app's core navigation and buttons. Posts, messages, and other user-written
              content stay in the language they were written in — this only changes DiasporaLink's own interface.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                    border: "2px solid " + (lang === code ? "var(--primary)" : "var(--border)"),
                    background: lang === code ? "rgba(59,130,246,.1)" : "transparent",
                    color: lang === code ? "var(--primary-light)" : "var(--text2)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">🎭 Presence Status</div>
            <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 14 }}>Choose how you appear to other members right now.</p>
            {PRESENCE_OPTIONS.map(p => (
              <div
                key={p.value}
                className={"role-option" + ((userProfile?.presence || "online") === p.value ? " selected" : "")}
                onClick={() => updatePresence(p.value)}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <div>
                  <div className="role-option-title">{p.label}</div>
                  <div className="role-option-desc">{p.desc}</div>
                </div>
              </div>
            ))}
            {settingsMsg && <div className="success-msg" style={{ marginTop: 10, marginBottom: 0 }}>✅ {settingsMsg}</div>}
          </div>

          <div className="card">
            <div className="card-title">👁️ Privacy</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Read Receipts</div>
                <div style={{ fontSize: 11.5, color: "var(--text2)", marginTop: 2, maxWidth: 260 }}>
                  When on, people see ✓✓ once you've read their message. When off, you won't see theirs either.
                </div>
              </div>
              <button
                onClick={toggleReadReceipts}
                style={{
                  width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0,
                  background: userProfile?.readReceiptsEnabled !== false ? "var(--primary)" : "var(--border2)",
                  position: "relative", transition: "background .2s"
                }}
              >
                <span style={{
                  position: "absolute", top: 3, left: userProfile?.readReceiptsEnabled !== false ? 23 : 3,
                  width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s"
                }} />
              </button>
            </div>
          </div>
        </>
      )}

      {tab === "privileges" && (
        <div className="card">
          <div className="card-title">🔑 Your Role</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <RoleBadge role={userProfile?.role} />
            <span style={{ fontSize: 13, color: "var(--text2)" }}>
              {userProfile?.city ? "Scoped to " + userProfile.city : "No city scope"}
            </span>
          </div>

          <div className="card-title" style={{ marginTop: 4 }}>Enter a Privilege Code</div>
          <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
            If someone above you in the community structure (a governor, president, embassy delegate, or admin)
            has given you a code, enter it here to be granted that role. Codes expire after 24 hours and only work once.
          </p>
          {pcErr && <div className="error-msg">⚠️ {pcErr}</div>}
          {pcOk && <div className="success-msg">✅ {pcOk}</div>}
          <form onSubmit={redeemCode} style={{ display: "flex", gap: 10 }}>
            <input
              className="form-input"
              placeholder="e.g. 7K9M2P"
              value={pcInput}
              onChange={e => setPcInput(e.target.value.toUpperCase())}
              style={{ letterSpacing: 2, fontWeight: 700, margin: 0 }}
              maxLength={6}
            />
            <button type="submit" className="btn-primary" style={{ margin: 0, width: "auto", padding: "11px 22px" }} disabled={pcRedeeming || !pcInput.trim()}>
              {pcRedeeming ? "Checking..." : "Redeem"}
            </button>
          </form>
        </div>
      )}

      {tab === "security" && (
        <div className="card">
          <div className="card-title">🔒 Change Password</div>
          <form onSubmit={changePw}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={curPw} onChange={e => setCurPw(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={confPw} onChange={e => setConfPw(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginBottom: 10 }}>🔒 Update Password</button>
          </form>
          <button className="btn-secondary" onClick={resetEmail}>📧 Send Password Reset Email</button>
        </div>
      )}

      {tab === "account" && (
        <>
          <div className="card">
            <div className="card-title">⚙️ Account Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: 13 }}>
              <span style={{ color: "var(--text2)" }}>Email</span><span>{currentUser?.email}</span>
              <span style={{ color: "var(--text2)" }}>Email verified</span>
              <span>{currentUser?.emailVerified ? <span style={{ color: "var(--success)" }}>✓ Yes</span> : <span style={{ color: "var(--warning)" }}>⏳ Not yet</span>}</span>
              <span style={{ color: "var(--text2)" }}>Role</span><span>{roleInfo.label}</span>
            </div>
            <button className="btn-secondary" style={{ marginTop: 16 }} onClick={logout}>🚪 Sign Out</button>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: "var(--danger)" }}>⚠️ Delete Account</div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>
              This permanently deletes your account and all your data. This cannot be undone.
            </p>
            {!showDel ? (
              <button onClick={() => setShowDel(true)} style={{ padding: "10px 20px", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", color: "#fca5a5", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                🗑️ Delete My Account
              </button>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Enter your password to confirm</label>
                  <input type="password" className="form-input" value={delPw} onChange={e => setDelPw(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={removeAccount} style={{ flex: 1, padding: 11, background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Yes, Delete Forever</button>
                  <button className="btn-secondary" style={{ flex: 1, margin: 0 }} onClick={() => setShowDel(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
