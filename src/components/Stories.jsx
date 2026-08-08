import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, arrayUnion, doc, updateDoc, getDocs } from "firebase/firestore";
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
  const [showViewersList, setShowViewersList] = useState(false);
  const [viewersInfo, setViewersInfo] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [showReportStory, setShowReportStory] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
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

  // Loads the display names/photos of everyone who has viewed the currently-open status —
  // only meaningful (and only shown) for your OWN status, same as every real status feature.
  const loadViewersList = async () => {
    if (!viewerGroup) return;
    const currentStory = viewerGroup?.items[viewerIndex];
    if (!currentStory) return;
    setLoadingViewers(true);
    setShowViewersList(true);
    try {
      const uids = currentStory.viewedBy || [];
      if (uids.length === 0) { setViewersInfo([]); setLoadingViewers(false); return; }
      const snap = await getDocs(collection(db, "users"));
      const allUsers = snap.docs.map(d => d.data());
      const matched = uids.map(uid => allUsers.find(u => u.uid === uid)).filter(Boolean);
      setViewersInfo(matched);
    } catch (e) { setViewersInfo([]); }
    setLoadingViewers(false);
  };

  const submitStoryReport = async () => {
    if (!reportReason || !viewerGroup) return;
    setReportSubmitting(true);
    try {
      const currentStory = viewerGroup.items[viewerIndex];
      await addDoc(collection(db, "reports"), {
        type: "story",
        reportedUserId: viewerGroup.authorId,
        reportedUserName: viewerGroup.authorName,
        reporterId: currentUser.uid,
        reporterName: userProfile.fullName,
        reason: reportReason,
        details: "Status content: " + (currentStory.text || (currentStory.mediaType === "image" ? "Photo status" : currentStory.mediaType === "video" ? "Video status" : "")),
        status: "open",
        createdAt: serverTimestamp(),
      });
      setReportDone(true);
      setTimeout(() => { setShowReportStory(false); setReportDone(false); setReportReason(""); }, 1800);
    } catch (e) {}
    setReportSubmitting(false);
  };

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
            {viewerGroup.authorId === currentUser.uid ? (
              <button className="st-viewer-close" style={{ marginLeft: "auto", fontSize: 14 }} onClick={loadViewersList} title="See who viewed">👁️</button>
            ) : (
              <button className="st-viewer-close" style={{ marginLeft: "auto", fontSize: 14 }} onClick={() => setShowReportStory(true)} title="Report">🚩</button>
            )}
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

      {showViewersList && (
        <div className="st-create-modal" onClick={() => setShowViewersList(false)}>
          <div className="st-create-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>👁️ Viewed By</h3>
            {loadingViewers && <p style={{ fontSize: 13, color: "var(--text2)" }}>Loading...</p>}
            {!loadingViewers && viewersInfo.length === 0 && <p style={{ fontSize: 13, color: "var(--text2)" }}>No one has viewed this yet.</p>}
            {!loadingViewers && viewersInfo.length > 0 && (
              <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {viewersInfo.map(v => (
                  <div key={v.uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar src={v.photoURL} name={v.fullName} size={36} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{v.fullName}{v.verified && <span className="verified-badge" style={{ marginLeft: 5 }}>✓</span>}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>{v.nationality}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => setShowViewersList(false)}>Close</button>
          </div>
        </div>
      )}

      {showReportStory && (
        <div className="st-create-modal" onClick={() => !reportSubmitting && setShowReportStory(false)}>
          <div className="st-create-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>🚩 Report this Status</h3>
            {reportDone ? (
              <div className="success-msg">✅ Report submitted. Our admin team will review it.</div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <select className="form-input" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                    <option value="">Select a reason...</option>
                    <option value="Inappropriate content">Inappropriate content</option>
                    <option value="Harassment or bullying">Harassment or bullying</option>
                    <option value="Scam or fraud attempt">Scam or fraud attempt</option>
                    <option value="Spam">Spam</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-primary" style={{ margin: 0 }} onClick={submitStoryReport} disabled={!reportReason || reportSubmitting}>
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                  <button className="btn-secondary" style={{ margin: 0 }} onClick={() => setShowReportStory(false)}>Cancel</button>
                </div>
              </>
            )}
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
