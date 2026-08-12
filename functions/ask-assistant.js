// CLOUDFLARE PAGES FUNCTION — ask-assistant
// Deployed at /.netlify/functions/ask-assistant via Pages Functions routing

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export async function onRequestOptions() {
  return new Response("", { status: 200, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = corsHeaders();

  const GROQ_API_KEY = env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "Server is missing GROQ_API_KEY environment variable." }), { status: 500, headers });
  }

  try {
    const { message, history } = await request.json();
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'message'." }), { status: 400, headers });
    }

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
      return new Response(JSON.stringify({ error: "AI service returned an error (" + res.status + ")." }), { status: 502, headers });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply just now.";

    return new Response(JSON.stringify({ reply }), { status: 200, headers });
  } catch (err) {
    console.error("Error in ask-assistant:", err.message);
    return new Response(JSON.stringify({ error: "Failed to get a response: " + err.message }), { status: 500, headers });
  }
}
