// Generates a fresh, short-lived Agora RTC token on demand.
// Called automatically by the app every time someone starts a call —
// nobody ever needs to touch this manually after it's deployed.
//
// NOTE: the agora-token package's exact export names have changed across
// versions (buildTokenWithAccount / buildTokenWithUid / different casing).
// Rather than guess one name and break again, we detect what's actually
// available on the installed package at runtime and use whichever real
// method exists.

const agoraToken = require("agora-token");

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (!APP_ID || !APP_CERTIFICATE) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server is missing AGORA_APP_ID or AGORA_APP_CERTIFICATE environment variables." }),
    };
  }

  try {
    const params = event.httpMethod === "GET"
      ? event.queryStringParameters || {}
      : JSON.parse(event.body || "{}");

    const channelName = params.channel;
    const uid = params.uid != null ? String(params.uid) : "0";

    if (!channelName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing 'channel' parameter." }) };
    }

    const expireSeconds = 3600; // token valid for 1 hour — plenty for any single call session
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expireSeconds;

    // Figure out which shape this installed version of agora-token actually has.
    const RtcTokenBuilder = agoraToken.RtcTokenBuilder || agoraToken.default?.RtcTokenBuilder;
    const RtcRole = agoraToken.RtcRole || agoraToken.default?.RtcRole || { PUBLISHER: 1 };

    if (!RtcTokenBuilder) {
      throw new Error("agora-token package did not export RtcTokenBuilder — package may not be installed correctly.");
    }

    let token;
    if (typeof RtcTokenBuilder.buildTokenWithAccount === "function") {
      // Newer versions: string-based user account
      token = RtcTokenBuilder.buildTokenWithAccount(
        APP_ID, APP_CERTIFICATE, channelName, uid,
        RtcRole.PUBLISHER, privilegeExpireTs, privilegeExpireTs
      );
    } else if (typeof RtcTokenBuilder.buildTokenWithUserAccount === "function") {
      // Some versions use this name instead
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        APP_ID, APP_CERTIFICATE, channelName, uid,
        RtcRole.PUBLISHER, privilegeExpireTs, privilegeExpireTs
      );
    } else if (typeof RtcTokenBuilder.buildTokenWithUid === "function") {
      // Older/alternate versions: numeric uid only — hash the string uid down to a number
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
      throw new Error("No recognized token-building method found on RtcTokenBuilder. Available methods: " + available.join(", "));
    }

    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ token, appId: APP_ID, channel: channelName, uid, expiresAt: privilegeExpireTs }),
    };
  } catch (err) {
    console.error("Token generation error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to generate token: " + err.message }) };
  }
};
