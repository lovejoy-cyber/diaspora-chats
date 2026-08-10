import { useState, useEffect, useMemo } from "react";

// A real cinematic entrance sequence, not a small logo fade:
// 1. Black canvas, a single point of light ignites center-screen
// 2. Light expands into a ring, a globe forms from converging particles
// 3. "DiasporaLink" writes itself letter-by-letter with a light-sweep trailing each letter
// 4. A tagline fades up beneath it
// 5. Everything holds briefly, then the whole scene dissolves into the app
//
// Built entirely in CSS/SVG — no video file, no external asset, genuinely lightweight —
// but choreographed like a real title sequence rather than a simple fade-in.

const WORD = "DiasporaLink";

const CSS = `
@keyframes ssIgnite{
  0%{transform:scale(0);opacity:0;box-shadow:0 0 0 0 rgba(96,165,250,0);}
  40%{transform:scale(1);opacity:1;box-shadow:0 0 60px 20px rgba(96,165,250,.9);}
  100%{transform:scale(1);opacity:0;box-shadow:0 0 120px 60px rgba(96,165,250,0);}
}
@keyframes ssRingExpand{
  0%{transform:scale(0);opacity:0;border-width:3px;}
  50%{opacity:.9;}
  100%{transform:scale(1);opacity:0;border-width:0.5px;}
}
@keyframes ssGlobeIn{
  0%{transform:scale(0) rotate(-30deg);opacity:0;filter:blur(8px);}
  60%{transform:scale(1.12) rotate(6deg);opacity:1;filter:blur(0);}
  100%{transform:scale(1) rotate(0deg);opacity:1;filter:blur(0);}
}
@keyframes ssGlobeSpin{
  to{transform:rotate(360deg);}
}
@keyframes ssContinentDrift{
  0%,100%{transform:translateX(0);}
  50%{transform:translateX(-3px);}
}
@keyframes ssLetterRise{
  0%{transform:translateY(28px) scale(.4) rotateX(60deg);opacity:0;filter:blur(4px);}
  60%{filter:blur(0);}
  100%{transform:translateY(0) scale(1) rotateX(0);opacity:1;}
}
@keyframes ssLetterGlowSweep{
  0%{text-shadow:0 0 0 rgba(255,255,255,0);}
  30%{text-shadow:0 0 24px rgba(147,197,253,1),0 0 46px rgba(167,139,250,.8);}
  100%{text-shadow:0 0 0 rgba(255,255,255,0);}
}
@keyframes ssTagIn{
  0%{opacity:0;transform:translateY(10px);letter-spacing:8px;}
  100%{opacity:1;transform:translateY(0);letter-spacing:2px;}
}
@keyframes ssParticleFly{
  0%{transform:translate(var(--px),var(--py)) scale(0);opacity:0;}
  30%{opacity:1;}
  100%{transform:translate(0,0) scale(1);opacity:0;}
}
@keyframes ssSceneOut{
  0%{opacity:1;}
  100%{opacity:0;visibility:hidden;}
}
@keyframes ssBgPulse{
  0%,100%{opacity:.5;}
  50%{opacity:.85;}
}

.ss-scene{position:fixed;inset:0;background:#04060C;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;
  animation:ssSceneOut .7s ease-in forwards;animation-delay:3.4s;}
.ss-bgglow{position:absolute;width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(59,130,246,.25),rgba(139,92,246,.12) 45%,transparent 70%);
  animation:ssBgPulse 2.4s ease-in-out infinite;filter:blur(20px);}

.ss-ignite{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;animation:ssIgnite .9s ease-out forwards;}
.ss-ring{position:absolute;width:140px;height:140px;border-radius:50%;border:2px solid #60A5FA;animation:ssRingExpand 1.1s ease-out .15s forwards;}
.ss-ring.r2{border-color:#A78BFA;animation-delay:.3s;width:170px;height:170px;}

.ss-particle{position:absolute;width:3px;height:3px;border-radius:50%;background:#93C5FD;animation:ssParticleFly 1s ease-out forwards;}

.ss-globe{position:relative;width:92px;height:92px;border-radius:50%;margin-bottom:18px;
  background:radial-gradient(circle at 32% 28%,#93C5FD,#3B82F6 45%,#6D28D9 100%);
  box-shadow:0 0 50px rgba(96,165,250,.7),0 0 100px rgba(139,92,246,.4),inset 0 -10px 18px rgba(0,0,0,.25),inset 0 6px 12px rgba(255,255,255,.3);
  animation:ssGlobeIn 1s cubic-bezier(.22,1,.36,1) .5s both;}
.ss-globe-spinwrap{position:absolute;inset:0;border-radius:50%;overflow:hidden;animation:ssGlobeSpin 9s linear infinite;}
.ss-continent{position:absolute;background:rgba(255,255,255,.25);border-radius:40% 60% 55% 45%;animation:ssContinentDrift 4s ease-in-out infinite;}

.ss-wordwrap{display:flex;perspective:400px;}
.ss-letter{display:inline-block;font-size:38px;font-weight:900;color:#fff;opacity:0;
  animation:ssLetterRise .55s cubic-bezier(.22,1,.36,1) forwards,ssLetterGlowSweep 1.1s ease-out forwards;}

.ss-tagline{margin-top:12px;font-size:12px;font-weight:600;color:#93C5FD;letter-spacing:2px;text-transform:uppercase;opacity:0;
  animation:ssTagIn .7s ease-out 2s forwards;}
`;

export default function SplashScreen() {
  const [show, setShow] = useState(() => !sessionStorage.getItem("dl_splash_shown"));

  const particles = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      const dist = 90 + Math.random() * 40;
      return {
        id: i,
        px: Math.cos(angle) * dist + "px",
        py: Math.sin(angle) * dist + "px",
        delay: (0.5 + Math.random() * 0.3) + "s",
      };
    });
  }, []);

  useEffect(() => {
    if (!show) return;
    if (!document.getElementById("splash-css")) {
      const s = document.createElement("style");
      s.id = "splash-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    sessionStorage.setItem("dl_splash_shown", "true");
    const timer = setTimeout(() => setShow(false), 4200);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="ss-scene">
      <div className="ss-bgglow" />
      <div className="ss-ignite" />
      <div className="ss-ring" />
      <div className="ss-ring r2" />

      {particles.map(p => (
        <span
          key={p.id}
          className="ss-particle"
          style={{ "--px": p.px, "--py": p.py, animationDelay: p.delay }}
        />
      ))}

      <div className="ss-globe">
        <div className="ss-globe-spinwrap">
          <div className="ss-continent" style={{ width: 26, height: 18, top: 16, left: 12 }} />
          <div className="ss-continent" style={{ width: 18, height: 22, top: 38, left: 44, animationDelay: ".8s" }} />
          <div className="ss-continent" style={{ width: 14, height: 12, top: 60, left: 18, animationDelay: "1.4s" }} />
        </div>
      </div>

      <div className="ss-wordwrap">
        {WORD.split("").map((ch, i) => (
          <span key={i} className="ss-letter" style={{ animationDelay: (1.1 + i * 0.06) + "s, " + (1.1 + i * 0.06) + "s" }}>
            {ch}
          </span>
        ))}
      </div>

      <div className="ss-tagline">Global Community Platform</div>
    </div>
  );
}
