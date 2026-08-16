export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(file, resourceType) {
  const fd = new FormData();
  // Real speed fix: compress images before upload — a typical phone photo (3-8MB) drops
  // to a few hundred KB with no visible quality loss for chat/feed purposes, which is
  // the actual cause of "slow to send/open" for photos, not a code inefficiency. Videos
  // are NOT compressed here — genuine video compression in-browser needs a heavier
  // library (like ffmpeg.wasm) and is a separate, bigger task, being honest about that
  // rather than pretending this covers video too.
  const uploadFile = resourceType === "image" ? await compressImage(file) : file;
  fd.append("file", uploadFile);
  fd.append("upload_preset", UPLOAD_PRESET);
  const type = resourceType || "image";
  const url = "https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/" + type + "/upload";
  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  // Real fix for documents failing to open correctly: Cloudinary's "raw" resource type
  // sometimes returns a secure_url with no file extension, or one that doesn't match
  // the original file — browsers then can't tell what to do with the link (no extension
  // to hint at PDF vs Word vs anything else), which can show as an error/blank page
  // instead of opening the file. This explicitly appends the real original extension
  // if the returned URL doesn't already end with one, so the browser always has a
  // correct hint about what kind of file it's opening.
  if (type === "raw" && file?.name) {
    const originalExt = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
    const urlHasExt = /\.[a-zA-Z0-9]{2,5}$/.test(data.secure_url);
    if (originalExt && !urlHasExt) {
      return data.secure_url + "." + originalExt;
    }
  }
  return data.secure_url;
}

// Resizes an image to a sane max dimension and re-encodes it as JPEG at a reasonable
// quality — genuinely fast (native browser Canvas API, no library), and cuts file size
// dramatically for typical phone photos. Falls back to the original file untouched if
// compression fails for any reason (e.g. an unusual image format), so this can never
// block someone from sending a photo even in an edge case.
function compressImage(file, maxDimension = 1600, quality = 0.75) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      resolve(file); // GIFs need to stay animated — compressing would freeze them to one frame
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) { height = Math.round(height * (maxDimension / width)); width = maxDimension; }
        else { width = Math.round(width * (maxDimension / height)); height = maxDimension; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        // Only use the compressed version if it's actually smaller — for a small image
        // that was already tiny, compression overhead could theoretically be larger.
        if (blob.size < file.size) {
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        } else {
          resolve(file);
        }
      }, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
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
    const url = "/generate-agora-token?channel=" + encodeURIComponent(channel) + "&uid=" + encodeURIComponent(uid);
    const res = await fetch(url);
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

// Every room gets its own persistent, dedicated call channel, derived from the room's
// own ID — this is what "each group must have its call feature" actually means: not
// the old single nationality-wide group call, but a real, separate channel per room
// that anyone currently viewing that room can join.
export function roomCallChannelId(roomId) {
  return "room_" + String(roomId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 55);
}

// Daily per-recipient call limit (see CALLS.md discussion) — protects people from being
// spammed with repeated calls and helps keep everyone within the free Agora usage tier.
export const MAX_CALLS_PER_RECIPIENT_PER_DAY = 4;

// How long an unanswered call rings before it's automatically marked "missed."
export const CALL_RING_TIMEOUT_MS = 22000;

// Validates an international phone number in the general +CountryCode format —
// doesn't try to validate against every country's exact numbering rules (that's
// genuinely a huge undertaking), just checks it starts with + and has a sane number
// of digits, which catches the common real mistakes (forgetting the country code,
// pasting letters, way too short/long).
export function isValidPhone(phone) {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  return /^\+[1-9]\d{6,14}$/.test(trimmed.replace(/[\s()-]/g, ""));
}
