import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { uploadToCloudinary, cleanText, timeAgo, clockTime } from "../lib/helpers";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";

// This is a SEPARATE system from the public "Announcements" room and from regular DMs —
// it's specifically the private, one-on-one channel between each individual student and
// Embassy for official business: submitting documents, transcripts, IDs, complaints,
// questions, and Embassy sending official notices/documents back down to a specific person.
//
// Access model: a regular student only ever sees their OWN thread with Embassy. Anyone
// with role "embassy" or "admin" sees a list of every student's thread and can open any
// of them — this is the "database of each person's submitted documents" you asked for.

const CSS = `
.em-page{display:flex;height:100%;overflow:hidden}
.em-side{width:280px;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--bg-card);flex-shrink:0}
.em-side-h{padding:14px;border-bottom:1px solid var(--border)}
.em-side-h h3{font-size:14px;font-weight:800}
.em-side-h p{font-size:11px;color:var(--text2);margin-top:2px}
.em-search{padding:8px 12px;background:var(--bg-input);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:12px;outline:none;font-family:inherit;margin:10px 12px 4px;width:calc(100% - 24px)}
.em-list{overflow-y:auto;flex:1}
.em-row{display:flex;align-items:center;gap:10px;padding:11px 13px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s}
.em-row:hover{background:rgba(255,255,255,.04)}
.em-row.active{background:rgba(139,92,246,.12)}
.em-row-info{flex:1;min-width:0}
.em-row-name{font-size:13px;font-weight:700}
.em-row-meta{font-size:11px;color:var(--text2);margin-top:1px}
.em-badge-count{background:#8b5cf6;color:#fff;font-size:10px;font-weight:800;border-radius:20px;min-width:17px;height:17px;display:flex;align-items:center;justify-content:center;padding:0 4px}
.em-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.em-header{padding:12px 16px;border-bottom:1px solid var(--border);background:var(--bg-card);display:flex;align-items:center;gap:10px}
.em-header h3{font-size:14px;font-weight:800}
.em-header p{font-size:11px;color:var(--text2)}
.em-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.em-msg{display:flex;gap:9px;max-width:75%}
.em-msg.mine{align-self:flex-end;flex-direction:row-reverse}
.em-bubble{padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.6}
.em-bubble.theirs{background:var(--bg-card2);border:1px solid var(--border);border-top-left-radius:4px}
.em-bubble.mine{background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border-top-right-radius:4px}
.em-doc{display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(255,255,255,.08);border-radius:10px;margin-top:6px;text-decoration:none;color:inherit}
.em-time{font-size:9.5px;opacity:.7;margin-top:4px;display:block}
.em-input-area{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end;background:var(--bg-card)}
.em-input{flex:1;padding:10px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:20px;color:var(--text);font-size:13.5px;outline:none;font-family:inherit;resize:none;max-height:100px}
.em-attach{background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.25);color:#a78bfa;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.em-send{width:40px;height:40px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border:none;border-radius:50%;font-size:15px;cursor:pointer;flex-shrink:0}
.em-send:disabled{opacity:.4;cursor:not-allowed}
.em-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--text2);text-align:center;padding:30px}
.em-doclist{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:14px;margin:0 16px 12px}
.em-doclist h4{font-size:12.5px;font-weight:750;margin-bottom:8px;color:var(--text2)}
`;

function threadIdFor(uid) { return "embassy_" + uid; }

export default function Embassy() {
  const { currentUser, userProfile } = useAuth();
  const isEmbassyStaff = userProfile?.role === "embassy" || userProfile?.role === "admin";
  const [threads, setThreads] = useState([]);
  const [selectedUid, setSelectedUid] = useState(isEmbassyStaff ? null : currentUser.uid);
  const [selectedName, setSelectedName] = useState(isEmbassyStaff ? null : userProfile?.fullName);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(isEmbassyStaff);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("em-css")) {
      const s = document.createElement("style");
      s.id = "em-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Embassy/Admin see every student thread that has at least one message, sorted by
  // most recent activity — this is the "database" view of everyone's submissions.
  useEffect(() => {
    if (!isEmbassyStaff) return;
    return onSnapshot(collection(db, "embassyThreads"), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.lastMessageAt?.toDate?.()?.getTime?.() || 0) - (a.lastMessageAt?.toDate?.()?.getTime?.() || 0));
      setThreads(list);
    }, () => {});
  }, [isEmbassyStaff]);

  useEffect(() => {
    if (!selectedUid) return;
    const tid = threadIdFor(selectedUid);
    const q = query(collection(db, "embassyThreads", tid, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
  }, [selectedUid]);

  const send = async (overrides) => {
    if (!selectedUid) return;
    const tid = threadIdFor(selectedUid);
    const payload = {
      senderId: currentUser.uid, senderName: userProfile.fullName,
      isFromEmbassy: isEmbassyStaff,
      createdAt: serverTimestamp(),
      text: "",
      ...overrides,
    };
    await addDoc(collection(db, "embassyThreads", tid, "messages"), payload);
    await setDoc(doc(db, "embassyThreads", tid), {
      studentId: selectedUid,
      studentName: selectedName || userProfile.fullName,
      lastMessage: overrides.text || (overrides.docUrl ? "📄 " + (overrides.docName || "Document") : ""),
      lastMessageAt: serverTimestamp(),
      lastSenderRole: isEmbassyStaff ? "embassy" : "student",
      ["unread_" + (isEmbassyStaff ? selectedUid : "embassy")]: true,
    }, { merge: true });
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = cleanText(text.trim());
    setText(""); setSending(true);
    await send({ text: content });
    setSending(false);
  };

  const handleDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    try {
      const docUrl = await uploadToCloudinary(file, "raw");
      await send({ docUrl, docName: file.name, text: "" });
    } catch (err) { alert("Document upload failed. Please try again."); }
    setSending(false); e.target.value = "";
  };

  const documents = messages.filter(m => m.docUrl);

  return (
    <div className="em-page">
      {isEmbassyStaff && (
        <div className={"em-side" + (showSidebar ? "" : "")}>
          <div className="em-side-h">
            <h3>🏛️ Student Threads</h3>
            <p>Every student's private channel with Embassy</p>
          </div>
          <input className="em-search" placeholder="🔍 Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="em-list">
            {threads.filter(t => t.studentName?.toLowerCase().includes(search.toLowerCase())).map(t => (
              <div key={t.id} className={"em-row" + (selectedUid === t.studentId ? " active" : "")} onClick={() => { setSelectedUid(t.studentId); setSelectedName(t.studentName); }}>
                <Avatar name={t.studentName} size={38} />
                <div className="em-row-info">
                  <div className="em-row-name">{t.studentName}</div>
                  <div className="em-row-meta">{t.lastMessage?.slice(0, 34) || "No messages yet"}</div>
                </div>
                {t["unread_embassy"] && <span className="em-badge-count">●</span>}
              </div>
            ))}
            {threads.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text2)" }}>No student threads yet.</div>}
          </div>
        </div>
      )}

      <div className="em-main">
        {!selectedUid ? (
          <div className="em-empty">
            <div style={{ fontSize: 42 }}>🏛️</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Embassy Portal</div>
            <div style={{ fontSize: 13 }}>Select a student thread to view their documents and messages.</div>
          </div>
        ) : (
          <>
            <div className="em-header">
              <Avatar name={selectedName} size={34} />
              <div>
                <h3>{isEmbassyStaff ? selectedName : "Embassy"}</h3>
                <p>{isEmbassyStaff ? "Private channel — visible only to Embassy staff" : "Send documents, ask questions, report issues — private and secure"}</p>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="em-doclist">
                <h4>📎 Documents in this thread ({documents.length})</h4>
                {documents.map(d => (
                  <a key={d.id} href={d.docUrl} target="_blank" rel="noreferrer" className="em-doc" style={{ marginTop: 6 }}>
                    📄 <span style={{ flex: 1, fontSize: 12.5 }}>{d.docName}</span>
                    <span style={{ fontSize: 10.5, color: "var(--text2)" }}>{timeAgo(d.createdAt)}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="em-body">
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "30px 0" }}>
                  {isEmbassyStaff ? "No messages in this thread yet." : "This is your private channel with the Embassy. Send documents, ask questions, or report an issue — only Embassy staff can see this."}
                </div>
              )}
              {messages.map(m => {
                const mine = isEmbassyStaff ? m.isFromEmbassy : !m.isFromEmbassy;
                return (
                  <div key={m.id} className={"em-msg" + (mine ? " mine" : "")}>
                    <div className={"em-bubble" + (mine ? " mine" : " theirs")}>
                      {!mine && <div style={{ fontSize: 10.5, fontWeight: 700, opacity: .8, marginBottom: 3 }}>{m.isFromEmbassy ? "🏛️ Embassy" : selectedName}</div>}
                      {m.docUrl && (
                        <a href={m.docUrl} target="_blank" rel="noreferrer" className="em-doc">
                          📄 <span style={{ textDecoration: "underline" }}>{m.docName || "Document"}</span>
                        </a>
                      )}
                      {m.text && <div>{m.text}</div>}
                      <span className="em-time">{clockTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="em-input-area">
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleDoc} />
              <button className="em-attach" onClick={() => fileRef.current?.click()} title="Send a document">📎</button>
              <textarea
                className="em-input"
                placeholder={isEmbassyStaff ? "Reply to " + selectedName + "..." : "Message the Embassy..."}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={1}
              />
              <button className="em-send" onClick={handleSend} disabled={!text.trim() || sending}>➤</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
