// CLOUDFLARE PAGES FUNCTION — Agora RTC token generator.
// Rebuilt fresh. Uses the real "agora-token" npm package (proven-correct
// implementation — not hand-rolled crypto, learned that lesson).

import { RtcTokenBuilder, RtcRole } from "agora-token";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export async function onRequestOptions() {
  return new Response("", { status: 200, headers: corsHeaders() });
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = corsHeaders();

  const APP_ID = env.AGORA_APP_ID;
  const APP_CERTIFICATE = env.AGORA_APP_CERTIFICATE;

  if (!APP_ID || !APP_CERTIFICATE) {
    return new Response(
      JSON.stringify({ error: "Server is missing AGORA_APP_ID or AGORA_APP_CERTIFICATE environment variables." }),
      { status: 500, headers }
    );
  }

  try {
    let channelName, uid;
    if (request.method === "GET") {
      const url = new URL(request.url);
      channelName = url.searchParams.get("channel");
      uid = url.searchParams.get("uid");
    } else {
      const body = await request.json().catch(() => ({}));
      channelName = body.channel;
      uid = body.uid;
    }
    uid = uid != null ? String(uid) : "0";

    if (!channelName) {
      return new Response(JSON.stringify({ error: "Missing 'channel' parameter." }), { status: 400, headers });
    }

    const expireSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expireSeconds;

    let token;
    if (typeof RtcTokenBuilder.buildTokenWithAccount === "function") {
      token = RtcTokenBuilder.buildTokenWithAccount(
        APP_ID, APP_CERTIFICATE, channelName, uid,
        RtcRole.PUBLISHER, privilegeExpireTs, privilegeExpireTs
      );
    } else if (typeof RtcTokenBuilder.buildTokenWithUserAccount === "function") {
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        APP_ID, APP_CERTIFICATE, channelName, uid,
        RtcRole.PUBLISHER, privilegeExpireTs, privilegeExpireTs
      );
    } else {
      throw new Error("agora-token package does not expose a recognized token-building method.");
    }

    return new Response(
      JSON.stringify({ token, appId: APP_ID, channel: channelName, uid, expiresAt: privilegeExpireTs }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to generate token: " + err.message }), { status: 500, headers });
  }
}
