export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  try {
    const { value, name, email, phone, cpf } = req.body;
    const token = process.env.PUSHINPAY_TOKEN;

    if (!token) {
      return res.status(500).json({ success: false, message: "Token não encontrado" });
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

    if (!response.ok) {
      return res.status(500).json({ success: false, message: "Erro na criação do pagamento", result });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return res.status(500).json({ success: false, message: "Erro interno no servidor" });
  }
}
