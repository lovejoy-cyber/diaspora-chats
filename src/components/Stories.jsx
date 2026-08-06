import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { uploadToCloudinary } from "../lib/helpers";
import Avatar from "./Avatar";

const CSS = `
.st-strip{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 14px;margin-bottom:4px}
.st-item{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0;cursor:pointer;width:64px}
.st-ring{width:60px;height:60px;border-radius:50%;padding:2.5px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f59e0b,#ec4899,#8b5cf6)}
.st-ring.seen{background:var(--border)}
.st-ring-inner{width:100%;height:100%;border-radius:50%;background:var(--bg);padding:2px;display:flex;align-items:center;justify-content:center}
.st-add-ring{width:60px;height:60px;border-radius:50%;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--text2);position:relative}
.st-add-plus{position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;border:2px solid var(--bg)}
.st-label{font-size:10.5px;color:var(--text2);max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.st-viewer{position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column}
.st-viewer-bars{display:flex;gap:4px;padding:10px 10px 0}
.st-viewer-bar{flex:1;height:3px;background:rgba(255,255,255,.3);border-radius:3px;overflow:hidden}
.st-viewer-bar-fill{height:100%;background:#fff;width:0%}
.st-viewer-head{display:flex;align-items:center;gap:10px;padding:12px 14px;color:#fff}
.st-viewer-close{margin-left:auto;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px}
.st-viewer-body{flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.st-viewer-body img,.st-viewer-body video{max-width:100%;max-height:100%;object-fit:contain}
.st-viewer-text{color:#fff;font-size:22px;font-weight:700;text-align:center;padding:40px;line-height:1.5}
.st-viewer-nav{position:absolute;top:0;bottom:0;width:35%;z-index:2}
.st-viewer-nav.left{left:0}
.st-viewer-nav.right{right:0}
.st-create-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
.st-create-card{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:22px;width:100%;max-width:380px}
.st-preview-box{width:100%;aspect-ratio:9/16;max-height:280px;background:var(--bg-input);border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:14px;position:relative}
.st-preview-box img,.st-preview-box video{width:100%;height:100%;object-fit:cover}
.st-preview-placeholder{color:var(--text2);text-align:center;padding:20px;font-size:13px}
`;

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  return Math.floor(diff / 3600) + "h ago";
}

export default function Stories() {
  const { currentUser, userProfile } = useAuth();
  const [stories, setStories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [textOnly, setTextOnly] = useState("");
  const [posting, setPosting] = useState(false);
  const [viewerGroup, setViewerGroup] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("st-css")) {
      const s = document.createElement("style");
      s.id = "st-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(collection(db, "stories"), where("createdAt", ">", cutoff), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setStories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Group stories by author
  const grouped = {};
  stories.forEach(s => {
    if (!grouped[s.authorId]) grouped[s.authorId] = { authorId: s.authorId, authorName: s.authorName, authorPhoto: s.authorPhoto, items: [] };
    grouped[s.authorId].items.push(s);
  });
  const groups = Object.values(grouped);
  const myGroup = groups.find(g => g.authorId === currentUser.uid);
  const otherGroups = groups.filter(g => g.authorId !== currentUser.uid);

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
    setMediaPreview(URL.createObjectURL(file));
    setShowCreate(true);
    e.target.value = "";
  };

  const postStory = async () => {
    if (!mediaFile && !textOnly.trim()) return;
    setPosting(true);
    try {
      let mediaUrl = null;
      if (mediaFile) mediaUrl = await uploadToCloudinary(mediaFile, mediaType === "video" ? "video" : "image");
      await addDoc(collection(db, "stories"), {
        authorId: currentUser.uid,
        authorName: userProfile.fullName,
        authorPhoto: userProfile.photoURL || "",
        mediaUrl, mediaType: mediaFile ? mediaType : "text",
        text: textOnly.trim(),
        viewedBy: [],
        createdAt: serverTimestamp(),
      });
      setShowCreate(false); setMediaFile(null); setMediaPreview(""); setTextOnly("");
    } catch (e) { alert("Failed to post status. Try again."); }
    setPosting(false);
  };

  const openViewer = (group, idx = 0) => {
    setViewerGroup(group); setViewerIndex(idx); setProgress(0);
  };

  const markSeen = async story => {
    if (story.viewedBy?.includes(currentUser.uid)) return;
    await updateDoc(doc(db, "stories", story.id), { viewedBy: arrayUnion(currentUser.uid) }).catch(() => {});
  };

  useEffect(() => {
    if (!viewerGroup) return;
    const current = viewerGroup.items[viewerIndex];
    if (!current) { setViewerGroup(null); return; }
    markSeen(current);
    setProgress(0);
    clearInterval(progressTimerRef.current);
    const duration = 5000;
    const step = 50;
    let elapsed = 0;
    progressTimerRef.current = setInterval(() => {
      elapsed += step;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        clearInterval(progressTimerRef.current);
        if (viewerIndex < viewerGroup.items.length - 1) setViewerIndex(i => i + 1);
        else setViewerGroup(null);
      }
    }, step);
    return () => clearInterval(progressTimerRef.current);
    // eslint-disable-next-line
  }, [viewerGroup, viewerIndex]);

  const hasUnseen = group => group.items.some(s => !s.viewedBy?.includes(currentUser.uid));

  return (
    <div>
      <div className="st-strip">
        <div className="st-item" onClick={() => (myGroup ? openViewer(myGroup) : fileRef.current?.click())}>
          {myGroup ? (
            <div className="st-ring"><div className="st-ring-inner"><Avatar src={userProfile?.photoURL} name={userProfile?.fullName} size={52} /></div></div>
          ) : (
            <div className="st-add-ring">
              <Avatar src={userProfile?.photoURL} name={userProfile?.fullName} size={56} />
              <span className="st-add-plus">+</span>
            </div>
          )}
          <span className="st-label">Your Status</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />

        {otherGroups.map(g => (
          <div key={g.authorId} className="st-item" onClick={() => openViewer(g)}>
            <div className={"st-ring" + (hasUnseen(g) ? "" : " seen")}>
              <div className="st-ring-inner"><Avatar src={g.authorPhoto} name={g.authorName} size={52} /></div>
            </div>
            <span className="st-label">{g.authorName?.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      {viewerGroup && viewerGroup.items[viewerIndex] && (
        <div className="st-viewer">
          <div className="st-viewer-bars">
            {viewerGroup.items.map((_, i) => (
              <div key={i} className="st-viewer-bar">
                <div className="st-viewer-bar-fill" style={{ width: i < viewerIndex ? "100%" : i === viewerIndex ? progress + "%" : "0%" }} />
              </div>
            ))}
          </div>
          <div className="st-viewer-head">
            <Avatar src={viewerGroup.authorPhoto} name={viewerGroup.authorName} size={32} />
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{viewerGroup.authorName}</div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11 }}>{timeAgo(viewerGroup.items[viewerIndex].createdAt)}</div>
            </div>
            <button className="st-viewer-close" onClick={() => setViewerGroup(null)}>✕</button>
          </div>
          <div className="st-viewer-body">
            <div className="st-viewer-nav left" onClick={() => viewerIndex > 0 ? setViewerIndex(i => i - 1) : setViewerGroup(null)} />
            <div className="st-viewer-nav right" onClick={() => viewerIndex < viewerGroup.items.length - 1 ? setViewerIndex(i => i + 1) : setViewerGroup(null)} />
            {viewerGroup.items[viewerIndex].mediaType === "image" && <img src={viewerGroup.items[viewerIndex].mediaUrl} alt="" />}
            {viewerGroup.items[viewerIndex].mediaType === "video" && <video src={viewerGroup.items[viewerIndex].mediaUrl} autoPlay muted playsInline />}
            {viewerGroup.items[viewerIndex].mediaType === "text" && <div className="st-viewer-text">{viewerGroup.items[viewerIndex].text}</div>}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="st-create-modal" onClick={() => !posting && setShowCreate(false)}>
          <div className="st-create-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>✨ Add to Your Status</h3>
            <div className="st-preview-box">
              {mediaPreview ? (
                mediaType === "video" ? <video src={mediaPreview} muted autoPlay loop playsInline /> : <img src={mediaPreview} alt="preview" />
              ) : (
                <div className="st-preview-placeholder">Write a text status below, or choose a photo/video</div>
              )}
            </div>
            <div className="form-group">
              <textarea className="form-input" placeholder="Say something (optional caption)..." value={textOnly} onChange={e => setTextOnly(e.target.value)} rows={2} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={postStory} disabled={posting || (!mediaFile && !textOnly.trim())} style={{ margin: 0 }}>{posting ? "Posting..." : "Post Status"}</button>
              <button className="btn-secondary" onClick={() => setShowCreate(false)} style={{ margin: 0 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
