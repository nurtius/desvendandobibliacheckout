"use client"

import { useState, useEffect } from "react"
import { Check, X, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Footer } from "@/components/footer"
import Image from "next/image"

interface OrderData {
  nome: string
  email: string
  telefone: string
  cpf: string
  total: number
  orderBumps: Array<{
    id: string
    title: string
    price: number
  }>
  orderId: string
  paymentId: string
}

type LoadingState = "idle" | "generating" | "success" | "error"

export default function Upsell() {
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const upsellPrice = 27.0

  useEffect(() => {
    // Carregar dados do pedido principal
    const savedOrderData = localStorage.getItem("orderData")
    if (savedOrderData) {
      const data = JSON.parse(savedOrderData)
      setOrderData(data)
    } else {
      // Se não há dados, redirecionar para o início
      window.location.href = "/"
    }

    // Disparar evento do Facebook Pixel para visualização do upsell
    if (typeof window !== "undefined" && (window as any).fbq) {
      ;(window as any).fbq("track", "ViewContent", {
        content_type: "product",
        content_name: "Upsell - Curso Completo",
        value: upsellPrice,
        currency: "BRL",
      })
    }
  }, [])

  const handleAcceptUpsell = async () => {
    if (!orderData) return

    try {
      setLoadingState("generating")
      setStatusMessage("Gerando seu PIX do Upsell... Aguarde alguns instantes")

      // Gerar novo ID para o upsell
      const upsellOrderId = `upsell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Preparar dados para a API
      const paymentData = {
        value: Math.round(upsellPrice * 100), // 2700 centavos
        payer_name: orderData.nome,
        payer_email: orderData.email,
        payer_phone: orderData.telefone.replace(/\D/g, ""),
        payer_document: orderData.cpf.replace(/\D/g, ""),
        reference: upsellOrderId,
        description: "Desvendando a Bíblia - Curso Completo (Upsell)",
      }

      // Chamar API para criar pagamento
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Erro ao gerar PIX do Upsell")
      }

      // Sucesso
      setLoadingState("success")
      setStatusMessage("PIX do Upsell gerado com sucesso! Redirecionando...")

      // Preparar dados do upsell
      const upsellData = {
        ...orderData,
        isUpsell: true,
        upsellPrice,
        upsellOrderId,
        upsellPaymentId: result.data.id,
        upsellQrCode: result.data.qr_code,
        upsellQrCodeUrl: result.data.qr_code_base64,
        upsellExpiresAt: result.data.expires_at,
        upsellStatus: result.data.status,
      }

      // Salvar dados atualizados
      localStorage.setItem("orderData", JSON.stringify(upsellData))

      // Disparar evento do Facebook Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        ;(window as any).fbq("track", "InitiateCheckout", {
          value: upsellPrice,
          currency: "BRL",
          content_name: "Upsell - Curso Completo",
        })
      }

      // Aguardar um pouco para mostrar a mensagem de sucesso
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirecionar para página de pagamento do upsell
      window.location.href = "/pagamento-upsell"
    } catch (error) {
      console.error("Erro ao processar upsell:", error)
      setLoadingState("error")

      let errorMessage = "Erro ao processar o upsell. Tente novamente."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      setStatusMessage(errorMessage)

      // Resetar estado após alguns segundos
      setTimeout(() => {
        setLoadingState("idle")
        setStatusMessage("")
      }, 5000)
    }
  }

  const handleDeclineUpsell = () => {
    // Disparar evento do Facebook Pixel para recusa
    if (typeof window !== "undefined" && (window as any).fbq) {
      ;(window as any).fbq("track", "CustomizeProduct", {
        content_name: "Upsell Declined",
      })
    }

    // Redirecionar para página de sucesso
    window.location.href = "/sucesso"
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const getStatusIcon = () => {
    switch (loadingState) {
      case "generating":
        return <Loader2 className="h-5 w-5 animate-spin" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (loadingState) {
      case "generating":
        return "bg-blue-50 border-blue-200 text-blue-800"
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return ""
    }
  }

  const isLoading = loadingState !== "idle"

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Status Message */}
        {statusMessage && (
          <Alert className={`mb-6 ${getStatusColor()}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <AlertDescription className="font-medium">{statusMessage}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">🎉 Parabéns, {orderData.nome}!</h1>
          <p className="text-xl text-blue-100 mb-2">Seu pagamento foi aprovado com sucesso!</p>
          <p className="text-lg text-blue-200">Mas antes de finalizar, temos uma oferta especial só para você...</p>
        </div>

        {/* Oferta Principal */}
        <Card className="mb-8 shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full inline-block mb-6">
                <span className="font-bold text-lg">⚡ OFERTA ESPECIAL - APENAS HOJE ⚡</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Curso Completo "Desvendando a Bíblia"
              </h2>

              <p className="text-xl text-gray-600 mb-6">
                Transforme sua vida espiritual com o curso mais completo sobre estudos bíblicos
              </p>

              {/* Imagem do Produto */}
              <div className="mb-8">
                <Image
                  src="/images/produto-principal.png"
                  alt="Curso Completo Desvendando a Bíblia"
                  width={400}
                  height={300}
                  className="mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Benefícios */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">✨ O que você vai receber:</h3>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">12 Módulos Completos</h4>
                    <p className="text-gray-600">Desde o básico até estudos avançados</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">50+ Videoaulas</h4>
                    <p className="text-gray-600">Mais de 20 horas de conteúdo exclusivo</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">Material de Apoio</h4>
                    <p className="text-gray-600">PDFs, exercícios e guias práticos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">Certificado de Conclusão</h4>
                    <p className="text-gray-600">Reconhecimento do seu aprendizado</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">🎯 Bônus Exclusivos:</h3>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">Grupo VIP no Telegram</h4>
                    <p className="text-gray-600">Comunidade exclusiva de estudantes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">Sessões de Mentoria</h4>
                    <p className="text-gray-600">Lives mensais para tirar dúvidas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">Atualizações Vitalícias</h4>
                    <p className="text-gray-600">Novos conteúdos sem custo adicional</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">Suporte Prioritário</h4>
                    <p className="text-gray-600">Atendimento exclusivo e rápido</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preço */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-lg mb-6">
                <p className="text-lg mb-2">
                  Valor normal: <span className="line-through">R$ 197,00</span>
                </p>
                <p className="text-3xl font-bold mb-2">Hoje apenas: {formatCurrency(upsellPrice)}</p>
                <p className="text-sm opacity-90">⏰ Esta oferta expira em alguns minutos!</p>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800 font-semibold">🔒 Garantia de 30 dias ou seu dinheiro de volta!</p>
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-4">
              <Button
                onClick={handleAcceptUpsell}
                className="w-full py-6 text-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                disabled={isLoading}
              >
                {loadingState === "generating" && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Gerando PIX...
                  </div>
                )}
                {loadingState === "success" && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    PIX Gerado! Redirecionando...
                  </div>
                )}
                {loadingState === "error" && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-6 w-6" />
                    Tentar Novamente
                  </div>
                )}
                {loadingState === "idle" && <>✅ SIM! QUERO O CURSO COMPLETO POR {formatCurrency(upsellPrice)}</>}
              </Button>

              <Button
                onClick={handleDeclineUpsell}
                variant="outline"
                className="w-full py-4 text-lg border-gray-300 text-gray-600 hover:bg-gray-50"
                disabled={isLoading}
              >
                <X className="h-5 w-5 mr-2" />
                Não, obrigado. Continuar sem o curso.
              </Button>
            </div>

            {/* Depoimentos */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Maria Silva</h4>
                    <div className="text-yellow-500">⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Este curso transformou completamente minha forma de estudar a Bíblia. Recomendo para todos!"
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    J
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">João Santos</h4>
                    <div className="text-yellow-500">⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Conteúdo incrível! Aprendi mais em 30 dias do que em anos de estudo por conta própria."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
