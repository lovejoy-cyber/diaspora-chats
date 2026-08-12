// SEPARATE Cloudflare Worker — handles the automated YouTube reels fetch on a schedule.
// Converted from netlify/functions/fetch-reels.js. The original already used raw
// fetch() calls to both YouTube's API and Firestore's REST API (no Node-specific SDK),
// which is exactly why this converts cleanly to Workers — no nodejs_compat flag needed
// here, unlike the Agora token function.

const CATEGORIES = [
  { key: "scholarships", query: "scholarship opportunities students 2026" },
  { key: "jobs", query: "job opportunities graduates career advice" },
  { key: "tech", query: "technology trends software development skills" },
  { key: "courses", query: "free online courses certification students" },
  { key: "news", query: "youth news trends education Africa" },
  { key: "life", query: "student life advice relationships motivation" },
  { key: "faith", query: "christian devotion encouragement short" },
];

async function searchYouTube(query, apiKey) {
  const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&safeSearch=strict&maxResults=6&order=date&q=" +
    encodeURIComponent(query) + "&key=" + apiKey;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error("YouTube API error " + res.status + ": " + text.slice(0, 200));
  }
  const data = await res.json();
  return (data.items || []).map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
    publishedAt: item.snippet.publishedAt,
  }));
}

async function runFetch(env) {
  const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
  const PROJECT_ID = env.FIREBASE_PROJECT_ID || "diasporalink-app-df914";
  const results = { fetched: 0, errors: [] };

  if (!YOUTUBE_API_KEY) {
    return { statusCode: 500, body: "Missing YOUTUBE_API_KEY" };
  }

  for (const cat of CATEGORIES) {
    try {
      const videos = await searchYouTube(cat.query, YOUTUBE_API_KEY);
      for (const v of videos) {
        const docId = "yt_" + v.videoId;
        const body = {
          fields: {
            source: { stringValue: "youtube" },
            category: { stringValue: cat.key },
            videoId: { stringValue: v.videoId },
            title: { stringValue: v.title },
            channelTitle: { stringValue: v.channelTitle },
            thumbnail: { stringValue: v.thumbnail },
            publishedAt: { stringValue: v.publishedAt },
            fetchedAt: { timestampValue: new Date().toISOString() },
            hidden: { booleanValue: false },
          },
        };
        const putRes = await fetch(
          "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/reels/" + docId,
          { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        );
        if (putRes.ok) results.fetched++;
        else results.errors.push(cat.key + ": Firestore write failed " + putRes.status);
      }
    } catch (e) {
      results.errors.push(cat.key + ": " + e.message);
    }
  }

  console.log("Reels fetch complete:", JSON.stringify(results));
  return results;
}

export default {
  // Runs automatically on the schedule defined in wrangler.toml — this is Cloudflare's
  // real equivalent of Netlify's exports.config = { schedule: ... }, but as its own
  // handler shape (scheduled), not a config export.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runFetch(env));
  },

  // Also allow manually triggering a fetch by visiting this Worker's URL directly —
  // genuinely useful for testing without waiting for the schedule, same as Netlify's
  // "trigger manually" option in the Functions tab.
  async fetch(request, env) {
    const result = await runFetch(env);
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  },
};
