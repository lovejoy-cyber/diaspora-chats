import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AGORA_APP_ID, fetchAgoraToken, CALL_RING_TIMEOUT_MS } from "../lib/helpers";
import Avatar from "./Avatar";

const CSS = `
.ic-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}
.ic-card{background:var(--bg-card);border:1px solid var(--border);border-radius:22px;padding:32px 28px;width:100%;max-width:360px;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.7);animation:icPop .3s ease-out}
@keyframes icPop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
.ic-ring-anim{width:96px;height:96px;border-radius:50%;margin:0 auto 16px;position:relative;display:flex;align-items:center;justify-content:center}
.ic-ring-anim::before,.ic-ring-anim::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid var(--primary);animation:icPulseRing 1.6s ease-out infinite}
.ic-ring-anim::after{animation-delay:.5s}
@keyframes icPulseRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.6);opacity:0}}
.ic-name{font-size:19px;font-weight:800;margin-bottom:4px}
.ic-sub{font-size:13px;color:var(--text2);margin-bottom:22px}
.ic-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:18px;background:rgba(59,130,246,.12);color:var(--primary-light)}
.ic-actions{display:flex;justify-content:center;gap:26px}
.ic-btn{width:62px;height:62px;border-radius:50%;border:none;font-size:24px;cursor:pointer;transition:transform .15s;display:flex;align-items:center;justify-content:center;color:#fff}
.ic-btn:active{transform:scale(.92)}
.ic-btn.decline{background:#ef4444}
.ic-btn.accept{background:#10b981;animation:icAcceptPulse 1.2s ease-in-out infinite}
@keyframes icAcceptPulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 10px rgba(16,185,129,0)}}
.ic-btn-label{font-size:11px;color:var(--text2);margin-top:6px;font-weight:600}
.ic-btns-col{display:flex;flex-direction:column;align-items:center}
.ic-missed-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--bg-card2);border:1px solid var(--border);border-radius:14px;padding:12px 18px;box-shadow:0 12px 32px rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;gap:10px;font-size:13px;animation:icToastIn .3s ease-out}
@keyframes icToastIn{from{transform:translate(-50%,20px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
`;

// Simple synthesized ringtone using the Web Audio API — no audio file to host or load,
// works instantly, and loops until the call is answered/declined/times out.
function useRingtone(playing) {
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      ctxRef.current = ctx;
      const playTone = () => {
        if (ctx.state === "closed") return;
        [660, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05 + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4 + i * 0.15);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + 0.5 + i * 0.15);
        });
      };
      playTone();
      intervalRef.current = setInterval(playTone, 1800);
    } catch (e) { /* Web Audio unsupported — silently continue with visual + vibration only */ }
    return () => {
      clearInterval(intervalRef.current);
      if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
    };
  }, [playing]);
}

// Vibrates the phone in a repeating ring pattern. Android Chrome supports this;
// iPhone Safari does not expose the Vibration API at all (Apple platform limitation) —
// on iPhone this simply does nothing, and the sound + visual popup still work fine.
function useRingVibration(playing) {
  useEffect(() => {
    if (!playing || !navigator.vibrate) return;
    const pattern = [400, 200, 400, 1000];
    navigator.vibrate(pattern);
    const interval = setInterval(() => navigator.vibrate(pattern), 2000);
    return () => { clearInterval(interval); navigator.vibrate(0); };
  }, [playing]);
}

export default function IncomingCallListener() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState(null);
  const [missedToast, setMissedToast] = useState(null);
  const [joining, setJoining] = useState(false);
  const timeoutRef = useRef(null);
  const seenCallIds = useRef(new Set());

  // Writes a persistent notification (visible in the bell, survives even if the toast
  // is missed because the tab wasn't open) whenever a call goes unanswered.
  const writeMissedCallNotification = async (call) => {
    try {
      await addDoc(collection(db, "notifications"), {
        recipientId: currentUser.uid, icon: "📵",
        title: "Missed call",
        message: call.callerName + " tried to " + (call.callType === "video" ? "video call" : "call") + " you.",
        link: "/dashboard/messages?start=" + call.callerId,
        read: false, createdAt: serverTimestamp(),
      });
    } catch (e) {}
  };

  useEffect(() => {
    if (!document.getElementById("ic-css")) {
      const s = document.createElement("style");
      s.id = "ic-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Listen globally for any call ringing FOR this user — this component lives at the
  // Dashboard level specifically so it's active no matter which page they're on.
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "calls"),
      where("recipientId", "==", currentUser.uid),
      where("status", "==", "ringing")
    );
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Respect Do Not Disturb: if presence is busy/invisible, skip the popup entirely
      // and let it silently time out to missed — matches how real phones handle DND.
      const dnd = userProfile?.presence === "busy" || userProfile?.presence === "invisible";
      const fresh = docs.find(c => !seenCallIds.current.has(c.id));
      if (fresh && !incoming && !dnd) {
        seenCallIds.current.add(fresh.id);
        setIncoming(fresh);
      } else if (fresh && dnd) {
        seenCallIds.current.add(fresh.id);
        updateDoc(doc(db, "calls", fresh.id), { status: "missed", missedAt: serverTimestamp() }).catch(() => {});
        writeMissedCallNotification(fresh);
      }
    }, err => console.error("Incoming call listener failed:", err));
  }, [currentUser, userProfile?.presence, incoming]);

  // Ring timeout — auto-marks as missed if nobody answers
  useEffect(() => {
    if (!incoming) return;
    timeoutRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "calls", incoming.id), { status: "missed", missedAt: serverTimestamp() });
      } catch (e) {}
      writeMissedCallNotification(incoming);
      setMissedToast(incoming);
      setIncoming(null);
      setTimeout(() => setMissedToast(null), 4000);
    }, CALL_RING_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [incoming]);

  useRingtone(!!incoming);
  useRingVibration(!!incoming);

  const decline = async () => {
    clearTimeout(timeoutRef.current);
    if (incoming) {
      try { await updateDoc(doc(db, "calls", incoming.id), { status: "declined", declinedAt: serverTimestamp() }); } catch (e) {}
    }
    setIncoming(null);
  };

  const accept = async () => {
    if (!incoming || joining) return;
    setJoining(true);
    clearTimeout(timeoutRef.current);
    try {
      await updateDoc(doc(db, "calls", incoming.id), { status: "accepted", acceptedAt: serverTimestamp() });
    } catch (e) {}
    // Hand off to the Calls page with everything it needs to join the same channel directly —
    // Calls.jsx reads these params and joins Agora immediately instead of showing the picker.
    navigate("/dashboard/calls?join=" + incoming.channel + "&type=" + incoming.callType + "&callId=" + incoming.id + "&withUid=" + incoming.callerId + "&withName=" + encodeURIComponent(incoming.callerName || "Caller") + "&withPhoto=" + encodeURIComponent(incoming.callerPhoto || ""));
    setIncoming(null);
    setJoining(false);
  };

  return (
    <>
      {incoming && (
        <div className="ic-overlay">
          <div className="ic-card">
            <div className="ic-ring-anim">
              <Avatar src={incoming.callerPhoto} name={incoming.callerName} size={88} />
            </div>
            <div className="ic-name">{incoming.callerName}</div>
            <div className="ic-sub">is calling you...</div>
            <span className="ic-badge">{incoming.callType === "video" ? "📹 Video Call" : "📞 Voice Call"}</span>
            <div className="ic-actions">
              <div className="ic-btns-col">
                <button className="ic-btn decline" onClick={decline}>📵</button>
                <span className="ic-btn-label">Decline</span>
              </div>
              <div className="ic-btns-col">
                <button className="ic-btn accept" onClick={accept} disabled={joining}>📞</button>
                <span className="ic-btn-label">{joining ? "Joining..." : "Accept"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {missedToast && (
        <div className="ic-missed-toast">
          📵 Missed call from {missedToast.callerName}
          <button
            onClick={() => { navigate("/dashboard/messages?start=" + missedToast.callerId); setMissedToast(null); }}
            style={{ background: "none", border: "none", color: "var(--primary-light)", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}
          >
            Message back
          </button>
        </div>
      )}
    </>
  );
}
