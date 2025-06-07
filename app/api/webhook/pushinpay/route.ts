// app/api/webhook/pushinpay/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Confirma que é uma notificação válida da PushinPay
    if (!body || !body.status || !body.id) {
      console.error("❌ Webhook recebido sem dados necessários");
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    const status = body.status;
    const value = body.value;

    console.log("✅ Webhook recebido:", { status, value });

    if (status === "paid") {
      // Decide o redirecionamento com base no valor
      const redirectTo =
        value === 1000 ? "/upsell" : "/obrigado"; // 1000 = R$10,00 (produto principal)

      return NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_BASE_URL), 302);
    }

    return NextResponse.json({ success: false, error: "Pagamento não aprovado" }, { status: 400 });

  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    return NextResponse.json({ success: false, error: "Erro interno no servidor" }, { status: 500 });
  }
}
