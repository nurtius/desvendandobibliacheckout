import type { Handler } from "@netlify/functions";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Método não permitido" }),
    };
  }

  try {
    const { value, name, email, phone, cpf } = JSON.parse(event.body || "{}");

    console.log("🟡 Dados recebidos:", { value, name, email, phone, cpf });

    // ✅ Validação mínima antes de chamar a API
    if (!value || !name || !email || !phone || !cpf) {
      console.error("⚠️ Campos obrigatórios faltando");
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Preencha todos os campos obrigatórios." }),
      };
    }

    const token = process.env.PUSHINPAY_TOKEN;
    if (!token) {
      console.error("❌ Token da PushInPay ausente");
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Token da API não encontrado" }),
      };
    }

    const response = await fetch("https://api.pushinpay.com.br/pix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        value,
        payer_name: name,
        payer_document: cpf,
        payer_email: email,
        payer_phone: phone,
        description: "Desvendando a Bíblia",
        reference: `pedido-${Date.now()}`,
      }),
    });

    const result = await response.json();

    console.log("🔵 Resposta da PushInPay:", result);

    if (!response.ok) {
      console.error("🛑 Erro da PushInPay:", result);
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
