// Time-limited privilege codes — the mechanism by which a normal student can be granted
// a higher role (Regional Monitor, Secretary, etc.) without anyone ever just logging in
// as admin directly. Flow: a Commander/Embassy/President generates a code for a specific
// target role and (optionally) a specific person; the recipient enters the code in their
// own Profile; if valid and unexpired, their role updates automatically.
//
// This deliberately does NOT let someone request their own privileges — only an existing
// authority above the target role can generate a code. That's the actual security model:
// codes are issued top-down, never self-served.

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

// Issues a new code. issuerLevel must be strictly higher than the target role's level —
// nobody can grant a role equal to or above their own.
export async function issuePrivilegeCode({ issuerId, issuerName, issuerRole, targetRole, targetEmail, note, scopeCity }) {
  const issuerLevel = ROLE_LEVELS[issuerRole] || 0;
  const targetLevel = ROLE_LEVELS[targetRole] || 0;
  if (targetLevel >= issuerLevel) {
    throw new Error("You cannot grant a role equal to or higher than your own.");
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
