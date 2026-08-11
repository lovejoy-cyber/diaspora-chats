import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/Avatar";

// Vertical swipeable feed. Two content sources:
// 1. AUTOMATED — YouTube videos fetched on a schedule by netlify/functions/fetch-reels.js,
//    no human curation needed, genuinely free and legal (official YouTube API).
// 2. MANUAL — TikTok/Instagram/other links pasted in by Embassy/Admin, embedded via each
//    platform's own official embed method. This exists because there is no safe, free,
//    automated way to pull TikTok/Instagram content — only a human choosing a specific,
//    vetted link keeps that legal.

const CSS = `
.rl-page{height:100%;overflow-y:scroll;scroll-snap-type:y mandatory;background:#000;}
.rl-slide{height:100%;min-height:100%;scroll-snap-align:start;position:relative;display:flex;align-items:center;justify-content:center;background:#000;}
.rl-media-wrap{width:100%;height:100%;max-width:480px;position:relative;}
.rl-media-wrap iframe{width:100%;height:100%;border:none;}
.rl-overlay{position:absolute;bottom:0;left:0;right:0;padding:20px 16px 90px;background:linear-gradient(to top,rgba(0,0,0,.85),transparent);color:#fff;}
.rl-cat{display:inline-block;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(59,130,246,.3);border:1px solid rgba(96,165,250,.5);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;}
.rl-title{font-size:14px;font-weight:700;line-height:1.4;margin-bottom:4px;}
.rl-channel{font-size:12px;opacity:.8;}
.rl-actions{position:absolute;right:10px;bottom:100px;display:flex;flex-direction:column;gap:18px;align-items:center;}
.rl-action-btn{background:rgba(255,255,255,.12);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:19px;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px);}
.rl-source-badge{position:absolute;top:16px;right:16px;background:rgba(0,0,0,.5);color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;backdrop-filter:blur(4px);}
.rl-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:12px;text-align:center;padding:30px;}
.rl-add-btn{position:fixed;bottom:90px;right:16px;background:linear-gradient(135deg,var(--primary),#8B5CF6);color:#fff;border:none;width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;box-shadow:0 8px 24px rgba(59,130,246,.5);z-index:20;}
.rl-cat-filter{position:fixed;top:64px;left:0;right:0;display:flex;gap:6px;overflow-x:auto;padding:8px 12px;z-index:15;background:linear-gradient(to bottom,rgba(0,0,0,.6),transparent);}
.rl-cat-chip{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:650;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);cursor:pointer;white-space:nowrap;}
.rl-cat-chip.on{background:var(--primary);border-color:var(--primary);}
`;

const CATEGORY_LABELS = {
  scholarships: "🎓 Scholarships", jobs: "💼 Jobs", tech: "💻 Tech", courses: "📚 Courses",
  news: "📰 News", life: "🌍 Life", faith: "✝️ Faith", manual: "🔗 Community Shared",
};

function detectEmbedUrl(link) {
  // Handles every common real-world YouTube link shape: standard watch links, shortened
  // youtu.be links, and Shorts links (YouTube's actual short-form video format — the
  // most likely thing anyone means by "reels" on YouTube) — plus links with extra
  // tracking parameters after the video ID, which the previous version didn't handle.
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/,
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match) return { type: "youtube", videoId: match[1], url: "https://www.youtube.com/embed/" + match[1] + "?autoplay=0" };
  }
  const tiktok = link.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  if (tiktok) return { type: "tiktok", embedHtml: true, videoId: tiktok[1] };
  return { type: "link", url: link };
}

export default function Reels() {
  const { currentUser, userProfile } = useAuth();
  const isStaff = ["embassy", "admin", "president"].includes(userProfile?.role);
  const [reels, setReels] = useState([]);
  const [activeCat, setActiveCat] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!document.getElementById("rl-css")) {
      const s = document.createElement("style");
      s.id = "rl-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "reels"), orderBy("fetchedAt", "desc"), limit(60));
    return onSnapshot(q, snap => {
      setReels(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.hidden));
    }, () => {});
  }, []);

  const addManualLink = async () => {
    if (!linkInput.trim()) return;
    setPosting(true);
    try {
      const embed = detectEmbedUrl(linkInput.trim());
      await addDoc(collection(db, "reels"), {
        source: embed.type, category: "manual",
        title: titleInput.trim() || "Shared by " + userProfile.fullName,
        channelTitle: userProfile.fullName, rawLink: linkInput.trim(),
        embedUrl: embed.url || null, videoId: embed.videoId || null,
        postedBy: currentUser.uid, hidden: false, fetchedAt: serverTimestamp(),
      });
      setLinkInput(""); setTitleInput(""); setShowAdd(false);
    } catch (e) { alert("Could not add that link."); }
    setPosting(false);
  };

  const hideReel = async (id) => {
    if (!isStaff) return;
    await updateDoc(doc(db, "reels", id), { hidden: true });
  };

  const filtered = activeCat === "all" ? reels : reels.filter(r => r.category === activeCat);
  const categories = ["all", ...new Set(reels.map(r => r.category))];

  return (
    <div className="rl-page">
      <div className="rl-cat-filter">
        {categories.map(c => (
          <div key={c} className={"rl-cat-chip" + (activeCat === c ? " on" : "")} onClick={() => setActiveCat(c)}>
            {c === "all" ? "🌍 All" : CATEGORY_LABELS[c] || c}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rl-empty">
          <div style={{ fontSize: 42 }}>🎬</div>
          <div style={{ fontWeight: 700 }}>No reels yet</div>
          <div style={{ fontSize: 13, opacity: .8 }}>Automated content refreshes every few hours, or share a link below.</div>
        </div>
      )}

      {filtered.map(r => (
        <div key={r.id} className="rl-slide">
          <div className="rl-media-wrap">
            {r.source === "youtube" && (
              <iframe src={"https://www.youtube.com/embed/" + r.videoId} title={r.title} allow="autoplay; encrypted-media" allowFullScreen />
            )}
            {r.source === "youtube" && r.embedUrl && !r.videoId && (
              <iframe src={r.embedUrl} title={r.title} allow="autoplay; encrypted-media" allowFullScreen />
            )}
            {r.source === "tiktok" && (
              <blockquote className="tiktok-embed" cite={r.rawLink} data-video-id={r.embedVideoId} style={{ maxWidth: "100%", minWidth: "100%" }}>
                <a href={r.rawLink} target="_blank" rel="noreferrer">View on TikTok</a>
              </blockquote>
            )}
            {r.source === "link" && (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: 30, textAlign: "center" }}>
                <a href={r.rawLink} target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>Open shared link ↗</a>
              </div>
            )}

            <span className="rl-source-badge">{r.source === "youtube" ? "▶ YouTube" : r.source === "tiktok" ? "TikTok" : "Link"}</span>

            <div className="rl-overlay">
              <span className="rl-cat">{CATEGORY_LABELS[r.category] || r.category}</span>
              <div className="rl-title">{r.title}</div>
              <div className="rl-channel">{r.channelTitle}</div>
            </div>

            <div className="rl-actions">
              {isStaff && <button className="rl-action-btn" onClick={() => hideReel(r.id)} title="Hide">🚫</button>}
              {r.rawLink && <a className="rl-action-btn" href={r.rawLink} target="_blank" rel="noreferrer" title="Open original">↗</a>}
            </div>
          </div>
        </div>
      ))}

      <button className="rl-add-btn" onClick={() => setShowAdd(true)} title="Share a link">➕</button>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>🔗 Share a Video Link</h3>
            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
              Paste a YouTube or TikTok link — it will embed automatically. Please only share content that's genuinely useful for the community.
            </p>
            <div className="form-group">
              <label className="form-label">Link</label>
              <input className="form-input" placeholder="https://..." value={linkInput} onChange={e => setLinkInput(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Title (optional)</label>
              <input className="form-input" placeholder="What is this about?" value={titleInput} onChange={e => setTitleInput(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" style={{ margin: 0 }} onClick={addManualLink} disabled={!linkInput.trim() || posting}>{posting ? "Adding..." : "Add"}</button>
              <button className="btn-secondary" style={{ margin: 0 }} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
