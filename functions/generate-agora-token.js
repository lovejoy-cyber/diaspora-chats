// CLOUDFLARE PAGES FUNCTION — converted from netlify/functions/generate-agora-token.js
//
// Real, honest differences from the Netlify version that made this a genuine rewrite,
// not a copy-paste:
// 1. Cloudflare Pages Functions use ES module exports (onRequestGet/onRequestPost/
//    onRequest), not Netlify's exports.handler(event).
// 2. Environment variables come through context.env, NOT process.env — Cloudflare
//    Workers don't have Node's process global by default.
// 3. require() doesn't work here — Workers run ES modules, so this uses import.
// 4. The agora-token package uses Node's crypto module internally for HMAC signing.
//    This REQUIRES the "nodejs_compat" compatibility flag to be enabled in Cloudflare
//    Pages settings (Settings → Functions → Compatibility flags → add "nodejs_compat"),
//    otherwise this will fail at runtime with a missing-module error. This is a real
//    setup step on your end, not optional.
//
// File location matters: this file at functions/generate-agora-token.js is
// automatically routed by Cloudflare to the URL /generate-agora-token — no extra
// routing config needed, that's how Pages Functions work.

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

    if (!RtcTokenBuilder) {
      throw new Error("agora-token package did not export RtcTokenBuilder.");
    }

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
    } else if (typeof RtcTokenBuilder.buildTokenWithUid === "function") {
      let numericUid = 0;
      for (let i = 0; i < uid.length; i++) {
        numericUid = (numericUid * 31 + uid.charCodeAt(i)) % 2147483647;
      }
      token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID, APP_CERTIFICATE, channelName, numericUid,
        RtcRole.PUBLISHER, privilegeExpireTs, privilegeExpireTs
      );
    } else {
      const available = Object.getOwnPropertyNames(RtcTokenBuilder).filter(n => typeof RtcTokenBuilder[n] === "function");
      throw new Error("No recognized token-building method found. Available: " + available.join(", "));
    }

    return new Response(
      JSON.stringify({ token, appId: APP_ID, channel: channelName, uid, expiresAt: privilegeExpireTs }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to generate token: " + err.message }), { status: 500, headers });
  }
}
