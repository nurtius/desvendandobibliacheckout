import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("id")

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "ID do pagamento não fornecido" }, { status: 400 })
    }

    // Consultar status do pagamento na PushInPay
    const response = await fetch(`https://api.pushinpay.com/v1/payment/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer 32749|OW7JYt7IQyUjJgcz6u17QV45V5MqDygrx4xCVEa4df88455b",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Erro ao consultar pagamento:", data)
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Erro ao consultar pagamento",
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        status: data.status,
        paid_at: data.paid_at,
        expires_at: data.expires_at,
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
