import { useEffect } from "react";

const CSS = `
.lb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.94);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.lb-img{max-width:100%;max-height:92vh;object-fit:contain;border-radius:6px}
.lb-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,.12);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.lb-close:hover{background:rgba(255,255,255,.22)}
`;

// Full-screen in-app image viewer. Never navigates away or opens a new tab —
// tapping an image should always keep the person inside the app.
export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    if (!document.getElementById("lb-css")) {
      const s = document.createElement("style");
      s.id = "lb-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="lb-overlay" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>✕</button>
      <img src={src} alt="" className="lb-img" onClick={e => e.stopPropagation()} />
    </div>
  );
}
