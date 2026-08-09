import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { isUserOnline, threadId, AGORA_APP_ID, fetchAgoraToken, callChannelId } from "../lib/helpers";
import { placeCall, updateCallStatus } from "../lib/callSignaling";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";

const CSS = `
.cl{padding:16px 14px;overflow-y:auto;height:100%}
.cl-top{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.cl-s{flex:1;min-width:180px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:13px;outline:none;font-family:inherit}
.cl-s:focus{border-color:var(--primary)}
.cl-gbtn{padding:10px 16px;background:linear-gradient(135deg,var(--accent),#6D28D9);color:#fff;border:none;border-radius:12px;font-size:12.5px;font-weight:750;cursor:pointer;font-family:inherit}
.cl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.cl-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:15px 11px;display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center;transition:all .2s}
.cl-card:hover{border-color:var(--primary);transform:translateY(-2px)}
.cl-n{font-size:13px;font-weight:750;display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:center}
.cl-m{font-size:10.5px;color:var(--text2)}
.cl-btns{display:flex;gap:6px;width:100%;margin-top:4px}
.cl-v{flex:1;padding:7px 4px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:#34d399;border-radius:9px;font-size:11.5px;font-weight:750;cursor:pointer;font-family:inherit}
.cl-v:hover{background:rgba(16,185,129,.22)}
.cl-c{flex:1;padding:7px 4px;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);color:var(--primary-light);border-radius:9px;font-size:11.5px;font-weight:750;cursor:pointer;font-family:inherit}
.cl-c:hover{background:rgba(59,130,246,.22)}
.cl-modal{position:fixed;inset:0;background:rgba(4,8,16,.96);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:14px;padding:16px}
.cl-box{background:var(--bg-card);border:1px solid var(--border);border-radius:22px;padding:26px 22px;text-align:center;width:100%;max-width:360px}
.cl-name{font-size:19px;font-weight:850;margin:12px 0 4px}
.cl-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:750;margin-bottom:14px}
.cl-badge.voice{background:rgba(16,185,129,.13);color:#34d399}
.cl-badge.video{background:rgba(59,130,246,.13);color:var(--primary-light)}
.cl-status{font-size:13px;color:var(--text2);margin-bottom:18px}
.cl-timer{font-size:26px;font-weight:850;color:var(--primary-light);letter-spacing:2px;display:block;margin-bottom:18px}
.cl-acts{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
.cl-ab{width:54px;height:54px;border-radius:50%;border:none;font-size:21px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.cl-ab.end{background:#ef4444}
.cl-ab.end:hover{background:#dc2626;transform:scale(1.1)}
.cl-ab.tog{background:var(--bg-input);border:1px solid var(--border)}
.cl-ab.tog:hover{background:rgba(255,255,255,.1)}
.cl-vid{width:100%;max-width:420px;aspect-ratio:3/4;max-height:46vh;background:#000;border-radius:16px;overflow:hidden;position:relative}
.cl-vid-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%;max-width:460px;max-height:60vh}
.cl-vid-lbl{position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:3px 9px;border-radius:20px}
.cl-vid-me{position:absolute;bottom:8px;right:8px;width:92px;aspect-ratio:3/4;background:#111;border-radius:10px;overflow:hidden;border:2px solid var(--primary)}
.cl-ring{animation:clRing .9s ease-in-out infinite}
@keyframes clRing{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
.cl-note{font-size:11.5px;color:var(--text3);text-align:center;margin-top:12px;line-height:1.6}
.cl-recent{margin-top:26px}
.cl-recent-title{font-size:13px;font-weight:750;color:var(--text2);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.cl-rrow{display:flex;align-items:center;gap:11px;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.04)}
.cl-rrow-info{flex:1;min-width:0}
.cl-rrow-name{font-size:13px;font-weight:650;display:flex;align-items:center;gap:6px}
.cl-rrow-meta{font-size:11px;color:var(--text2);display:flex;align-items:center;gap:5px;margin-top:1px}
.cl-rrow-icon{font-size:13px}
.cl-rrow-icon.missed{color:#ef4444}
.cl-rrow-icon.declined{color:#f59e0b}
.cl-rrow-icon.ended,.cl-rrow-icon.accepted{color:#10b981}
.cl-rrow-time{font-size:10.5px;color:var(--text3);flex-shrink:0}
.cl-rrow-callback{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);color:var(--primary-light);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:13px}
`;

const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

export default function Calls() {
  const { currentUser, userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("idle");
  const [target, setTarget] = useState(null);
  const [type, setType] = useState("voice");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [timer, setTimer] = useState(0);
  const [group, setGroup] = useState(false);
  const clientRef = useRef(null);
  const tracksRef = useRef([]);

  // Safety net: if this page unmounts while still in a call (user navigates away, closes
  // tab, etc.) release the camera/mic immediately rather than leaving them held until the
  // browser eventually garbage-collects — this is what was causing the camera light to
  // stay on after a call ended.
  useEffect(() => {
    return () => {
      tracksRef.current.forEach(t => {
        try {
          const mediaTrack = t.getMediaStreamTrack?.();
          if (mediaTrack) mediaTrack.stop();
          t.stop(); t.close();
        } catch (e) {}
      });
      if (clientRef.current) {
        try { clientRef.current.leave(); } catch (e) {}
      }
    };
  }, []);
  const timerRef = useRef(null);
  // (remoteRefs declared below, next to remoteUsers state)
  const localRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [callError, setCallError] = useState("");
  const [localCamTrack, setLocalCamTrack] = useState(null);
  // Remote participants tracked as a Map keyed by their UID — NOT single state values.
  // This was the actual bug: with useState(null) for a single remote track, every new
  // "user-published" event overwrote whoever published before them, so in a 3-person call
  // (or even 2 people joining close together) only the LAST person to publish was ever
  // visible/audible — explaining "one person speaks, others only hear" and "video box
  // empty for others." A Map lets every participant's audio/video track persist independently.
  const [remoteUsers, setRemoteUsers] = useState(new Map());
  const [activeCallId, setActiveCallId] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [limitError, setLimitError] = useState("");
  const remoteRefs = useRef({}); // uid -> DOM node, one per remote participant

  // Plays the local camera preview the moment the video box actually exists in the DOM —
  // fixes the black-screen bug, which was caused by a fixed setTimeout racing against a
  // conditionally-rendered <div> that didn't exist yet when the timer fired.
  useEffect(() => {
    if (localCamTrack && localRef.current) {
      localCamTrack.play(localRef.current);
    }
  }, [localCamTrack, state]);

  // Plays each remote participant's video into THEIR OWN dom node, keyed by uid, the
  // moment both the track and that node exist — same fix pattern as the local preview,
  // but now correctly handles more than one remote person at once.
  useEffect(() => {
    remoteUsers.forEach((info, uid) => {
      if (info.videoTrack && remoteRefs.current[uid]) {
        info.videoTrack.play(remoteRefs.current[uid]);
      }
    });
  }, [remoteUsers, state]);

  // Auto-start a call if we arrived here from a chat header (?call=uid&type=voice)
  useEffect(() => {
    const callUid = searchParams.get("call");
    const callType = searchParams.get("type") || "voice";
    if (!callUid || users.length === 0) return;
    const target = users.find(u => u.uid === callUid);
    if (target) {
      callUser(target, callType);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line
  }, [searchParams, users]);

  // Accepting an incoming call from IncomingCallListener — the caller already created the
  // "ringing" doc and channel, so we join directly rather than going through placeCall again.
  useEffect(() => {
    const joinChannel = searchParams.get("join");
    const joinType = searchParams.get("type");
    const callId = searchParams.get("callId");
    const withUid = searchParams.get("withUid");
    const withName = searchParams.get("withName");
    const withPhoto = searchParams.get("withPhoto");
    if (!joinChannel || !callId) return;
    setTarget({ uid: withUid, fullName: withName ? decodeURIComponent(withName) : "Caller", photoURL: withPhoto ? decodeURIComponent(withPhoto) : "" });
    setGroup(false);
    join(joinChannel, joinType || "voice", withName, callId);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line
  }, [searchParams]);

  // Recent Calls log — merges "calls I made" and "calls I received" into one
  // chronological list, like every phone's native call history.
  useEffect(() => {
    if (!currentUser) return;
    let mineAsCaller = [], mineAsRecipient = [];
    const merge = () => {
      const combined = [...mineAsCaller, ...mineAsRecipient].sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });
      setRecentCalls(combined.slice(0, 30));
    };
    const qCaller = query(collection(db, "calls"), where("callerId", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(30));
    const qRecipient = query(collection(db, "calls"), where("recipientId", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(30));
    const unsub1 = onSnapshot(qCaller, snap => { mineAsCaller = snap.docs.map(d => ({ id: d.id, ...d.data(), direction: "outgoing" })); merge(); }, () => {});
    const unsub2 = onSnapshot(qRecipient, snap => { mineAsRecipient = snap.docs.map(d => ({ id: d.id, ...d.data(), direction: "incoming" })); merge(); }, () => {});
    return () => { unsub1(); unsub2(); };
  }, [currentUser]);

  useEffect(() => {
    if (!document.getElementById("cl-css")) {
      const s = document.createElement("style");
      s.id = "cl-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    getDocs(collection(db, "users")).then(snap => {
      const seen = new Map();
      snap.docs.forEach(d => {
        const u = d.data();
        if (u.uid && u.uid !== currentUser.uid && u.profileComplete && !u.suspended) seen.set(u.uid, u);
      });
      setUsers(Array.from(seen.values()));
    });
  }, [currentUser]);

  useEffect(() => {
    if (state === "in-call") timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    else { clearInterval(timerRef.current); setTimer(0); }
    return () => clearInterval(timerRef.current);
  }, [state]);

  const join = async (channel, callType, label, callId) => {
    setType(callType); setState("calling");
    if (callId) setActiveCallId(callId);
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;
      const token = await fetchAgoraToken(channel, currentUser.uid);
      await client.join(AGORA_APP_ID, channel, token, currentUser.uid);
      const tracks = [];
      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      tracks.push(mic);
      if (callType === "video") {
        const cam = await AgoraRTC.createCameraVideoTrack();
        tracks.push(cam);
        setLocalCamTrack(cam); // triggers the useEffect above once the DOM box exists
      }
      await client.publish(tracks);
      tracksRef.current = tracks;
      client.on("user-published", async (user, media) => {
        await client.subscribe(user, media);
        setState("in-call");
        setRemoteUsers(prev => {
          const next = new Map(prev);
          const existing = next.get(user.uid) || {};
          if (media === "audio") {
            user.audioTrack.play();
            next.set(user.uid, { ...existing, audioTrack: user.audioTrack });
          }
          if (media === "video") {
            next.set(user.uid, { ...existing, videoTrack: user.videoTrack });
          }
          return next;
        });
      });
      client.on("user-unpublished", (user, media) => {
        setRemoteUsers(prev => {
          const next = new Map(prev);
          const existing = next.get(user.uid);
          if (existing) {
            const updated = { ...existing };
            if (media === "audio") updated.audioTrack = null;
            if (media === "video") updated.videoTrack = null;
            next.set(user.uid, updated);
          }
          return next;
        });
      });
      client.on("user-left", (user) => {
        setRemoteUsers(prev => {
          const next = new Map(prev);
          next.delete(user.uid);
          return next;
        });
        if (client.remoteUsers.length === 0) end();
      });
      setTimeout(() => setState(s => s === "calling" ? "in-call" : s), 4000);
    } catch (e) {
      console.error("Call error:", e);
      setState("idle"); setTarget(null); setGroup(false);
      if (callId) updateCallStatus(callId, "failed").catch(() => {});
      setActiveCallId(null);
      const code = e?.code || "";
      const msg = e?.message || String(e);
      let friendly = "Could not start the call. ";
      if (msg.includes("Permission denied") || msg.includes("NotAllowedError") || code === "PERMISSION_DENIED") {
        friendly += "Please allow microphone/camera access for this site in your browser settings, then try again.";
      } else if (msg.includes("NotFoundError") || msg.includes("device not found")) {
        friendly += "No microphone or camera was found on this device.";
      } else if (msg.includes("dynamic key") || msg.includes("token") || msg.includes("CAN_NOT_GET_GATEWAY_SERVER") || code === "CAN_NOT_GET_GATEWAY_SERVER") {
        friendly += "The call service rejected the connection (token/App ID issue). If this keeps happening, the Agora project needs a token server or Testing Mode re-enabled.";
      } else {
        friendly += "Error: " + msg;
      }
      setCallError(friendly);
    }
  };

  // Outgoing call: writes a "ringing" doc first (so the other person's IncomingCallListener
  // sees it), respects the daily per-recipient limit, THEN joins Agora once placed.
  const callUser = async (u, t) => {
    setLimitError("");
    setTarget(u); setGroup(false);
    const channel = callChannelId(currentUser.uid, u.uid);
    try {
      const { callId } = await placeCall({
        callerId: currentUser.uid, callerName: userProfile.fullName, callerPhoto: userProfile.photoURL,
        recipientId: u.uid, recipientName: u.fullName, callType: t,
      });
      join(channel, t, u.fullName, callId);
    } catch (e) {
      if (e.code === "DAILY_LIMIT_REACHED") { setLimitError(e.message); setTarget(null); }
      else { setCallError("Could not place the call. Please try again."); setTarget(null); }
    }
  };

  const startGroup = (t) => {
    const room = "group_" + (userProfile?.nationality || "all").toLowerCase().replace(/[^a-z]/g, "");
    setTarget({ fullName: (userProfile?.nationality || "Community") + " Group Call", photoURL: "" });
    setGroup(true); join(room, t);
  };

  const end = async () => {
    try {
      // Stop each Agora track wrapper AND the raw underlying browser MediaStreamTrack —
      // Agora's track.close() doesn't always fully release camera/mic hardware on its own,
      // which was leaving the camera light on after hanging up. Explicitly stopping the
      // native track guarantees the OS actually releases the device.
      tracksRef.current.forEach(t => {
        try {
          const mediaTrack = t.getMediaStreamTrack?.();
          if (mediaTrack) mediaTrack.stop();
          t.stop();
          t.close();
        } catch (e) {}
      });
      if (clientRef.current) {
        clientRef.current.removeAllListeners?.();
        await clientRef.current.leave();
      }
    } catch (e) {}
    if (activeCallId) {
      updateCallStatus(activeCallId, "ended").catch(() => {});
    }
    clientRef.current = null; tracksRef.current = [];
    setState("idle"); setTarget(null); setMuted(false); setCamOff(false); setGroup(false);
    setLocalCamTrack(null); setRemoteUsers(new Map()); setActiveCallId(null);
  };

  const toggleMute = () => {
    const a = tracksRef.current.find(t => t.trackMediaType === "audio");
    if (a) { a.setEnabled(muted); setMuted(!muted); }
  };
  const toggleCam = () => {
    const v = tracksRef.current.find(t => t.trackMediaType === "video");
    if (v) { v.setEnabled(camOff); setCamOff(!camOff); }
  };

  const blocked = userProfile?.blockedUsers || [];
  const list = users.filter(u => !blocked.includes(u.uid) && (
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.nationality?.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.toLowerCase().includes(search.toLowerCase())
  ));

  return (
    <div className="cl">
      <div className="cl-top">
        <input className="cl-s" placeholder="🔍 Search members to call..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="cl-gbtn" onClick={() => startGroup("voice")}>👥 Join Group Call</button>
      </div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>{list.length} members available</div>
      {callError && (
        <div className="error-msg" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span>⚠️ {callError}</span>
          <button onClick={() => setCallError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 15 }}>✕</button>
        </div>
      )}
      {limitError && (
        <div className="error-msg" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "rgba(245,158,11,.08)", borderColor: "rgba(245,158,11,.25)", color: "#fcd34d" }}>
          <span>📵 {limitError}</span>
          <button onClick={() => setLimitError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 15 }}>✕</button>
        </div>
      )}

      <div className="cl-grid">
        {list.map(u => (
          <div key={u.uid} className="cl-card">
            <Avatar src={u.photoURL} name={u.fullName} size={56} online={isUserOnline(u)} />
            <div className="cl-n">{u.fullName}{u.verified && <span className="verified-badge">✓</span>}</div>
            <RoleBadge role={u.role} small />
            <div className="cl-m">🌍 {u.nationality}</div>
            <div className="cl-btns">
              <button className="cl-v" onClick={() => callUser(u, "voice")}>📞 Voice</button>
              <button className="cl-c" onClick={() => callUser(u, "video")}>📹 Video</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cl-note">
        Group calls use your country room channel. Best with small groups on the free plan.
      </div>

      {recentCalls.length > 0 && (
        <div className="cl-recent">
          <div className="cl-recent-title">🕐 Recent Calls</div>
          {recentCalls.map(c => {
            const otherName = c.direction === "outgoing" ? c.recipientName : c.callerName;
            const otherPhoto = c.direction === "outgoing" ? "" : c.callerPhoto;
            const otherUid = c.direction === "outgoing" ? c.recipientId : c.callerId;
            const icon = c.direction === "outgoing" ? "↗️" : "↙️";
            const statusIcon = c.status === "missed" ? "📵" : c.status === "declined" ? "🚫" : c.status === "failed" ? "⚠️" : c.callType === "video" ? "📹" : "📞";
            const statusLabel = c.status === "missed" ? "Missed" : c.status === "declined" ? "Declined" : c.status === "failed" ? "Failed" : c.status === "ringing" ? "Ringing" : c.status === "accepted" ? "Connected" : "Ended";
            const t = c.createdAt?.toDate ? c.createdAt.toDate() : null;
            return (
              <div key={c.id} className="cl-rrow">
                <span className="cl-rrow-icon">{icon}</span>
                <Avatar src={otherPhoto} name={otherName} size={34} />
                <div className="cl-rrow-info">
                  <div className="cl-rrow-name">{otherName}</div>
                  <div className="cl-rrow-meta">
                    <span className={"cl-rrow-icon " + c.status}>{statusIcon}</span> {statusLabel}
                  </div>
                </div>
                <span className="cl-rrow-time">{t ? t.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                {(c.status === "missed" || c.status === "declined") && otherUid && (
                  <button className="cl-rrow-callback" title="Call back" onClick={() => {
                    const u = users.find(x => x.uid === otherUid);
                    if (u) callUser(u, c.callType || "voice");
                  }}>📞</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {state !== "idle" && target && (
        <div className="cl-modal">
          {type === "video" && (state === "in-call" || (state === "calling" && localCamTrack)) && (
            remoteUsers.size <= 1 ? (
              // Common case: 1-on-1 video call — single big remote box + small self-preview,
              // same layout as before.
              <div className="cl-vid">
                <div ref={el => { const uid = [...remoteUsers.keys()][0]; if (uid) remoteRefs.current[uid] = el; }} style={{ width: "100%", height: "100%" }} />
                <span className="cl-vid-lbl">{target.fullName}</span>
                <div className="cl-vid-me"><div ref={localRef} style={{ width: "100%", height: "100%" }} /></div>
              </div>
            ) : (
              // Group call with multiple remote participants — each gets their own box in
              // a grid, keyed by their real uid so tracks never overwrite each other.
              <div className="cl-vid-grid">
                {[...remoteUsers.entries()].map(([uid]) => (
                  <div key={uid} className="cl-vid" style={{ maxWidth: "none" }}>
                    <div ref={el => { remoteRefs.current[uid] = el; }} style={{ width: "100%", height: "100%" }} />
                  </div>
                ))}
                <div className="cl-vid" style={{ maxWidth: "none" }}>
                  <div ref={localRef} style={{ width: "100%", height: "100%" }} />
                  <span className="cl-vid-lbl">You</span>
                </div>
              </div>
            )
          )}
          <div className={"cl-box" + (state === "calling" ? " cl-ring" : "")}>
            <Avatar src={target.photoURL} name={target.fullName} size={78} ring />
            <div className="cl-name">{target.fullName}</div>
            <span className={"cl-badge " + type}>{type === "video" ? "📹 Video Call" : "📞 Voice Call"}{group ? " · Group" : ""}</span>
            {state === "calling" && <div className="cl-status">Connecting…</div>}
            {state === "in-call" && <span className="cl-timer">{fmt(timer)}</span>}
            <div className="cl-acts">
              {state === "in-call" && (
                <>
                  <button className="cl-ab tog" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>{muted ? "🔇" : "🎙️"}</button>
                  {type === "video" && <button className="cl-ab tog" onClick={toggleCam}>{camOff ? "📷" : "📹"}</button>}
                </>
              )}
              <button className="cl-ab end" onClick={end} title="End call">📵</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
