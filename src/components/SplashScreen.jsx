import { useState, useEffect } from "react";

// Brief full-screen splash shown once per app session (not on every navigation — just
// when the app is first opened/reopened). Placeholder content for now — swap the emoji
// block for your actual photo/short video once you have it ready, same component,
// just change what's inside .splash-media.
const CSS = `
.splash-overlay{position:fixed;inset:0;background:var(--bg);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;animation:splashFadeOut .5s ease-in forwards;animation-delay:1.6s}
@keyframes splashFadeOut{to{opacity:0;visibility:hidden;}}
.splash-media{width:120px;height:120px;border-radius:50%;overflow:hidden;position:relative;animation:splashPop .6s cubic-bezier(.34,1.56,.64,1);}
@keyframes splashPop{0%{transform:scale(.6);opacity:0;}100%{transform:scale(1);opacity:1;}}
.splash-media-inner{width:100%;height:100%;background:linear-gradient(135deg,var(--primary),#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:48px;}
.splash-media.glow-border::before{animation:glowRotate 2s linear infinite;}
.splash-title{font-size:20px;font-weight:900;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:splashTextIn .5s ease-out .2s both;}
@keyframes splashTextIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
`;

export default function SplashScreen() {
  const [show, setShow] = useState(() => {
    // Only show once per browser session, not on every single navigation within the app.
    return !sessionStorage.getItem("dl_splash_shown");
  });

  useEffect(() => {
    if (!show) return;
    if (!document.getElementById("splash-css")) {
      const s = document.createElement("style");
      s.id = "splash-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    sessionStorage.setItem("dl_splash_shown", "true");
    const timer = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="splash-overlay">
      <div className="splash-media glow-border">
        {/* Replace this inner block with <img src="..." /> or <video autoPlay muted loop /> once the real photo/video is ready */}
        <div className="splash-media-inner">🌍</div>
      </div>
      <div className="splash-title">DiasporaLink</div>
    </div>
  );
}
