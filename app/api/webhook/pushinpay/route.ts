// app/api/webhook/pushinpay/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📦 Corpo recebido:", body);

    // Verificações básicas de segurança
    if (!body || typeof body !== "object") {
      console.error("❌ Webhook sem corpo ou formato inválido");
      return NextResponse.json({ success: false, error: "Corpo inválido" }, { status: 400 });
    }

    const status = body.status;
    const value = body.value;

    console.log("📊 Dados extraídos:", { status, value });

    if (!status || !value) {
      console.error("❌ Campos obrigatórios ausentes");
      return NextResponse.json({ success: false, error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    if (status === "paid") {
      const redirectTo = value === 1000 ? "/upsell" : "/obrigado";

      console.log("🔁 Redirecionando para:", redirectTo);

      return NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_BASE_URL), 302);
    }

    console.warn("⚠️ Status diferente de 'paid':", status);
    return NextResponse.json({ success: false, error: "Pagamento não aprovado" }, { status: 400 });

  } catch (error: any) {
    console.error("🔥 Erro inesperado ao processar webhook:", error);
    return NextResponse.json({ success: false, error: "Erro ao processar webhook" }, { status: 500 });
  }
}
