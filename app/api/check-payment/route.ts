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

    // Consultar status do pagamento na PushInPay com a URL CORRETA
    const response = await fetch(`https://api.pushinpay.com.br/v1/payment/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    const data = await response.json()

    console.log("Status do pagamento:", {
      paymentId,
      status: response.status,
      data: data,
    })

    if (!response.ok) {
      console.error("Erro ao consultar pagamento:", data)
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || "Erro ao consultar pagamento",
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id || data.payment_id || data.data?.id,
        status: data.status || data.data?.status,
        paid_at: data.paid_at || data.payment_date || data.data?.paid_at,
        expires_at: data.expires_at || data.expiration_date || data.data?.expires_at,
      },
    })
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
