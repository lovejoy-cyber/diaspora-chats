export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(file, resourceType) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const type = resourceType || "image";
  const url = "https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/" + type + "/upload";
  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

const BANNED = ["fuck","shit","bitch","asshole","nigger","nigga","whore","cunt","bastard","retard","faggot","slut","rape","kill yourself","kys"];

export function containsProfanity(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return BANNED.some(w => t.includes(w));
}

export function cleanText(text) {
  if (!text) return "";
  let out = text;
  BANNED.forEach(w => {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, "*".repeat(w.length));
  });
  return out;
}

export function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  if (diff < 604800) return Math.floor(diff / 86400) + "d";
  return d.toLocaleDateString();
}

export function clockTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function lastSeenText(profile) {
  if (!profile) return "Offline";
  const ts = profile.lastSeen;
  if (!ts) return "Offline";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (profile.online && diff < 120) return "Online";
  if (diff < 3600) return "Last seen " + Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return "Last seen " + Math.floor(diff / 3600) + "h ago";
  return "Last seen " + d.toLocaleDateString();
}

export function isUserOnline(profile) {
  if (!profile || !profile.online || !profile.lastSeen) return false;
  const d = profile.lastSeen.toDate ? profile.lastSeen.toDate() : new Date(profile.lastSeen);
  return (Date.now() - d.getTime()) < 120000;
}

export function threadId(a, b) {
  return [a, b].sort().join("_");
}

export function initials(name) {
  if (!name) return "?";
  return name.trim()[0].toUpperCase();
}

// Simple throttle — returns a function that only actually runs at most once per `ms`
export function throttle(fn, ms) {
  let last = 0, timer = null;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => { last = Date.now(); fn(...args); }, ms - (now - last));
    }
  };
}

// Group consecutive messages from the same sender within a short time window,
// WhatsApp-style, so only the first message in a run shows name/avatar.
export function groupMessages(messages, gapSeconds = 300) {
  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const sameSender = prev && prev.senderId === msg.senderId;
    let closeInTime = false;
    if (sameSender && prev.createdAt && msg.createdAt) {
      const t1 = prev.createdAt.toDate ? prev.createdAt.toDate().getTime() : new Date(prev.createdAt).getTime();
      const t2 = msg.createdAt.toDate ? msg.createdAt.toDate().getTime() : new Date(msg.createdAt).getTime();
      closeInTime = Math.abs(t2 - t1) < gapSeconds * 1000;
    }
    const isGrouped = sameSender && closeInTime;
    const next = messages[i + 1];
    const nextSame = next && next.senderId === msg.senderId;
    let nextClose = false;
    if (nextSame && next.createdAt && msg.createdAt) {
      const t1 = msg.createdAt.toDate ? msg.createdAt.toDate().getTime() : new Date(msg.createdAt).getTime();
      const t2 = next.createdAt.toDate ? next.createdAt.toDate().getTime() : new Date(next.createdAt).getTime();
      nextClose = Math.abs(t2 - t1) < gapSeconds * 1000;
    }
    return {
      ...msg,
      isFirstInGroup: !isGrouped,
      isLastInGroup: !(nextSame && nextClose),
    };
  });
}

// ─── Shared Agora call helpers ───────────────────────────────────────────
// Used by both the Calls page (outgoing) and IncomingCallListener (ringing/accepting)
// so there's exactly one implementation of "how we talk to Agora," not two that can drift apart.

export const AGORA_APP_ID = "239608a7432f4a6facc81a29d4c7d71f";

export async function fetchAgoraToken(channel, uid) {
  try {
    // Cloudflare Pages Functions are routed directly by filename — no "/.netlify/functions/"
    // prefix needed, unlike Netlify. functions/generate-agora-token.js maps to this exact path.
    const res = await fetch("/generate-agora-token?channel=" + encodeURIComponent(channel) + "&uid=" + encodeURIComponent(uid));
    if (!res.ok) throw new Error("Token server returned " + res.status);
    const data = await res.json();
    if (!data.token) throw new Error("Token server response missing token");
    return data.token;
  } catch (err) {
    console.error("Could not fetch Agora token, falling back to null (only works in Testing Mode):", err);
    return null;
  }
}

// Builds a stable, unique channel name for a 1-to-1 call between two people —
// same pair always gets the same channel regardless of who initiates.
export function callChannelId(uidA, uidB) {
  return "call_" + [uidA, uidB].sort().join("_").slice(0, 60);
}

// Daily per-recipient call limit (see CALLS.md discussion) — protects people from being
// spammed with repeated calls and helps keep everyone within the free Agora usage tier.
export const MAX_CALLS_PER_RECIPIENT_PER_DAY = 4;

// How long an unanswered call rings before it's automatically marked "missed."
export const CALL_RING_TIMEOUT_MS = 22000;
