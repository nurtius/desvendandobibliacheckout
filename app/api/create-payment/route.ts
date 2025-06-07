import { type NextRequest, NextResponse } from "next/server"

interface PaymentRequest {
  value: number
  payer_name: string
  payer_email: string
  payer_phone: string
  payer_document: string
  reference: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()

    console.log("=== CRIANDO PAGAMENTO ===")
    console.log("Dados recebidos:", body)
    console.log("Token existe:", !!process.env.PUSHINPAY_TOKEN)

    // Validar dados obrigatórios
    if (!body.value || !body.payer_name || !body.payer_email || !body.reference) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    // Verificar se o valor é válido (mínimo 50 centavos)
    if (body.value < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "O valor mínimo permitido é de R$ 0,50",
        },
        { status: 400 },
      )
    }

    const token = process.env.PUSHINPAY_TOKEN
    if (!token) {
      console.error("❌ Token PushInPay não configurado")
      return NextResponse.json(
        {
          success: false,
          error: "Token PushInPay não configurado",
        },
        { status: 500 },
      )
    }

    console.log("✅ Token encontrado, criando pagamento...")

    // Usar o endpoint correto da PushInPay
    const apiUrl = "https://api.pushinpay.com.br/api/pix/cashIn"
    console.log("Chamando API:", apiUrl)

    const requestBody = {
      value: body.value, // valor em centavos
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/pushinpay`,
      split_rules: [],
    }

    console.log("Dados enviados:", requestBody)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    // Verificar se a resposta é JSON
    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const text = await response.text()
      console.error("❌ Resposta não é JSON:", text)
      return NextResponse.json(
        {
          success: false,
          error: "Resposta inválida da API",
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("Resposta da PushInPay:", data)

    if (!response.ok) {
      console.error("❌ Erro da PushInPay:", data)
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Erro ao gerar PIX",
          details: data,
        },
        { status: response.status },
      )
    }

    // Retornar dados do PIX formatados
    return NextResponse.json({
      success: true,
      data: {
        id: data.id || data.payment_id,
        qr_code: data.qr_code || data.pix_code,
        qr_code_base64: data.qr_code_base64 || data.qr_code_url,
        expires_at: data.expires_at || data.expiration_date,
        status: data.status || "pending",
      },
    })
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
