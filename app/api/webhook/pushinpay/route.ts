import { type NextRequest, NextResponse } from "next/server"

interface WebhookPayload {
  event: string
  data: {
    id: string
    status: string
    value: number
    payer_name: string
    payer_email: string
    reference: string
    paid_at?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json()

    console.log("Webhook recebido:", payload)

    // Verificar se é um evento de pagamento aprovado
    if (payload.event === "payment.approved" || payload.data.status === "paid") {
      const { data } = payload

      // Aqui você pode:
      // 1. Salvar no banco de dados
      // 2. Enviar email com acesso
      // 3. Integrar com sistema de entrega
      // 4. Notificar outros sistemas

      console.log(`Pagamento aprovado: ${data.id} - ${data.payer_email}`)

      // Exemplo de log para demonstração (substitua por integração real)
      await logAccessEmail({
        email: data.payer_email,
        name: data.payer_name,
        orderId: data.reference,
        value: data.value,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no webhook:", error)
    return NextResponse.json({ success: false, error: "Erro ao processar webhook" }, { status: 500 })
  }
}

// Função para log de email de acesso (exemplo para demonstração)
async function logAccessEmail(data: {
  email: string
  name: string
  orderId: string
  value: number
}) {
  // Log para demonstração - em produção você integraria com seu provedor de email
  console.log("=== EMAIL DE ACESSO ===")
  console.log(`Para: ${data.email}`)
  console.log(`Nome: ${data.name}`)
  console.log(`Pedido: ${data.orderId}`)
  console.log(`Valor: R$ ${data.value.toFixed(2)}`)
  console.log("Conteúdo: Link de acesso ao aplicativo enviado!")
  console.log("======================")

  // Em produção, você usaria algo como:
  // - SendGrid: await sgMail.send(emailData)
  // - Mailgun: await mailgun.messages().send(emailData)
  // - Amazon SES: await ses.sendEmail(emailData).promise()
  // - Resend: await resend.emails.send(emailData)
}
