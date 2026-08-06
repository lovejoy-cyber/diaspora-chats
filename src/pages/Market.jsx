import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { uploadToCloudinary, cleanText, containsProfanity, timeAgo } from "../lib/helpers";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";
import UserProfileModal from "../components/UserProfileModal";
import Lightbox from "../components/Lightbox";

const CATEGORIES = [
  { id: "transfer", label: "💸 Money Transfer" },
  { id: "sell",     label: "🛒 Selling" },
  { id: "buy",      label: "🔎 Looking to Buy" },
  { id: "service",  label: "🛠️ Service Offered" },
  { id: "housing",  label: "🏠 Housing" },
  { id: "job",      label: "💼 Job / Gig" },
  { id: "tutoring", label: "📚 Tutoring" },
  { id: "other",    label: "📦 Other" },
];
const CURRENCIES = ["DZD","USD","EUR","GBP","ZAR","NGN","KES","XAF","XOF","ZMW","ETB","USDT","BTC","Other"];
const COUNTRIES = ["Zimbabwe","Nigeria","Cameroon","DR Congo","Congo","Ivory Coast","Senegal","Mali","Ghana","Kenya","Ethiopia","South Africa","Mozambique","Zambia","Tanzania","Uganda","Rwanda","Togo","Benin","Chad","Sudan","Morocco","Tunisia","Algeria","Namibia","Botswana","Angola","Malawi","Egypt","Other"];
const DIRECTIONS = [
  { value: "sending",   label: "📤 I'm Sending Money", desc: "You have funds and want to send them somewhere" },
  { value: "receiving", label: "📥 I Want To Receive Money", desc: "You're expecting funds from abroad" },
  { value: "exchange",  label: "🔁 Currency Exchange", desc: "You want to swap one currency for another" },
];

const CSS = `
.mk{padding:16px 14px;overflow-y:auto;height:100%}
.mk-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.mk-sel{padding:9px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:11px;color:var(--text);font-size:12px;outline:none;font-family:inherit;cursor:pointer}
.mk-sel:focus{border-color:var(--primary)}
.mk-post{padding:9px 18px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border:none;border-radius:11px;font-size:12.5px;font-weight:750;cursor:pointer;font-family:inherit;margin-left:auto;box-shadow:0 4px 12px rgba(59,130,246,.3)}
.mk-post-transfer{padding:9px 18px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:11px;font-size:12.5px;font-weight:750;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(16,185,129,.3)}
.mk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:13px}
.mk-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:all .2s;display:flex;flex-direction:column}
.mk-card:hover{border-color:var(--primary);transform:translateY(-2px)}
.mk-card.closed{opacity:.55}
.mk-card.transfer{border-color:rgba(16,185,129,.35);background:linear-gradient(180deg,rgba(16,185,129,.05),var(--bg-card) 40%)}
.mk-card.transfer:hover{border-color:#10b981}
.mk-priority-tag{position:absolute;top:10px;left:10px;background:#10b981;color:#fff;font-size:9.5px;font-weight:800;padding:3px 9px;border-radius:20px;letter-spacing:.4px;z-index:2}
.mk-img-wrap{position:relative}
.mk-img{width:100%;height:150px;object-fit:cover;display:block;cursor:pointer}
.mk-in{padding:14px;position:relative}
.mk-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:9px}
.mk-cat{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;padding:3px 8px;border-radius:20px;background:rgba(59,130,246,.13);color:var(--primary-light);white-space:nowrap}
.mk-cat.transfer{background:rgba(16,185,129,.15);color:#34d399}
.mk-st{font-size:9.5px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap}
.mk-st.open{background:rgba(16,185,129,.13);color:#34d399}
.mk-st.closed{background:rgba(239,68,68,.13);color:#fca5a5}
.mk-ti{font-size:15px;font-weight:750;margin-bottom:5px;line-height:1.35}
.mk-de{font-size:12px;color:var(--text2);line-height:1.65;margin-bottom:11px}
.mk-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:11px}
.mk-tag{font-size:11px;padding:3px 9px;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:7px;color:var(--text2)}
.mk-tag.card{background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.25);color:var(--primary-light)}
.mk-pr{font-size:17px;font-weight:850;color:#34d399;margin-bottom:9px}
.mk-route{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;margin-bottom:10px;padding:8px 10px;background:rgba(16,185,129,.08);border-radius:9px;border:1px solid rgba(16,185,129,.18)}
.mk-po{display:flex;align-items:center;gap:8px;border-top:1px solid var(--border);padding-top:11px;margin-top:auto}
.mk-po-n{font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.mk-po-n:hover{color:var(--primary-light)}
.mk-po-t{font-size:10px;color:var(--text3);margin-left:auto;white-space:nowrap}
.mk-acts{display:flex;gap:7px;margin-top:11px}
.mk-b{flex:1;padding:8px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:inherit}
.mk-b.msg{background:rgba(59,130,246,.14);color:var(--primary-light);border:1px solid rgba(59,130,246,.25)}
.mk-b.msg.transfer{background:rgba(16,185,129,.16);color:#34d399;border:1px solid rgba(16,185,129,.3)}
.mk-b.cls{background:rgba(239,68,68,.1);color:#fca5a5;border:1px solid rgba(239,68,68,.2)}
.mk-empty{text-align:center;padding:56px 20px;color:var(--text2)}
.mk-direction-opt{padding:12px 14px;border:2px solid var(--border);border-radius:12px;cursor:pointer;transition:all .15s;margin-bottom:8px}
.mk-direction-opt:hover{border-color:var(--border2)}
.mk-direction-opt.sel{border-color:#10b981;background:rgba(16,185,129,.08)}
.mk-direction-title{font-size:13.5px;font-weight:700}
.mk-direction-desc{font-size:11.5px;color:var(--text2);margin-top:2px}
.mk-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
.mk-toggle{width:44px;height:25px;border-radius:20px;border:none;cursor:pointer;position:relative;flex-shrink:0}
.mk-toggle-knob{position:absolute;top:3px;width:19px;height:19px;border-radius:50%;background:#fff;transition:left .2s}
`;

export default function Market() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [transferMode, setTransferMode] = useState(false);
  const [fCat, setFCat] = useState("");
  const [fCountry, setFCountry] = useState("");
  const [fStatus, setFStatus] = useState("open");
  const [viewUid, setViewUid] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState("");
  const [img, setImg] = useState(null);
  const [prev, setPrev] = useState("");
  const [form, setForm] = useState({
    title: "", desc: "", category: "", country: "", currency: "", price: "", contact: "",
    direction: "", fromCountry: "", toCountry: "", cardHolder: false, cardNotes: "",
  });

  useEffect(() => {
    if (!document.getElementById("mk-css")) {
      const s = document.createElement("style");
      s.id = "mk-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
  }, []);

  const openTransferForm = () => {
    setForm({ title: "", desc: "", category: "transfer", country: "", currency: "", price: "", contact: "", direction: "", fromCountry: "", toCountry: "", cardHolder: false, cardNotes: "" });
    setTransferMode(true);
    setShowForm(true);
  };
  const openGeneralForm = () => {
    setForm({ title: "", desc: "", category: "", country: "", currency: "", price: "", contact: "", direction: "", fromCountry: "", toCountry: "", cardHolder: false, cardNotes: "" });
    setTransferMode(false);
    setShowForm(true);
  };

  const post = async (e) => {
    e.preventDefault();
    const isTransfer = form.category === "transfer";
    if (isTransfer) {
      if (!form.direction) { setErr("Please choose whether you're sending, receiving, or exchanging."); return; }
      if (!form.currency || !form.price) { setErr("Amount and currency are required for a transfer listing."); return; }
    } else if (!form.title.trim() || !form.category) {
      setErr("Title and category are required."); return;
    }
    if (containsProfanity(form.title + " " + form.desc)) { setErr("Listing contains language that is not allowed."); return; }
    setPosting(true); setErr("");
    try {
      let imageUrl = null;
      if (img) imageUrl = await uploadToCloudinary(img, "image");
      const title = isTransfer
        ? (form.title.trim() || (form.direction === "sending" ? "Sending " : form.direction === "receiving" ? "Receiving " : "Exchanging ") + form.price + " " + form.currency)
        : form.title.trim();
      await addDoc(collection(db, "listings"), {
        title: cleanText(title), desc: cleanText(form.desc.trim()),
        category: form.category, country: form.country, currency: form.currency,
        price: form.price.trim(), contact: form.contact.trim(), imageUrl,
        direction: isTransfer ? form.direction : "", fromCountry: isTransfer ? form.fromCountry : "", toCountry: isTransfer ? form.toCountry : "",
        cardHolder: isTransfer ? form.cardHolder : false, cardNotes: isTransfer ? cleanText(form.cardNotes.trim()) : "",
        uid: currentUser.uid, posterName: userProfile.fullName,
        posterPhoto: userProfile.photoURL || "", posterRole: userProfile.role || "student",
        posterNationality: userProfile.nationality || "", posterVerified: userProfile.verified || false,
        status: "open", createdAt: serverTimestamp(),
      });
      setShowForm(false); setImg(null); setPrev("");
    } catch { setErr("Could not post. Please try again."); }
    setPosting(false);
  };

  const close = async (id) => { await updateDoc(doc(db, "listings", id), { status: "closed" }); };
  const remove = async (id) => { if (window.confirm("Delete this listing?")) await deleteDoc(doc(db, "listings", id)); };

  const blocked = userProfile?.blockedUsers || [];
  let list = items.filter(l => {
    if (blocked.includes(l.uid)) return false;
    if (fCat && l.category !== fCat) return false;
    if (fCountry && l.country !== fCountry && l.fromCountry !== fCountry && l.toCountry !== fCountry) return false;
    if (fStatus && l.status !== fStatus) return false;
    return true;
  });
  // Money-transfer listings are the core purpose of this app — always float to the top.
  list = [...list].sort((a, b) => {
    const aT = a.category === "transfer" ? 1 : 0;
    const bT = b.category === "transfer" ? 1 : 0;
    if (aT !== bT) return bT - aT;
    const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
    const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
    return tb - ta;
  });

  const catLabel = id => CATEGORIES.find(c => c.id === id)?.label || "📦 Other";
  const directionLabel = d => DIRECTIONS.find(x => x.value === d)?.label || "";

  return (
    <div className="mk">
      <div className="mk-top">
        <select className="mk-sel" value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="open">✓ Open</option>
          <option value="closed">Closed</option>
          <option value="">All</option>
        </select>
        <select className="mk-sel" value={fCat} onChange={e => setFCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select className="mk-sel" value={fCountry} onChange={e => setFCountry(e.target.value)}>
          <option value="">All countries</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="mk-post-transfer" onClick={openTransferForm}>💸 Post Transfer</button>
        <button className="mk-post" onClick={openGeneralForm}>+ Other Listing</button>
      </div>

      {list.length === 0 && (
        <div className="mk-empty">
          <div style={{ fontSize: 42, marginBottom: 10, opacity: .5 }}>🛒</div>
          <div style={{ fontWeight: 750, fontSize: 16, marginBottom: 6 }}>Nothing listed yet</div>
          <div style={{ fontSize: 13 }}>Post the first listing for the community.</div>
        </div>
      )}

      <div className="mk-grid">
        {list.map(l => {
          const isTransfer = l.category === "transfer";
          return (
            <div key={l.id} className={"mk-card" + (l.status === "closed" ? " closed" : "") + (isTransfer ? " transfer" : "")}>
              <div className="mk-img-wrap">
                {isTransfer && <span className="mk-priority-tag">💸 PRIORITY</span>}
                {l.imageUrl && <img src={l.imageUrl} alt="" className="mk-img" onClick={() => setLightboxSrc(l.imageUrl)} />}
              </div>
              <div className="mk-in">
                <div className="mk-hd">
                  <span className={"mk-cat" + (isTransfer ? " transfer" : "")}>{catLabel(l.category)}</span>
                  <span className={"mk-st " + l.status}>{l.status === "open" ? "✓ Open" : "Closed"}</span>
                </div>
                <div className="mk-ti">{l.title}</div>

                {isTransfer && l.direction && (
                  <div className="mk-route">
                    {directionLabel(l.direction)}
                    {(l.fromCountry || l.toCountry) && (
                      <span style={{ marginLeft: "auto", fontWeight: 600, color: "var(--text2)" }}>
                        {l.fromCountry || "?"} → {l.toCountry || "?"}
                      </span>
                    )}
                  </div>
                )}

                {l.price && <div className="mk-pr">{l.price} {l.currency}</div>}
                {l.desc && <div className="mk-de">{l.desc}</div>}

                <div className="mk-tags">
                  {l.country && <span className="mk-tag">🌍 {l.country}</span>}
                  {l.currency && !l.price && <span className="mk-tag">💱 {l.currency}</span>}
                  {isTransfer && l.cardHolder && <span className="mk-tag card">💳 Card holder available</span>}
                </div>

                {l.cardNotes && (
                  <div style={{ fontSize: 11.5, color: "var(--text2)", marginBottom: 10, padding: "7px 9px", background: "var(--bg-input)", borderRadius: 8 }}>
                    💳 {l.cardNotes}
                  </div>
                )}
                {l.contact && (
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, padding: "8px 10px", background: "var(--bg-input)", borderRadius: 8 }}>
                    📌 {l.contact}
                  </div>
                )}

                <div className="mk-po">
                  <Avatar src={l.posterPhoto} name={l.posterName} size={30} onClick={() => setViewUid(l.uid)} />
                  <div>
                    <div className="mk-po-n" onClick={() => setViewUid(l.uid)}>
                      {l.posterName}{l.posterVerified && <span className="verified-badge">✓</span>}
                    </div>
                    <RoleBadge role={l.posterRole} small />
                  </div>
                  <span className="mk-po-t">{timeAgo(l.createdAt)}</span>
                </div>
                <div className="mk-acts">
                  {l.uid !== currentUser.uid && l.status === "open" && (
                    <button className={"mk-b msg" + (isTransfer ? " transfer" : "")} onClick={() => navigate("/dashboard/messages?start=" + l.uid + "&listing=" + l.id)}>
                      {isTransfer ? "💬 Link Up About This" : "💬 Message"}
                    </button>
                  )}
                  {l.uid === currentUser.uid && l.status === "open" && (
                    <button className="mk-b cls" onClick={() => close(l.id)}>Mark Closed</button>
                  )}
                  {l.uid === currentUser.uid && (
                    <button className="mk-b cls" onClick={() => remove(l.id)}>🗑️ Delete</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>{transferMode ? "💸 Post a Money Transfer Request" : "📋 Post a Listing"}</h3>
            {err && <div className="error-msg">⚠️ {err}</div>}
            <form onSubmit={post}>

              {transferMode ? (
                <>
                  <div className="form-group">
                    <label className="form-label">What do you need? *</label>
                    {DIRECTIONS.map(d => (
                      <div key={d.value} className={"mk-direction-opt" + (form.direction === d.value ? " sel" : "")} onClick={() => setForm({ ...form, direction: d.value })}>
                        <div className="mk-direction-title">{d.label}</div>
                        <div className="mk-direction-desc">{d.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Amount *</label>
                      <input className="form-input" placeholder="e.g. 500" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency *</label>
                      <select className="form-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                        <option value="">Select...</option>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">From Country</label>
                      <select className="form-input" value={form.fromCountry} onChange={e => setForm({ ...form, fromCountry: e.target.value })}>
                        <option value="">Select...</option>
                        <option value="Algeria">Algeria</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Country</label>
                      <select className="form-input" value={form.toCountry} onChange={e => setForm({ ...form, toCountry: e.target.value })}>
                        <option value="">Select...</option>
                        <option value="Algeria">Algeria</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="mk-toggle-row">
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>💳 Visa / Card holder for online transactions?</div>
                        <div style={{ fontSize: 11.5, color: "var(--text2)", marginTop: 2, maxWidth: 260 }}>
                          Only say yes if you can genuinely help with card-based transfers. Never share your real card number here — only availability and general notes.
                        </div>
                      </div>
                      <button type="button" className="mk-toggle" style={{ background: form.cardHolder ? "#10b981" : "var(--border2)" }} onClick={() => setForm({ ...form, cardHolder: !form.cardHolder })}>
                        <span className="mk-toggle-knob" style={{ left: form.cardHolder ? 22 : 3 }} />
                      </button>
                    </div>
                    {form.cardHolder && (
                      <input className="form-input" placeholder="e.g. Visa debit, works for USD/EUR sites, ask for details" value={form.cardNotes} onChange={e => setForm({ ...form, cardNotes: e.target.value })} />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Additional Details</label>
                    <textarea className="form-input" rows={2} placeholder="Rates, timing, conditions..." value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" placeholder='e.g. "Selling textbooks", "Room available in Oran"' value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        <option value="">Select...</option>
                        {CATEGORIES.filter(c => c.id !== "transfer").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <select className="form-input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
                        <option value="">Select...</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Price / Amount</label>
                      <input className="form-input" placeholder="e.g. 5000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency</label>
                      <select className="form-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                        <option value="">Select...</option>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={3} placeholder="Details, conditions..." value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Contact Note</label>
                <input className="form-input" placeholder='e.g. "Message me first, available weekends"' value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Photo (optional)</label>
                {prev && <img src={prev} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10, marginBottom: 8 }} />}
                <input type="file" accept="image/*" className="form-input"
                  onChange={e => { const f = e.target.files[0]; if (f) { setImg(f); setPrev(URL.createObjectURL(f)); } }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn-primary" style={{ margin: 0 }} disabled={posting}>{posting ? "Posting..." : "Post Listing"}</button>
                <button type="button" className="btn-secondary" style={{ margin: 0 }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUid && <UserProfileModal uid={viewUid} onClose={() => setViewUid(null)} />}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
