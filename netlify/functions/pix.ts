import type { Handler } from "@netlify/functions";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Método não permitido" }),
    };
  }

  try {
    const { value } = JSON.parse(event.body || "{}");

    console.log("🟡 Valor recebido:", value);

    if (!value) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Valor é obrigatório" }),
      };
    }

    const token = process.env.PUSHINPAY_TOKEN;
    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Token não encontrado" }),
      };
    }

    const endpoint = "https://api.pushinpay.com.br/api/pix/cashIn";
    console.log("🌐 Chamando endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value,
        webhook_url: "https://checkout.desvendandoabiblia.shop/api/webhook/pushinpay",
        split_rules: [],
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Resposta não é JSON:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Resposta inválida da API" }),
      };
    }

    const result = await response.json();
    console.log("🔵 Resposta da PushInPay:", result);

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, result }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: result }),
    };
  } catch (error) {
    console.error("🔥 Erro inesperado:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Erro interno ao gerar PIX" }),
    };
  }
};

export { handler };
