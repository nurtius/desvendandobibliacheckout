"use client"

import { useState, useEffect } from "react"
import { Check, Download, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Footer } from "@/components/footer"

interface OrderData {
  nome: string
  email: string
  total: number
  orderId: string
}

export default function Sucesso() {
  const [orderData, setOrderData] = useState<OrderData | null>(null)

  useEffect(() => {
    const savedOrderData = localStorage.getItem("orderData")
    if (savedOrderData) {
      const data = JSON.parse(savedOrderData)
      setOrderData(data)

      // Limpar dados do localStorage após sucesso
      localStorage.removeItem("orderData")
    }
  }, [])

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 md:p-6 pt-12">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pagamento Aprovado!</h1>
          <p className="text-gray-600">
            Obrigado pela sua compra, {orderData.nome}! Seu pedido foi processado com sucesso.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalhes do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Número do pedido:</span>
              <span className="font-mono">{orderData.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span>{orderData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valor pago:</span>
              <span className="font-bold text-green-600">
                {orderData.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-green-50 border-green-200 mb-6">
          <Mail className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            <strong>Acesso liberado!</strong>
            <p className="mt-1">
              Enviamos o link de acesso ao aplicativo para <strong>{orderData.email}</strong>. Verifique sua caixa de
              entrada e spam.
            </p>
          </AlertDescription>
        </Alert>

        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-bold mb-2">Acesso Imediato</h3>
            <p className="text-sm text-gray-600 mb-4">
              Acesse seu aplicativo agora mesmo através do link enviado por email.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>
              Lembre-se: Você tem <strong>7 dias de garantia</strong> para testar o aplicativo.
            </span>
          </p>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Problemas com o acesso? Entre em contato conosco através do email:
            <a href="mailto:desvendandobiblia@outlook.com" className="text-blue-600 hover:underline ml-1">
              desvendandobiblia@outlook.com
            </a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
