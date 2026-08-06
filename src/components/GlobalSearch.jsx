import { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const STYLE = `
.gs-wrapper{position:relative;flex:1;max-width:340px;}
.gs-input-box{display:flex;align-items:center;gap:8px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:8px 12px;transition:border-color 0.2s;}
.gs-input-box:focus-within{border-color:var(--primary);}
.gs-input{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:13px;font-family:inherit;}
.gs-dropdown{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.5);z-index:999;max-height:400px;overflow-y:auto;}
.gs-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background 0.15s;}
.gs-item:hover{background:rgba(255,255,255,0.05);}
.gs-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;}
.gs-avatar-ph{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;flex-shrink:0;}
.gs-item-info{flex:1;min-width:0;}
.gs-item-name{font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px;}
.gs-item-meta{font-size:11px;color:var(--text2);}
.gs-empty{padding:20px;text-align:center;font-size:12px;color:var(--text2);}
.gs-filters{display:flex;gap:6px;padding:8px 10px;border-bottom:1px solid var(--border);flex-wrap:wrap;}
.gs-filter-chip{padding:4px 10px;border-radius:20px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text2);}
.gs-filter-chip.active{background:var(--primary);border-color:var(--primary);color:white;}
`;

export default function GlobalSearch() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const wrapperRef = useRef(null);

  useEffect(() => {
    if(!document.getElementById("gs-css")) {
      const s = document.createElement("style");
      s.id = "gs-css"; s.textContent = STYLE;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    getDocs(collection(db,"users")).then(snap => {
      const seen = new Map();
      snap.docs.forEach(d => {
        const u = d.data();
        if (u.uid && u.uid !== currentUser.uid && u.profileComplete && !u.suspended) seen.set(u.uid, u);
      });
      setAllUsers(Array.from(seen.values()));
    });
  }, [currentUser]);

  useEffect(() => {
    const handleClick = (e) => { if(wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const blockedByMe = userProfile?.blockedUsers||[];

  const results = allUsers.filter(u => {
    if(blockedByMe.includes(u.uid)) return false;
    if(u.blockedUsers?.includes(currentUser.uid)) return false;
    if(filter==="country" && u.nationality!==userProfile?.nationality) return false;
    if(filter==="city" && u.city!==userProfile?.city) return false;
    if(filter==="verified" && !u.verified) return false;
    if(!query.trim()) return false;
    const q = query.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.nationality?.toLowerCase().includes(q) || u.university?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q);
  }).slice(0,20);

  const goToProfile = (uid) => {
    setOpen(false); setQuery("");
    navigate("/dashboard/user/"+uid);
  };

  return (
    <div className="gs-wrapper" ref={wrapperRef}>
      <div className="gs-input-box">
        🔍
        <input
          className="gs-input"
          placeholder="Search people, country, city, university..."
          value={query}
          onChange={e=>{setQuery(e.target.value);setOpen(true);}}
          onFocus={()=>setOpen(true)}
        />
      </div>
      {open && query.trim() && (
        <div className="gs-dropdown">
          <div className="gs-filters">
            <button className={"gs-filter-chip"+(filter==="all"?" active":"")} onClick={()=>setFilter("all")}>All</button>
            <button className={"gs-filter-chip"+(filter==="country"?" active":"")} onClick={()=>setFilter("country")}>My Country</button>
            <button className={"gs-filter-chip"+(filter==="city"?" active":"")} onClick={()=>setFilter("city")}>My City</button>
            <button className={"gs-filter-chip"+(filter==="verified"?" active":"")} onClick={()=>setFilter("verified")}>Verified Only</button>
          </div>
          {results.length===0 && <div className="gs-empty">No members found.</div>}
          {results.map(u=>(
            <div key={u.uid} className="gs-item" onClick={()=>goToProfile(u.uid)}>
              {u.photoURL ? <img src={u.photoURL} alt={u.fullName} className="gs-avatar" /> : <div className="gs-avatar-ph">{u.fullName?.[0]}</div>}
              <div className="gs-item-info">
                <div className="gs-item-name">{u.fullName}{u.verified && <span className="verified-badge">✓</span>}</div>
                <div className="gs-item-meta">🌍 {u.nationality} · 🏫 {u.university}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
