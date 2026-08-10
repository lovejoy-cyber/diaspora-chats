import { useState, useEffect } from "react";

// A real entrance sequence, not a static reactive face: a globe-character walks in from
// off-screen, "arrives" at the card with a bounce, and settles into place — then reacts
// to the email/password fields once it's arrived. Built entirely in CSS/SVG so it's
// genuinely lightweight; your real photo/video can later replace the character shape
// (the .ra-character div) while keeping the exact same walk-in/settle/react choreography.
const CSS = `
@keyframes raWalkIn{
  0%{transform:translateX(-140px) translateY(0) rotate(-8deg);opacity:0;}
  15%{opacity:1;}
  40%{transform:translateX(-20px) translateY(-6px) rotate(3deg);}
  60%{transform:translateX(6px) translateY(0) rotate(-2deg);}
  100%{transform:translateX(0) translateY(0) rotate(0deg);}
}
@keyframes raBounceLand{
  0%{transform:scale(1) translateY(0);}
  30%{transform:scale(1.08,0.9) translateY(4px);}
  55%{transform:scale(0.95,1.05) translateY(-6px);}
  80%{transform:scale(1.02,0.98) translateY(1px);}
  100%{transform:scale(1) translateY(0);}
}
@keyframes raLegSwing{
  0%,100%{transform:rotate(-18deg);}
  50%{transform:rotate(18deg);}
}
@keyframes raArmSwing{
  0%,100%{transform:rotate(20deg);}
  50%{transform:rotate(-20deg);}
}
@keyframes raBlink{
  0%,92%,100%{transform:scaleY(1);}
  95%{transform:scaleY(0.1);}
}
@keyframes raFloat{
  0%,100%{transform:translateY(0);}
  50%{transform:translateY(-5px);}
}
@keyframes raShadowPulse{
  0%,100%{transform:scaleX(1);opacity:.28;}
  50%{transform:scaleX(0.82);opacity:.16;}
}

.ra-outer{display:flex;flex-direction:column;align-items:center;margin-bottom:22px;height:150px;justify-content:flex-end;position:relative;}
.ra-walker{position:relative;width:100px;height:118px;animation:raWalkIn 1.1s cubic-bezier(.22,1,.36,1) both,raFloat 3.2s ease-in-out 1.1s infinite;}
.ra-walker.landed{animation:raFloat 3.2s ease-in-out infinite;}
.ra-shadow{width:56px;height:10px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.35),transparent 70%);margin:0 auto;animation:raShadowPulse 3.2s ease-in-out infinite;}

.ra-body{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);width:64px;height:64px;}
.ra-legs{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:1;}
.ra-leg{width:8px;height:24px;background:linear-gradient(180deg,#3B82F6,#1D4ED8);border-radius:4px;transform-origin:top center;}
.ra-walker:not(.landed) .ra-leg-l{animation:raLegSwing .55s ease-in-out infinite;}
.ra-walker:not(.landed) .ra-leg-r{animation:raLegSwing .55s ease-in-out infinite reverse;}

.ra-arms{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:84px;display:flex;justify-content:space-between;z-index:0;}
.ra-arm{width:7px;height:26px;background:linear-gradient(180deg,#8B5CF6,#7C3AED);border-radius:4px;transform-origin:top center;}
.ra-walker:not(.landed) .ra-arm-l{animation:raArmSwing .55s ease-in-out infinite;}
.ra-walker:not(.landed) .ra-arm-r{animation:raArmSwing .55s ease-in-out infinite reverse;}
.ra-walker.landed .ra-arm-l{transition:transform .3s ease;}
.ra-walker.landed .ra-arm-r{transition:transform .3s ease;}
.ra-walker.landed.ra-covering .ra-arm-l{transform:rotate(70deg) translateY(2px);}
.ra-walker.landed.ra-covering .ra-arm-r{transform:rotate(-70deg) translateY(2px);}

.ra-character{position:absolute;top:0;left:50%;transform:translateX(-50%);width:66px;height:66px;border-radius:50%;
  background:radial-gradient(circle at 32% 28%,#93C5FD,#3B82F6 46%,#7C3AED 100%);
  box-shadow:0 6px 18px rgba(59,130,246,.4),inset 0 -6px 10px rgba(0,0,0,.18),inset 0 4px 8px rgba(255,255,255,.25);
  z-index:2;}
.ra-continent{position:absolute;background:rgba(255,255,255,.22);border-radius:40% 60% 55% 45%;}
.ra-c1{width:22px;height:16px;top:14px;left:10px;transform:rotate(-12deg);}
.ra-c2{width:16px;height:20px;top:30px;left:34px;transform:rotate(20deg);border-radius:50% 40% 60% 50%;}

.ra-eyes{position:absolute;top:26px;left:50%;transform:translateX(-50%);display:flex;gap:13px;z-index:3;}
.ra-eye{width:12px;height:12px;border-radius:50%;background:#fff;position:relative;overflow:hidden;animation:raBlink 4.5s ease-in-out infinite;transition:transform .25s ease;}
.ra-eye.covered{transform:scaleY(.1) !important;animation:none;}
.ra-pupil{width:5.5px;height:5.5px;border-radius:50%;background:#0F172A;position:absolute;top:3.2px;left:3.2px;transition:transform .22s ease;}

.ra-mouth{position:absolute;top:42px;left:50%;transform:translateX(-50%);width:16px;height:8px;border-bottom:2.5px solid rgba(255,255,255,.9);border-radius:0 0 10px 10px;z-index:3;transition:all .25s ease;}
.ra-mouth.smile{width:20px;height:10px;}

.ra-sparkle{position:absolute;border-radius:50%;background:#fff;opacity:0;pointer-events:none;}
.ra-walker.landed .ra-sparkle{animation:raSparklePop .9s ease-out forwards;}
@keyframes raSparklePop{0%{opacity:0;transform:scale(0);}40%{opacity:1;}100%{opacity:0;transform:scale(1.8) translateY(-14px);}}
`;

const LOOK_OFFSETS = { none: { x: 0, y: 0 }, email: { x: 1.4, y: -0.6 }, name: { x: -1.4, y: -0.6 } };

export default function ReactiveAvatar({ focusedField }) {
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!document.getElementById("ra-css")) {
      const s = document.createElement("style");
      s.id = "ra-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    const t = setTimeout(() => setLanded(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const isPassword = focusedField === "password";
  const look = LOOK_OFFSETS[focusedField] || LOOK_OFFSETS.none;

  return (
    <div className="ra-outer">
      <div className={"ra-walker" + (landed ? " landed" : "") + (isPassword ? " ra-covering" : "")}>
        {landed && (
          <>
            <span className="ra-sparkle" style={{ width: 5, height: 5, top: 8, left: 6 }} />
            <span className="ra-sparkle" style={{ width: 4, height: 4, top: 20, right: 4, animationDelay: ".15s" }} />
            <span className="ra-sparkle" style={{ width: 6, height: 6, top: 4, right: 16, animationDelay: ".3s" }} />
          </>
        )}
        <div className="ra-arms"><div className="ra-arm ra-arm-l glow-border" /><div className="ra-arm ra-arm-r" /></div>
        <div className="ra-character glow-border">
          <div className="ra-continent ra-c1" />
          <div className="ra-continent ra-c2" />
          <div className="ra-eyes">
            <div className={"ra-eye" + (isPassword ? " covered" : "")}>
              <div className="ra-pupil" style={{ transform: "translate(" + look.x + "px," + look.y + "px)" }} />
            </div>
            <div className={"ra-eye" + (isPassword ? " covered" : "")}>
              <div className="ra-pupil" style={{ transform: "translate(" + look.x + "px," + look.y + "px)" }} />
            </div>
          </div>
          <div className={"ra-mouth" + (landed && !isPassword ? " smile" : "")} />
        </div>
        <div className="ra-legs"><div className="ra-leg ra-leg-l" /><div className="ra-leg ra-leg-r" /></div>
      </div>
      <div className="ra-shadow" />
    </div>
  );
}
