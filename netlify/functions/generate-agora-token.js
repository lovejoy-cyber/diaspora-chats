// Generates a fresh, short-lived Agora RTC token on demand.
// Called automatically by the app every time someone starts a call —
// nobody ever needs to touch this manually after it's deployed.

const { RtcTokenBuilder, RtcRole } = require("agora-token");

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
    const uid = params.uid || 0; // Agora accepts 0 to mean "assign any numeric uid", but we pass the real uid as a string identity below instead

    if (!channelName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing 'channel' parameter." }) };
    }

    const expireSeconds = 3600; // token valid for 1 hour — plenty for any single call session
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expireSeconds;

    // Build with account (string uid) since our app uses Firebase UIDs, not numeric Agora uids
    const token = RtcTokenBuilder.buildTokenWithAccount(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      String(uid),
      RtcRole.PUBLISHER,
      privilegeExpireTs,
      privilegeExpireTs
    );

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
