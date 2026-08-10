import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const AGORA_APP_ID = "239608a7432f4a6facc81a29d4c7d71f";

const STYLE = `
.calls-page { padding:22px; overflow-y:auto; height:calc(100vh - 57px); }
.calls-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; margin-top:20px; }
.call-member-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:18px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; transition:border-color 0.2s; }
.call-member-card:hover { border-color:var(--primary); }
.call-avatar { width:64px; height:64px; border-radius:50%; object-fit:cover; border:2px solid var(--border); }
.call-avatar-ph { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,var(--primary),#1e40af); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; color:white; }
.call-name { font-size:14px; font-weight:700; }
.call-meta { font-size:11px; color:var(--text-muted); }
.call-btn { width:100%; padding:9px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); color:#34d399; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.15s; }
.call-btn:hover { background:rgba(16,185,129,0.22); }
.call-modal { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:999; flex-direction:column; gap:20px; }
.call-modal-card { background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:32px; text-align:center; width:90%; max-width:360px; }
.call-modal-avatar { width:90px; height:90px; border-radius:50%; object-fit:cover; border:3px solid var(--primary); margin:0 auto 16px; display:block; }
.call-modal-avatar-ph { width:90px; height:90px; border-radius:50%; background:linear-gradient(135deg,var(--primary),#1e40af); display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:800; color:white; margin:0 auto 16px; }
.call-modal-name { font-size:20px; font-weight:800; margin-bottom:6px; }
.call-modal-status { font-size:13px; color:var(--text-muted); margin-bottom:24px; }
.call-actions { display:flex; justify-content:center; gap:20px; }
.call-action-btn { width:60px; height:60px; border-radius:50%; border:none; font-size:24px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; }
.call-action-btn.end { background:#ef4444; }
.call-action-btn.end:hover { background:#dc2626; transform:scale(1.1); }
.call-action-btn.mute { background:var(--bg-input); border:1px solid var(--border); }
.call-action-btn.mute:hover { background:rgba(255,255,255,0.1); }
.call-action-btn.accept { background:#10b981; }
.call-action-btn.accept:hover { background:#059669; transform:scale(1.1); }
.call-timer { font-size:28px; font-weight:800; color:var(--primary); letter-spacing:2px; }
.incoming-ring { animation:ring 1s ease-in-out infinite; }
@keyframes ring { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
.call-search { width:100%; padding:10px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; color:var(--text); font-size:13px; outline:none; font-family:inherit; margin-bottom:4px; }
.call-search:focus { border-color:var(--primary); }
`;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

export default function Calls() {
  const { currentUser, userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [callState, setCallState] = useState("idle"); // idle | calling | in-call | incoming
  const [callTarget, setCallTarget] = useState(null);
  const [muted, setMuted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [agoraClient, setAgoraClient] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const timerRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("calls-css")) {
      const s = document.createElement("style");
      s.id = "calls-css";
      s.textContent = STYLE;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    getDocs(collection(db, "users")).then((snap) => {
      setMembers(
        snap.docs
          .map((d) => d.data())
          .filter((u) => u.uid !== currentUser.uid && u.profileComplete)
      );
    });
  }, [currentUser]);

  useEffect(() => {
    if (callState === "in-call") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const startCall = async (member) => {
    setCallTarget(member);
    setCallState("calling");

    try {
      // Dynamically load Agora SDK
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setAgoraClient(client);

      // Use a channel name based on both user IDs sorted
      const channel = [currentUser.uid, member.uid].sort().join("_").slice(0, 64);
      channelRef.current = channel;

      // Join channel — using null token for development (set up token server for production)
      await client.join(AGORA_APP_ID, channel, null, currentUser.uid);

      // Create and publish microphone track
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([micTrack]);
      setLocalTrack(micTrack);

      // Listen for remote users
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack.play();
          setCallState("in-call");
        }
      });

      client.on("user-left", () => {
        endCall(client, micTrack);
      });

      // Simulate connecting after 3 seconds if no one joins
      setTimeout(() => {
        setCallState((prev) => {
          if (prev === "calling") return "in-call";
          return prev;
        });
      }, 3000);

    } catch (err) {
      console.error("Call error:", err);
      setCallState("idle");
      setCallTarget(null);
      alert("Could not start call. Please check your microphone permissions.");
    }
  };

  const endCall = async (client, track) => {
    try {
      const c = client || agoraClient;
      const t = track || localTrack;
      if (t) { t.stop(); t.close(); }
      if (c) await c.leave();
    } catch (e) {
      console.error(e);
    }
    setAgoraClient(null);
    setLocalTrack(null);
    setCallState("idle");
    setCallTarget(null);
    setMuted(false);
  };

  const toggleMute = () => {
    if (localTrack) {
      if (muted) {
        localTrack.setEnabled(true);
      } else {
        localTrack.setEnabled(false);
      }
      setMuted(!muted);
    }
  };

  const filtered = members.filter((m) =>
    m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    m.nationality?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="calls-page">
      <input
        className="call-search"
        placeholder="🔍 Search members to call..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
        {filtered.length} members available
      </div>

      <div className="calls-grid">
        {filtered.map((member) => (
          <div key={member.uid} className="call-member-card">
            {member.photoURL ? (
              <img src={member.photoURL} alt={member.fullName} className="call-avatar" />
            ) : (
              <div className="call-avatar-ph">{member.fullName?.[0]}</div>
            )}
            <div className="call-name">
              {member.fullName}
              {member.verified && <span className="verified-badge" style={{ marginLeft: 5 }}>✓</span>}
            </div>
            <div className="call-meta">
              🌍 {member.nationality}<br />
              🏫 {member.university}
            </div>
            <button className="call-btn" onClick={() => startCall(member)}>
              📞 Voice Call
            </button>
          </div>
        ))}
      </div>

      {/* Call Modal */}
      {callState !== "idle" && callTarget && (
        <div className="call-modal">
          <div className={"call-modal-card" + (callState === "calling" ? " incoming-ring" : "")}>
            {callTarget.photoURL ? (
              <img src={callTarget.photoURL} alt={callTarget.fullName} className="call-modal-avatar" />
            ) : (
              <div className="call-modal-avatar-ph">{callTarget.fullName?.[0]}</div>
            )}
            <div className="call-modal-name">{callTarget.fullName}</div>
            <div className="call-modal-status">
              {callState === "calling" && "📞 Calling..."}
              {callState === "in-call" && (
                <span className="call-timer">{formatTime(timer)}</span>
              )}
            </div>
            <div className="call-actions">
              {callState === "in-call" && (
                <button
                  className="call-action-btn mute"
                  onClick={toggleMute}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? "🔇" : "🎙️"}
                </button>
              )}
              <button
                className="call-action-btn end"
                onClick={() => endCall(null, null)}
                title="End call"
              >
                📵
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
