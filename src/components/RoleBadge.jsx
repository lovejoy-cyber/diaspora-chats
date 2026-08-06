import { ROLE_INFO } from "../contexts/AuthContext";

export default function RoleBadge({ role, small }) {
  const info = ROLE_INFO[role];
  if (!info || role === "student") return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: small ? 8 : 9, fontWeight: 800,
      padding: small ? "1px 5px" : "2px 7px", borderRadius: 10,
      background: info.color + "22", color: info.color,
      letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>
      {info.icon} {info.label}
    </span>
  );
}
