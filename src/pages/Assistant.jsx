import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/Avatar";

const CSS = `
.as-page{display:flex;flex-direction:column;height:100%;max-width:680px;margin:0 auto;}
.as-header{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:var(--bg-card);}
.as-header-icon{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:18px;position:relative;}
.as-header-icon::before{content:"";position:absolute;inset:-3px;border-radius:50%;padding:2px;
  background:conic-gradient(from var(--glow-angle,0deg),#3B82F6,#8B5CF6,#06B6D4,#3B82F6);
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  animation:glowRotate 3s linear infinite;z-index:-1;}
.as-header h3{font-size:14px;font-weight:800;}
.as-header p{font-size:11px;color:var(--text2);}
.as-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
.as-empty{text-align:center;padding:40px 20px;color:var(--text2);}
.as-empty-icon{font-size:40px;margin-bottom:10px;}
.as-suggestions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px;}
.as-suggestion{padding:8px 14px;background:var(--bg-card2);border:1px solid var(--border);border-radius:20px;font-size:12px;cursor:pointer;transition:all .15s;}
.as-suggestion:hover{border-color:var(--primary);color:var(--primary-light);}
.as-msg{display:flex;gap:9px;max-width:82%;}
.as-msg.mine{align-self:flex-end;flex-direction:row-reverse;}
.as-bubble{padding:11px 14px;border-radius:14px;font-size:13.5px;line-height:1.65;white-space:pre-wrap;}
.as-bubble.theirs{background:var(--bg-card2);border:1px solid var(--border);border-top-left-radius:4px;}
.as-bubble.mine{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border-top-right-radius:4px;}
.as-typing{display:flex;gap:4px;padding:11px 14px;}
.as-typing span{width:6px;height:6px;border-radius:50%;background:var(--text2);animation:asBounce 1.2s ease-in-out infinite;}
.as-typing span:nth-child(2){animation-delay:.15s;}
.as-typing span:nth-child(3){animation-delay:.3s;}
@keyframes asBounce{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-4px);opacity:1;}}
.as-input-area{padding:12px 14px;border-top:1px solid var(--border);display:flex;gap:8px;background:var(--bg-card);}
.as-input{flex:1;padding:11px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:22px;color:var(--text);font-size:13.5px;outline:none;font-family:inherit;}
.as-send{width:42px;height:42px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border:none;border-radius:50%;font-size:16px;cursor:pointer;flex-shrink:0;}
.as-send:disabled{opacity:.4;cursor:not-allowed;}
.as-disclaimer{font-size:10.5px;color:var(--text3);text-align:center;padding:6px 16px 10px;}
`;

const SUGGESTIONS = [
  "How do I get verified on DiasporaLink?",
  "Where do I send documents to the Embassy?",
  "Tips for scholarship applications?",
  "How does the money transfer marketplace work?",
];

export default function Assistant() {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("as-css")) {
      const s = document.createElement("style");
      s.id = "as-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setError("");
    const userMsg = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/functions/ask-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: messages }),
      });
      if (!res.ok) throw new Error("Assistant service returned " + res.status);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      console.error("Assistant error:", e);
      setError("Could not reach the assistant. Please try again in a moment.");
    }
    setLoading(false);
  };

  const handleKey = e => { if (e.key === "Enter") send(); };

  return (
    <div className="as-page">
      <div className="as-header">
        <span className="as-header-icon">🤖</span>
        <div>
          <h3>DiasporaLink Assistant</h3>
          <p>Ask anything about the app, scholarships, or community life</p>
        </div>
      </div>

      <div className="as-body">
        {messages.length === 0 && (
          <div className="as-empty">
            <div className="as-empty-icon">💬</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Hi {userProfile?.fullName?.split(" ")[0] || "there"}, how can I help?</div>
            <div className="as-suggestions">
              {SUGGESTIONS.map(s => (
                <div key={s} className="as-suggestion" onClick={() => send(s)}>{s}</div>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={"as-msg" + (m.role === "user" ? " mine" : "")}>
            {m.role !== "user" && <Avatar name="AI" size={30} />}
            <div className={"as-bubble" + (m.role === "user" ? " mine" : " theirs")}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="as-msg">
            <Avatar name="AI" size={30} />
            <div className="as-bubble theirs as-typing"><span /><span /><span /></div>
          </div>
        )}
        {error && <div className="error-msg">⚠️ {error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="as-input-area">
        <input className="as-input" placeholder="Ask the assistant..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
        <button className="as-send" onClick={() => send()} disabled={!input.trim() || loading}>➤</button>
      </div>
      <div className="as-disclaimer">AI-generated — not a substitute for official Embassy guidance on documents or visas.</div>
    </div>
  );
}
