// SEPARATE Cloudflare Worker — handles the automated YouTube reels fetch on a schedule.
// Converted from netlify/functions/fetch-reels.js. The original already used raw
// fetch() calls to both YouTube's API and Firestore's REST API (no Node-specific SDK),
// which is exactly why this converts cleanly to Workers — no nodejs_compat flag needed
// here, unlike the Agora token function.

// Real fix for "same boring videos every time": previously each category had ONE fixed
// query string, searched identically on every single scheduled run. Combined with
// order=viewCount, this reliably surfaced the same small set of top-ranked videos
// again and again — not a bug, just what a static query does. Now each category has
// several real query variations, and one is picked at random each run — genuine
// rotation, not the same search repeated forever.
const CATEGORIES = [
  { key: "scholarships", queries: [
    "scholarship opportunities students 2026", "study abroad scholarship tips",
    "fully funded masters scholarship", "how to win a scholarship interview",
  ]},
  { key: "jobs", queries: [
    "job opportunities graduates career advice", "how to get hired 2026",
    "resume tips for graduates", "career change advice young professionals",
  ]},
  { key: "tech", queries: [
    "technology trends software development skills", "new tech gadgets 2026",
    "coding tips for beginners", "AI tools students should know",
  ]},
  { key: "courses", queries: [
    "free online courses certification students", "best free coding bootcamp",
    "learn a new skill online free", "certification worth getting 2026",
  ]},
  { key: "news", queries: [
    "youth news trends education Africa", "student news update this week",
    "global youth trends 2026", "education news Africa students",
  ]},
  { key: "life", queries: [
    "student life advice relationships motivation", "study abroad life tips",
    "how to make friends studying abroad", "motivation for students far from home",
  ]},
  { key: "faith", queries: [
    "christian devotion encouragement short", "daily bible encouragement short",
    "christian motivation students", "faith encouragement young adults",
  ]},
  { key: "trending", queries: [
    "trending viral funny shorts entertainment", "viral shorts this week",
    "trending videos worldwide", "popular shorts right now",
  ]},
  { key: "jokes", queries: [
    "funny jokes comedy shorts clean humor", "clean stand up comedy shorts",
    "funny moments compilation clean", "wholesome funny shorts",
  ]},
];

function pickRandomQuery(category) {
  return category.queries[Math.floor(Math.random() * category.queries.length)];
}

async function searchYouTube(query, apiKey) {
  // relevanceLanguage=en biases results toward English-language videos — the real fix
  // for videos in unrelated languages showing up, since our search terms are generic
  // English phrases that YouTube would otherwise match globally regardless of language.
  // order=viewCount instead of order=date also surfaces genuinely popular/trending
  // content rather than just whatever was uploaded most recently, which tends to be
  // higher quality and more relevant.
  const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&safeSearch=strict&maxResults=6&order=viewCount&relevanceLanguage=en&q=" +
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
      const query = pickRandomQuery(cat);
      const videos = await searchYouTube(query, YOUTUBE_API_KEY);
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
