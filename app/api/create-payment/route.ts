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

    // Log para debug
    console.log("=== CRIANDO PAGAMENTO ===")
    console.log("Dados recebidos:", body)
    console.log("Token existe:", !!process.env.PUSHINPAY_TOKEN)
    console.log("========================")

    // Validar dados obrigatórios
    if (!body.value || !body.payer_name || !body.payer_email || !body.reference) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    // Verificar se o token existe
    const token = process.env.PUSHINPAY_TOKEN
    if (!token) {
      console.error("❌ Token PushInPay não configurado")
      return NextResponse.json(
        {
          success: false,
          error: "Token PushInPay não configurado. Verifique o arquivo .env.local",
        },
        { status: 500 },
      )
    }

    console.log("✅ Token encontrado, criando pagamento...")

    // URL CORRETA da API da PushInPay (testando diferentes endpoints)
    const apiUrl = "https://api.pushinpay.com.br/api/pix"
    console.log("Chamando API externa:", apiUrl)

    const requestBody = {
      value: body.value,
      payer_name: body.payer_name,
      payer_email: body.payer_email,
      payer_phone: body.payer_phone,
      payer_document: body.payer_document,
      reference: body.reference,
      description: body.description || "Desvendando a Bíblia - Materiais Digitais",
      expires_in: 900, // 15 minutos
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/pushinpay`,
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

    const data = await response.json()

    console.log("Resposta da PushInPay:", {
      status: response.status,
      success: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data: data,
    })

    if (!response.ok) {
      console.error("❌ Erro da PushInPay:", data)

      // Se for erro 404, tentar endpoint alternativo
      if (response.status === 404) {
        console.log("Tentando endpoint alternativo...")

        const alternativeUrl = "https://api.pushinpay.com.br/pix"
        console.log("Tentando URL:", alternativeUrl)

        const altResponse = await fetch(alternativeUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        const altData = await altResponse.json()

        console.log("Resposta alternativa:", {
          status: altResponse.status,
          success: altResponse.ok,
          data: altData,
        })

        if (altResponse.ok) {
          return NextResponse.json({
            success: true,
            data: {
              id: altData.id || altData.payment_id || altData.data?.id,
              qr_code: altData.qr_code || altData.pix_code || altData.data?.qr_code,
              qr_code_url: altData.qr_code_url || altData.qr_code_image || altData.data?.qr_code_url,
              pix_code: altData.pix_code || altData.qr_code || altData.data?.pix_code,
              expires_at: altData.expires_at || altData.expiration_date || altData.data?.expires_at,
              status: altData.status || altData.data?.status || "pending",
            },
          })
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || "Erro ao gerar PIX",
          details: data,
        },
        { status: response.status },
      )
    }

    // Retornar dados do PIX formatados
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
