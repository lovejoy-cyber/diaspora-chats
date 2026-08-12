// Scheduled function — runs automatically on a timer (configured in netlify.toml) to
// search YouTube for videos matching our curated categories, and stores fresh results
// into Firestore so the app's Reels feed always has current content without anyone
// manually pasting links in. This is the "automated" half of the reels feed — TikTok/
// Instagram links stay manual (see the app's own paste-a-link flow) since there is no
// safe, free, legal automated API for those platforms — only YouTube offers one.

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Curated search categories — Embassy/Admin can extend this list later via the Admin
// panel; for now it's the exact themes requested: academic/career growth, avoiding
// anything explicit, including faith content specifically.
const CATEGORIES = [
  { key: "scholarships", query: "scholarship opportunities students 2026" },
  { key: "jobs", query: "job opportunities graduates career advice" },
  { key: "tech", query: "technology trends software development skills" },
  { key: "courses", query: "free online courses certification students" },
  { key: "news", query: "youth news trends education Africa" },
  { key: "life", query: "student life advice relationships motivation" },
  { key: "faith", query: "christian devotion encouragement short" },
];

async function searchYouTube(query) {
  const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&safeSearch=strict&maxResults=6&order=date&q=" +
    encodeURIComponent(query) + "&key=" + YOUTUBE_API_KEY;
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

exports.handler = async () => {
  if (!YOUTUBE_API_KEY) {
    console.error("Missing YOUTUBE_API_KEY environment variable.");
    return { statusCode: 500, body: "Missing YOUTUBE_API_KEY" };
  }

  // Firestore write happens via the REST API here (no firebase-admin SDK dependency
  // needed) using the same project — this keeps the function lightweight.
  const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "diasporalink-app-df914";
  const results = { fetched: 0, errors: [] };

  for (const cat of CATEGORIES) {
    try {
      const videos = await searchYouTube(cat.query);
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
  return { statusCode: 200, body: JSON.stringify(results) };
};

// Runs every 6 hours — frequent enough to stay current, well within YouTube's free
// daily quota (7 categories x ~100 units each = 700 units per run, four runs a day
// = 2800 units, comfortably under the 10,000/day free limit).
// Runs every 2 hours — I want to be precise here rather than optimistic: at 7 categories
// x ~100 units per search, one run costs ~700 units. YouTube's free quota is 10,000
// units/day. Every 30 minutes would be 48 runs/day = 33,600 units — more than 3x over
// the free limit, which would make the feed go dead partway through the day once quota
// runs out. Every 2 hours = 12 runs/day = 8,400 units, safely within the free tier with
// room to spare. This is the fastest genuinely sustainable refresh rate on the free plan.
exports.config = { schedule: "0 */2 * * *" };
