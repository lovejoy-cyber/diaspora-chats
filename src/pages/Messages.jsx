import { useState, useEffect, useRef } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, getDocs, getDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const REACTIONS = ["👍","❤️","😂","😮","😢","🙏","🔥"];

const MSG_CSS = `
.msg-layout{display:flex;height:calc(100vh - 57px);overflow:hidden}
.msg-sidebar{width:280px;border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;background:var(--bg-card)}
.msg-search{padding:10px;border-bottom:1px solid var(--border)}
.msg-search input{width:100%;padding:8px 12px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none;font-family:inherit}
.msg-search input:focus{border-color:var(--primary)}
.new-conv-btn{margin:8px;padding:9px;background:rgba(37,99,235,0.1);border:1px dashed var(--primary);border-radius:8px;color:#60a5fa;font-size:12px;font-weight:600;cursor:pointer;text-align:center;transition:all 0.15s}
.new-conv-btn:hover{background:rgba(37,99,235,0.2)}
.conv-list{overflow-y:auto;flex:1}
.conv-item{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.03);transition:background 0.15s}
.conv-item:hover{background:rgba(255,255,255,0.04)}
.conv-item.active{background:rgba(37,99,235,0.12)}
.conv-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;position:relative}
.conv-avatar img{width:40px;height:40px;border-radius:50%;object-fit:cover}
.conv-avatar-ph{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#1e40af);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:white;flex-shrink:0}
.online-indicator{position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#10b981;border:2px solid var(--bg-card)}
.offline-indicator{position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#64748b;border:2px solid var(--bg-card)}
.conv-info{flex:1;min-width:0}
.conv-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.conv-preview{font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.conv-time{font-size:10px;color:var(--text-muted);flex-shrink:0}
.msg-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.msg-header{padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;background:var(--bg-card);flex-shrink:0}
.msg-header-info h4{font-size:14px;font-weight:700}
.msg-header-info span{font-size:11px;color:var(--text-muted)}
.msg-header-info .online-text{color:#10b981}
.messages-area{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:2px}
.msg-date-div{text-align:center;font-size:11px;color:var(--text-muted);margin:12px 0;font-weight:600}
.msg-bubble-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:2px}
.msg-bubble-row.mine{flex-direction:row-reverse}
.msg-avatar-sm{width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0}
.msg-avatar-sm-ph{width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
.msg-bubble{max-width:65%;padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.55;position:relative;word-break:break-word}
.msg-bubble.theirs{background:var(--bg-card);border:1px solid var(--border);border-bottom-left-radius:4px}
.msg-bubble.mine{background:linear-gradient(135deg,var(--primary),#1e40af);color:white;border-bottom-right-radius:4px}
.msg-bubble.deleted{opacity:0.45;font-style:italic;background:transparent!important;border:1px dashed var(--border)!important;color:var(--text-muted)!important}
.msg-bubble img{max-width:100%;border-radius:8px;cursor:pointer;display:block}
.msg-time{font-size:9px;opacity:0.6;margin-top:4px;display:block;text-align:right}
.msg-tick{font-size:10px}
.msg-tick.seen{color:#60a5fa}
.msg-actions{display:flex;gap:4px;margin-bottom:2px}
.msg-action-btn{background:none;border:none;cursor:pointer;font-size:13px;opacity:0;padding:3px;transition:opacity 0.15s;border-radius:4px}
.msg-action-btn:hover{background:rgba(255,255,255,0.1)}
.msg-bubble-row:hover .msg-action-btn{opacity:1}
.reactions-bar{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}
.reaction-chip{background:rgba(255,255,255,0.08);border:1px solid var(--border);border-radius:20px;padding:2px 7px;font-size:12px;cursor:pointer;transition:all 0.15s}
.reaction-chip:hover,.reaction-chip.mine-reaction{background:rgba(37,99,235,0.2);border-color:var(--primary)}
.reaction-picker{position:absolute;bottom:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:8px;display:flex;gap:6px;z-index:10;box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.reaction-picker-btn{background:none;border:none;font-size:20px;cursor:pointer;padding:4px;border-radius:6px;transition:background 0.15s}
.reaction-picker-btn:hover{background:rgba(255,255,255,0.1)}
.reply-preview{background:rgba(37,99,235,0.1);border-left:3px solid var(--primary);padding:8px 12px;margin:0 16px 8px;border-radius:0 8px 8px 0;font-size:12px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center}
.reply-quote{background:rgba(255,255,255,0.06);border-left:2px solid rgba(255,255,255,0.3);padding:4px 8px;margin-bottom:6px;border-radius:0 4px 4px 0;font-size:11px;opacity:0.8}
.typing-indicator{padding:8px 20px;font-size:12px;color:var(--text-muted);font-style:italic;height:28px}
.typing-dots span{display:inline-block;animation:typingDot 1.2s infinite;margin-right:2px}
.typing-dots span:nth-child(2){animation-delay:0.2s}
.typing-dots span:nth-child(3){animation-delay:0.4s}
@keyframes typingDot{0%,100%{opacity:0.3}50%{opacity:1}}
.msg-input-area{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end;background:var(--bg-card);flex-shrink:0}
.msg-input{flex:1;padding:10px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:13px;outline:none;font-family:inherit;resize:none;max-height:120px;line-height:1.5}
.msg-input:focus{border-color:var(--primary)}
.msg-icon-btn{background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text-muted);padding:10px;border-radius:10px;font-size:16px;cursor:pointer;transition:all 0.15s;flex-shrink:0}
.msg-icon-btn:hover{background:rgba(37,99,235,0.15);border-color:var(--primary);color:var(--primary-light)}
.msg-icon-btn.recording{background:rgba(239,68,68,0.2);border-color:#ef4444;color:#fca5a5}
.msg-send-btn{padding:10px 16px;background:linear-gradient(135deg,var(--primary),#1e40af);color:white;border:none;border-radius:10px;font-size:15px;cursor:pointer;transition:all 0.15s;flex-shrink:0}
.msg-send-btn:hover:not(:disabled){transform:scale(1.05)}
.msg-send-btn:disabled{opacity:0.4;cursor:not-allowed}
.msg-empty{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:var(--text-muted)}
.msg-empty-icon{font-size:44px;opacity:0.5}
.audio-player{display:flex;align-items:center;gap:8px;min-width:160px}
.audio-play-btn{background:rgba(255,255,255,0.15);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;flex-shrink:0}
.audio-bar{flex:1;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;position:relative}
.audio-progress{height:100%;background:rgba(255,255,255,0.8);border-radius:2px;transition:width 0.1s}
.audio-dur{font-size:10px;opacity:0.7;flex-shrink:0}
.member-picker{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px}
.member-picker-card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:22px;width:100%;max-width:400px;max-height:80vh;display:flex;flex-direction:column;gap:12px}
.member-picker-card h3{font-size:16px;font-weight:700}
.member-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;cursor:pointer;transition:background 0.15s}
.member-row:hover{background:rgba(255,255,255,0.05)}
.member-row-info h4{font-size:13px;font-weight:600}
.member-row-info span{font-size:11px;color:var(--text-muted)}
@media(max-width:768px){.msg-sidebar{width:100%;position:absolute;z-index:10;height:calc(100vh - 57px)}.msg-sidebar.hidden{display:none}.msg-main{width:100%}}
`;

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  return d.toLocaleDateString();
}

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(ts) {
  if (!ts) return "Offline";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 120) return "Online";
  if (diff < 3600) return "Last seen " + Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return "Last seen " + Math.floor(diff / 3600) + "h ago";
  return "Last seen " + d.toLocaleDateString();
}

function AudioPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onTimeUpdate={e => setProgress((e.target.currentTime / e.target.duration) * 100 || 0)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button className="audio-play-btn" onClick={toggle}>{playing ? "⏸" : "▶"}</button>
      <div className="audio-bar"><div className="audio-progress" style={{ width: progress + "%" }} /></div>
      <span className="audio-dur">{duration ? Math.round(duration) + "s" : "🎙"}</span>
    </div>
  );
}

export default function Messages() {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showReactions, setShowReactions] = useState(null);
  const [recording, setRecording] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("msg-css")) {
      const s = document.createElement("style");
      s.id = "msg-css";
      s.textContent = MSG_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );
    return onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [currentUser]);

  // Load messages
  useEffect(() => {
    if (!activeConv) return;
    setMessages([]);
    const q = query(
      collection(db, "conversations", activeConv.id, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      // Mark messages as read
      msgs.forEach(msg => {
        if (msg.senderId !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)) {
          updateDoc(doc(db, "conversations", activeConv.id, "messages", msg.id), {
            readBy: [...(msg.readBy || []), currentUser.uid]
          }).catch(() => {});
        }
      });
    });
  }, [activeConv]);

  // Load other user's profile for online status
  useEffect(() => {
    if (!activeConv) return;
    const otherId = activeConv.participants?.find(p => p !== currentUser.uid);
    if (!otherId) return;
    return onSnapshot(doc(db, "users", otherId), snap => {
      if (snap.exists()) setOtherUserProfile(snap.data());
    });
  }, [activeConv]);

  // Load members for picker
  useEffect(() => {
    if (!showPicker) return;
    getDocs(collection(db, "users")).then(snap => {
      setMembers(snap.docs.map(d => d.data()).filter(u => u.uid !== currentUser.uid && u.profileComplete));
    });
  }, [showPicker]);

  const getOtherId = (conv) => conv.participants?.find(p => p !== currentUser.uid);
  const getOtherName = (conv) => conv.participantNames?.[getOtherId(conv)] || "Member";
  const getOtherPhoto = (conv) => conv.participantPhotos?.[getOtherId(conv)] || "";

  const startConversation = async (member) => {
    setShowPicker(false);
    const tid = [currentUser.uid, member.uid].sort().join("_");
    const existing = conversations.find(c => c.id === tid);
    if (existing) { setActiveConv(existing); setShowSidebar(false); return; }
    const convData = {
      participants: [currentUser.uid, member.uid],
      participantNames: { [currentUser.uid]: userProfile.fullName, [member.uid]: member.fullName },
      participantPhotos: { [currentUser.uid]: userProfile.photoURL || "", [member.uid]: member.photoURL || "" },
      lastMessage: "", lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "conversations"), convData);
    setActiveConv({ ...convData, id: tid });
    setShowSidebar(false);
  };

  const handleTyping = () => {
    if (!activeConv) return;
    updateDoc(doc(db, "conversations", activeConv.id), {
      ["typing_" + currentUser.uid]: serverTimestamp()
    }).catch(() => {});
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, "conversations", activeConv.id), {
        ["typing_" + currentUser.uid]: null
      }).catch(() => {});
    }, 2000);
  };

  const isOtherTyping = () => {
    if (!activeConv || !otherUserProfile) return false;
    const otherId = getOtherId(activeConv);
    const typingTs = activeConv["typing_" + otherId];
    if (!typingTs) return false;
    const d = typingTs.toDate ? typingTs.toDate() : new Date(typingTs);
    return (Date.now() - d) < 3000;
  };

  const uploadToCloudinary = async (file, resourceType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const url = "https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/" + (resourceType || "image") + "/upload";
    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return (await res.json()).secure_url;
  };

  const sendMessage = async (overrides) => {
    if (!activeConv) return;
    const payload = {
      senderId: currentUser.uid,
      senderName: userProfile.fullName,
      senderPhoto: userProfile.photoURL || "",
      createdAt: serverTimestamp(),
      deleted: false,
      readBy: [currentUser.uid],
      reactions: {},
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text || "📷 Photo", senderName: replyTo.senderName } : null,
      ...overrides,
    };
    await addDoc(collection(db, "conversations", activeConv.id, "messages"), payload);
    await updateDoc(doc(db, "conversations", activeConv.id), {
      lastMessage: overrides.text || (overrides.imageUrl ? "📷 Photo" : overrides.audioUrl ? "🎙 Voice message" : ""),
      lastMessageAt: serverTimestamp(),
      lastSenderId: currentUser.uid,
    });
    setReplyTo(null);
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    await sendMessage({ text: content, type: "text" });
    setSending(false);
  };

  const handlePhotoSend = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    try {
      const imageUrl = await uploadToCloudinary(file, "image");
      await sendMessage({ imageUrl, type: "image", text: "" });
    } catch { alert("Photo upload failed. Check your connection."); }
    setSending(false);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        setSending(true);
        try {
          const audioUrl = await uploadToCloudinary(blob, "video");
          await sendMessage({ audioUrl, type: "audio", text: "" });
        } catch { alert("Voice message upload failed."); }
        setSending(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch { alert("Microphone permission denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setRecording(false); }
  };

  const deleteMessage = async (msgId) => {
    await updateDoc(doc(db, "conversations", activeConv.id, "messages", msgId), {
      deleted: true, text: "This message was deleted", imageUrl: null, audioUrl: null,
    });
  };

  const toggleReaction = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const current = msg.reactions?.[emoji] || [];
    const hasReacted = current.includes(currentUser.uid);
    const updated = hasReacted ? current.filter(id => id !== currentUser.uid) : [...current, currentUser.uid];
    const reactions = { ...msg.reactions, [emoji]: updated };
    if (updated.length === 0) delete reactions[emoji];
    await updateDoc(doc(db, "conversations", activeConv.id, "messages", msgId), { reactions });
    setShowReactions(null);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isOnline = otherUserProfile?.online && otherUserProfile?.lastSeen &&
    (Date.now() - (otherUserProfile.lastSeen.toDate?.() || new Date()).getTime()) < 120000;

  return (
    <div className="msg-layout">
      {/* Sidebar */}
      <div className={"msg-sidebar" + (showSidebar ? "" : " hidden")}>
        <div className="msg-search">
          <input placeholder="🔍 Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="new-conv-btn" onClick={() => setShowPicker(true)}>✏️ New Message</div>
        <div className="conv-list">
          {conversations.filter(c => getOtherName(c).toLowerCase().includes(search.toLowerCase())).map(conv => {
            const photo = getOtherPhoto(conv);
            const name = getOtherName(conv);
            return (
              <div key={conv.id} className={"conv-item" + (activeConv?.id === conv.id ? " active" : "")}
                onClick={() => { setActiveConv(conv); setShowSidebar(false); }}>
                <div className="conv-avatar" style={{ position: "relative" }}>
                  {photo ? <img src={photo} alt={name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                    : <div className="conv-avatar-ph">{name[0]}</div>}
                </div>
                <div className="conv-info">
                  <div className="conv-name">{name}</div>
                  <div className="conv-preview">{conv.lastMessage || "Tap to chat"}</div>
                </div>
                <div className="conv-time">{timeAgo(conv.lastMessageAt)}</div>
              </div>
            );
          })}
          {conversations.length === 0 && (
            <div style={{ padding: "30px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
              No conversations yet.<br />Start one above.
            </div>
          )}
        </div>
      </div>

      {/* Chat Main */}
      <div className="msg-main">
        {!activeConv ? (
          <div className="msg-empty">
            <div className="msg-empty-icon">💬</div>
            <div style={{ fontWeight: "600", fontSize: "16px" }}>Your Messages</div>
            <div style={{ fontSize: "13px" }}>Select a conversation or start a new one</div>
          </div>
        ) : (
          <>
            <div className="msg-header">
              <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", padding: "0 8px 0 0" }}>←</button>
              {getOtherPhoto(activeConv)
                ? <img src={getOtherPhoto(activeConv)} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                : <div className="conv-avatar-ph" style={{ width: 36, height: 36, fontSize: 14 }}>{getOtherName(activeConv)[0]}</div>}
              <div className="msg-header-info">
                <h4>{getOtherName(activeConv)}</h4>
                <span className={isOnline ? "online-text" : ""}>
                  {isOnline ? "🟢 Online" : otherUserProfile ? formatLastSeen(otherUserProfile.lastSeen) : ""}
                </span>
              </div>
            </div>

            <div className="messages-area">
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "40px 0" }}>No messages yet. Say hello! 👋</div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.senderId === currentUser.uid;
                const prevMsg = messages[i - 1];
                const showDate = !prevMsg || msg.createdAt?.toDate?.()?.toDateString() !== prevMsg.createdAt?.toDate?.()?.toDateString();
                const isRead = msg.readBy?.some(id => id !== currentUser.uid);
                const hasReactions = msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions[k].length > 0);
                return (
                  <div key={msg.id}>
                    {showDate && msg.createdAt && (
                      <div className="msg-date-div">
                        {msg.createdAt.toDate().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                      </div>
                    )}
                    <div className={"msg-bubble-row" + (isMine ? " mine" : "")}>
                      {!isMine && (
                        msg.senderPhoto
                          ? <img src={msg.senderPhoto} alt="" className="msg-avatar-sm" />
                          : <div className="msg-avatar-sm-ph">{msg.senderName?.[0]}</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", maxWidth: "65%", position: "relative" }}>
                        {!msg.deleted && (
                          <div className="msg-actions">
                            <button className="msg-action-btn" onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)} title="React">😊</button>
                            <button className="msg-action-btn" onClick={() => setReplyTo(msg)} title="Reply">↩</button>
                            {isMine && <button className="msg-action-btn" onClick={() => deleteMessage(msg.id)} title="Delete">🗑️</button>}
                          </div>
                        )}
                        {showReactions === msg.id && !msg.deleted && (
                          <div className="reaction-picker" style={{ left: isMine ? "auto" : 0, right: isMine ? 0 : "auto" }}>
                            {REACTIONS.map(emoji => (
                              <button key={emoji} className="reaction-picker-btn" onClick={() => toggleReaction(msg.id, emoji)}>{emoji}</button>
                            ))}
                          </div>
                        )}
                        <div className={"msg-bubble" + (isMine ? " mine" : " theirs") + (msg.deleted ? " deleted" : "")}>
                          {msg.replyTo && !msg.deleted && (
                            <div className="reply-quote">
                              <strong>{msg.replyTo.senderName}</strong><br />
                              {msg.replyTo.text}
                            </div>
                          )}
                          {msg.type === "image" && msg.imageUrl && !msg.deleted && (
                            <img src={msg.imageUrl} alt="Shared" onClick={() => window.open(msg.imageUrl, "_blank")} />
                          )}
                          {msg.type === "audio" && msg.audioUrl && !msg.deleted && (
                            <AudioPlayer url={msg.audioUrl} />
                          )}
                          {msg.text && <span>{msg.text}</span>}
                          <span className="msg-time">
                            {formatTime(msg.createdAt)}
                            {isMine && <span className={"msg-tick" + (isRead ? " seen" : "")}> {isRead ? "✓✓" : "✓"}</span>}
                          </span>
                        </div>
                        {hasReactions && (
                          <div className="reactions-bar">
                            {Object.entries(msg.reactions || {}).filter(([, v]) => v.length > 0).map(([emoji, users]) => (
                              <span key={emoji} className={"reaction-chip" + (users.includes(currentUser.uid) ? " mine-reaction" : "")}
                                onClick={() => toggleReaction(msg.id, emoji)}>
                                {emoji} {users.length}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="typing-indicator">
              {isOtherTyping() && (
                <span className="typing-dots">{getOtherName(activeConv)} is typing<span>.</span><span>.</span><span>.</span></span>
              )}
            </div>

            {replyTo && (
              <div className="reply-preview">
                <span>↩ Replying to <strong>{replyTo.senderName}</strong>: {(replyTo.text || "📷 Photo").slice(0, 60)}</span>
                <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px" }}>✕</button>
              </div>
            )}

            <div className="msg-input-area">
              <label htmlFor="photo-send" className="msg-icon-btn" title="Send photo" style={{ cursor: "pointer" }}>📷</label>
              <input id="photo-send" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSend} />
              <button
                className={"msg-icon-btn" + (recording ? " recording" : "")}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                title="Hold to record voice message"
              >
                {recording ? "🔴" : "🎙️"}
              </button>
              <textarea
                ref={textareaRef}
                className="msg-input"
                placeholder="Type a message..."
                value={text}
                onChange={e => { setText(e.target.value); handleTyping(); }}
                onKeyDown={handleKey}
                rows={1}
              />
              <button className="msg-send-btn" onClick={handleSend} disabled={!text.trim() || sending}>➤</button>
            </div>
          </>
        )}
      </div>

      {showPicker && (
        <div className="member-picker" onClick={() => setShowPicker(false)}>
          <div className="member-picker-card" onClick={e => e.stopPropagation()}>
            <h3>💬 Start a Conversation</h3>
            <input className="form-input" placeholder="Search members..." onChange={e => setPickerSearch(e.target.value)} />
            <div style={{ overflowY: "auto", flex: 1 }}>
              {members.filter(m => m.fullName?.toLowerCase().includes(pickerSearch.toLowerCase())).map(m => (
                <div key={m.uid} className="member-row" onClick={() => startConversation(m)}>
                  {m.photoURL
                    ? <img src={m.photoURL} alt={m.fullName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    : <div className="conv-avatar-ph" style={{ width: 36, height: 36, fontSize: 14 }}>{m.fullName?.[0]}</div>}
                  <div className="member-row-info">
                    <h4>{m.fullName}</h4>
                    <span>{m.nationality} · {m.university}</span>
                  </div>
                  {m.verified && <span className="verified-badge">✓</span>}
                </div>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
