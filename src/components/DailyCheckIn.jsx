import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, limit, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "./Avatar";

// Daily welfare/check-in prompt — Embassy or President posts a question, everyone answers,
// and answers only reveal once YOU'VE answered too (same "reveal together" mechanic as
// BeReal), so it's not just another feed to scroll past. Ties directly into the Embassy
// page's purpose: a lightweight, recurring way for the community to signal how they're
// doing without it being a formal document submission.

const STYLE = `
.dc-card{background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(59,130,246,.08));border:1px solid rgba(139,92,246,.25);border-radius:16px;padding:16px;margin-bottom:16px}
.dc-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.dc-head h4{font-size:13px;font-weight:800;color:#a78bfa}
.dc-q{font-size:14.5px;font-weight:700;margin-bottom:12px;line-height:1.5}
.dc-input{width:100%;padding:10px 13px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13.5px;outline:none;font-family:inherit;resize:vertical;min-height:60px;margin-bottom:8px}
.dc-btn{padding:9px 18px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border:none;border-radius:9px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.dc-btn:disabled{opacity:.5;cursor:not-allowed}
.dc-answers{margin-top:14px;display:flex;flex-direction:column;gap:10px}
.dc-ans{display:flex;gap:9px}
.dc-ans-b{background:rgba(255,255,255,.06);border-radius:10px;padding:9px 12px;flex:1}
.dc-ans-n{font-size:12px;font-weight:700;margin-bottom:2px}
.dc-ans-t{font-size:13px;line-height:1.5}
.dc-locked{font-size:12px;color:var(--text2);text-align:center;padding:14px;font-style:italic}
.dc-new-form{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.dc-empty{font-size:13px;color:var(--text2);text-align:center;padding:10px 0}
`;

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

export default function DailyCheckIn() {
  const { currentUser, userProfile } = useAuth();
  const canPost = ["embassy", "admin", "president"].includes(userProfile?.role);
  const [prompt, setPrompt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [myAnswer, setMyAnswer] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!document.getElementById("dc-css")) {
      const s = document.createElement("style");
      s.id = "dc-css"; s.textContent = STYLE;
      document.head.appendChild(s);
    }
  }, []);

  // Loads today's prompt (one per day, keyed by date) if one has been posted.
  useEffect(() => {
    const q = query(collection(db, "dailyPrompts"), orderBy("createdAt", "desc"), limit(1));
    return onSnapshot(q, snap => {
      if (snap.empty) { setPrompt(null); return; }
      const p = { id: snap.docs[0].id, ...snap.docs[0].data() };
      // Only show it if it's actually today's prompt, not a stale old one
      if (p.dateKey === todayKey()) setPrompt(p); else setPrompt(null);
    }, () => {});
  }, []);

  useEffect(() => {
    if (!prompt) return;
    const q = query(collection(db, "dailyPrompts", prompt.id, "answers"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnswers(all);
      const mine = all.find(a => a.authorId === currentUser.uid);
      setMyAnswer(mine?.text || "");
    }, () => {});
  }, [prompt, currentUser]);

  const submitAnswer = async () => {
    if (!answerText.trim() || !prompt) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "dailyPrompts", prompt.id, "answers", currentUser.uid), {
        authorId: currentUser.uid, authorName: userProfile.fullName, authorPhoto: userProfile.photoURL || "",
        text: answerText.trim(), createdAt: serverTimestamp(),
      });
      setAnswerText("");
    } catch (e) {}
    setSubmitting(false);
  };

  const postNewPrompt = async () => {
    if (!newQuestion.trim()) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "dailyPrompts"), {
        question: newQuestion.trim(), dateKey: todayKey(),
        postedBy: userProfile.fullName, postedById: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setNewQuestion(""); setShowNewForm(false);
    } catch (e) {}
    setPosting(false);
  };

  if (!prompt && !canPost) return null; // nothing to show a regular student if no prompt exists today

  return (
    <div className="dc-card">
      <div className="dc-head">
        <span style={{ fontSize: 18 }}>💭</span>
        <h4>Daily Check-In</h4>
      </div>

      {prompt ? (
        <>
          <div className="dc-q">{prompt.question}</div>
          {!myAnswer ? (
            <>
              <textarea className="dc-input" placeholder="Your answer..." value={answerText} onChange={e => setAnswerText(e.target.value)} />
              <button className="dc-btn" onClick={submitAnswer} disabled={!answerText.trim() || submitting}>
                {submitting ? "Sharing..." : "Share Answer"}
              </button>
              {answers.length > 0 && <div className="dc-locked">🔒 Answer to see what {answers.length} other {answers.length === 1 ? "person has" : "people have"} shared</div>}
            </>
          ) : (
            <div className="dc-answers">
              {answers.map(a => (
                <div key={a.id} className="dc-ans">
                  <Avatar src={a.authorPhoto} name={a.authorName} size={30} />
                  <div className="dc-ans-b">
                    <div className="dc-ans-n">{a.authorName}{a.authorId === currentUser.uid ? " (You)" : ""}</div>
                    <div className="dc-ans-t">{a.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="dc-empty">No check-in posted today.</div>
      )}

      {canPost && (
        <div className="dc-new-form">
          {!showNewForm ? (
            <button className="dc-btn" style={{ background: "rgba(255,255,255,.08)" }} onClick={() => setShowNewForm(true)}>
              {prompt ? "✏️ Post a new prompt (replaces today's)" : "➕ Post today's check-in question"}
            </button>
          ) : (
            <>
              <textarea className="dc-input" placeholder='e.g. "How is your week going? Any concerns?"' value={newQuestion} onChange={e => setNewQuestion(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="dc-btn" onClick={postNewPrompt} disabled={!newQuestion.trim() || posting}>{posting ? "Posting..." : "Post"}</button>
                <button className="dc-btn" style={{ background: "rgba(255,255,255,.08)" }} onClick={() => setShowNewForm(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
