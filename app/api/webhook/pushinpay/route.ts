import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""
    let data: any

    if (contentType.includes("application/json")) {
      data = await req.json()
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text()
      data = Object.fromEntries(new URLSearchParams(text))
    } else {
      console.warn("⚠️ Tipo de conteúdo não suportado:", contentType)
      return NextResponse.json({ success: false, error: "Unsupported content-type" }, { status: 415 })
    }

    console.log("📥 Webhook recebido:", JSON.stringify(data, null, 2))

    const status = data.status
    const valor = parseInt(data.value)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!baseUrl) {
      console.error("❌ NEXT_PUBLIC_BASE_URL não está definido.")
      return NextResponse.json({ success: false, error: "BASE_URL ausente" }, { status: 500 })
    }

    if (status === "paid") {
      const valoresProdutoPrincipal = [1000, 1690, 2380, 3070, 3760, 4450, 5140]
      const redirecionarPara = valoresProdutoPrincipal.includes(valor) ? "/upsell" : "/obrigado"

      console.log("✅ Pagamento aprovado. Redirecionando para:", redirecionarPara)
      return NextResponse.redirect(`${baseUrl}${redirecionarPara}`, 303)
    }

    console.warn("⚠️ Status diferente de 'paid':", status)
    return NextResponse.json({ success: false, error: "Status não pago" }, { status: 200 })

  } catch (error) {
    console.error("🔥 Erro inesperado ao processar webhook:", error)
    return NextResponse.json({ success: false, error: "Erro ao processar webhook" }, { status: 500 })
  }
}
