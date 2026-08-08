import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const STYLE = `
.vp-page{max-width:560px;margin:0 auto;padding:20px 14px;overflow-y:auto;height:calc(100vh - 57px);}
.vp-cover{height:100px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:var(--radius2) var(--radius2) 0 0;position:relative;}
.vp-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius2);overflow:hidden;margin-bottom:16px;}
.vp-header{padding:0 20px 20px;position:relative;}
.vp-avatar{width:88px;height:88px;border-radius:50%;object-fit:cover;border:4px solid var(--bg-card);margin-top:-44px;background:var(--bg-card);}
.vp-avatar-ph{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:white;margin-top:-44px;border:4px solid var(--bg-card);}
.vp-name{font-size:20px;font-weight:800;margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.vp-meta{font-size:13px;color:var(--text2);margin-top:4px;line-height:1.8;}
.vp-bio{font-size:13px;color:var(--text);margin-top:10px;line-height:1.7;font-style:italic;}
.vp-actions{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;}
.vp-btn{padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border:none;transition:all 0.15s;}
.vp-btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;}
.vp-btn-outline{background:transparent;border:1px solid var(--border);color:var(--text2);}
.vp-btn-outline:hover{border-color:var(--primary);color:var(--primary-light);}
.vp-btn-danger{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;}
.vp-stats{display:flex;gap:20px;padding:14px 20px;border-top:1px solid var(--border);}
.vp-stat{text-align:center;}
.vp-stat-num{font-size:18px;font-weight:800;}
.vp-stat-label{font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;}
.vp-menu{position:relative;}
.vp-menu-btn{position:absolute;top:12px;right:0;background:rgba(0,0,0,0.3);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;}
.vp-dropdown{position:absolute;top:50px;right:0;background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:10;min-width:160px;overflow:hidden;}
.vp-dropdown-item{padding:10px 14px;font-size:13px;cursor:pointer;transition:background 0.15s;display:flex;align-items:center;gap:8px;}
.vp-dropdown-item:hover{background:rgba(255,255,255,0.05);}
.vp-dropdown-item.danger{color:#fca5a5;}
.report-form textarea{width:100%;margin-top:8px;}
.blocked-notice{text-align:center;padding:60px 20px;color:var(--text2);}
`;

const REPORT_REASONS = ["Harassment or bullying","Fake profile / impersonation","Scam or fraud attempt","Inappropriate content","Spam","Other"];

export default function ViewProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if(!document.getElementById("vp-css")) {
      const s = document.createElement("style");
      s.id = "vp-css"; s.textContent = STYLE;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const snap = await getDoc(doc(db,"users",uid));
      if(snap.exists()) setProfile(snap.data());
      setLoading(false);
    };
    load();
  }, [uid]);

  const isOwnProfile = uid === currentUser.uid;
  const isFollowing = userProfile?.following?.includes(uid);
  const isBlocked = userProfile?.blockedUsers?.includes(uid);
  const isBlockedByThem = profile?.blockedUsers?.includes(currentUser.uid);

  const toggleFollow = async () => {
    if(isFollowing) {
      await updateDoc(doc(db,"users",currentUser.uid), {following:arrayRemove(uid)});
      await updateDoc(doc(db,"users",uid), {followers:arrayRemove(currentUser.uid)});
    } else {
      await updateDoc(doc(db,"users",currentUser.uid), {following:arrayUnion(uid)});
      await updateDoc(doc(db,"users",uid), {followers:arrayUnion(currentUser.uid)});
    }
    await refreshProfile();
  };

  const toggleBlock = async () => {
    if(isBlocked) {
      await updateDoc(doc(db,"users",currentUser.uid), {blockedUsers:arrayRemove(uid)});
    } else {
      if(window.confirm("Block "+profile.fullName+"? They won't be able to message you or see your profile.")) {
        await updateDoc(doc(db,"users",currentUser.uid), {blockedUsers:arrayUnion(uid)});
      }
    }
    await refreshProfile();
    setShowMenu(false);
  };

  const submitReport = async () => {
    if(!reportReason) return;
    setSubmitting(true);
    await addDoc(collection(db,"reports"), {
      reportedUserId: uid,
      reportedUserName: profile.fullName,
      reporterId: currentUser.uid,
      reporterName: userProfile.fullName,
      reason: reportReason,
      details: reportDetails.trim(),
      status: "open",
      createdAt: serverTimestamp(),
    });
    setSubmitting(false);
    setShowReport(false);
    setReportReason("");
    setReportDetails("");
    alert("Report submitted. Our admin team will review it.");
  };

  const messageUser = () => {
    navigate("/dashboard/messages?start="+uid);
  };

  if(loading) return <div className="loading-screen"><div className="spinner" /><span>Loading profile...</span></div>;
  if(!profile) return <div className="vp-page"><div className="blocked-notice">Profile not found.</div></div>;

  if(isBlockedByThem && !isOwnProfile) {
    return (
      <div className="vp-page">
        <div className="blocked-notice">
          <div style={{fontSize:44,marginBottom:12}}>🚫</div>
          <div style={{fontWeight:700,fontSize:16}}>Profile unavailable</div>
        </div>
      </div>
    );
  }

  const getRoleBadge = () => {
    if(profile.role==="admin") return <span className="role-badge-admin">Admin</span>;
    if(profile.role==="embassy") return <span className="role-badge-embassy">Embassy Delegate</span>;
    if(profile.role==="governor") return <span className="role-badge-governor">Governor</span>;
    if(profile.role==="president") return <span className="role-badge-embassy">President</span>;
    if(profile.role==="sender") return <span style={{background:"rgba(16,185,129,0.15)",color:"#34d399",fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:8}}>Sender</span>;
    return null;
  };

  return (
    <div className="vp-page">
      <div className="vp-card">
        <div className="vp-cover">
          {!isOwnProfile && (
            <div className="vp-menu">
              <button className="vp-menu-btn" onClick={()=>setShowMenu(!showMenu)}>⋯</button>
              {showMenu && (
                <div className="vp-dropdown">
                  <div className="vp-dropdown-item" onClick={()=>{setShowReport(true);setShowMenu(false);}}>🚩 Report User</div>
                  <div className="vp-dropdown-item danger" onClick={toggleBlock}>{isBlocked?"✅ Unblock User":"🚫 Block User"}</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="vp-header">
          {profile.photoURL
            ? <img src={profile.photoURL} alt={profile.fullName} className="vp-avatar" />
            : <div className="vp-avatar-ph">{profile.fullName?.[0]}</div>}
          <div className="vp-name">
            {profile.fullName}
            {profile.verified && <span className="verified-badge">✓ Verified</span>}
            {getRoleBadge()}
          </div>
          <div className="vp-meta">
            🌍 {profile.nationality} · 🏫 {profile.university}<br />
            📍 {profile.city||"—"} {profile.gender && "· " + (profile.gender==="male"?"👨":profile.gender==="female"?"👩":"🧑")}
          </div>
          {profile.bio && <div className="vp-bio">"{profile.bio}"</div>}

          {!isOwnProfile && !isBlocked && (
            <div className="vp-actions">
              <button className="vp-btn vp-btn-primary" onClick={messageUser}>💬 Message</button>
              <button className="vp-btn vp-btn-outline" onClick={toggleFollow}>{isFollowing?"✓ Following":"+ Follow"}</button>
              <button className="vp-btn vp-btn-outline" onClick={()=>navigate("/dashboard/calls?call="+uid)}>📞 Call</button>
            </div>
          )}
          {isOwnProfile && (
            <div className="vp-actions">
              <button className="vp-btn vp-btn-primary" onClick={()=>navigate("/dashboard/profile")}>✏️ Edit Profile</button>
            </div>
          )}
          {isBlocked && (
            <div className="vp-actions">
              <button className="vp-btn vp-btn-outline" onClick={toggleBlock}>✅ Unblock</button>
            </div>
          )}
        </div>
        <div className="vp-stats">
          <div className="vp-stat"><div className="vp-stat-num">{profile.followers?.length||0}</div><div className="vp-stat-label">Followers</div></div>
          <div className="vp-stat"><div className="vp-stat-num">{profile.following?.length||0}</div><div className="vp-stat-label">Following</div></div>
          <div className="vp-stat"><div className="vp-stat-num">{profile.ratingCount||0}</div><div className="vp-stat-label">Reviews</div></div>
          <div className="vp-stat"><div className="vp-stat-num">{profile.verified?"✓":"⏳"}</div><div className="vp-stat-label">{profile.verified?"Verified":"Pending"}</div></div>
        </div>
      </div>

      {showReport && (
        <div className="modal-overlay" onClick={()=>setShowReport(false)}>
          <div className="modal-card report-form" onClick={e=>e.stopPropagation()}>
            <h3>🚩 Report {profile.fullName}</h3>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select className="form-input" value={reportReason} onChange={e=>setReportReason(e.target.value)}>
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Additional details (optional)</label>
              <textarea className="form-input" rows={3} placeholder="Describe what happened..." value={reportDetails} onChange={e=>setReportDetails(e.target.value)} />
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-primary" onClick={submitReport} disabled={!reportReason||submitting} style={{margin:0}}>{submitting?"Submitting...":"Submit Report"}</button>
              <button className="btn-secondary" onClick={()=>setShowReport(false)} style={{margin:0}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
