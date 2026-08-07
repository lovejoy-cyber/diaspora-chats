import { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { COUNTRY_ROOMS, INTEREST_ROOMS, CONTINENTS } from "../lib/rooms";
import { cleanText as cleanTextHelper } from "../lib/helpers";

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
  const [search, setSearch] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
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

  const sendMessage = async () => {
    if(!text.trim()||!activeRoom||!canPost(activeRoom)) return;
    const filtered = filterContent(text.trim());
    await addDoc(collection(db,"rooms",activeRoom.id,"messages"), {
      text:filtered,
      senderId:currentUser.uid,
      senderName:userProfile.fullName,
      senderPhoto:userProfile.photoURL||"",
      senderRole:userProfile.role||"student",
      senderVerified:userProfile.verified||false,
      createdAt:serverTimestamp(),
    });
    setText("");
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
  const allCustom = customRooms.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));

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
            </div>

            <div className="room-messages">
              {messages.length===0&&(
                <div style={{textAlign:"center",color:"var(--text2)",fontSize:13,padding:"40px 0"}}>
                  No messages yet in {activeRoom.name}. Be the first! 👋
                </div>
              )}
              {messages.map(msg=>{
                const isMine = msg.senderId===currentUser.uid;
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
                      <div className={"room-msg-bubble"+(isMine?" mine":" theirs")}>{msg.text}</div>
                      <div className="room-msg-time">{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="room-input-area">
              {!canPost(activeRoom) ? (
                <div style={{flex:1,textAlign:"center",fontSize:12,color:"var(--text2)",padding:"8px 0"}}>
                  🔒 Read-only channel. Only embassy and admins can post here.
                </div>
              ) : (
                <>
                  <input className="room-input" placeholder={"Message "+activeRoom.name+"..."} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){sendMessage();}}} />
                  <button className="room-send-btn" onClick={sendMessage} disabled={!text.trim()}>➤</button>
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
    </div>
  );
}
