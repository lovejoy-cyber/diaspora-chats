import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, setDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { uploadToCloudinary, cleanText, containsProfanity, timeAgo, clockTime, lastSeenText, isUserOnline, threadId, throttle, groupMessages } from "../lib/helpers";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";
import Lightbox from "../components/Lightbox";

const EMOJIS = ["👍","❤️","😂","😮","😢","🙏","🔥","💯"];

const CSS = `
.ms{display:flex;height:100%;overflow:hidden}
.ms-side{width:300px;border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;background:var(--bg-card)}
.ms-sh{padding:10px;border-bottom:1px solid var(--border)}
.ms-sh input{width:100%;padding:8px 12px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:12.5px;outline:none;font-family:inherit}
.ms-sh input:focus{border-color:var(--primary)}
.ms-new{margin:9px;padding:9px;background:rgba(59,130,246,.1);border:1px dashed var(--primary);border-radius:11px;color:var(--primary-light);font-size:12px;font-weight:700;cursor:pointer;text-align:center;transition:background .15s}
.ms-new:hover{background:rgba(59,130,246,.2)}
.ms-cl{overflow-y:auto;flex:1}
.ms-c{display:flex;align-items:center;gap:10px;padding:11px 13px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s;position:relative}
.ms-c:hover{background:rgba(255,255,255,.04)}
.ms-c.active{background:rgba(59,130,246,.12)}
.ms-ci{flex:1;min-width:0}
.ms-cn{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px}
.ms-cp{font-size:11px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;max-width:190px}
.ms-cp.unread{color:var(--text);font-weight:600}
.ms-ct{font-size:10px;color:var(--text3);flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.ms-badge{background:var(--primary);color:#fff;font-size:10px;font-weight:800;border-radius:20px;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;padding:0 5px}
.ms-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;background:radial-gradient(ellipse at top,rgba(59,130,246,0.03),transparent 60%)}
.ms-h{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:var(--bg-card);flex-shrink:0}
.ms-back{background:none;border:none;color:var(--text2);cursor:pointer;font-size:19px;padding:0 4px 0 0;display:none}
.ms-hi{flex:1;min-width:0;cursor:pointer}
.ms-hi h4{font-size:14px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px}
.ms-hi span{font-size:11px;color:var(--text2)}
.ms-hi span.on{color:#10B981}
.ms-hactions{display:flex;gap:6px;flex-shrink:0;position:relative}
.ms-hbtn{background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.ms-hbtn:hover{background:rgba(59,130,246,.18);border-color:var(--primary);color:var(--primary-light)}
.ms-hmenu{position:absolute;top:calc(100% + 8px);right:0;background:var(--bg-card2);border:1px solid var(--border);border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.5);z-index:30;overflow:hidden;min-width:180px}
.ms-hmenu-item{display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s;color:var(--text)}
.ms-hmenu-item:hover{background:rgba(255,255,255,.06)}
.ms-area{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:2px}
.ms-day{text-align:center;font-size:11px;color:var(--text3);margin:14px 0 8px;font-weight:650}
.ms-day span{background:var(--bg-card);padding:3px 12px;border-radius:20px;border:1px solid var(--border)}
.ms-row{display:flex;align-items:flex-end;gap:7px;margin-bottom:2px}
.ms-row.grouped{margin-bottom:2px}
.ms-row.grouped-first{margin-top:10px}
.ms-row.mine{flex-direction:row-reverse}
.ms-avatar-slot{width:26px;flex-shrink:0}
.ms-wrap{display:flex;flex-direction:column;max-width:70%;min-width:0;position:relative}
.ms-sender-name{font-size:10.5px;color:var(--text2);font-weight:700;margin-bottom:2px;margin-left:2px;display:flex;align-items:center;gap:4px}
.ms-bub{padding:9px 13px;border-radius:16px;font-size:13.5px;line-height:1.55;word-break:break-word}
.ms-bub.theirs{background:var(--bg-card2);border:1px solid var(--border);border-bottom-left-radius:5px}
.ms-bub.mine{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border-bottom-right-radius:5px}
.ms-bub.grouped.theirs{border-top-left-radius:5px}
.ms-bub.grouped.mine{border-top-right-radius:5px}
.ms-bub.del{opacity:.5;font-style:italic;background:transparent!important;border:1px dashed var(--border)!important;color:var(--text2)!important}
.ms-bub img{max-width:100%;border-radius:9px;display:block;cursor:pointer}
.ms-t{font-size:9px;opacity:.65;margin-top:4px;display:block;text-align:right}
.ms-tick.seen{color:#93C5FD}
.ms-tools{display:flex;gap:3px;margin-bottom:2px;align-self:center}
.ms-tool{background:none;border:none;cursor:pointer;font-size:12px;opacity:0;padding:3px;border-radius:5px;transition:opacity .15s}
.ms-row:hover .ms-tool{opacity:.9}
.ms-tool:hover{background:rgba(255,255,255,.1)}
.ms-rx{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}
.ms-chip{background:rgba(255,255,255,.08);border:1px solid var(--border);border-radius:20px;padding:2px 7px;font-size:11px;cursor:pointer}
.ms-chip.on{background:rgba(59,130,246,.2);border-color:var(--primary)}
.ms-pick{position:absolute;bottom:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:6px;display:flex;gap:4px;z-index:10;box-shadow:0 8px 24px rgba(0,0,0,.5)}
.ms-pick button{background:none;border:none;font-size:18px;cursor:pointer;padding:3px;border-radius:6px}
.ms-pick button:hover{background:rgba(255,255,255,.1)}
.ms-quote{background:rgba(255,255,255,.07);border-left:2px solid rgba(255,255,255,.35);padding:4px 8px;margin-bottom:5px;border-radius:0 5px 5px 0;font-size:11px;opacity:.85}
.ms-reply{background:rgba(59,130,246,.1);border-left:3px solid var(--primary);padding:8px 12px;margin:0 13px 7px;border-radius:0 9px 9px 0;font-size:12px;color:var(--text2);display:flex;justify-content:space-between;align-items:center;gap:8px}
.ms-typing{padding:5px 18px;font-size:11.5px;color:var(--text2);font-style:italic;height:24px;display:flex;align-items:center;gap:6px}
.ms-typing-dot{width:5px;height:5px;border-radius:50%;background:var(--text2);animation:msTypingBounce 1.2s infinite}
.ms-typing-dot:nth-child(2){animation-delay:.2s}
.ms-typing-dot:nth-child(3){animation-delay:.4s}
@keyframes msTypingBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-3px);opacity:1}}
.ms-input-area{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end;background:var(--bg-card);flex-shrink:0;position:relative}
.ms-input{flex:1;padding:10px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:20px;color:var(--text);font-size:13.5px;outline:none;font-family:inherit;resize:none;max-height:110px;line-height:1.5}
.ms-input:focus{border-color:var(--primary)}
.ms-attach-btn{background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text2);width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:17px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
.ms-attach-btn:hover{background:rgba(59,130,246,.15);color:var(--primary-light)}
.ms-attach-btn.rec{background:rgba(239,68,68,.2);border-color:#ef4444;color:#fca5a5}
.ms-send{padding:0;width:40px;height:40px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border:none;border-radius:50%;font-size:16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.ms-send:disabled{opacity:.4;cursor:not-allowed}
.ms-empty{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--text2)}
.ms-empty-icon{font-size:42px;opacity:.5}
.ms-audio{display:flex;align-items:center;gap:8px;min-width:160px}
.ms-audio-btn{background:rgba(255,255,255,.16);border:none;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0}
.ms-audio-bar{flex:1;height:22px;display:flex;align-items:center;gap:1.5px}
.ms-audio-wave{width:2.5px;border-radius:2px;background:rgba(255,255,255,.35)}
.ms-audio-wave.done{background:rgba(255,255,255,.85)}
.ms-pop{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px}
.ms-pop-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:20px;width:100%;max-width:380px;max-height:78vh;display:flex;flex-direction:column;gap:10px}
.ms-attach-menu{position:absolute;bottom:calc(100% + 8px);left:14px;background:var(--bg-card2);border:1px solid var(--border);border-radius:16px;padding:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;box-shadow:0 12px 32px rgba(0,0,0,.5);z-index:20}
.ms-attach-opt{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border-radius:12px;cursor:pointer;transition:background .15s;border:none;background:none;color:var(--text);font-family:inherit}
.ms-attach-opt:hover{background:rgba(255,255,255,.06)}
.ms-attach-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:19px}
.ms-attach-label{font-size:10.5px;color:var(--text2);font-weight:600}
.ms-mrow{display:flex;align-items:center;gap:10px;padding:9px;border-radius:10px;cursor:pointer;transition:background .15s}
.ms-mrow:hover{background:rgba(255,255,255,.05)}
@media(max-width:768px){
  .ms-side{width:100%;position:absolute;z-index:10;height:100%}
  .ms-side.hidden{display:none}
  .ms-main{width:100%}
  .ms-back{display:block}
}
`;

function AudioPlayer({ url }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const bars = useMemo(() => Array.from({ length: 24 }, () => 6 + Math.round(Math.random() * 16)), []);
  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };
  return (
    <div className="ms-audio">
      <audio ref={ref} src={url} onTimeUpdate={e => setProgress((e.target.currentTime / e.target.duration) * 100 || 0)} onEnded={() => { setPlaying(false); setProgress(0); }} />
      <button className="ms-audio-btn" onClick={toggle}>{playing ? "⏸" : "▶"}</button>
      <div className="ms-audio-bar">
        {bars.map((h, i) => <div key={i} className={"ms-audio-wave" + (i / bars.length * 100 < progress ? " done" : "")} style={{ height: h }} />)}
      </div>
    </div>
  );
}

export default function Messages() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showRx, setShowRx] = useState(null);
  const [recording, setRecording] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAttach, setShowAttach] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const bottomRef = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const fileRef = useRef(null);
  const videoFileRef = useRef(null);
  const docFileRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("ms-css")) {
      const s = document.createElement("style");
      s.id = "ms-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!showHeaderMenu) return;
    const close = () => setShowHeaderMenu(false);
    const t = setTimeout(() => document.addEventListener("click", close), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", close); };
  }, [showHeaderMenu]);

  useEffect(() => {
    if (!currentUser) return;
    // No orderBy here on purpose — array-contains + orderBy on a different field needs a
    // Firestore composite index, and an unbuilt index makes this listener fail silently
    // (same root cause as an earlier notifications-bell bug). Sorting client-side instead
    // means this works immediately on any fresh Firestore project, no manual index setup.
    const q = query(collection(db, "conversations"), where("participants", "array-contains", currentUser.uid));
    return onSnapshot(q, snap => {
      const convos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      convos.sort((a, b) => (b.lastMessageAt?.toDate?.()?.getTime?.() || 0) - (a.lastMessageAt?.toDate?.()?.getTime?.() || 0));
      setConversations(convos);
    }, err => console.error("Conversations listener failed:", err));
  }, [currentUser]);

  // Auto-open a conversation if navigated here with ?start=uid (optionally ?listing=id to attach context)
  useEffect(() => {
    const startUid = searchParams.get("start");
    const listingId = searchParams.get("listing");
    if (!startUid || !userProfile) return;
    getDoc(doc(db, "users", startUid)).then(snap => {
      if (snap.exists()) startConversation(snap.data(), listingId);
    });
    // eslint-disable-next-line
  }, [searchParams, userProfile]);

  useEffect(() => {
    if (!active) return;
    setMessages([]);
    const q = query(collection(db, "conversations", active.id, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      msgs.forEach(msg => {
        // If read receipts are off for this user, we still clear our own unread badge,
        // but we don't write ourselves into readBy — so the sender never sees a "seen" tick from us.
        if (userProfile?.readReceiptsEnabled === false) return;
        if (msg.senderId !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)) {
          updateDoc(doc(db, "conversations", active.id, "messages", msg.id), { readBy: [...(msg.readBy || []), currentUser.uid] }).catch(() => {});
        }
      });
      updateDoc(doc(db, "conversations", active.id), { ["unread_" + currentUser.uid]: 0 }).catch(() => {});
    });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const oid = active.participants?.find(p => p !== currentUser.uid);
    if (!oid) return;
    return onSnapshot(doc(db, "users", oid), snap => { if (snap.exists()) setOtherProfile(snap.data()); });
  }, [active]);

  useEffect(() => {
    if (!showPicker) return;
    getDocs(collection(db, "users")).then(snap => {
      const seen = new Map();
      snap.docs.forEach(d => {
        const u = d.data();
        if (u.uid && u.uid !== currentUser.uid && u.profileComplete && !userProfile?.blockedUsers?.includes(u.uid)) seen.set(u.uid, u);
      });
      setMembers(Array.from(seen.values()));
    });
  }, [showPicker]);

  const getOid = c => c.participants?.find(p => p !== currentUser.uid);
  const getOName = c => c.participantNames?.[getOid(c)] || "Member";
  const getOPhoto = c => c.participantPhotos?.[getOid(c)] || "";
  const getUnread = c => c["unread_" + currentUser.uid] || 0;

  const startConversation = async (member, listingId) => {
    setShowPicker(false);
    const tid = threadId(currentUser.uid, member.uid);
    // Check local state first (fast path), then Firestore directly (authoritative — closes any race
    // condition where the onSnapshot listener hasn't loaded yet and we'd otherwise overwrite the thread).
    const existingLocal = conversations.find(c => c.id === tid);
    if (existingLocal) { setActive(existingLocal); setShowSidebar(false); if (listingId) sendListingContext(tid, listingId); return; }
    const existingSnap = await getDoc(doc(db, "conversations", tid));
    if (existingSnap.exists()) {
      setActive({ id: tid, ...existingSnap.data() });
      setShowSidebar(false);
      if (listingId) sendListingContext(tid, listingId);
      return;
    }
    const data = {
      participants: [currentUser.uid, member.uid],
      participantNames: { [currentUser.uid]: userProfile.fullName, [member.uid]: member.fullName },
      participantPhotos: { [currentUser.uid]: userProfile.photoURL || "", [member.uid]: member.photoURL || "" },
      lastMessage: "", lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "conversations", tid), data);
    setActive({ ...data, id: tid });
    setShowSidebar(false);
    if (listingId) sendListingContext(tid, listingId);
  };

  // When arriving from a Marketplace listing, drop a small reference message so both people
  // know exactly which listing the conversation is about.
  const sendListingContext = async (convId, listingId) => {
    try {
      const listingSnap = await getDoc(doc(db, "listings", listingId));
      if (!listingSnap.exists()) return;
      const l = listingSnap.data();
      await addDoc(collection(db, "conversations", convId, "messages"), {
        senderId: currentUser.uid, senderName: userProfile.fullName, senderPhoto: userProfile.photoURL || "",
        createdAt: serverTimestamp(), deleted: false, readBy: [currentUser.uid], reactions: {}, type: "listing_ref",
        listingRef: {
          id: listingId, title: l.title || "Listing",
          currency: l.currency || "", amount: l.price || "",
          direction: l.direction || "", fromCountry: l.fromCountry || "", toCountry: l.toCountry || "",
        },
        text: "",
      });
    } catch (e) { /* listing lookup failing shouldn't block the conversation from opening */ }
  };

  // Forwards a message's content into a (possibly brand new) conversation with the chosen
  // person, tagged as forwarded so the recipient knows it originated elsewhere.
  const forwardMessageTo = async (member) => {
    if (!forwardingMsg) return;
    setShowPicker(false);
    const tid = threadId(currentUser.uid, member.uid);
    let convId = tid;
    const existingLocal = conversations.find(c => c.id === tid);
    if (!existingLocal) {
      const existingSnap = await getDoc(doc(db, "conversations", tid));
      if (!existingSnap.exists()) {
        await setDoc(doc(db, "conversations", tid), {
          participants: [currentUser.uid, member.uid],
          participantNames: { [currentUser.uid]: userProfile.fullName, [member.uid]: member.fullName },
          participantPhotos: { [currentUser.uid]: userProfile.photoURL || "", [member.uid]: member.photoURL || "" },
          lastMessage: "", lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(),
        });
      }
    }
    const forwardPayload = {
      senderId: currentUser.uid, senderName: userProfile.fullName, senderPhoto: userProfile.photoURL || "",
      createdAt: serverTimestamp(), deleted: false, readBy: [currentUser.uid], reactions: {},
      forwarded: true,
      type: forwardingMsg.type || "text",
      text: forwardingMsg.text || "",
      imageUrl: forwardingMsg.imageUrl || null,
      audioUrl: forwardingMsg.audioUrl || null,
      docUrl: forwardingMsg.docUrl || null,
      docName: forwardingMsg.docName || null,
    };
    await addDoc(collection(db, "conversations", convId, "messages"), forwardPayload);
    await updateDoc(doc(db, "conversations", convId), {
      lastMessage: "↪ Forwarded: " + (forwardingMsg.text || (forwardingMsg.imageUrl ? "Photo" : forwardingMsg.audioUrl ? "Voice message" : "Document")),
      lastMessageAt: serverTimestamp(),
      lastSenderId: currentUser.uid,
      ["unread_" + member.uid]: 1,
    });
    setForwardingMsg(null);
    if (active?.id !== convId) {
      setActive({ id: convId, participants: [currentUser.uid, member.uid], participantNames: { [currentUser.uid]: userProfile.fullName, [member.uid]: member.fullName }, participantPhotos: { [currentUser.uid]: userProfile.photoURL || "", [member.uid]: member.photoURL || "" } });
      setShowSidebar(false);
    }
  };

  // Throttled typing write — only hits Firestore at most once every 2.5s while typing,
  // instead of on every keystroke (this was the source of the input glitch).
  const throttledTypingRef = useRef(
    throttle((convId, uid) => {
      updateDoc(doc(db, "conversations", convId), { ["typing_" + uid]: serverTimestamp() }).catch(() => {});
    }, 2500)
  );

  const handleTyping = val => {
    setText(val);
    if (!active) return;
    throttledTypingRef.current(active.id, currentUser.uid);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, "conversations", active.id), { ["typing_" + currentUser.uid]: null }).catch(() => {});
    }, 3000);
  };

  const isOtherTyping = () => {
    if (!active || !otherProfile) return false;
    const oid = getOid(active);
    const ts = active["typing_" + oid];
    if (!ts) return false;
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return (Date.now() - d.getTime()) < 3500;
  };

  const isMuted = active?.["muted_" + currentUser.uid] === true;
  const toggleMute = async () => {
    if (!active) return;
    await updateDoc(doc(db, "conversations", active.id), { ["muted_" + currentUser.uid]: !isMuted });
  };

  const isArchived = active?.["archived_" + currentUser.uid] === true;
  const toggleArchive = async () => {
    if (!active) return;
    const next = !isArchived;
    await updateDoc(doc(db, "conversations", active.id), { ["archived_" + currentUser.uid]: next });
    if (next) { setActive(null); setShowSidebar(true); } // archiving closes the open thread and returns to the list
  };

  const sendMessage = async overrides => {
    if (!active) return;
    const oid = getOid(active);
    const payload = {
      senderId: currentUser.uid, senderName: userProfile.fullName, senderPhoto: userProfile.photoURL || "",
      createdAt: serverTimestamp(), deleted: false, readBy: [currentUser.uid], reactions: {},
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text || "📷 Photo", senderName: replyTo.senderName } : null,
      ...overrides,
    };
    await addDoc(collection(db, "conversations", active.id, "messages"), payload);
    await updateDoc(doc(db, "conversations", active.id), {
      lastMessage: overrides.text || (overrides.imageUrl ? "📷 Photo" : overrides.audioUrl ? "🎙 Voice message" : overrides.docUrl ? "📄 " + (overrides.docName||"Document") : ""),
      lastMessageAt: serverTimestamp(),
      lastSenderId: currentUser.uid,
      ["unread_" + oid]: (active["unread_" + oid] || 0) + 1,
      ["typing_" + currentUser.uid]: null,
      // Sending a message un-archives the thread for both people — receiving a real new
      // message is exactly the moment a conversation shouldn't stay hidden away.
      ["archived_" + currentUser.uid]: false,
      ["archived_" + oid]: false,
    });
    setReplyTo(null);
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = cleanText(text.trim());
    setText("");
    setSending(true);
    await sendMessage({ text: content, type: "text" });
    setSending(false);
  };

  const handlePhoto = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setShowAttach(false); setSending(true);
    try { const imageUrl = await uploadToCloudinary(file, "image"); await sendMessage({ imageUrl, type: "image", text: "" }); }
    catch { alert("Photo upload failed."); }
    setSending(false); e.target.value = "";
  };

  const handleVideo = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setShowAttach(false); setSending(true);
    try { const videoUrl = await uploadToCloudinary(file, "video"); await sendMessage({ videoUrl, type: "video", text: "" }); }
    catch { alert("Video upload failed."); }
    setSending(false); e.target.value = "";
  };

  const handleDoc = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setShowAttach(false); setSending(true);
    try { const docUrl = await uploadToCloudinary(file, "raw"); await sendMessage({ docUrl, docName: file.name, type: "doc", text: "" }); }
    catch { alert("Document upload failed."); }
    setSending(false); e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        setSending(true);
        try { const audioUrl = await uploadToCloudinary(blob, "video"); await sendMessage({ audioUrl, type: "audio", text: "" }); }
        catch { alert("Voice message upload failed."); }
        setSending(false);
      };
      rec.start(); mediaRecRef.current = rec; setRecording(true);
    } catch { alert("Microphone permission denied."); }
  };
  const stopRecording = () => { if (mediaRecRef.current) { mediaRecRef.current.stop(); setRecording(false); } };

  const deleteMessage = async id => {
    await updateDoc(doc(db, "conversations", active.id, "messages", id), { deleted: true, text: "This message was deleted", imageUrl: null, audioUrl: null, docUrl: null });
  };

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const startEdit = msg => { setEditingId(msg.id); setEditText(msg.text || ""); };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, "conversations", active.id, "messages", editingId), { text: cleanText(editText.trim()), edited: true });
    setEditingId(null); setEditText("");
  };

  const toggleStar = async msg => {
    const starred = msg.starredBy || [];
    const has = starred.includes(currentUser.uid);
    await updateDoc(doc(db, "conversations", active.id, "messages", msg.id), {
      starredBy: has ? starred.filter(u => u !== currentUser.uid) : [...starred, currentUser.uid]
    });
  };

  const toggleReaction = async (id, emoji) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    const cur = msg.reactions?.[emoji] || [];
    const has = cur.includes(currentUser.uid);
    const updated = has ? cur.filter(u => u !== currentUser.uid) : [...cur, currentUser.uid];
    const reactions = { ...msg.reactions, [emoji]: updated };
    if (updated.length === 0) delete reactions[emoji];
    await updateDoc(doc(db, "conversations", active.id, "messages", id), { reactions });
    setShowRx(null);
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // Swipe-to-reply — tracks a touch drag on a message bubble; swiping far enough right
  // (for their messages) or left (for yours) triggers Reply, same gesture as WhatsApp.
  const swipeStateRef = useRef({});
  const [swipeOffset, setSwipeOffset] = useState({});
  const SWIPE_THRESHOLD = 60;

  const onTouchStart = (msgId, e) => {
    swipeStateRef.current[msgId] = { startX: e.touches[0].clientX, active: true };
  };
  const onTouchMove = (msgId, isMine, e) => {
    const s = swipeStateRef.current[msgId];
    if (!s?.active) return;
    const dx = e.touches[0].clientX - s.startX;
    const clamped = isMine ? Math.min(0, Math.max(dx, -80)) : Math.max(0, Math.min(dx, 80));
    setSwipeOffset(prev => ({ ...prev, [msgId]: clamped }));
  };
  const onTouchEnd = (msgId, msg) => {
    const offset = swipeOffset[msgId] || 0;
    if (Math.abs(offset) > SWIPE_THRESHOLD) setReplyTo(msg);
    setSwipeOffset(prev => ({ ...prev, [msgId]: 0 }));
    if (swipeStateRef.current[msgId]) swipeStateRef.current[msgId].active = false;
  };

  const online = isUserOnline(otherProfile);
  const groupedMsgs = useMemo(() => groupMessages(messages), [messages]);
  const displayMsgs = useMemo(() => {
    if (!msgSearchQuery.trim()) return groupedMsgs;
    const q = msgSearchQuery.toLowerCase();
    return groupedMsgs.filter(m => !m.deleted && m.text?.toLowerCase().includes(q));
  }, [groupedMsgs, msgSearchQuery]);
  // Defensive dedupe: only one conversation row per "other person," even if stray duplicate
  // documents exist in Firestore from an older build. Keeps the most recently active one.
  const dedupedConvs = useMemo(() => {
    const byOther = new Map();
    conversations.forEach(c => {
      const oid = getOid(c);
      if (!oid) return;
      const existing = byOther.get(oid);
      const cTime = c.lastMessageAt?.toDate?.()?.getTime?.() || 0;
      const existingTime = existing?.lastMessageAt?.toDate?.()?.getTime?.() || 0;
      if (!existing || cTime >= existingTime) byOther.set(oid, c);
    });
    return Array.from(byOther.values()).sort((a, b) => {
      const ta = a.lastMessageAt?.toDate?.()?.getTime?.() || 0;
      const tb = b.lastMessageAt?.toDate?.()?.getTime?.() || 0;
      return tb - ta;
    });
  }, [conversations]);

  const filteredConvs = dedupedConvs
    .filter(c => showArchived ? c["archived_" + currentUser.uid] === true : c["archived_" + currentUser.uid] !== true)
    .filter(c => getOName(c).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ms">
      <div className={"ms-side" + (showSidebar ? "" : " hidden")}>
        <div className="ms-sh"><input placeholder="🔍 Search conversations..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="ms-new" onClick={() => setShowPicker(true)}>✏️ New Message</div>
        <div
          style={{ padding: "0 12px 8px", fontSize: 11.5, color: "var(--primary-light)", cursor: "pointer", fontWeight: 650 }}
          onClick={() => setShowArchived(a => !a)}
        >
          {showArchived ? "← Back to chats" : "🗄️ View archived chats"}
        </div>
        <div className="ms-cl">
          {filteredConvs.length === 0 && <div style={{ padding: "30px 16px", textAlign: "center", fontSize: 13, color: "var(--text2)" }}>No conversations yet.<br />Start one above.</div>}
          {filteredConvs.map(c => {
            const name = getOName(c), photo = getOPhoto(c), unread = getUnread(c);
            const muted = c["muted_" + currentUser.uid] === true;
            return (
              <div key={c.id} className={"ms-c" + (active?.id === c.id ? " active" : "")} onClick={() => { setActive(c); setShowSidebar(false); }}>
                <Avatar src={photo} name={name} size={44} online={isUserOnline(members.find(m => m.uid === getOid(c)))} />
                <div className="ms-ci">
                  <div className="ms-cn">{name}{muted && <span style={{ fontSize: 11, opacity: .6 }}>🔕</span>}</div>
                  <div className={"ms-cp" + (unread > 0 && !muted ? " unread" : "")}>{c.lastMessage || "Tap to chat"}</div>
                </div>
                <div className="ms-ct">
                  <span>{timeAgo(c.lastMessageAt)}</span>
                  {unread > 0 && <span className="ms-badge" style={muted ? { background: "var(--text3)" } : undefined}>{unread > 9 ? "9+" : unread}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ms-main">
        {!active ? (
          <div className="ms-empty"><div className="ms-empty-icon">💬</div><div style={{ fontWeight: 700, fontSize: 16 }}>Your Messages</div><div style={{ fontSize: 13 }}>Select a conversation or start a new one</div></div>
        ) : (
          <>
            <div className="ms-h">
              <button className="ms-back" onClick={() => setShowSidebar(true)}>←</button>
              <div className="ms-hi" onClick={() => navigate("/dashboard/user/" + getOid(active))}>
                <Avatar src={getOPhoto(active)} name={getOName(active)} size={38} />
              </div>
              <div className="ms-hi" onClick={() => navigate("/dashboard/user/" + getOid(active))} style={{ display: "flex", flexDirection: "column" }}>
                <h4>{getOName(active)}{otherProfile?.verified && <span className="verified-badge">✓</span>}<RoleBadge role={otherProfile?.role} small /></h4>
                <span className={online ? "on" : ""}>{online ? "🟢 Online" : otherProfile ? lastSeenText(otherProfile) : ""}</span>
              </div>
              <div className="ms-hactions">
                <button className="ms-hbtn" title="Chat options" onClick={() => setShowHeaderMenu(!showHeaderMenu)}>⋯</button>
                {showHeaderMenu && (
                  <div className="ms-hmenu">
                    <div className="ms-hmenu-item" onClick={() => { setShowHeaderMenu(false); navigate("/dashboard/calls?call=" + getOid(active) + "&type=voice"); }}>📞 Voice Call</div>
                    <div className="ms-hmenu-item" onClick={() => { setShowHeaderMenu(false); navigate("/dashboard/calls?call=" + getOid(active) + "&type=video"); }}>📹 Video Call</div>
                    <div className="ms-hmenu-item" onClick={() => { setShowHeaderMenu(false); setShowMsgSearch(true); }}>🔍 Search in Chat</div>
                    <div className="ms-hmenu-item" onClick={() => { setShowHeaderMenu(false); toggleMute(); }}>{isMuted ? "🔔 Unmute" : "🔕 Mute Notifications"}</div>
                    <div className="ms-hmenu-item" onClick={() => { setShowHeaderMenu(false); toggleArchive(); }}>{isArchived ? "📥 Unarchive" : "🗄️ Archive Chat"}</div>
                    <div className="ms-hmenu-item" onClick={() => { setShowHeaderMenu(false); navigate("/dashboard/user/" + getOid(active)); }}>👤 View Profile</div>
                  </div>
                )}
              </div>
            </div>

            {showMsgSearch && (
              <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-card)" }}>
                <input
                  autoFocus
                  className="form-input"
                  placeholder="🔍 Search in this conversation..."
                  value={msgSearchQuery}
                  onChange={e => setMsgSearchQuery(e.target.value)}
                  style={{ flex: 1, margin: 0 }}
                />
                <button className="btn-secondary" style={{ width: "auto", padding: "0 14px", margin: 0 }} onClick={() => { setShowMsgSearch(false); setMsgSearchQuery(""); }}>✕</button>
              </div>
            )}

            <div className="ms-area">
              {displayMsgs.length === 0 && <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "40px 0" }}>{msgSearchQuery ? "No matching messages." : "No messages yet. Say hello! 👋"}</div>}
              {displayMsgs.map((msg, i) => {
                const isMine = msg.senderId === currentUser.uid;
                const prev = displayMsgs[i - 1];
                const showDate = !prev || msg.createdAt?.toDate?.()?.toDateString() !== prev.createdAt?.toDate?.()?.toDateString();
                const isRead = msg.readBy?.some(id => id !== currentUser.uid);
                const hasRx = msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions[k].length > 0);
                return (
                  <div key={msg.id}>
                    {showDate && msg.createdAt && <div className="ms-day"><span>{msg.createdAt.toDate().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</span></div>}
                    <div
                      className={"ms-row" + (isMine ? " mine" : "") + (msg.isFirstInGroup ? " grouped-first" : " grouped")}
                      style={{ transform: "translateX(" + (swipeOffset[msg.id] || 0) + "px)", transition: swipeOffset[msg.id] ? "none" : "transform .2s", position: "relative" }}
                      onTouchStart={e => onTouchStart(msg.id, e)}
                      onTouchMove={e => onTouchMove(msg.id, isMine, e)}
                      onTouchEnd={() => onTouchEnd(msg.id, msg)}
                    >
                      {Math.abs(swipeOffset[msg.id] || 0) > 15 && (
                        <span style={{ position: "absolute", top: "50%", [isMine ? "left" : "right"]: -28, transform: "translateY(-50%)", fontSize: 16, opacity: Math.min(1, Math.abs(swipeOffset[msg.id] || 0) / SWIPE_THRESHOLD) }}>↩</span>
                      )}
                      <div className="ms-avatar-slot">
                        {!isMine && msg.isLastInGroup && <Avatar src={msg.senderPhoto} name={msg.senderName} size={26} />}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%", position: "relative" }}>
                        {!msg.deleted && (
                          <div className="ms-tools">
                            <button className="ms-tool" onClick={() => setShowRx(showRx === msg.id ? null : msg.id)} title="React">😊</button>
                            <button className="ms-tool" onClick={() => setReplyTo(msg)} title="Reply">↩</button>
                            <button className="ms-tool" onClick={() => { setForwardingMsg(msg); setShowPicker(true); }} title="Forward">➦</button>
                            <button className="ms-tool" onClick={() => toggleStar(msg)} title={msg.starredBy?.includes(currentUser.uid) ? "Unstar" : "Star"}>{msg.starredBy?.includes(currentUser.uid) ? "⭐" : "☆"}</button>
                            {isMine && msg.type === "text" && <button className="ms-tool" onClick={() => startEdit(msg)} title="Edit">✏️</button>}
                            {isMine && <button className="ms-tool" onClick={() => deleteMessage(msg.id)} title="Delete">🗑️</button>}
                          </div>
                        )}
                        {showRx === msg.id && !msg.deleted && (
                          <div className="ms-pick" style={{ left: isMine ? "auto" : 0, right: isMine ? 0 : "auto" }}>
                            {EMOJIS.map(e => <button key={e} onClick={() => toggleReaction(msg.id, e)}>{e}</button>)}
                          </div>
                        )}
                        {editingId === msg.id ? (
                          <div className={"ms-bub" + (isMine ? " mine" : " theirs")} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <input
                              autoFocus
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, padding: "6px 9px", color: "inherit", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                            />
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "inherit", opacity: .8, cursor: "pointer", fontSize: 11 }}>Cancel</button>
                              <button onClick={saveEdit} style={{ background: "none", border: "none", color: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 11 }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className={"ms-bub" + (isMine ? " mine" : " theirs") + (msg.isFirstInGroup ? "" : " grouped") + (msg.deleted ? " del" : "")}>
                            {msg.forwarded && !msg.deleted && <div style={{ fontSize: 10.5, opacity: .7, fontStyle: "italic", marginBottom: 3 }}>➦ Forwarded</div>}
                            {msg.replyTo && !msg.deleted && <div className="ms-quote"><strong>{msg.replyTo.senderName}</strong><br />{msg.replyTo.text}</div>}
                            {msg.type === "image" && msg.imageUrl && !msg.deleted && <img src={msg.imageUrl} alt="" onClick={() => setLightboxSrc(msg.imageUrl)} />}
                            {msg.type === "video" && msg.videoUrl && !msg.deleted && <video src={msg.videoUrl} controls playsInline style={{ maxWidth: 260, borderRadius: 10, display: "block" }} />}
                            {msg.type === "audio" && msg.audioUrl && !msg.deleted && <AudioPlayer url={msg.audioUrl} />}
                            {msg.type === "doc" && msg.docUrl && !msg.deleted && (
                              <a href={msg.docUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                                📄 <span style={{ textDecoration: "underline" }}>{msg.docName || "Document"}</span>
                              </a>
                            )}
                            {msg.type === "listing_ref" && msg.listingRef && !msg.deleted && (
                              <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "9px 11px", marginBottom: msg.text ? 6 : 0 }}>
                                <div style={{ fontSize: 11, opacity: .8, marginBottom: 2 }}>💸 Regarding this listing</div>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{msg.listingRef.title}</div>
                                {(msg.listingRef.currency || msg.listingRef.amount) && (
                                  <div style={{ fontSize: 12, opacity: .85, marginTop: 2 }}>{msg.listingRef.amount} {msg.listingRef.currency}</div>
                                )}
                                {msg.listingRef.direction && (
                                  <div style={{ fontSize: 12, opacity: .85, marginTop: 2 }}>{msg.listingRef.direction}{msg.listingRef.fromCountry ? " · from " + msg.listingRef.fromCountry : ""}{msg.listingRef.toCountry ? " → " + msg.listingRef.toCountry : ""}</div>
                                )}
                              </div>
                            )}
                            {msg.text && <span>{msg.text}</span>}
                            <span className="ms-t">
                              {msg.edited && !msg.deleted && <em style={{ opacity: .7, marginRight: 5 }}>edited</em>}
                              {msg.starredBy?.length > 0 && <span style={{ marginRight: 4 }}>⭐</span>}
                              {clockTime(msg.createdAt)}{isMine && <span className={"ms-tick" + (isRead ? " seen" : "")}> {isRead ? "✓✓" : "✓"}</span>}
                            </span>
                          </div>
                        )}
                        {hasRx && <div className="ms-rx">{Object.entries(msg.reactions || {}).filter(([, v]) => v.length > 0).map(([e, u]) => <span key={e} className={"ms-chip" + (u.includes(currentUser.uid) ? " on" : "")} onClick={() => toggleReaction(msg.id, e)}>{e} {u.length}</span>)}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="ms-typing">
              {isOtherTyping() && <>{getOName(active)} is typing <span className="ms-typing-dot" /><span className="ms-typing-dot" /><span className="ms-typing-dot" /></>}
            </div>

            {replyTo && (
              <div className="ms-reply">
                <span>↩ Replying to <strong>{replyTo.senderName}</strong>: {(replyTo.text || "📷 Photo").slice(0, 50)}</span>
                <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            )}

            <div className="ms-input-area">
              {showAttach && (
                <div className="ms-attach-menu">
                  <button className="ms-attach-opt" onClick={() => { fileRef.current?.click(); }}>
                    <span className="ms-attach-icon" style={{ background: "rgba(59,130,246,.18)", color: "#60a5fa" }}>📷</span>
                    <span className="ms-attach-label">Photo</span>
                  </button>
                  <button className="ms-attach-opt" onClick={() => { videoFileRef.current?.click(); }}>
                    <span className="ms-attach-icon" style={{ background: "rgba(236,72,153,.18)", color: "#f472b6" }}>🎬</span>
                    <span className="ms-attach-label">Video</span>
                  </button>
                  <button className="ms-attach-opt" onClick={() => { docFileRef.current?.click(); }}>
                    <span className="ms-attach-icon" style={{ background: "rgba(139,92,246,.18)", color: "#a78bfa" }}>📄</span>
                    <span className="ms-attach-label">Document</span>
                  </button>
                  <button className="ms-attach-opt" onClick={() => { setShowAttach(false); navigate("/dashboard/user/" + getOid(active)); }}>
                    <span className="ms-attach-icon" style={{ background: "rgba(16,185,129,.18)", color: "#34d399" }}>👤</span>
                    <span className="ms-attach-label">Profile</span>
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              <input ref={videoFileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideo} />
              <input ref={docFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" style={{ display: "none" }} onChange={handleDoc} />
              <button className="ms-attach-btn" onClick={() => setShowAttach(!showAttach)} title="Attach">📎</button>
              <button
                className={"ms-attach-btn" + (recording ? " rec" : "")}
                onMouseDown={startRecording} onMouseUp={stopRecording}
                onTouchStart={startRecording} onTouchEnd={stopRecording}
                title="Hold to record voice message"
              >{recording ? "🔴" : "🎙️"}</button>
              <textarea className="ms-input" placeholder="Type a message..." value={text} onChange={e => handleTyping(e.target.value)} onKeyDown={handleKey} rows={1} />
              <button className="ms-send" onClick={handleSend} disabled={!text.trim() || sending}>➤</button>
            </div>
          </>
        )}
      </div>

      {showPicker && (
        <div className="ms-pop" onClick={() => { setShowPicker(false); setForwardingMsg(null); }}>
          <div className="ms-pop-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>{forwardingMsg ? "➦ Forward to..." : "💬 Start a Conversation"}</h3>
            {forwardingMsg && (
              <div className="ms-reply" style={{ margin: 0 }}>
                <span>
                  {forwardingMsg.text
                    ? forwardingMsg.text.slice(0, 60)
                    : forwardingMsg.imageUrl ? "📷 Photo" : forwardingMsg.audioUrl ? "🎙 Voice message" : "📄 Document"}
                </span>
              </div>
            )}
            <input className="form-input" placeholder="Search members..." onChange={e => setPickerSearch(e.target.value)} />
            <div style={{ overflowY: "auto", flex: 1 }}>
              {members.filter(m => m.fullName?.toLowerCase().includes(pickerSearch.toLowerCase())).map(m => (
                <div key={m.uid} className="ms-mrow" onClick={() => forwardingMsg ? forwardMessageTo(m) : startConversation(m)}>
                  <Avatar src={m.photoURL} name={m.fullName} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>{m.fullName}{m.verified && <span className="verified-badge">✓</span>}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{m.nationality} · {m.university}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => { setShowPicker(false); setForwardingMsg(null); }}>Cancel</button>
          </div>
        </div>
      )}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
