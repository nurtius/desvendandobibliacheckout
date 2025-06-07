// app/api/webhook/pushinpay/route.ts
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("📩 Webhook recebido:", body)

    const transactionId = body.id
    const status = body.status

    if (!transactionId || !status) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos no webhook" },
        { status: 400 }
      )
    }

    // Verifica se o status é pago
    if (status === "paid") {
      console.log(`✅ Pagamento confirmado: ${transactionId}`)

      // Aqui você poderia salvar em um banco, ativar algo, etc.
      // Mas como seu site depende só do status, basta retornar sucesso

      return NextResponse.json({ success: true })
    }

    console.warn(`⚠️ Webhook recebido, mas status não é 'paid': ${status}`)
    return NextResponse.json({ success: false, error: "Status não é 'paid'" }, { status: 200 })
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}
