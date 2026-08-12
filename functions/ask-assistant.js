// AI assistant endpoint — powered by Groq (fast, free-tier-friendly LLM inference).
// The GROQ_API_KEY lives only in Netlify's environment variables, never in frontend code
// or committed to git — same security pattern as the Agora App Certificate.

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server is missing GROQ_API_KEY environment variable." }) };
  }

  try {
    const { message, history } = JSON.parse(event.body || "{}");
    if (!message || !message.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing 'message'." }) };
    }

    // Keep a short rolling history (last 6 turns) so replies stay fast and cheap, while
    // still feeling like a real conversation rather than a one-shot Q&A.
    const messages = [
      {
        role: "system",
        content:
          "You are the DiasporaLink Assistant, a helpful guide inside a community app for " +
          "the global diaspora — students, graduates, and professionals living abroad. " +
          "Help with questions about using the app, general advice on studying/working abroad, " +
          "scholarships, visas, and community life. Be warm, concise, and practical. " +
          "You are not a lawyer or immigration official — for official document or visa " +
          "decisions, always suggest they contact their embassy through the app's Embassy tab. " +
          "Never give medical, legal, or financial advice as if it were certain — offer general " +
          "information and suggest a qualified professional for anything serious.",
      },
      ...(Array.isArray(history) ? history.slice(-6) : []),
      { role: "user", content: message.trim() },
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.6,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", res.status, errText);
      return { statusCode: 502, headers, body: JSON.stringify({ error: "AI service returned an error (" + res.status + ")." }) };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply just now.";

    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Assistant function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to get a response: " + err.message }) };
  }
};
