import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, query, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth, ROLE_INFO } from "../contexts/AuthContext";
import { timeAgo, isUserOnline } from "../lib/helpers";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";
import UserProfileModal from "../components/UserProfileModal";

const ASSIGNABLE = ["student","sender","ambassador","governor","treasurer","secretary","vicepresident","president","embassy","admin"];

const CSS = `
.ad{padding:16px 14px;overflow-y:auto;height:100%}
.ad-tabs{display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap}
.ad-tab{padding:8px 15px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.ad-tab.on{background:rgba(59,130,246,.14);border-color:var(--primary);color:var(--primary-light)}
.ad-row{display:flex;align-items:center;gap:11px;padding:13px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:13px;margin-bottom:9px;flex-wrap:wrap}
.ad-i{flex:1;min-width:150px}
.ad-n{font-size:13.5px;font-weight:750;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.ad-m{font-size:11px;color:var(--text2);margin-top:3px;line-height:1.6;word-break:break-word}
.ad-acts{display:flex;gap:6px;flex-wrap:wrap}
.ad-b{padding:6px 12px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;transition:all .15s;white-space:nowrap}
.ad-b.ok{background:rgba(16,185,129,.13);color:#34d399;border-color:rgba(16,185,129,.3)}
.ad-b.warn{background:rgba(245,158,11,.11);color:#fcd34d;border-color:rgba(245,158,11,.25)}
.ad-b.bad{background:rgba(239,68,68,.11);color:#fca5a5;border-color:rgba(239,68,68,.25)}
.ad-b.info{background:rgba(59,130,246,.11);color:var(--primary-light);border-color:rgba(59,130,246,.25)}
.ad-st{font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:20px}
.ad-st.v{background:rgba(16,185,129,.13);color:#34d399}
.ad-st.p{background:rgba(245,158,11,.13);color:#fcd34d}
.ad-st.s{background:rgba(239,68,68,.13);color:#fca5a5}
.ad-sel{padding:6px 9px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:11.5px;font-family:inherit;cursor:pointer;outline:none}
.ad-search{width:100%;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:13px;outline:none;font-family:inherit;margin-bottom:12px}
.ad-bars{display:flex;align-items:flex-end;gap:8px;height:130px;padding:14px 4px 0;overflow-x:auto}
.ad-bar{flex:1;min-width:38px;display:flex;flex-direction:column;align-items:center;gap:5px}
.ad-bar-f{width:100%;background:linear-gradient(180deg,var(--primary-light),var(--primary-dark));border-radius:7px 7px 0 0;min-height:4px;transition:height .4s}
.ad-bar-l{font-size:9.5px;color:var(--text2);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.ad-bar-v{font-size:11px;font-weight:800}
`;

export default function Admin() {
  const { currentUser, userProfile, isAdmin, isStaff, level } = useAuth();
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [listings, setListings] = useState([]);
  const [posts, setPosts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody] = useState("");
  const [nUrgent, setNUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewUid, setViewUid] = useState(null);

  useEffect(() => {
    if (!document.getElementById("ad-css")) {
      const s = document.createElement("style");
      s.id = "ad-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "users"), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const u2 = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc")), s => setReports(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const u3 = onSnapshot(collection(db, "listings"), s => setListings(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const u4 = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), s => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const u5 = onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), s => setNotices(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  if (!isStaff) {
    return (
      <div className="main-body">
        <div className="card" style={{ textAlign: "center", padding: 50 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
          <h3 style={{ fontSize: 19, marginBottom: 8 }}>Access Restricted</h3>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>This panel is for embassy staff and administrators only.</p>
        </div>
      </div>
    );
  }

  const verify = async u => { await updateDoc(doc(db, "users", u.uid), { verified: true, verifiedBy: currentUser.uid, verifiedAt: serverTimestamp() });
    await addDoc(collection(db, "notifications"), { recipientId: u.uid, icon: "✅", title: "Account verified", message: "Your account has been verified by the embassy. You now have full access.", read: false, createdAt: serverTimestamp() }).catch(() => {}); };
  const unverify = async u => { await updateDoc(doc(db, "users", u.uid), { verified: false }); };
  const suspend = async u => { if (window.confirm("Suspend " + u.fullName + "?")) await updateDoc(doc(db, "users", u.uid), { suspended: true, suspendedAt: serverTimestamp() }); };
  const restore = async u => { await updateDoc(doc(db, "users", u.uid), { suspended: false }); };
  const setRole = async (u, role) => {
    if (!isAdmin) return alert("Only administrators can change roles.");
    await updateDoc(doc(db, "users", u.uid), { role });
    await addDoc(collection(db, "notifications"), { recipientId: u.uid, icon: "🎖️", title: "Role updated", message: "Your role is now " + (ROLE_INFO[role]?.label || role) + ".", read: false, createdAt: serverTimestamp() }).catch(() => {});
  };
  const resolveReport = async r => { await updateDoc(doc(db, "reports", r.id), { status: "resolved", resolvedBy: currentUser.uid }); };
  const removeListing = async id => { if (window.confirm("Remove this listing?")) await updateDoc(doc(db, "listings", id), { status: "closed" }); };
  const removePost = async id => { if (window.confirm("Delete this post?")) await deleteDoc(doc(db, "posts", id)); };

  const broadcast = async e => {
    e.preventDefault();
    if (!nTitle.trim() || !nBody.trim()) return;
    setSending(true);
    await addDoc(collection(db, "notifications"), {
      recipientId: "ALL", urgent: nUrgent, icon: nUrgent ? "🚨" : "📢",
      title: nTitle.trim(), message: nBody.trim(),
      postedBy: userProfile.fullName, read: false, createdAt: serverTimestamp(),
    });
    await addDoc(collection(db, "posts"), {
      text: nTitle.trim() + "\n\n" + nBody.trim(), imageUrl: null, docUrl: null, docName: null,
      urgent: nUrgent, authorId: currentUser.uid, authorName: userProfile.fullName,
      authorPhoto: userProfile.photoURL || "", authorRole: userProfile.role,
      authorNationality: userProfile.nationality || "", authorVerified: true,
      likes: [], reactions: {}, commentCount: 0, createdAt: serverTimestamp(),
    }).catch(() => {});
    setNTitle(""); setNBody(""); setNUrgent(false); setSending(false);
  };

  const exportCSV = () => {
    const head = ["Full Name","Email","Phone","Nationality","City","University","Gender","Role","Verified","Suspended","Joined"];
    const rows = users.map(u => [
      u.fullName || "", u.email || "", u.phone || "", u.nationality || "", u.city || "",
      u.university || "", u.gender || "", u.role || "", u.verified ? "Yes" : "No",
      u.suspended ? "Yes" : "No",
      u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "",
    ]);
    const csv = [head, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "diasporalink_members_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
  };

  const exportPDF = () => {
    const rows = users.map(u => "<tr><td>" + (u.fullName || "") + "</td><td>" + (u.email || "") + "</td><td>" + (u.nationality || "") + "</td><td>" + (u.city || "") + "</td><td>" + (u.university || "") + "</td><td>" + (ROLE_INFO[u.role]?.label || u.role || "") + "</td><td>" + (u.verified ? "Yes" : "No") + "</td></tr>").join("");
    const html = "<html><head><title>DiasporaLink Members</title><style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:20px;margin-bottom:4px}p{color:#555;font-size:12px;margin-bottom:18px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1e3a8a;color:#fff;padding:7px;text-align:left}td{padding:6px 7px;border-bottom:1px solid #ddd}tr:nth-child(even) td{background:#f6f8fb}</style></head><body><h1>DiasporaLink — Member Register</h1><p>Generated " + new Date().toLocaleString() + " · " + users.length + " members · " + users.filter(u => u.verified).length + " verified</p><table><thead><tr><th>Name</th><th>Email</th><th>Country</th><th>City</th><th>University</th><th>Role</th><th>Verified</th></tr></thead><tbody>" + rows + "</tbody></table></body></html>";
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow pop-ups to export the PDF.");
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const total = users.length;
  const verified = users.filter(u => u.verified).length;
  const pending = users.filter(u => !u.verified && !u.suspended).length;
  const suspended = users.filter(u => u.suspended).length;
  const onlineNow = users.filter(isUserOnline).length;
  const openReports = reports.filter(r => r.status === "open").length;

  const byCountry = {};
  users.forEach(u => { if (u.nationality) byCountry[u.nationality] = (byCountry[u.nationality] || 0) + 1; });
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxC = Math.max(1, ...topCountries.map(c => c[1]));

  const shown = users.filter(u => {
    const q = search.toLowerCase();
    const m = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.nationality?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q);
    if (filter === "verified") return m && u.verified;
    if (filter === "pending") return m && !u.verified && !u.suspended;
    if (filter === "suspended") return m && u.suspended;
    if (filter === "staff") return m && ["governor","secretary","treasurer","president","vicepresident","embassy","admin","superadmin"].includes(u.role);
    return m;
  });

  const TABS = [
    { k: "overview", l: "📊 Overview" },
    { k: "users", l: "👥 Members" },
    { k: "reports", l: "🚩 Reports" + (openReports ? " (" + openReports + ")" : "") },
    { k: "content", l: "📝 Content" },
    { k: "broadcast", l: "📢 Broadcast" },
  ];

  return (
    <div className="ad">
      <div className="ad-tabs">
        {TABS.map(t => <button key={t.k} className={"ad-tab" + (tab === t.k ? " on" : "")} onClick={() => setTab(t.k)}>{t.l}</button>)}
      </div>

      {tab === "overview" && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-number">{total}</div><div className="stat-label">Members</div></div>
            <div className="stat-card"><div className="stat-number">{verified}</div><div className="stat-label">Verified</div></div>
            <div className="stat-card"><div className="stat-number">{pending}</div><div className="stat-label">Pending</div></div>
            <div className="stat-card"><div className="stat-number">{onlineNow}</div><div className="stat-label">Online Now</div></div>
            <div className="stat-card"><div className="stat-number">{openReports}</div><div className="stat-label">Open Reports</div></div>
            <div className="stat-card"><div className="stat-number">{listings.filter(l => l.status === "open").length}</div><div className="stat-label">Listings</div></div>
          </div>

          <div className="card">
            <div className="card-title">🌍 Members by Country</div>
            <div className="ad-bars">
              {topCountries.map(([c, n]) => (
                <div key={c} className="ad-bar">
                  <div className="ad-bar-v">{n}</div>
                  <div className="ad-bar-f" style={{ height: Math.max(4, (n / maxC) * 90) + "px" }} />
                  <div className="ad-bar-l" title={c}>{c.slice(0, 9)}</div>
                </div>
              ))}
              {topCountries.length === 0 && <div style={{ color: "var(--text2)", fontSize: 13 }}>No data yet.</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-title">⏳ Pending Verification ({pending})</div>
            {users.filter(u => !u.verified && !u.suspended && u.profileComplete).slice(0, 15).map(u => (
              <div key={u.uid} className="ad-row">
                <Avatar src={u.photoURL} name={u.fullName} size={40} online={isUserOnline(u)} onClick={() => setViewUid(u.uid)} />
                <div className="ad-i">
                  <div className="ad-n">{u.fullName} <RoleBadge role={u.role} small /></div>
                  <div className="ad-m">{u.nationality} · {u.city} · {u.university}<br />{u.email} · {u.phone || "no phone"}</div>
                </div>
                <div className="ad-acts">
                  <button className="ad-b ok" onClick={() => verify(u)}>✓ Verify</button>
                  <button className="ad-b bad" onClick={() => suspend(u)}>⊘ Suspend</button>
                </div>
              </div>
            ))}
            {pending === 0 && <p style={{ color: "var(--text2)", fontSize: 13.5 }}>No pending verifications.</p>}
          </div>
        </>
      )}

      {tab === "users" && (
        <>
          <input className="ad-search" placeholder="🔍 Search by name, email, country, city..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginBottom: 13, flexWrap: "wrap" }}>
            <select className="ad-sel" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All ({total})</option>
              <option value="verified">Verified ({verified})</option>
              <option value="pending">Pending ({pending})</option>
              <option value="suspended">Suspended ({suspended})</option>
              <option value="staff">Staff & Officials</option>
            </select>
            <button className="ad-b info" onClick={exportCSV}>⬇ Export CSV</button>
            <button className="ad-b info" onClick={exportPDF}>🖨 Export PDF</button>
          </div>
          {shown.map(u => (
            <div key={u.uid} className="ad-row">
              <Avatar src={u.photoURL} name={u.fullName} size={40} online={isUserOnline(u)} onClick={() => setViewUid(u.uid)} />
              <div className="ad-i">
                <div className="ad-n">
                  {u.fullName || "—"}
                  <span className={"ad-st " + (u.suspended ? "s" : u.verified ? "v" : "p")}>
                    {u.suspended ? "Suspended" : u.verified ? "✓ Verified" : "Pending"}
                  </span>
                  <RoleBadge role={u.role} small />
                </div>
                <div className="ad-m">🌍 {u.nationality} · 🏙️ {u.city} · 🏫 {u.university}<br />✉️ {u.email} · 📞 {u.phone || "—"}</div>
              </div>
              <div className="ad-acts">
                {isAdmin && u.uid !== currentUser.uid && (
                  <select className="ad-sel" value={u.role || "student"} onChange={e => setRole(u, e.target.value)}>
                    {ASSIGNABLE.map(r => <option key={r} value={r}>{ROLE_INFO[r]?.label || r}</option>)}
                  </select>
                )}
                {!u.verified && !u.suspended && <button className="ad-b ok" onClick={() => verify(u)}>✓ Verify</button>}
                {u.verified && <button className="ad-b warn" onClick={() => unverify(u)}>↩ Unverify</button>}
                {!u.suspended && u.uid !== currentUser.uid && <button className="ad-b bad" onClick={() => suspend(u)}>⊘ Suspend</button>}
                {u.suspended && <button className="ad-b info" onClick={() => restore(u)}>↩ Restore</button>}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "reports" && (
        <>
          <div style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 12 }}>
            {reports.length} reports total · {openReports} open
          </div>
          {reports.length === 0 && <p style={{ color: "var(--text2)", fontSize: 13.5 }}>No reports submitted.</p>}
          {reports.map(r => (
            <div key={r.id} className="ad-row">
              <div className="ad-i">
                <div className="ad-n">
                  🚩 {r.reportedName}
                  <span className={"ad-st " + (r.status === "open" ? "p" : "v")}>{r.status === "open" ? "Open" : "Resolved"}</span>
                </div>
                <div className="ad-m">
                  <strong>Reason:</strong> {r.reason}<br />
                  {r.details && <><strong>Details:</strong> {r.details}<br /></>}
                  Reported by {r.reporterName} · {timeAgo(r.createdAt)}
                </div>
              </div>
              <div className="ad-acts">
                <button className="ad-b info" onClick={() => setViewUid(r.reportedUid)}>View Profile</button>
                {r.status === "open" && (
                  <>
                    <button className="ad-b bad" onClick={() => { const u = users.find(x => x.uid === r.reportedUid); if (u) suspend(u); }}>⊘ Suspend</button>
                    <button className="ad-b ok" onClick={() => resolveReport(r)}>✓ Resolve</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "content" && (
        <>
          <div className="card">
            <div className="card-title">📝 Recent Posts ({posts.length})</div>
            {posts.slice(0, 25).map(p => (
              <div key={p.id} className="ad-row">
                <Avatar src={p.authorPhoto} name={p.authorName} size={34} onClick={() => setViewUid(p.authorId)} />
                <div className="ad-i">
                  <div className="ad-n">{p.authorName} <RoleBadge role={p.authorRole} small /></div>
                  <div className="ad-m">{(p.text || "(media post)").slice(0, 130)}<br />{timeAgo(p.createdAt)} · ❤️ {p.likes?.length || 0} · 💬 {p.commentCount || 0}</div>
                </div>
                <button className="ad-b bad" onClick={() => removePost(p.id)}>🗑️ Delete</button>
              </div>
            ))}
            {posts.length === 0 && <p style={{ color: "var(--text2)", fontSize: 13.5 }}>No posts yet.</p>}
          </div>

          <div className="card">
            <div className="card-title">🛒 Listings ({listings.length})</div>
            {listings.slice(0, 25).map(l => (
              <div key={l.id} className="ad-row">
                <div className="ad-i">
                  <div className="ad-n">{l.title} <span className={"ad-st " + (l.status === "open" ? "v" : "s")}>{l.status}</span></div>
                  <div className="ad-m">By {l.posterName} · {l.category} · {l.country} · {timeAgo(l.createdAt)}</div>
                </div>
                {l.status === "open" && <button className="ad-b bad" onClick={() => removeListing(l.id)}>✗ Remove</button>}
              </div>
            ))}
            {listings.length === 0 && <p style={{ color: "var(--text2)", fontSize: 13.5 }}>No listings yet.</p>}
          </div>
        </>
      )}

      {tab === "broadcast" && (
        <>
          <div className="card">
            <div className="card-title">📢 Send Announcement to Everyone</div>
            <form onSubmit={broadcast}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder='e.g. "Embassy meeting this Saturday"' value={nTitle} onChange={e => setNTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" rows={4} placeholder="Write your announcement for the community..." value={nBody} onChange={e => setNBody(e.target.value)} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={nUrgent} onChange={e => setNUrgent(e.target.checked)} style={{ width: 17, height: 17, cursor: "pointer" }} />
                🚨 Mark as urgent — flashes the notification bell for everyone
              </label>
              <button type="submit" className="btn-primary" disabled={sending || !nTitle.trim() || !nBody.trim()}>
                {sending ? "Sending..." : "📢 Send to All Members"}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-title">📜 Sent Announcements</div>
            {notices.filter(n => n.recipientId === "ALL").slice(0, 20).map(n => (
              <div key={n.id} className="ad-row">
                <div className="ad-i">
                  <div className="ad-n">{n.urgent ? "🚨" : "📢"} {n.title}</div>
                  <div className="ad-m">{n.message}<br />By {n.postedBy || "Admin"} · {timeAgo(n.createdAt)}</div>
                </div>
                <button className="ad-b bad" onClick={() => deleteDoc(doc(db, "notifications", n.id))}>🗑️</button>
              </div>
            ))}
            {notices.filter(n => n.recipientId === "ALL").length === 0 && <p style={{ color: "var(--text2)", fontSize: 13.5 }}>No announcements sent yet.</p>}
          </div>
        </>
      )}

      {viewUid && <UserProfileModal uid={viewUid} onClose={() => setViewUid(null)} />}
    </div>
  );
}
