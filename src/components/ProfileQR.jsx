import { useState } from "react";

// Generates a scannable QR code for a profile URL using a free public QR API
// (api.qrserver.com — no key needed, no cost, no account) rather than pulling in a
// whole QR-generating library just for this one feature.
const STYLE = `
.qr-btn{background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--text2);padding:8px 12px;border-radius:9px;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .15s}
.qr-btn:hover{background:rgba(59,130,246,.14);border-color:var(--primary);color:var(--primary-light)}
.qr-modal{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}
.qr-card{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:28px;width:100%;max-width:320px;text-align:center}
.qr-img-wrap{background:#fff;border-radius:16px;padding:16px;margin:16px 0;display:inline-block}
.qr-name{font-size:16px;font-weight:800;margin-top:4px}
.qr-sub{font-size:12px;color:var(--text2);margin-bottom:4px}
.qr-close{background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer;position:absolute;top:16px;right:16px}
`;

export default function ProfileQR({ uid, name }) {
  const [open, setOpen] = useState(false);

  if (!document.getElementById("qr-css")) {
    const s = document.createElement("style");
    s.id = "qr-css"; s.textContent = STYLE;
    document.head.appendChild(s);
  }

  const profileUrl = window.location.origin + "/dashboard/user/" + uid;
  const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(profileUrl);

  const copyLink = () => {
    navigator.clipboard?.writeText(profileUrl).catch(() => {});
  };

  return (
    <>
      <button className="qr-btn" onClick={() => setOpen(true)}>📱 My QR Code</button>
      {open && (
        <div className="qr-modal" onClick={() => setOpen(false)}>
          <div className="qr-card" onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
            <button className="qr-close" onClick={() => setOpen(false)}>✕</button>
            <div className="qr-sub">Scan to open profile</div>
            <div className="qr-name">{name}</div>
            <div className="qr-img-wrap">
              <img src={qrImageUrl} alt="Profile QR code" width={220} height={220} />
            </div>
            <button className="qr-btn" style={{ width: "100%", justifyContent: "center" }} onClick={copyLink}>🔗 Copy Profile Link</button>
          </div>
        </div>
      )}
    </>
  );
}
