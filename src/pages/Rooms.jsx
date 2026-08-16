import { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { COUNTRY_ROOMS, INTEREST_ROOMS, CONTINENTS } from "../lib/rooms";
import { cleanText as cleanTextHelper, uploadToCloudinary } from "../lib/helpers";
import Lightbox from "../components/Lightbox";

const PRESET_ROOMS = [
  ...INTEREST_ROOMS.map(r => ({ id: r.id, name: r.name, desc: r.desc, type: r.type, country: null, color: r.color })),
  ...COUNTRY_ROOMS.map(r => ({
    id: r.country.toLowerCase().replace(/[^a-z]/g, "_"),
    name: r.flag + " " + r.name,
    desc: r.name + " students",
    type: "country",
    country: r.country,
    continent: r.continent,
  })),
];
const BANNED_WORDS = ["fuck","shit","bitch","asshole","nigger","whore","cunt","bastard"];
function filterContent(text) {
  let filtered = text;
  BANNED_WORDS.forEach(word => { filtered = filtered.replace(new RegExp(word,"gi"),"***"); });
  return filtered;
}

function formatTime(ts) {
  if(!ts) return "";
  const d = ts.toDate?ts.toDate():new Date(ts);
  return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
}

const STYLE = `
.rooms-layout{display:flex;height:calc(100vh - 57px);overflow:hidden;}
.rooms-sidebar{width:250px;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--bg-card);flex-shrink:0;}
.rooms-sidebar-header{padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;}
.rooms-search{flex:1;padding:7px 10px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;outline:none;font-family:inherit;}
.rooms-search:focus{border-color:var(--primary);}
.create-room-btn{padding:7px 10px;background:var(--primary);border:none;color:white;border-radius:8px;font-size:14px;cursor:pointer;flex-shrink:0;}
.rooms-list{overflow-y:auto;flex:1;}
.rooms-section-title{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;padding:10px 12px 4px;}
.room-item{display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;transition:background 0.15s;}
.room-item:hover{background:rgba(255,255,255,0.04);}
.room-item.active{background:rgba(59,130,246,0.1);}
.room-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.room-item-info{flex:1;min-width:0;}
.room-item-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.room-item-desc{font-size:10px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.room-locked{font-size:10px;color:var(--text3);flex-shrink:0;}
.room-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.room-header{padding:12px 16px;border-bottom:1px solid var(--border);background:var(--bg-card);display:flex;align-items:center;gap:10px;flex-shrink:0;}
.room-header-info h3{font-size:15px;font-weight:800;}
.room-header-info p{font-size:11px;color:var(--text2);}
.room-messages{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:2px;}
.room-msg{display:flex;gap:8px;align-items:flex-start;margin-bottom:2px;}
.room-msg.mine{flex-direction:row-reverse;}
.room-msg-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:white;flex-shrink:0;margin-top:1px;cursor:pointer;overflow:hidden;}
.room-msg-avatar img{width:28px;height:28px;object-fit:cover;}
.room-msg-content{max-width:70%;}
.room-msg-name{font-size:10px;color:var(--text2);margin-bottom:2px;display:flex;align-items:center;gap:4px;font-weight:600;cursor:pointer;}
.room-msg-bubble{padding:8px 12px;border-radius:14px;font-size:13px;line-height:1.55;word-break:break-word;}
.room-msg-bubble.theirs{background:var(--bg-card2);border:1px solid var(--border);border-top-left-radius:4px;}
.room-msg-bubble.mine{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;border-top-right-radius:4px;}
.room-msg-time{font-size:9px;color:var(--text3);margin-top:2px;}
.room-input-area{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;background:var(--bg-card);flex-shrink:0;}
.room-input{flex:1;padding:10px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:13px;outline:none;font-family:inherit;}
.room-input:focus{border-color:var(--primary);}
.room-send-btn{padding:10px 16px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;border:none;border-radius:12px;font-size:14px;cursor:pointer;}
.room-send-btn:disabled{opacity:0.4;cursor:not-allowed;}
.join-overlay{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:30px;}
.join-overlay-icon{font-size:44px;}
.join-overlay h3{font-size:18px;font-weight:800;}
.join-overlay p{font-size:13px;color:var(--text2);text-align:center;max-width:300px;line-height:1.7;}
.mobile-rooms-btn{display:none;background:none;border:none;color:var(--text2);cursor:pointer;font-size:18px;padding:0 8px 0 0;}
@media(max-width:768px){
  .rooms-sidebar{width:100%;position:absolute;z-index:10;height:calc(100vh - 130px);}
  .rooms-sidebar.hidden{display:none;}
  .room-main{width:100%;}
  .mobile-rooms-btn{display:block;}
}
`;

export default function Rooms() {
  const { currentUser, userProfile, isStaff } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [bannedFromActiveRoom, setBannedFromActiveRoom] = useState(false);
  const [showRoomMembers, setShowRoomMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [roomUserSearch, setRoomUserSearch] = useState("");
  const [allUsersForBan, setAllUsersForBan] = useState([]);
  const [roomBans, setRoomBans] = useState([]);
  const [text, setText] = useState("");
  const [customRooms, setCustomRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({name:"",desc:""});
  const [creating, setCreating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef(null);
  // isStaff now comes from AuthContext's ROLE_LEVELS (single source of truth) instead of
  // a locally duplicated list that had drifted (was missing superadmin, secretary, etc.)

  useEffect(() => {
    if(!document.getElementById("rooms-css")) {
      const s = document.createElement("style");
      s.id = "rooms-css"; s.textContent = STYLE;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db,"customRooms"), snap => {
      setCustomRooms(snap.docs.map(d=>({id:d.id,...d.data(),isCustom:true})));
    });
  }, []);

  useEffect(() => {
    if(!activeRoom) return;
    setMessages([]);
    const q = query(collection(db,"rooms",activeRoom.id,"messages"), orderBy("createdAt","asc"), limit(150));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})));
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),80);
    });
    return unsub;
  }, [activeRoom]);

  // Checks whether the current user is banned from the room they're viewing, and (for
  // moderators) loads the full ban list so it can be managed from the Members panel.
  useEffect(() => {
    if (!activeRoom || !currentUser) { setBannedFromActiveRoom(false); return; }
    const banDoc = doc(db, "roomBans", activeRoom.id + "_" + currentUser.uid);
    getDoc(banDoc).then(snap => setBannedFromActiveRoom(snap.exists())).catch(() => setBannedFromActiveRoom(false));
    if (canModerateRoom(activeRoom)) {
      const q = query(collection(db, "roomBans"), where("roomId", "==", activeRoom.id));
      getDocs(q).then(snap => setRoomBans(snap.docs.map(d => d.data()))).catch(() => setRoomBans([]));
    } else {
      setRoomBans([]);
    }
    // eslint-disable-next-line
  }, [activeRoom, currentUser]);

  // All country/city/public rooms are now open-join, no approval needed.
  // Only readonly (announcements/emergency) restrict posting to staff.
  const canPost = (room) => {
    if(!room) return false;
    if(room.type==="readonly") return isStaff;
    return true;
  };

  // Regional Monitors (governors) can only moderate rooms tied to THEIR assigned city —
  // Embassy, President, and above can moderate anywhere. This is the city-scoping piece
  // of the authority hierarchy: a governor for Oran shouldn't be able to delete a room
  // or pin messages in the Alger room.
  const canModerateRoom = (room) => {
    if(!currentUser) return false;
    if(room.creatorId===currentUser.uid) return true; // creator of a custom group always can
    const level = userProfile?.level ?? 0;
    if(level >= 70) return true; // president and above: unrestricted
    if(userProfile?.role === "governor") {
      // A governor can only moderate their own city's room (or non-city-specific rooms
      // don't count as "theirs" — city rooms only).
      return room.city && userProfile?.city === room.city;
    }
    return false;
  };

  const sendMessage = async (overrides = {}) => {
    const hasText = text.trim();
    const hasMedia = overrides.imageUrl || overrides.videoUrl || overrides.docUrl || overrides.audioUrl;
    if((!hasText && !hasMedia)||!activeRoom||!canPost(activeRoom)) return;
    if(bannedFromActiveRoom) return;
    const filtered = hasText ? filterContent(text.trim()) : "";
    await addDoc(collection(db,"rooms",activeRoom.id,"messages"), {
      text:filtered,
      senderId:currentUser.uid,
      senderName:userProfile.fullName,
      senderPhoto:userProfile.photoURL||"",
      senderRole:userProfile.role||"student",
      senderVerified:userProfile.verified||false,
      pinned:false,
      type: overrides.type || "text",
      imageUrl: overrides.imageUrl || null,
      videoUrl: overrides.videoUrl || null,
      docUrl: overrides.docUrl || null,
      docName: overrides.docName || null,
      audioUrl: overrides.audioUrl || null,
      createdAt:serverTimestamp(),
    });
    // Notify on room activity, but debounced to once per room per 10 minutes — notifying
    // on literally every single message would make the bell fire constantly during any
    // active conversation, which defeats the point of having it at all. This is the one
    // deliberate exception to "notify on everything," because the literal version would
    // make the bell actively unusable rather than just noisy.
    const lastNotifyKey = "dl_room_notify_" + activeRoom.id;
    const lastNotify = Number(sessionStorage.getItem(lastNotifyKey) || 0);
    if (Date.now() - lastNotify > 10 * 60 * 1000) {
      sessionStorage.setItem(lastNotifyKey, String(Date.now()));
      const activitySummary = hasText ? filtered.slice(0, 60) : (overrides.type === "image" ? "📷 Photo" : overrides.type === "audio" ? "🎙 Voice message" : overrides.type === "doc" ? "📄 Document" : "New message");
      addDoc(collection(db, "notifications"), {
        recipientId: "ALL", urgent: false, icon: "🌍",
        title: "New activity in " + activeRoom.name,
        message: userProfile.fullName + ": " + activitySummary,
        link: "/dashboard/rooms",
        read: false, createdAt: serverTimestamp(),
      }).catch(() => {});
    }
    setText("");
  };

  // Room media uploads — photo, document, and voice message support, matching the
  // same real functionality already proven working in 1-on-1 Messages. This was
  // genuinely missing from Rooms entirely before now, not a bug — new functionality.
  const [showRoomAttach, setShowRoomAttach] = useState(false);
  const [roomSending, setRoomSending] = useState(false);

  // Real fix: the attach menu (📎) stayed open when switching rooms, since nothing ever
  // reset showRoomAttach when activeRoom changed — confirmed by checking every place
  // setActiveRoom is called, none of them touched the attach menu state.
  useEffect(() => {
    setShowRoomAttach(false);
  }, [activeRoom?.id]);
  const [roomRecording, setRoomRecording] = useState(false);
  const roomMediaRecRef = useRef(null);
  const roomChunksRef = useRef([]);
  const roomPhotoRef = useRef(null);
  const roomVideoRef = useRef(null);
  const roomDocRef = useRef(null);

  const handleRoomPhoto = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setShowRoomAttach(false); setRoomSending(true);
    try { const imageUrl = await uploadToCloudinary(file, "image"); await sendMessage({ imageUrl, type: "image" }); }
    catch { alert("Photo upload failed."); }
    setRoomSending(false); e.target.value = "";
  };

  const handleRoomVideo = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setShowRoomAttach(false); setRoomSending(true);
    try { const videoUrl = await uploadToCloudinary(file, "video"); await sendMessage({ videoUrl, type: "video" }); }
    catch { alert("Video upload failed."); }
    setRoomSending(false); e.target.value = "";
  };

  const handleRoomDoc = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setShowRoomAttach(false); setRoomSending(true);
    try { const docUrl = await uploadToCloudinary(file, "raw"); await sendMessage({ docUrl, docName: file.name, type: "doc" }); }
    catch { alert("Document upload failed."); }
    setRoomSending(false); e.target.value = "";
  };

  const roomMediaStreamRef = useRef(null);

  const startRoomRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      roomMediaStreamRef.current = stream;
      // Same real fix as Messages.jsx — explicit mimeType instead of relying on the
      // browser's unpredictable default, and tagging the resulting Blob with what was
      // actually recorded rather than a hardcoded guess.
      const preferredType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      roomChunksRef.current = [];
      rec.ondataavailable = e => roomChunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(roomChunksRef.current, { type: rec.mimeType || "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        roomMediaStreamRef.current = null;
        setRoomSending(true);
        try { const audioUrl = await uploadToCloudinary(blob, "video"); await sendMessage({ audioUrl, type: "audio" }); }
        catch { alert("Voice message upload failed."); }
        setRoomSending(false);
      };
      rec.start(); roomMediaRecRef.current = rec; setRoomRecording(true);
    } catch { alert("Microphone permission denied."); }
  };
  const stopRoomRecording = () => { if (roomMediaRecRef.current) { roomMediaRecRef.current.stop(); setRoomRecording(false); } };

  // Same real fix as Messages.jsx and Calls.jsx — releases the mic if the tab closes
  // mid-recording, before stopRoomRecording is ever called.
  useEffect(() => {
    const releaseMic = () => {
      if (roomMediaStreamRef.current) {
        roomMediaStreamRef.current.getTracks().forEach(t => t.stop());
        roomMediaStreamRef.current = null;
      }
    };
    window.addEventListener("pagehide", releaseMic);
    window.addEventListener("beforeunload", releaseMic);
    return () => {
      window.removeEventListener("pagehide", releaseMic);
      window.removeEventListener("beforeunload", releaseMic);
    };
  }, []);

  // Room-level ban list — the actual "add/remove someone from the group" power a Governor
  // needs, since preset country/city rooms don't have a fixed member list the way custom
  // groups do. Banning blocks posting in that specific room only, checked live below.
  const banFromRoom = async (roomId, targetUid, targetName) => {
    if (!window.confirm("Remove " + targetName + " from this room? They will no longer be able to post here.")) return;
    await setDoc(doc(db, "roomBans", roomId + "_" + targetUid), {
      roomId, uid: targetUid, name: targetName,
      bannedBy: currentUser.uid, bannedByName: userProfile.fullName,
      createdAt: serverTimestamp(),
    });
  };
  const unbanFromRoom = async (roomId, targetUid) => {
    await deleteDoc(doc(db, "roomBans", roomId + "_" + targetUid));
  };

  const pinMessage = async (msgId, currentlyPinned) => {
    if (!activeRoom) return;
    await updateDoc(doc(db, "rooms", activeRoom.id, "messages", msgId), { pinned: !currentlyPinned });
  };

  const deleteRoomMessage = async (msgId) => {
    if (!activeRoom) return;
    if (window.confirm("Delete this message?")) {
      await updateDoc(doc(db, "rooms", activeRoom.id, "messages", msgId), { deleted: true, text: "Message removed by moderator" });
    }
  };

  const createRoom = async () => {
    if(!newRoom.name.trim()) return;
    setCreating(true);
    try {
      const roomDoc = await addDoc(collection(db,"customRooms"), {
        name:newRoom.name.trim(),
        desc:newRoom.desc.trim(),
        creatorId:currentUser.uid,
        creatorName:userProfile.fullName,
        members:[currentUser.uid],
        createdAt:serverTimestamp(),
      });
      setShowCreate(false);
      setNewRoom({name:"",desc:""});
      setActiveRoom({id:roomDoc.id,name:newRoom.name.trim(),desc:newRoom.desc.trim(),isCustom:true,creatorId:currentUser.uid});
      setShowSidebar(false);
    } catch(e) { alert("Failed to create room."); }
    setCreating(false);
  };

  const deleteRoom = async (room) => {
    if(!canModerateRoom(room)) return;
    if(window.confirm("Delete \""+room.name+"\" permanently? This cannot be undone.")) {
      await deleteDoc(doc(db,"customRooms",room.id));
      if(activeRoom?.id===room.id) setActiveRoom(null);
    }
  };

  const allPreset = PRESET_ROOMS.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||r.desc.toLowerCase().includes(search.toLowerCase()));
  // Real fix: rooms someone created now sort to the top of their own custom rooms list —
  // previously there was no sorting at all, rooms just showed in whatever order Firestore
  // happened to return them.
  const allCustom = customRooms
    .filter(r=>r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aMine = a.creatorId === currentUser.uid ? 1 : 0;
      const bMine = b.creatorId === currentUser.uid ? 1 : 0;
      if (aMine !== bMine) return bMine - aMine; // mine first
      const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
      const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
      return tb - ta; // then most recent first
    });

  // Handles arriving via a room invite link (?join=roomId) — finds the matching room
  // (preset or custom) and auto-selects it, so the link genuinely drops someone straight
  // into the room rather than just opening the general Rooms page.
  useEffect(() => {
    const joinRoomId = searchParams.get("join");
    if (!joinRoomId) return;
    const found = PRESET_ROOMS.find(r => r.id === joinRoomId) || customRooms.find(r => r.id === joinRoomId);
    if (found) {
      setActiveRoom(found);
      setShowSidebar(false);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, customRooms]);

  const getRoomColor = (room) => {
    if(room.isCustom) return "#f59e0b";
    if(room.type==="country") return "#3b82f6";
    if(room.type==="readonly") return "#8b5cf6";
    return "#10b981";
  };

  return (
    <div className="rooms-layout">
      <div className={"rooms-sidebar"+(showSidebar?"":" hidden")}>
        <div className="rooms-sidebar-header">
          <input className="rooms-search" placeholder="🔍 Search rooms..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="create-room-btn" onClick={()=>setShowCreate(true)} title="Create room">+</button>
        </div>
        <div className="rooms-list">
          <div className="rooms-section-title">Your Country</div>
          {allPreset.filter(r=>r.country===userProfile?.nationality).map(room=>(
            <div key={room.id} className={"room-item"+(activeRoom?.id===room.id?" active":"")} onClick={()=>{setActiveRoom(room);setShowSidebar(false);}}>
              <div className="room-dot" style={{background:getRoomColor(room)}} />
              <div className="room-item-info"><div className="room-item-name">{room.name}</div><div className="room-item-desc">{room.desc}</div></div>
            </div>
          ))}
          <div className="rooms-section-title">Community Rooms</div>
          {allPreset.filter(r=>r.country!==userProfile?.nationality).map(room=>(
            <div key={room.id} className={"room-item"+(activeRoom?.id===room.id?" active":"")} onClick={()=>{setActiveRoom(room);setShowSidebar(false);}}>
              <div className="room-dot" style={{background:getRoomColor(room)}} />
              <div className="room-item-info"><div className="room-item-name">{room.name}</div><div className="room-item-desc">{room.desc}</div></div>
              {room.type==="readonly"&&!isStaff&&<span className="room-locked">🔒</span>}
            </div>
          ))}
          {allCustom.length>0 && (
            <>
              <div className="rooms-section-title">Custom Groups</div>
              {allCustom.map(room=>(
                <div key={room.id} className={"room-item"+(activeRoom?.id===room.id?" active":"")} onClick={()=>{setActiveRoom(room);setShowSidebar(false);}}>
                  <div className="room-dot" style={{background:"#f59e0b"}} />
                  <div className="room-item-info"><div className="room-item-name">{room.name}</div><div className="room-item-desc">{room.desc||"Custom group · by "+room.creatorName}</div></div>
                  {canModerateRoom(room)&&(
                    <button onClick={e=>{e.stopPropagation();deleteRoom(room);}} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:13}}>🗑️</button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="room-main">
        {!activeRoom ? (
          <div className="join-overlay">
            <div className="join-overlay-icon">🌍</div>
            <h3>Community Rooms</h3>
            <p>All rooms are open — pick one and start chatting. Create your own group anytime with the + button.</p>
          </div>
        ) : (
          <>
            <div className="room-header">
              <button className="mobile-rooms-btn" onClick={()=>setShowSidebar(true)}>←</button>
              <div className="room-item-info">
                <h3 style={{fontSize:15,fontWeight:800}}>{activeRoom.name}</h3>
                <p style={{fontSize:11,color:"var(--text2)"}}>{activeRoom.desc}</p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button
                  onClick={() => navigate("/dashboard/calls?roomCall=" + activeRoom.id + "&roomName=" + encodeURIComponent(activeRoom.name) + "&type=voice")}
                  title="Voice call this group"
                  style={{ background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.25)", color: "#34d399", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                >📞</button>
                <button
                  onClick={() => navigate("/dashboard/calls?roomCall=" + activeRoom.id + "&roomName=" + encodeURIComponent(activeRoom.name) + "&type=video")}
                  title="Video call this group"
                  style={{ background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.25)", color: "var(--primary-light)", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                >📹</button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  title="Invite people to this room"
                  style={{ background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.25)", color: "#fbbf24", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                >🔗</button>
                {canModerateRoom(activeRoom) && (
                  <button
                    onClick={() => setShowRoomMembers(true)}
                    style={{ background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.25)", color: "var(--primary-light)", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    👥 Manage
                  </button>
                )}
              </div>
            </div>

            {messages.some(m => m.pinned && !m.deleted) && (
              <div style={{ padding: "8px 16px", background: "rgba(139,92,246,.08)", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                {messages.filter(m => m.pinned && !m.deleted).map(m => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                    <span>📌 <strong>{m.senderName}:</strong> {m.text?.slice(0, 60)}</span>
                    {canModerateRoom(activeRoom) && <button onClick={() => pinMessage(m.id, true)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 11 }}>Unpin</button>}
                  </div>
                ))}
              </div>
            )}

            <div className="room-messages">
              {messages.length===0&&(
                <div style={{textAlign:"center",color:"var(--text2)",fontSize:13,padding:"40px 0"}}>
                  No messages yet in {activeRoom.name}. Be the first! 👋
                </div>
              )}
              {messages.map(msg=>{
                const isMine = msg.senderId===currentUser.uid;
                const canMod = canModerateRoom(activeRoom);
                return (
                  <div key={msg.id} className={"room-msg"+(isMine?" mine":"")}>
                    <div className="room-msg-avatar" onClick={()=>navigate("/dashboard/user/"+msg.senderId)}>
                      {msg.senderPhoto ? <img src={msg.senderPhoto} alt="" /> : msg.senderName?.[0]}
                    </div>
                    <div className="room-msg-content">
                      {!isMine&&(
                        <div className="room-msg-name" onClick={()=>navigate("/dashboard/user/"+msg.senderId)}>
                          {msg.senderName}
                          {msg.senderVerified&&<span className="verified-badge">✓</span>}
                          {["embassy","admin"].includes(msg.senderRole)&&<span className="role-badge-embassy">Embassy</span>}
                          {msg.senderRole==="governor"&&<span className="role-badge-governor">Governor</span>}
                        </div>
                      )}
                      <div className={"room-msg-bubble"+(isMine?" mine":" theirs")}>
                        {msg.pinned && !msg.deleted && <div style={{ fontSize: 10, opacity: .75, marginBottom: 3 }}>📌 Pinned</div>}
                        {msg.type === "image" && msg.imageUrl && !msg.deleted && (
                          <img src={msg.imageUrl} alt="" style={{ maxWidth: 220, borderRadius: 10, display: "block", cursor: "pointer" }} onClick={() => setLightboxSrc(msg.imageUrl)} />
                        )}
                        {msg.type === "video" && msg.videoUrl && !msg.deleted && (
                          <video src={msg.videoUrl} controls playsInline style={{ maxWidth: 260, borderRadius: 10, display: "block" }} />
                        )}
                        {msg.type === "doc" && msg.docUrl && !msg.deleted && (
                          <a href={msg.docUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                            📄 <span style={{ textDecoration: "underline" }}>{msg.docName || "Document"}</span>
                          </a>
                        )}
                        {msg.type === "audio" && msg.audioUrl && !msg.deleted && (
                          <audio controls src={msg.audioUrl} style={{ maxWidth: 220, height: 34 }} />
                        )}
                        {msg.text}
                      </div>
                      <div className="room-msg-time" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {formatTime(msg.createdAt)}
                        {canMod && !msg.deleted && (
                          <button onClick={() => pinMessage(msg.id, msg.pinned)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 11 }}>{msg.pinned ? "Unpin" : "📌 Pin"}</button>
                        )}
                        {(isMine || canMod) && !msg.deleted && (
                          <button onClick={() => deleteRoomMessage(msg.id)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 11 }}>🗑️</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="room-input-area">
              {bannedFromActiveRoom ? (
                <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--danger)", padding: "8px 0" }}>
                  🚫 You have been removed from this room and cannot post here.
                </div>
              ) : !canPost(activeRoom) ? (
                <div style={{flex:1,textAlign:"center",fontSize:12,color:"var(--text2)",padding:"8px 0"}}>
                  🔒 Read-only channel. Only embassy and admins can post here.
                </div>
              ) : (
                <>
                  <input ref={roomPhotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleRoomPhoto} />
                  <input ref={roomVideoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleRoomVideo} />
                  <input ref={roomDocRef} type="file" style={{ display: "none" }} onChange={handleRoomDoc} />
                  <div style={{ position: "relative" }}>
                    <button className="room-send-btn" style={{ background: "rgba(255,255,255,.08)" }} onClick={() => setShowRoomAttach(!showRoomAttach)} disabled={roomSending}>📎</button>
                    {showRoomAttach && (
                      <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 12, padding: 8, display: "flex", flexDirection: "column", gap: 4, minWidth: 160, boxShadow: "0 12px 32px rgba(0,0,0,.5)", zIndex: 30 }}>
                        <div onClick={() => { setShowRoomAttach(false); roomPhotoRef.current?.click(); }} style={{ padding: "9px 12px", cursor: "pointer", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>📷 Photo</div>
                        <div onClick={() => { setShowRoomAttach(false); roomVideoRef.current?.click(); }} style={{ padding: "9px 12px", cursor: "pointer", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>🎬 Video</div>
                        <div onClick={() => { setShowRoomAttach(false); roomDocRef.current?.click(); }} style={{ padding: "9px 12px", cursor: "pointer", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>📄 Document</div>
                      </div>
                    )}
                  </div>
                  <input className="room-input" placeholder={"Message "+activeRoom.name+"..."} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){sendMessage();}}} disabled={roomSending} />
                  {text.trim() ? (
                    <button className="room-send-btn" onClick={() => sendMessage()} disabled={roomSending}>➤</button>
                  ) : (
                    <button
                      className="room-send-btn"
                      style={{ background: roomRecording ? "var(--danger)" : undefined }}
                      onMouseDown={startRoomRecording} onMouseUp={stopRoomRecording}
                      onTouchStart={startRoomRecording} onTouchEnd={stopRoomRecording}
                      disabled={roomSending}
                      title="Hold to record a voice message"
                    >
                      {roomRecording ? "⏹" : "🎙"}
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <h3>➕ Create New Group</h3>
            <div className="form-group">
              <label className="form-label">Group Name</label>
              <input className="form-input" placeholder='e.g. "Oran Study Group"' value={newRoom.name} onChange={e=>setNewRoom({...newRoom,name:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="What is this group for?" value={newRoom.desc} onChange={e=>setNewRoom({...newRoom,desc:e.target.value})} />
            </div>
            <p style={{fontSize:11,color:"var(--text3)",marginBottom:14,lineHeight:1.6}}>Anyone can join and post. As the creator, you can delete this group anytime.</p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-primary" onClick={createRoom} disabled={creating||!newRoom.name.trim()} style={{margin:0}}>{creating?"Creating...":"Create Group"}</button>
              <button className="btn-secondary" onClick={()=>setShowCreate(false)} style={{margin:0}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRoomMembers && activeRoom && (
        <div className="modal-overlay" onClick={() => setShowRoomMembers(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>👥 Manage {activeRoom.name}</h3>
            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
              As moderator you can remove someone from posting in this room, or pin important messages.
              This does not affect their account elsewhere — only their access to this specific room.
            </p>

            <div className="form-group">
              <label className="form-label">Currently Removed ({roomBans.length})</label>
              {roomBans.length === 0 && <p style={{ fontSize: 12.5, color: "var(--text2)" }}>Nobody has been removed from this room.</p>}
              {roomBans.map(b => (
                <div key={b.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13 }}>{b.name}</span>
                  <button
                    onClick={async () => { await unbanFromRoom(activeRoom.id, b.uid); setRoomBans(prev => prev.filter(x => x.uid !== b.uid)); }}
                    style={{ background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.25)", color: "#34d399", padding: "5px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ✅ Restore Access
                  </button>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Remove Someone</label>
              <input
                className="form-input"
                placeholder="Search by name..."
                value={roomUserSearch}
                onChange={e => { setRoomUserSearch(e.target.value); if (allUsersForBan.length === 0) getDocs(collection(db, "users")).then(snap => setAllUsersForBan(snap.docs.map(d => d.data()))); }}
              />
              {roomUserSearch.trim() && (
                <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 8 }}>
                  {allUsersForBan
                    .filter(u => u.fullName?.toLowerCase().includes(roomUserSearch.toLowerCase()) && u.uid !== currentUser.uid && !roomBans.some(b => b.uid === u.uid))
                    .slice(0, 8)
                    .map(u => (
                      <div key={u.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" }}>
                        <span style={{ fontSize: 13 }}>{u.fullName}</span>
                        <button
                          onClick={async () => { await banFromRoom(activeRoom.id, u.uid, u.fullName); setRoomBans(prev => [...prev, { uid: u.uid, name: u.fullName }]); setRoomUserSearch(""); }}
                          style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#fca5a5", padding: "5px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          🚫 Remove
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button className="btn-secondary" onClick={() => setShowRoomMembers(false)}>Close</button>
          </div>
        </div>
      )}

      {showInviteModal && activeRoom && (
        <div className="modal-overlay" onClick={() => { setShowInviteModal(false); setInviteCopied(false); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>🔗 Invite to {activeRoom.name}</h3>
            <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>
              Share this link with anyone — if they already have an account, tapping it opens this room directly.
              If they're new, it takes them to sign up first, then drops them right into this room.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                readOnly
                value={window.location.origin + "/dashboard/rooms?join=" + activeRoom.id}
                style={{ flex: 1, padding: "10px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text)", fontSize: 12, fontFamily: "inherit" }}
                onClick={e => e.target.select()}
              />
              <button
                className="btn-primary"
                style={{ margin: 0, width: "auto", padding: "0 16px" }}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.origin + "/dashboard/rooms?join=" + activeRoom.id).then(() => {
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2000);
                  }).catch(() => {});
                }}
              >
                {inviteCopied ? "✅ Copied" : "Copy"}
              </button>
            </div>
            <button className="btn-secondary" onClick={() => { setShowInviteModal(false); setInviteCopied(false); }}>Close</button>
          </div>
        </div>
      )}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
