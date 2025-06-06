"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  qrCode: string
  qrCodeUrl: string
  expiresAt: string
  status: string
}

export default function PagamentoPix() {
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [copyText, setCopyText] = useState("Copiar")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending")
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos em segundos
  const [isLoading, setIsLoading] = useState(true)
  const [checkingPayment, setCheckingPayment] = useState(false)

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Carregar dados do pedido
  useEffect(() => {
    const savedOrderData = localStorage.getItem("orderData")
    if (savedOrderData) {
      const data = JSON.parse(savedOrderData)
      setOrderData(data)

      // Calcular tempo restante baseado na expiração real
      const expiresAt = new Date(data.expiresAt).getTime()
      const now = new Date().getTime()
      const timeLeftSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setTimeLeft(timeLeftSeconds)

      setIsLoading(false)
    } else {
      window.location.href = "/"
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === "pending") {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setPaymentStatus("expired")
    }
  }, [timeLeft, paymentStatus])

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (paymentStatus === "pending" && !isLoading && orderData?.paymentId) {
      const checkPayment = async () => {
        if (checkingPayment) return

        setCheckingPayment(true)
        try {
          const response = await fetch(`/api/check-payment?id=${orderData.paymentId}`)
          const result = await response.json()

          if (result.success && result.data.status === "paid") {
            setPaymentStatus("paid")

            // Registrar conversão no Facebook Pixel
            if (typeof window !== "undefined" && (window as any).fbq) {
              ;(window as any).fbq("track", "Purchase", {
                value: orderData.total,
                currency: "BRL",
              })
            }

            // Redirecionar para página de sucesso após 2 segundos
            setTimeout(() => {
              window.location.href = "/sucesso"
            }, 2000)
          }
        } catch (error) {
          console.error("Erro ao verificar pagamento:", error)
        } finally {
          setCheckingPayment(false)
        }
      }

      // Verificar a cada 5 segundos
      const interval = setInterval(checkPayment, 5000)

      // Verificar imediatamente
      checkPayment()

      return () => clearInterval(interval)
    }
  }, [paymentStatus, isLoading, orderData, checkingPayment])

  const copyPix = async () => {
    if (!orderData?.qrCode) return

    try {
      await navigator.clipboard.writeText(orderData.qrCode)
      setCopyText("Copiado!")
      setTimeout(() => setCopyText("Copiar"), 3000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea")
      textArea.value = orderData.qrCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopyText("Copiado!")
      setTimeout(() => setCopyText("Copiar"), 3000)
    }
  }

  const handleNewPayment = () => {
    localStorage.removeItem("orderData")
    window.location.href = "/"
  }

  const handleConfirmPayment = async () => {
    if (!orderData?.paymentId) return

    setCheckingPayment(true)
    try {
      const response = await fetch(`/api/check-payment?id=${orderData.paymentId}`)
      const result = await response.json()

      if (result.success && result.data.status === "paid") {
        setPaymentStatus("paid")

        // Registrar conversão no Facebook Pixel
        if (typeof window !== "undefined" && (window as any).fbq) {
          ;(window as any).fbq("track", "Purchase", {
            value: orderData.total,
            currency: "BRL",
          })
        }

        setTimeout(() => {
          window.location.href = "/sucesso"
        }, 2000)
      } else {
        alert("Pagamento ainda não foi identificado. Aguarde alguns instantes e tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
      alert("Erro ao verificar pagamento. Tente novamente.")
    } finally {
      setCheckingPayment(false)
    }
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-orange-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  if (paymentStatus === "expired") {
    return (
      <div className="min-h-screen bg-orange-400">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-6">
                <Clock className="h-20 w-20 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">PIX Expirado</h2>
              <p className="text-gray-600 mb-8">O tempo para pagamento expirou. Gere um novo PIX para continuar.</p>
              <Button onClick={handleNewPayment} className="w-full bg-green-600 hover:bg-green-700 py-3">
                Gerar Novo PIX
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  if (paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-orange-400">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-green-500 mb-6">
                <Check className="h-20 w-20 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Pagamento Aprovado!</h2>
              <p className="text-gray-600 mb-6">
                Seu pagamento foi processado com sucesso. Você será redirecionado em instantes...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-400">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-white mb-2">Pague o Pix</h1>
          <p className="text-white/90">Transação: {orderData.orderId}</p>
        </div>

        {/* Card Principal */}
        <Card className="shadow-lg mb-4">
          <CardContent className="p-6">
            {/* Saudação e Instruções */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">{orderData.nome},</h2>
              <p className="text-gray-700 mb-4">Siga os passos abaixo para pagar:</p>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </span>
                  <span>Copie a chave PIX abaixo</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </span>
                  <span>Abra o aplicativo do seu banco e entre na opção PIX</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </span>
                  <span>Escolha a opção Pagar → Pix copia e cola</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    4
                  </span>
                  <span>Depois, confirme o pagamento.</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-orange-100 text-orange-800 p-3 rounded-lg mb-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-semibold">
                  {checkingPayment ? "Verificando pagamento..." : "Aguardando pagamento"}
                </span>
              </div>
              <p className="text-sm mt-1">Expira em: {formatTime(timeLeft)}</p>
            </div>

            {/* QR Code */}
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                <Image
                  src={orderData.qrCodeUrl || "/placeholder.svg?height=200&width=200"}
                  alt="QR Code PIX"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
            </div>

            {/* Botão Copiar Chave */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-3">Copie a chave pix</p>
              <Button onClick={copyPix} variant="outline" className="w-full mb-4">
                <Copy className="h-4 w-4 mr-2" />
                {copyText}
              </Button>
            </div>

            {/* Código PIX */}
            <div className="bg-gray-50 p-3 rounded-lg mb-6 border">
              <code className="text-xs break-all text-gray-700 font-mono block">{orderData.qrCode}</code>
            </div>

            {/* Botão Confirmar */}
            <Button
              onClick={handleConfirmPayment}
              className="w-full bg-green-600 hover:bg-green-700 py-3"
              disabled={checkingPayment}
            >
              {checkingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verificando...
                </div>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Itens da Compra */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-800 mb-4">Itens da sua compra</h3>

            {/* Produto Principal */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-600 text-white rounded-lg">
              <Image
                src="/images/produto-principal.png"
                alt="Desvendando a Bíblia"
                width={60}
                height={60}
                className="rounded-md"
              />
              <div className="flex-grow">
                <h4 className="font-bold text-sm">Desvendando a Bíblia + 4 Bônus</h4>
                <p className="text-xs opacity-90">Aplicativo completo + materiais exclusivos</p>
              </div>
            </div>

            {/* Order Bumps Selecionados */}
            {orderData.orderBumps.map((bump) => (
              <div key={bump.id} className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded-lg">
                <Image
                  src={`/images/order-bump-${bump.id}.png`}
                  alt={bump.title}
                  width={40}
                  height={40}
                  className="rounded-md"
                />
                <div className="flex-grow">
                  <h4 className="font-semibold text-sm text-gray-800">{bump.title.split(":")[0]}</h4>
                  <p className="text-xs text-gray-600">{formatCurrency(bump.price)}</p>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="border-t pt-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(orderData.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
