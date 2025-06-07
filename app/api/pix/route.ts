// app/api/pix/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { value, name, email, phone, cpf } = body;

    const token = process.env.PUSHINPAY_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token não encontrado" },
        { status: 500 }
      );
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
  console.error("🧨 Erro retornado pela PushInPay:", result)
  return NextResponse.json(
    { success: false, message: "Erro na criação do pagamento", result },
    { status: 500 }
  );
}


    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
