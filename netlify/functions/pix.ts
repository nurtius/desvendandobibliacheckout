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
    const token = process.env.PUSHINPAY_TOKEN;

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
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Erro interno ao gerar PIX" }),
    };
  }
};

export { handler };
