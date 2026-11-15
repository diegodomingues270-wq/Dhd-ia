export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response("Método não permitido", {
      status: 405
    });
  }

  try {
    const { message, history = [] } = await req.json();
    const key = Netlify.env.get("GEMINI_API_KEY");

    if (!key) {
      throw new Error("Chave Gemini não encontrada");
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Você é a DHD IA, uma inteligência artificial amigável, inteligente e prestativa. Responda sempre em português do Brasil."
            }]
          },
          contents: [
            ...history,
            {
              role: "user",
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Erro ao conectar com Gemini"
      );
    }

    return new Response(JSON.stringify({
      reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui responder."
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
