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

interface PushInPayResponse {
  success: boolean
  data?: {
    id: string
    qr_code: string
    qr_code_url: string
    pix_code: string
    expires_at: string
    status: string
  }
  error?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()

    // Validar dados obrigatórios
    if (!body.value || !body.payer_name || !body.payer_email || !body.reference) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    // Verificar se o token existe
    const token = process.env.PUSHINPAY_TOKEN
    if (!token) {
      console.error("Token PushInPay não configurado")
      return NextResponse.json({ success: false, error: "Configuração de pagamento não encontrada" }, { status: 500 })
    }

    console.log("Criando pagamento PushInPay:", {
      value: body.value,
      payer_name: body.payer_name,
      payer_email: body.payer_email,
      reference: body.reference,
    })

    // Chamar API da PushInPay com a URL CORRETA
    const response = await fetch("https://api.pushinpay.com.br/v1/payment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        value: body.value,
        payer_name: body.payer_name,
        payer_email: body.payer_email,
        payer_phone: body.payer_phone,
        payer_document: body.payer_document,
        reference: body.reference,
        description: body.description || "Desvendando a Bíblia - Materiais Digitais",
        expires_in: 900, // 15 minutos
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/pushinpay`,
      }),
    })

    const data = await response.json()

    console.log("Resposta PushInPay:", {
      status: response.status,
      success: response.ok,
      data: data,
    })

    if (!response.ok) {
      console.error("Erro da PushInPay:", data)
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || "Erro ao gerar PIX",
          details: data,
        },
        { status: response.status },
      )
    }

    // Retornar dados do PIX com mapeamento correto
    return NextResponse.json({
      success: true,
      data: {
        id: data.id || data.payment_id || data.data?.id,
        qr_code: data.qr_code || data.pix_code || data.data?.qr_code,
        qr_code_url: data.qr_code_url || data.qr_code_image || data.data?.qr_code_url,
        pix_code: data.pix_code || data.qr_code || data.data?.pix_code,
        expires_at: data.expires_at || data.expiration_date || data.data?.expires_at,
        status: data.status || data.data?.status || "pending",
      },
    })
  } catch (error) {
    console.error("Erro interno:", error)
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
