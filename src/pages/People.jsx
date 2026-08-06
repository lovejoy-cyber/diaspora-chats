import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { isUserOnline } from "../lib/helpers";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";

const CSS = `
.ppl-page{padding:12px 14px;overflow-y:auto;height:100%;max-width:640px;margin:0 auto}
.ppl-search{width:100%;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:13px;outline:none;font-family:inherit;margin-bottom:10px}
.ppl-search:focus{border-color:var(--primary)}
.ppl-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;margin-bottom:4px}
.ppl-chip{flex-shrink:0;padding:6px 13px;border-radius:20px;font-size:11.5px;font-weight:650;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text2);white-space:nowrap;transition:all .15s}
.ppl-chip.on{background:var(--primary);border-color:var(--primary);color:#fff}
.ppl-count{font-size:11.5px;color:var(--text3);margin:6px 2px 8px}
.ppl-row{display:flex;align-items:center;gap:12px;padding:10px 6px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .15s;border-radius:10px}
.ppl-row:hover{background:rgba(255,255,255,.04)}
.ppl-info{flex:1;min-width:0}
.ppl-name{font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.ppl-meta{font-size:11.5px;color:var(--text2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ppl-msgbtn{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);color:var(--primary-light);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;transition:background .15s}
.ppl-msgbtn:hover{background:rgba(59,130,246,.22)}
.ppl-empty{text-align:center;padding:50px 20px;color:var(--text2)}
`;

export default function People() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!document.getElementById("ppl-css")) {
      const s = document.createElement("style");
      s.id = "ppl-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "users"), snap => {
      const seen = new Map();
      snap.docs.forEach(d => {
        const u = d.data();
        if (u.uid && u.uid !== currentUser.uid && u.profileComplete) seen.set(u.uid, u);
      });
      setUsers(Array.from(seen.values()));
    });
  }, [currentUser]);

  const blocked = userProfile?.blockedUsers || [];
  const chips = [
    { key: "all", label: "🌍 Everyone" },
    { key: "country", label: "🏠 My Country" },
    { key: "city", label: "📍 My City" },
    { key: "verified", label: "✓ Verified" },
    { key: "online", label: "🟢 Online" },
  ];

  let list = users.filter(u => !blocked.includes(u.uid) && !u.blockedUsers?.includes(currentUser.uid));
  if (filter === "country") list = list.filter(u => u.nationality === userProfile?.nationality);
  if (filter === "city") list = list.filter(u => u.city === userProfile?.city);
  if (filter === "verified") list = list.filter(u => u.verified);
  if (filter === "online") list = list.filter(u => isUserOnline(u));
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(u => u.fullName?.toLowerCase().includes(q) || u.nationality?.toLowerCase().includes(q) || u.university?.toLowerCase().includes(q));
  }
  list.sort((a, b) => (isUserOnline(b) ? 1 : 0) - (isUserOnline(a) ? 1 : 0));

  return (
    <div className="ppl-page">
      <input className="ppl-search" placeholder="🔍 Search people..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="ppl-chips">
        {chips.map(c => <button key={c.key} className={"ppl-chip" + (filter === c.key ? " on" : "")} onClick={() => setFilter(c.key)}>{c.label}</button>)}
      </div>
      <div className="ppl-count">{list.length} member{list.length !== 1 ? "s" : ""}</div>

      {list.length === 0 && <div className="ppl-empty">No one matches this filter yet.</div>}

      {list.map(u => (
        <div key={u.uid} className="ppl-row" onClick={() => navigate("/dashboard/user/" + u.uid)}>
          <Avatar src={u.photoURL} name={u.fullName} size={44} online={isUserOnline(u)} />
          <div className="ppl-info">
            <div className="ppl-name">
              {u.fullName}
              {u.verified && <span className="verified-badge">✓</span>}
              <RoleBadge role={u.role} small />
            </div>
            <div className="ppl-meta">🌍 {u.nationality} · 🏫 {u.university}</div>
          </div>
          <button className="ppl-msgbtn" onClick={e => { e.stopPropagation(); navigate("/dashboard/messages?start=" + u.uid); }} title="Message">💬</button>
        </div>
      ))}
    </div>
  );
}
