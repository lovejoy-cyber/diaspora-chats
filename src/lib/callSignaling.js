// Handles the Firestore "calls" collection — this is the signaling layer that makes
// ringing possible. Agora itself has no concept of "notify someone before they join" —
// it only knows about people already inside a channel. So we use Firestore as the
// paging system: write a "ringing" doc, the other person's app is listening for it
// globally, they accept or decline, and only then do both sides actually join Agora.

import { collection, doc, setDoc, updateDoc, serverTimestamp, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { callChannelId, MAX_CALLS_PER_RECIPIENT_PER_DAY } from "./helpers";

// Returns { allowed: bool, count: number } — checks how many calls the current user
// has placed to this specific recipient since midnight today.
export async function checkDailyCallLimit(callerId, recipientId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, "calls"),
    where("callerId", "==", callerId),
    where("recipientId", "==", recipientId),
  );
  const snap = await getDocs(q);
  const todayCount = snap.docs.filter(d => {
    const data = d.data();
    const createdAt = data.createdAt?.toDate?.();
    return createdAt && createdAt >= startOfDay;
  }).length;
  return { allowed: todayCount < MAX_CALLS_PER_RECIPIENT_PER_DAY, count: todayCount };
}

// Creates a new "ringing" call doc. Returns the call's id (also the Agora channel name)
// or throws if the daily limit has been hit.
export async function placeCall({ callerId, callerName, callerPhoto, recipientId, recipientName, callType }) {
  const { allowed, count } = await checkDailyCallLimit(callerId, recipientId);
  if (!allowed) {
    const err = new Error("You've reached the limit of " + MAX_CALLS_PER_RECIPIENT_PER_DAY + " calls to " + recipientName + " today. Please try again tomorrow, or send a message instead.");
    err.code = "DAILY_LIMIT_REACHED";
    throw err;
  }
  const channel = callChannelId(callerId, recipientId);
  const callDoc = doc(collection(db, "calls"));
  await setDoc(callDoc, {
    channel, callerId, callerName, callerPhoto: callerPhoto || "",
    recipientId, recipientName: recipientName || "",
    callType, status: "ringing",
    createdAt: serverTimestamp(),
  });
  return { callId: callDoc.id, channel };
}

export async function updateCallStatus(callId, status) {
  await updateDoc(doc(db, "calls", callId), { status, ["" + status + "At"]: serverTimestamp() });
}
