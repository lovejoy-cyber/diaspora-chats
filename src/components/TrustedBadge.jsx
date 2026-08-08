// Manual, admin-granted badge marking someone vetted for money-transfer trustworthiness.
// Deliberately separate from RoleBadge (Governor, Embassy etc) — this is about trust in
// transactions specifically, not a position in the community structure.
export default function TrustedBadge({ show, small }) {
  if (!show) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: small ? 8 : 9, fontWeight: 800,
      padding: small ? "1px 5px" : "2px 7px", borderRadius: 10,
      background: "#06B6D422", color: "#06B6D4",
      letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>
      💎 Trusted Sender
    </span>
  );
}
