import { useState } from "react";

// The animation "stage" for the login/register screen — built now with a placeholder
// character so the real photo/video can drop in later with zero rework. The eyes track
// which field is focused, and cover themselves when the password field is active —
// exactly the effect described: "looks at" email, "covers its eyes" for password.
const CSS = `
.ra-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:20px;}
.ra-stage{width:96px;height:96px;border-radius:50%;position:relative;overflow:hidden;background:linear-gradient(135deg,var(--primary),#8B5CF6);}
.ra-face{width:100%;height:100%;position:relative;}
.ra-eyes{position:absolute;top:38%;left:50%;transform:translateX(-50%);display:flex;gap:14px;}
.ra-eye{width:14px;height:14px;border-radius:50%;background:#fff;position:relative;transition:transform .25s ease;overflow:hidden;}
.ra-pupil{width:6px;height:6px;border-radius:50%;background:#1a1a2e;position:absolute;top:4px;left:4px;transition:transform .2s ease;}
.ra-eye.covered{transform:scaleY(0.1);}
.ra-hands{position:absolute;bottom:6px;left:50%;transform:translateX(-50%) translateY(120%);width:70px;height:34px;display:flex;justify-content:space-between;transition:transform .35s cubic-bezier(.34,1.56,.64,1);}
.ra-hands.up{transform:translateX(-50%) translateY(-46px);}
.ra-hand{width:30px;height:30px;border-radius:50% 50% 50% 4px;background:#fff;opacity:.95;}
.ra-mouth{position:absolute;bottom:26%;left:50%;transform:translateX(-50%);width:18px;height:3px;border-radius:3px;background:#fff;opacity:.85;transition:all .2s ease;}
.ra-mouth.smile{width:22px;height:8px;border-radius:0 0 12px 12px;background:transparent;border-bottom:3px solid #fff;}
`;

// Placeholder pupil offsets simulating "looking at" a field. Real photo/video can layer
// this same offset logic behind actual eye positions if you want the effect to persist
// once your real photo replaces the placeholder shape.
const LOOK_OFFSETS = { none: { x: 0, y: 0 }, email: { x: 1, y: -0.5 }, name: { x: -1, y: -0.5 } };

export default function ReactiveAvatar({ focusedField }) {
  if (!document.getElementById("ra-css")) {
    const s = document.createElement("style");
    s.id = "ra-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  const isPassword = focusedField === "password";
  const look = LOOK_OFFSETS[focusedField] || LOOK_OFFSETS.none;
  const [smiling] = useState(false);

  return (
    <div className="ra-wrap">
      <div className="ra-stage glow-border">
        <div className="ra-face">
          <div className="ra-eyes">
            <div className={"ra-eye" + (isPassword ? " covered" : "")}>
              <div className="ra-pupil" style={{ transform: "translate(" + look.x + "px," + look.y + "px)" }} />
            </div>
            <div className={"ra-eye" + (isPassword ? " covered" : "")}>
              <div className="ra-pupil" style={{ transform: "translate(" + look.x + "px," + look.y + "px)" }} />
            </div>
          </div>
          <div className={"ra-mouth" + (smiling ? " smile" : "")} />
          <div className={"ra-hands" + (isPassword ? " up" : "")}>
            <div className="ra-hand" />
            <div className="ra-hand" style={{ transform: "scaleX(-1)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
