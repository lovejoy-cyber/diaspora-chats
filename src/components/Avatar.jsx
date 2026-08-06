import { initials } from "../lib/helpers";

export default function Avatar({ src, name, size, online, onClick, ring }) {
  const s = size || 40;
  const style = {
    width: s, height: s, borderRadius: "50%", objectFit: "cover",
    flexShrink: 0, cursor: onClick ? "pointer" : "default",
    border: ring ? "2px solid var(--primary)" : "none",
  };
  const phStyle = {
    ...style,
    background: "linear-gradient(135deg,var(--primary),var(--accent))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: Math.round(s * 0.4), fontWeight: 800, color: "#fff",
  };
  const wrap = { position: "relative", display: "inline-block", flexShrink: 0, lineHeight: 0 };
  const dot = {
    position: "absolute", bottom: 0, right: 0,
    width: Math.max(9, s * 0.26), height: Math.max(9, s * 0.26),
    borderRadius: "50%", background: online ? "#10B981" : "#475569",
    border: "2px solid var(--bg-card)",
  };
  return (
    <span style={wrap} onClick={onClick}>
      {src ? <img src={src} alt={name || ""} style={style} />
           : <span style={phStyle}>{initials(name)}</span>}
      {online !== undefined && <span style={dot} />}
    </span>
  );
}
