// Lightweight, zero-cost device fingerprinting for spotting repeat account creation.
//
// HONEST LIMITATION, stated plainly for anyone reading this later: this is a deterrent,
// not a hard wall. Clearing browser storage, using a different browser, or incognito
// mode can all produce a different fingerprint. True hard prevention requires paid
// SMS/phone verification. What this DOES do: catch casual, repeat signups from the
// same browser on the same device, and flag suspicious patterns for admin review
// rather than silently blocking anyone (a human should always be able to override this).

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Builds a fingerprint from stable browser/device characteristics that don't change
// between visits (unlike IP, which changes on mobile data / different wifi).
export function getDeviceFingerprint() {
  const parts = [
    navigator.userAgent || "",
    navigator.language || "",
    String(screen.width) + "x" + String(screen.height),
    String(screen.colorDepth || ""),
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency || ""),
    navigator.platform || "",
  ];
  return hashString(parts.join("|"));
}

// Persists a stable random ID in localStorage too — this is a stronger signal than the
// fingerprint alone (survives across sessions on the same browser) but is wiped if the
// person clears site data, which is expected and fine — it's a deterrent, not a lock.
export function getOrCreatePersistentDeviceId() {
  const KEY = "dl_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = getDeviceFingerprint() + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(KEY, id);
  }
  return id;
}
