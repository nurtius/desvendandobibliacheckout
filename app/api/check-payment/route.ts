import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("id")

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "ID do pagamento não fornecido" }, { status: 400 })
    }

    // Verificar se o token existe
    const token = process.env.PUSHINPAY_TOKEN
    if (!token) {
      console.error("Token PushInPay não configurado")
      return NextResponse.json({ success: false, error: "Configuração de pagamento não encontrada" }, { status: 500 })
    }

    console.log("Consultando pagamento:", paymentId)

    // Tentar diferentes URLs para consulta
    const urls = [
      `https://api.pushinpay.com.br/api/pix/${paymentId}`,
      `https://api.pushinpay.com.br/pix/${paymentId}`,
      `https://api.pushinpay.com.br/api/v1/pix/${paymentId}`,
    ]

    for (const apiUrl of urls) {
      console.log("Tentando URL:", apiUrl)

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        const data = await response.json()

        console.log("Resposta:", {
          url: apiUrl,
          status: response.status,
          data: data,
        })

        if (response.ok) {
          return NextResponse.json({
            success: true,
            data: {
              id: data.id || data.payment_id || data.data?.id,
              status: data.status || data.data?.status,
              paid_at: data.paid_at || data.payment_date || data.data?.paid_at,
              expires_at: data.expires_at || data.expiration_date || data.data?.expires_at,
            },
          })
        }
      } catch (urlError) {
        console.log(`Erro na URL ${apiUrl}:`, urlError)
        continue
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível consultar o pagamento em nenhum endpoint",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
