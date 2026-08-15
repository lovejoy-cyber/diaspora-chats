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
.rl-filter-bar{position:sticky;top:0;left:0;right:0;z-index:15;display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:linear-gradient(to bottom,rgba(0,0,0,.85),rgba(0,0,0,.3));pointer-events:none;}
.rl-filter-bar>*{pointer-events:auto;}
.rl-filter-chip{flex-shrink:0;padding:6px 13px;border-radius:20px;font-size:11.5px;font-weight:650;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.18);cursor:pointer;white-space:nowrap;backdrop-filter:blur(4px);transition:all .15s;}
.rl-filter-chip.on{background:var(--primary);border-color:var(--primary);}
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
  trending: "🔥 Trending", jokes: "😂 Jokes",
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
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [posting, setPosting] = useState(false);
  // Tracks which single reel is actually visible/scrolled-to right now — only that one
  // gets a live, playing embed. This is the real fix for "videos play together instead
  // of stopping the previous one" — every reel WAS rendering a live YouTube iframe
  // simultaneously regardless of scroll position. Only the active slide's video element
  // exists in the DOM at all now; scrolling away unmounts it, which stops playback.
  const [activeReelId, setActiveReelId] = useState(null);
  const slideRefs = useRef({});
  const observerRef = useRef(null);

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

  const filtered = activeCategory === "all" ? reels : reels.filter(r => r.category === activeCategory);
  const availableCategories = ["all", ...new Set(reels.map(r => r.category).filter(Boolean))];

  // Sets up ONE IntersectionObserver watching all rendered slides — whichever one is
  // most visible in the viewport (i.e. the one the user has scrolled to) becomes the
  // active reel. Re-runs whenever the list of reels changes, since new slide elements
  // need to be observed too.
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio — the slide most fully
        // in view — and make that the active (playing) one.
        let best = null;
        entries.forEach(entry => {
          if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
            best = entry;
          }
        });
        if (best) {
          const id = best.target.getAttribute("data-reel-id");
          setActiveReelId(id);
        }
      },
      { threshold: [0.6] } // a slide must be at least 60% visible to be considered "active"
    );
    Object.values(slideRefs.current).forEach(el => { if (el) observer.observe(el); });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [filtered.length]);

  return (
    <div className="rl-page">
      {availableCategories.length > 1 && (
        <div className="rl-filter-bar">
          {availableCategories.map(c => (
            <div key={c} className={"rl-filter-chip" + (activeCategory === c ? " on" : "")} onClick={() => setActiveCategory(c)}>
              {c === "all" ? "🌍 All" : CATEGORY_LABELS[c] || c}
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="rl-empty">
          <div style={{ fontSize: 42 }}>🎬</div>
          <div style={{ fontWeight: 700 }}>No reels yet</div>
          <div style={{ fontSize: 13, opacity: .8 }}>Automated content refreshes every few hours, or share a link below.</div>
        </div>
      )}

      {filtered.map(r => {
        const isActive = activeReelId === r.id;
        return (
          <div key={r.id} className="rl-slide" ref={el => { slideRefs.current[r.id] = el; }} data-reel-id={r.id}>
            <div className="rl-media-wrap">
              {isActive ? (
                <>
                  {r.source === "youtube" && (
                    <iframe src={"https://www.youtube.com/embed/" + r.videoId + "?autoplay=1"} title={r.title} allow="autoplay; encrypted-media" allowFullScreen />
                  )}
                  {r.source === "youtube" && r.embedUrl && !r.videoId && (
                    <iframe src={r.embedUrl.replace("autoplay=0", "autoplay=1")} title={r.title} allow="autoplay; encrypted-media" allowFullScreen />
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
                </>
              ) : (
                // Inactive slide — no live video, just a static thumbnail so scrolling
                // past feels smooth rather than showing a blank black box. Tapping it
                // still lets the person jump straight to it via native scroll snap.
                <div style={{ width: "100%", height: "100%", position: "relative", background: "#111" }}>
                  {r.thumbnail && (
                    <img src={r.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .6 }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, opacity: .8 }}>▶</div>
                </div>
              )}

              <span className="rl-source-badge">{r.source === "youtube" ? "▶ YouTube" : r.source === "tiktok" ? "TikTok" : "Link"}</span>

              <div className="rl-overlay">
                <div className="rl-title">{r.title}</div>
                <div className="rl-channel">{r.channelTitle}</div>
              </div>

              <div className="rl-actions">
                {isStaff && <button className="rl-action-btn" onClick={() => hideReel(r.id)} title="Hide">🚫</button>}
              </div>
            </div>
          </div>
        );
      })}

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
