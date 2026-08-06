import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, deleteDoc, limit, increment } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { uploadToCloudinary, cleanText, containsProfanity, timeAgo } from "../lib/helpers";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";
import UserProfileModal from "../components/UserProfileModal";
import Lightbox from "../components/Lightbox";
import Stories from "../components/Stories";

const EMOJIS = ["❤️","😂","😮","😢","🔥","👏","🙏","💯"];

const CSS = `
.fd{max-width:620px;margin:0 auto;padding:16px 12px;height:100%;overflow-y:auto}
.fd-comp{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:14px;margin-bottom:14px}
.fd-comp-top{display:flex;gap:10px;align-items:flex-start}
.fd-ta{flex:1;min-width:0;background:var(--bg-input);border:1px solid var(--border);border-radius:12px;padding:10px 13px;color:var(--text);font-size:14px;font-family:inherit;resize:none;outline:none;line-height:1.55;min-height:56px}
.fd-ta:focus{border-color:var(--primary)}
.fd-acts{display:flex;gap:7px;align-items:center;margin-top:10px;flex-wrap:wrap}
.fd-btn{padding:7px 12px;border-radius:9px;font-size:12px;font-weight:650;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:inherit;transition:all .15s}
.fd-btn:hover{background:rgba(255,255,255,.06);color:var(--text)}
.fd-post{padding:8px 20px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:750;cursor:pointer;font-family:inherit;margin-left:auto;box-shadow:0 4px 12px rgba(59,130,246,.3)}
.fd-post:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.fd-prev{position:relative;margin-top:10px}
.fd-prev img{width:100%;max-height:260px;object-fit:cover;border-radius:12px;display:block}
.fd-prev button{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.7);border:none;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:13px}
.fd-tabs{display:flex;gap:4px;margin-bottom:14px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:4px}
.fd-tab{flex:1;padding:8px 4px;text-align:center;border-radius:9px;cursor:pointer;font-size:12px;font-weight:650;color:var(--text2);border:none;background:none;font-family:inherit;transition:all .15s;white-space:nowrap}
.fd-tab.active{background:var(--primary);color:#fff}
.fd-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;margin-bottom:13px;overflow:hidden;transition:border-color .2s}
.fd-card:hover{border-color:var(--border2)}
.fd-head{display:flex;align-items:center;gap:10px;padding:13px 14px 0}
.fd-au{flex:1;min-width:0}
.fd-au-n{font-size:14px;font-weight:750;cursor:pointer;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.fd-au-n:hover{color:var(--primary-light)}
.fd-au-m{font-size:11px;color:var(--text2);margin-top:1px}
.fd-body{padding:9px 14px 11px}
.fd-txt{font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.fd-img{width:100%;max-height:420px;object-fit:cover;display:block;cursor:pointer}
.fd-doc{display:flex;align-items:center;gap:10px;padding:10px 13px;background:var(--bg-input);border:1px solid var(--border);border-radius:11px;margin-top:9px;text-decoration:none;color:var(--text);transition:background .15s}
.fd-doc:hover{background:rgba(255,255,255,.04)}
.fd-rx{display:flex;gap:5px;flex-wrap:wrap;padding:7px 14px 2px}
.fd-chip{display:flex;align-items:center;gap:3px;padding:3px 9px;border-radius:20px;font-size:12px;background:rgba(255,255,255,.06);border:1px solid var(--border);cursor:pointer;font-weight:650;transition:all .15s}
.fd-chip:hover,.fd-chip.on{background:rgba(59,130,246,.16);border-color:var(--primary)}
.fd-bar{display:flex;border-top:1px solid var(--border);padding:4px 6px;margin-top:6px}
.fd-abtn{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:9px 4px;border:none;background:none;color:var(--text2);font-size:12px;font-weight:650;cursor:pointer;border-radius:9px;transition:all .15s;font-family:inherit}
.fd-abtn:hover{background:rgba(255,255,255,.05);color:var(--text)}
.fd-abtn.liked{color:#ef4444}
.fd-heart-burst{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);font-size:80px;pointer-events:none;animation:fdHeartPop .7s ease-out forwards;filter:drop-shadow(0 4px 12px rgba(0,0,0,.4))}
@keyframes fdHeartPop{0%{transform:translate(-50%,-50%) scale(0);opacity:0}25%{transform:translate(-50%,-50%) scale(1.2);opacity:1}50%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(1.4);opacity:0}}
.fd-pick{display:flex;gap:5px;padding:8px 12px;background:var(--bg-card2);border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;margin:0 14px 10px}
.fd-pick button{background:none;border:none;font-size:21px;cursor:pointer;padding:3px;border-radius:8px;transition:transform .15s}
.fd-pick button:hover{transform:scale(1.3)}
.fd-cms{padding:0 14px 12px;border-top:1px solid var(--border)}
.fd-cm{display:flex;gap:8px;margin-bottom:9px}
.fd-cm-b{background:var(--bg-input);border-radius:12px;padding:8px 12px;flex:1;min-width:0}
.fd-cm-a{font-size:12px;font-weight:750;margin-bottom:2px;cursor:pointer}
.fd-cm-t{font-size:13px;line-height:1.5;word-break:break-word}
.fd-cm-time{font-size:10px;color:var(--text3);margin-top:3px}
.fd-cm-in{display:flex;gap:8px;margin-top:9px}
.fd-cm-in input{flex:1;min-width:0;background:var(--bg-input);border:1px solid var(--border);border-radius:20px;padding:8px 14px;color:var(--text);font-size:13px;font-family:inherit;outline:none}
.fd-cm-in input:focus{border-color:var(--primary)}
.fd-cm-in button{background:var(--primary);border:none;color:#fff;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:13px;flex-shrink:0}
.fd-empty{text-align:center;padding:56px 20px;color:var(--text2)}
`;

export default function Feed() {
  const { currentUser, userProfile, isStaff } = useAuth();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const [prev, setPrev] = useState("");
  const [docF, setDocF] = useState(null);
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState("all");
  const [openC, setOpenC] = useState({});
  const [cIn, setCIn] = useState({});
  const [cms, setCms] = useState({});
  const [pick, setPick] = useState(null);
  const [viewUid, setViewUid] = useState(null);
  const [urgent, setUrgent] = useState(false);
  const [burstId, setBurstId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const triggerHeartBurst = id => {
    setBurstId(id);
    setTimeout(() => setBurstId(null), 700);
  };
  const imgRef = useRef(null);
  const docRef2 = useRef(null);

  useEffect(() => {
    if (!document.getElementById("fd-css")) {
      const s = document.createElement("style");
      s.id = "fd-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(60));
    return onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
  }, []);

  const submit = async () => {
    if (!text.trim() && !img && !docF) return;
    if (containsProfanity(text)) { alert("Your post contains language that is not allowed."); return; }
    setPosting(true);
    try {
      let imageUrl = null, docUrl = null, docName = null;
      if (img) imageUrl = await uploadToCloudinary(img, "image");
      if (docF) { docUrl = await uploadToCloudinary(docF, "raw"); docName = docF.name; }
      await addDoc(collection(db, "posts"), {
        text: cleanText(text.trim()), imageUrl, docUrl, docName,
        urgent: urgent && isStaff,
        authorId: currentUser.uid, authorName: userProfile.fullName,
        authorPhoto: userProfile.photoURL || "", authorRole: userProfile.role || "student",
        authorNationality: userProfile.nationality || "", authorVerified: userProfile.verified || false,
        likes: [], reactions: {}, commentCount: 0, createdAt: serverTimestamp(),
      });
      if (urgent && isStaff) {
        await addDoc(collection(db, "notifications"), {
          recipientId: "ALL", urgent: true, icon: "🚨",
          title: "Urgent notice",
          message: userProfile.fullName + " posted an urgent notice: " + text.trim().slice(0, 80),
          read: false, createdAt: serverTimestamp(),
        }).catch(() => {});
      }
      setText(""); setImg(null); setPrev(""); setDocF(null); setUrgent(false);
    } catch { alert("Post failed. Please try again."); }
    setPosting(false);
  };

  const like = async (p) => {
    const has = p.likes?.includes(currentUser.uid);
    await updateDoc(doc(db, "posts", p.id), { likes: has ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
  };

  const react = async (pid, emoji) => {
    const p = posts.find(x => x.id === pid); if (!p) return;
    const cur = p.reactions?.[emoji] || [];
    const has = cur.includes(currentUser.uid);
    const upd = has ? cur.filter(i => i !== currentUser.uid) : [...cur, currentUser.uid];
    const rx = { ...(p.reactions || {}), [emoji]: upd };
    if (!upd.length) delete rx[emoji];
    await updateDoc(doc(db, "posts", pid), { reactions: rx });
    setPick(null);
  };

  const toggleComments = (pid) => {
    const next = !openC[pid];
    setOpenC(p => ({ ...p, [pid]: next }));
    if (next && !cms[pid]) {
      const q = query(collection(db, "posts", pid, "comments"), orderBy("createdAt", "asc"));
      onSnapshot(q, snap => setCms(p => ({ ...p, [pid]: snap.docs.map(d => ({ id: d.id, ...d.data() })) })), () => {});
    }
  };

  const comment = async (pid) => {
    const c = (cIn[pid] || "").trim(); if (!c) return;
    if (containsProfanity(c)) { alert("Comment contains language that is not allowed."); return; }
    setCIn(p => ({ ...p, [pid]: "" }));
    await addDoc(collection(db, "posts", pid, "comments"), {
      text: cleanText(c), authorId: currentUser.uid, authorName: userProfile.fullName,
      authorPhoto: userProfile.photoURL || "", createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "posts", pid), { commentCount: increment(1) }).catch(() => {});
  };

  const del = async (pid) => { if (window.confirm("Delete this post?")) await deleteDoc(doc(db, "posts", pid)); };
  const delComment = async (pid, cid) => { if (window.confirm("Delete this comment?")) await deleteDoc(doc(db, "posts", pid, "comments", cid)); };

  const blocked = userProfile?.blockedUsers || [];
  const list = posts.filter(p => {
    if (blocked.includes(p.authorId)) return false;
    if (tab === "following") return userProfile?.following?.includes(p.authorId) || p.authorId === currentUser.uid;
    if (tab === "official") return ["embassy", "admin", "superadmin", "governor", "president"].includes(p.authorRole);
    return true;
  });

  return (
    <div className="fd">
      <Stories />
      <div className="fd-comp">
        <div className="fd-comp-top">
          <Avatar src={userProfile?.photoURL} name={userProfile?.fullName} size={38} />
          <textarea className="fd-ta" rows={2}
            placeholder={"What's on your mind, " + (userProfile?.fullName?.split(" ")[0] || "there") + "?"}
            value={text} onChange={e => setText(e.target.value)} />
        </div>
        {prev && (
          <div className="fd-prev">
            <img src={prev} alt="" />
            <button onClick={() => { setImg(null); setPrev(""); }}>✕</button>
          </div>
        )}
        {docF && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: "var(--bg-input)", borderRadius: 10, marginTop: 9, fontSize: 12, color: "var(--text2)" }}>
            📄 <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{docF.name}</span>
            <button onClick={() => setDocF(null)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}>✕</button>
          </div>
        )}
        <div className="fd-acts">
          <button className="fd-btn" onClick={() => imgRef.current?.click()}>📷 Photo</button>
          <button className="fd-btn" onClick={() => docRef2.current?.click()}>📄 Document</button>
          {isStaff && (
            <button className="fd-btn" style={urgent ? { background: "rgba(239,68,68,.15)", borderColor: "#ef4444", color: "#fca5a5" } : {}}
              onClick={() => setUrgent(!urgent)}>🚨 Urgent</button>
          )}
          <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files[0]; if (f) { setImg(f); setPrev(URL.createObjectURL(f)); } e.target.value = ""; }} />
          <input ref={docRef2} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" style={{ display: "none" }}
            onChange={e => { setDocF(e.target.files[0] || null); e.target.value = ""; }} />
          <button className="fd-post" onClick={submit} disabled={posting || (!text.trim() && !img && !docF)}>
            {posting ? "Posting..." : "Post ✈️"}
          </button>
        </div>
      </div>

      <div className="fd-tabs">
        {[{ k: "all", l: "🌍 Everyone" }, { k: "following", l: "👥 Following" }, { k: "official", l: "🏛️ Official" }].map(t => (
          <button key={t.k} className={"fd-tab" + (tab === t.k ? " active" : "")} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="fd-empty">
          <div style={{ fontSize: 42, marginBottom: 10, opacity: .5 }}>✨</div>
          <div style={{ fontWeight: 750, fontSize: 16, marginBottom: 6 }}>Nothing here yet</div>
          <div style={{ fontSize: 13 }}>Be the first to share something with the community.</div>
        </div>
      )}

      {list.map(p => (
        <div key={p.id} className="fd-card" style={p.urgent ? { borderColor: "rgba(239,68,68,.4)" } : {}}>
          {p.urgent && (
            <div style={{ background: "rgba(239,68,68,.1)", color: "#fca5a5", fontSize: 11, fontWeight: 800, padding: "6px 14px", letterSpacing: .5 }}>
              🚨 URGENT NOTICE
            </div>
          )}
          <div className="fd-head">
            <Avatar src={p.authorPhoto} name={p.authorName} size={40} onClick={() => setViewUid(p.authorId)} />
            <div className="fd-au">
              <div className="fd-au-n" onClick={() => setViewUid(p.authorId)}>
                {p.authorName}
                {p.authorVerified && <span className="verified-badge">✓</span>}
                <RoleBadge role={p.authorRole} small />
              </div>
              <div className="fd-au-m">🌍 {p.authorNationality} · {timeAgo(p.createdAt)}</div>
            </div>
            {(p.authorId === currentUser.uid || isStaff) && (
              <button onClick={() => del(p.id)} title={p.authorId === currentUser.uid ? "Delete your post" : "Remove post (moderation)"} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 15, padding: 4 }}>🗑️</button>
            )}
          </div>

          {p.text && <div className="fd-body"><div className="fd-txt">{p.text}</div></div>}
          {p.imageUrl && (
            <div style={{ position: "relative" }} onDoubleClick={() => { if (!p.likes?.includes(currentUser.uid)) like(p); triggerHeartBurst(p.id); }}>
              <img src={p.imageUrl} alt="" className="fd-img" onClick={() => setLightboxSrc(p.imageUrl)} />
              {burstId === p.id && <span className="fd-heart-burst">❤️</span>}
            </div>
          )}
          {p.docUrl && (
            <div className="fd-body">
              <a href={p.docUrl} target="_blank" rel="noreferrer" className="fd-doc">
                📄 <span style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.docName || "Document"}</span>
                <span style={{ fontSize: 11, color: "var(--primary-light)", fontWeight: 700 }}>Open</span>
              </a>
            </div>
          )}

          {p.reactions && Object.keys(p.reactions).filter(e => p.reactions[e]?.length).length > 0 && (
            <div className="fd-rx">
              {Object.entries(p.reactions).filter(([, v]) => v.length).map(([e, u]) => (
                <span key={e} className={"fd-chip" + (u.includes(currentUser.uid) ? " on" : "")} onClick={() => react(p.id, e)}>{e} {u.length}</span>
              ))}
            </div>
          )}

          {pick === p.id && (
            <div className="fd-pick">
              {EMOJIS.map(e => <button key={e} onClick={() => react(p.id, e)}>{e}</button>)}
            </div>
          )}

          <div className="fd-bar">
            <button className={"fd-abtn" + (p.likes?.includes(currentUser.uid) ? " liked" : "")} onClick={() => like(p)}>
              {p.likes?.includes(currentUser.uid) ? "❤️" : "🤍"} {p.likes?.length || 0}
            </button>
            <button className="fd-abtn" onClick={() => setPick(pick === p.id ? null : p.id)}>😊 React</button>
            <button className="fd-abtn" onClick={() => toggleComments(p.id)}>💬 {p.commentCount || 0}</button>
          </div>

          {openC[p.id] && (
            <div className="fd-cms">
              {(cms[p.id] || []).map(c => (
                <div key={c.id} className="fd-cm">
                  <Avatar src={c.authorPhoto} name={c.authorName} size={28} onClick={() => setViewUid(c.authorId)} />
                  <div className="fd-cm-b">
                    <div className="fd-cm-a" onClick={() => setViewUid(c.authorId)}>{c.authorName}</div>
                    <div className="fd-cm-t">{c.text}</div>
                    <div className="fd-cm-time">
                      {timeAgo(c.createdAt)}
                      {(c.authorId === currentUser.uid || isStaff) && (
                        <button onClick={() => delComment(p.id, c.id)} style={{ marginLeft: 10, background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 11 }}>🗑️ Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="fd-cm-in">
                <input placeholder="Write a comment..." value={cIn[p.id] || ""}
                  onChange={e => setCIn(x => ({ ...x, [p.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") comment(p.id); }} />
                <button onClick={() => comment(p.id)}>➤</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {viewUid && <UserProfileModal uid={viewUid} onClose={() => setViewUid(null)} />}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
