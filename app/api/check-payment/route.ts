import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID não fornecido" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(`https://api.pushinpay.com.br/api/transactions/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PUSHINPAY_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Erro ao consultar pagamento" },
        { status: 500 }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      status: result.status, // pode ser "created", "paid" ou "expired"
    })
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno" },
      { status: 500 }
    )
  }
}
