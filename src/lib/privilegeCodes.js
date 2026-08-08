// Time-limited privilege codes — the mechanism by which a normal student can be granted
// a higher role (Governor, Secretary, etc.) without anyone ever just logging in as admin
// directly. Flow: the Commander (and ONLY the Commander) generates a code for a specific
// target role and (optionally) a specific person; the recipient enters the code in their
// own Profile; if valid and unexpired, their role updates automatically.
//
// IMPORTANT — role hierarchy correction: Embassy, President, Governor, Secretary,
// Treasurer etc. are all badges/positions with specific delegated PERMISSIONS (like
// moderating their own room or reviewing documents), but none of them can grant roles
// to anyone else. Only the Commander (role === "admin") can ever issue a privilege code.
// This was previously "anyone above the target role's level can issue," which was wrong —
// a Governor should never be able to make someone else a Governor.

import { collection, doc, addDoc, getDocs, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { ROLE_LEVELS } from "../contexts/AuthContext";

const CODE_VALID_HOURS = 24;

function generateCode() {
  // Six-character human-typeable code, uppercase letters + digits, avoiding ambiguous
  // characters (0/O, 1/I/L) so it's easy to read aloud or type on a phone keyboard.
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Issues a new code. Only the Commander (role === "admin") can issue codes, for any role
// below Commander. This is a hard rule, not a level comparison — no other role, no matter
// how high, can grant privileges to someone else.
export async function issuePrivilegeCode({ issuerId, issuerName, issuerRole, targetRole, targetEmail, note, scopeCity }) {
  if (issuerRole !== "admin") {
    throw new Error("Only the Commander can issue privilege codes. Embassy, President, Governor and other roles are badges with specific permissions, not the ability to grant roles.");
  }
  const targetLevel = ROLE_LEVELS[targetRole] || 0;
  if (targetLevel >= ROLE_LEVELS["admin"]) {
    throw new Error("You cannot issue a code for the Commander role.");
  }
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_VALID_HOURS * 60 * 60 * 1000);
  const codeDoc = await addDoc(collection(db, "privilegeCodes"), {
    code, targetRole, scopeCity: scopeCity || null,
    issuerId, issuerName, issuerRole,
    targetEmail: targetEmail ? targetEmail.toLowerCase().trim() : null,
    note: note || "",
    status: "unused",
    createdAt: serverTimestamp(),
    expiresAt,
  });
  return { id: codeDoc.id, code, expiresAt };
}

// Redeems a code for the current user. Checks expiry, checks it hasn't been used,
// and (if the code was targeted at a specific email) checks it matches.
export async function redeemPrivilegeCode({ code, userId, userEmail }) {
  const q = query(collection(db, "privilegeCodes"), where("code", "==", code.toUpperCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("That code doesn't exist. Double-check it and try again.");
  const codeDoc = snap.docs[0];
  const data = codeDoc.data();

  if (data.status !== "unused") throw new Error("This code has already been used.");

  const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if (Date.now() > expiresAt.getTime()) throw new Error("This code has expired. Ask the person who gave it to you to issue a new one.");

  if (data.targetEmail && data.targetEmail !== userEmail.toLowerCase().trim()) {
    throw new Error("This code was issued for a different email address.");
  }

  await updateDoc(doc(db, "privilegeCodes", codeDoc.id), {
    status: "used", usedBy: userId, usedAt: serverTimestamp(),
  });

  return { role: data.targetRole, scopeCity: data.scopeCity, issuerName: data.issuerName };
}
