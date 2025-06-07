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
    console.log("=== CRIANDO PAGAMENTO PIX ===")
    console.log("Dados recebidos:", body)
    console.log("Token existe:", !!process.env.PUSHINPAY_TOKEN)
    console.log("=============================")

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

    console.log("✅ Token encontrado, criando pagamento PIX...")

    // URLs para testar (PushInPay pode ter diferentes endpoints)
    const urls = [
      "https://api.pushinpay.com.br/api/pix",
      "https://api.pushinpay.com.br/pix",
      "https://api.pushinpay.com.br/v1/pix",
      "https://api.pushinpay.com.br/api/v1/pix",
    ]

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

    // Tentar cada URL até encontrar uma que funcione
    for (const apiUrl of urls) {
      console.log(`Tentando URL: ${apiUrl}`)

      try {
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

        console.log(`Resposta de ${apiUrl}:`, {
          status: response.status,
          success: response.ok,
          data: data,
        })

        if (response.ok) {
          console.log("✅ PIX criado com sucesso!")

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
        }

        // Se não funcionou, continua para próxima URL
        console.log(`❌ Erro em ${apiUrl}:`, data)
      } catch (urlError) {
        console.log(`❌ Erro de conexão em ${apiUrl}:`, urlError)
        continue
      }
    }

    // Se chegou aqui, nenhuma URL funcionou
    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível conectar com a API de pagamento. Tente novamente.",
      },
      { status: 503 },
    )
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
