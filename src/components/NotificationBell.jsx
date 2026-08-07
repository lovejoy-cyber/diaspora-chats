import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../lib/helpers";

const CSS = `
.nb-wrap{position:relative}
.nb-btn{background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--text2);padding:7px 10px;border-radius:10px;font-size:17px;cursor:pointer;transition:all .15s;position:relative;line-height:1}
.nb-btn:hover{background:rgba(59,130,246,.14);border-color:var(--primary)}
.nb-btn.alert{animation:nbAlert 1.1s infinite}
@keyframes nbAlert{0%{background:rgba(239,68,68,.18);border-color:#ef4444;box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{background:rgba(245,158,11,.22);border-color:#f59e0b;box-shadow:0 0 0 6px rgba(239,68,68,0)}100%{background:rgba(239,68,68,.18);border-color:#ef4444;box-shadow:0 0 0 0 rgba(239,68,68,0)}}
.nb-btn.newmsg{animation:nbGreenGlow 1.6s ease-in-out infinite;border-color:#10b981}
@keyframes nbGreenGlow{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 7px rgba(16,185,129,0)}}
.nb-btn.newmsg::after{content:"";position:absolute;top:2px;right:2px;width:9px;height:9px;border-radius:50%;background:#10b981;box-shadow:0 0 6px 2px rgba(16,185,129,.8);animation:nbDotPulse 1.6s ease-in-out infinite}
@keyframes nbDotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}}
.nb-badge{position:absolute;top:-5px;right:-5px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;border-radius:20px;padding:2px 5px;min-width:16px;text-align:center;animation:nbPulse 1.5s infinite}
.nb-badge.green{background:#10b981}
@keyframes nbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
.nb-point{position:absolute;top:calc(100% + 2px);right:10px;font-size:11px;color:#10b981;font-weight:800;white-space:nowrap;animation:nbBounce 1s ease-in-out infinite}
@keyframes nbBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.nb-drop{position:absolute;top:calc(100% + 8px);right:0;width:min(320px,calc(100vw - 32px));background:var(--bg-card);border:1px solid var(--border);border-radius:14px;box-shadow:0 20px 48px rgba(0,0,0,.6);z-index:500;overflow:hidden}
.nb-head{padding:11px 15px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.nb-head h4{font-size:13px;font-weight:800}
.nb-clear{background:none;border:none;color:var(--text2);font-size:11px;cursor:pointer;font-family:inherit}
.nb-clear:hover{color:var(--primary-light)}
.nb-list{max-height:340px;overflow-y:auto}
.nb-item{padding:11px 15px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;display:flex;gap:10px;align-items:flex-start;transition:background .15s}
.nb-item:hover{background:rgba(255,255,255,.04)}
.nb-item.unread{background:rgba(59,130,246,.06);border-left:3px solid var(--primary)}
.nb-item.urgent{background:rgba(239,68,68,.07);border-left:3px solid #ef4444}
.nb-txt{font-size:12.5px;line-height:1.5}
.nb-time{font-size:10px;color:var(--text3);margin-top:3px}
.nb-empty{padding:30px 16px;text-align:center;color:var(--text2);font-size:13px}
`;

export default function NotificationBell() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);
  const [unreadConvos, setUnreadConvos] = useState([]);
  const wrapRef = useRef(null);

  // Watch conversations for unread message counts so the bell reacts to new DMs too —
  // also keeps the actual conversation list so notifications can be clicked straight
  // through to the right chat, not just show a number.
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "conversations"), where("participants", "array-contains", currentUser.uid));
    return onSnapshot(q, snap => {
      let total = 0;
      const convos = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (data["muted_" + currentUser.uid]) return; // muted chats don't light up the bell
        const count = data["unread_" + currentUser.uid] || 0;
        total += count;
        if (count > 0) {
          const otherId = data.participants?.find(p => p !== currentUser.uid);
          convos.push({
            id: d.id, otherId,
            otherName: data.participantNames?.[otherId] || "Member",
            otherPhoto: data.participantPhotos?.[otherId] || "",
            lastMessage: data.lastMessage || "",
            unreadCount: count,
            lastMessageAt: data.lastMessageAt,
          });
        }
      });
      convos.sort((a, b) => (b.lastMessageAt?.toDate?.()?.getTime?.() || 0) - (a.lastMessageAt?.toDate?.()?.getTime?.() || 0));
      setMsgUnread(total);
      setUnreadConvos(convos);
    }, err => console.error("Bell: conversation listener failed:", err));
  }, [currentUser]);

  useEffect(() => {
    if (!document.getElementById("nb-css")) {
      const s = document.createElement("style");
      s.id = "nb-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    // Split into two simple queries instead of one where(...,"in",...) + orderBy combo —
    // that combination needs a Firestore composite index, and if it's missing the listener
    // fails silently, which is exactly why the bell stopped updating. Two simple queries
    // (each filtering on one field, ordering on another) don't need any special index.
    const qMine = query(collection(db, "notifications"), where("recipientId", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(40));
    const qAll = query(collection(db, "notifications"), where("recipientId", "==", "ALL"), orderBy("createdAt", "desc"), limit(40));

    let mine = [], all = [];
    const merge = () => {
      const combined = [...mine, ...all].sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });
      setItems(combined);
    };

    const unsub1 = onSnapshot(qMine, snap => { mine = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge(); }, err => console.error("Notifications (mine) query failed:", err));
    const unsub2 = onSnapshot(qAll, snap => { all = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge(); }, err => console.error("Notifications (all) query failed:", err));
    return () => { unsub1(); unsub2(); };
  }, [currentUser]);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const readIds = () => {
    try { return JSON.parse(localStorage.getItem("dl_read") || "[]"); } catch { return []; }
  };
  const isRead = n => n.recipientId === "ALL" ? readIds().includes(n.id) : n.read;
  const unread = items.filter(n => !isRead(n));
  const hasUrgent = unread.some(n => n.urgent);
  const totalBadge = unread.length + msgUnread;

  const markAll = async () => {
    const allIds = items.map(n => n.id);
    try { localStorage.setItem("dl_read", JSON.stringify(allIds)); } catch {}
    await Promise.all(
      items.filter(n => n.recipientId === currentUser.uid && !n.read)
        .map(n => updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {}))
    );
    setItems(prev => [...prev]);
  };

  return (
    <div className="nb-wrap" ref={wrapRef}>
      <button
        className={"nb-btn" + (hasUrgent ? " alert" : (msgUnread > 0 ? " newmsg" : ""))}
        onClick={() => { setOpen(!open); if (!open) markAll(); }}
        title={msgUnread > 0 ? msgUnread + " unread message" + (msgUnread > 1 ? "s" : "") : "Notifications"}
      >
        {hasUrgent ? "🚨" : "🔔"}
        {totalBadge > 0 && <span className={"nb-badge" + (!hasUrgent && msgUnread > 0 ? " green" : "")}>{totalBadge > 9 ? "9+" : totalBadge}</span>}
      </button>
      {!open && msgUnread > 0 && !hasUrgent && <div className="nb-point">👆 new</div>}

      {open && (
        <div className="nb-drop">
          <div className="nb-head">
            <h4>🔔 Notifications</h4>
            {unread.length > 0 && <button className="nb-clear" onClick={markAll}>Mark all read</button>}
          </div>
          <div className="nb-list">
            {items.length === 0 && unreadConvos.length === 0 && <div className="nb-empty">No notifications yet</div>}
            {unreadConvos.map(c => (
              <div
                key={c.id}
                className="nb-item unread"
                onClick={() => { setOpen(false); navigate("/dashboard/messages?start=" + c.otherId); }}
              >
                <span style={{ fontSize: 17 }}>💬</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 2 }}>
                    {c.otherName} {c.unreadCount > 1 && <span style={{ color: "var(--primary-light)" }}>({c.unreadCount})</span>}
                  </div>
                  <div className="nb-txt">{c.lastMessage || "New message"}</div>
                  <div className="nb-time">{timeAgo(c.lastMessageAt)}</div>
                </div>
              </div>
            ))}
            {items.map(n => (
              <div
                key={n.id}
                className={"nb-item" + (isRead(n) ? "" : n.urgent ? " urgent" : " unread")}
                onClick={n.link ? () => { setOpen(false); navigate(n.link); } : undefined}
                style={n.link ? { cursor: "pointer" } : undefined}
              >
                <span style={{ fontSize: 17 }}>{n.icon || (n.urgent ? "🚨" : "🔔")}</span>
                <div>
                  {n.title && <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 2 }}>{n.title}</div>}
                  <div className="nb-txt">{n.message}</div>
                  <div className="nb-time">{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
