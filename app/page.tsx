"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Check, AlertCircle, Shield, Zap, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Footer } from "@/components/footer"
import Image from "next/image"

interface OrderBump {
  id: string
  title: string
  image: string
  price: number
  selected: boolean
  percentage: number
}

type LoadingState = "idle" | "validating" | "generating" | "success" | "error"

export default function Checkout() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpf, setCpf] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const basePrice = 10.0
  const bumpPrice = 6.9

  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([
    {
      id: "checklist",
      title: "Checklist Ouro: 7 Passos Diários para um Estudo Bíblico Transformador",
      image: "/images/order-bump-checklist.png",
      price: bumpPrice,
      selected: false,
      percentage: 82,
    },
    {
      id: "promessas",
      title: "Coleção de Promessas Bíblicas Essenciais: Força para Cada Dia",
      image: "/images/order-bump-promessas.png",
      price: bumpPrice,
      selected: false,
      percentage: 78,
    },
    {
      id: "parabolas",
      title: "Decifrando Parábolas: Lições Essenciais das Histórias de Jesus",
      image: "/images/order-bump-parabolas.png",
      price: bumpPrice,
      selected: false,
      percentage: 75,
    },
    {
      id: "evangelizar",
      title: "Miniguia Prático: Compartilhando Sua Fé Sem Medo",
      image: "/images/order-bump-evangelizar.png",
      price: bumpPrice,
      selected: false,
      percentage: 69,
    },
    {
      id: "caderno",
      title: "Meu Caderno de Reflexões Bíblicas: Templates para Anotações",
      image: "/images/order-bump-caderno.png",
      price: bumpPrice,
      selected: false,
      percentage: 73,
    },
    {
      id: "glossario",
      title: "Glossário Bíblico Descomplicado",
      image: "/images/order-bump-glossario.png",
      price: bumpPrice,
      selected: false,
      percentage: 71,
    },
  ])

  const toggleOrderBump = useCallback(
    (id: string) => {
      if (loadingState !== "idle") return
      setOrderBumps((prev) => prev.map((bump) => (bump.id === id ? { ...bump, selected: !bump.selected } : bump)))
    },
    [loadingState],
  )

  const calculateTotal = useCallback(() => {
    const bumpTotal = orderBumps.filter((bump) => bump.selected).reduce((acc, bump) => acc + bump.price, 0)
    return basePrice + bumpTotal
  }, [orderBumps, basePrice])

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1-$2")
      .substring(0, 14)
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!nome.trim()) {
      newErrors.nome = "Nome é obrigatório"
    }

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido"
    }

    const phoneDigits = telefone.replace(/\D/g, "")
    if (!phoneDigits) {
      newErrors.telefone = "Telefone é obrigatório"
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.telefone = "Telefone inválido"
    }

    const cpfDigits = cpf.replace(/\D/g, "")
    if (!cpfDigits) {
      newErrors.cpf = "CPF é obrigatório"
    } else if (cpfDigits.length !== 11 || !validarCPF(cpfDigits)) {
      newErrors.cpf = "CPF inválido"
    }

    setErrors(newErrors)

    // Scroll para o primeiro campo com erro
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        element.focus()
      }
    }

    return Object.keys(newErrors).length === 0
  }

  const validarCPF = (cpf: string) => {
    if (/^(\d)\1+$/.test(cpf)) return false

    let soma = 0
    let resto

    for (let i = 1; i <= 9; i++) soma += Number.parseInt(cpf.substring(i - 1, i)) * (11 - i)

    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== Number.parseInt(cpf.substring(9, 10))) return false

    soma = 0
    for (let i = 1; i <= 10; i++) soma += Number.parseInt(cpf.substring(i - 1, i)) * (12 - i)

    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0

    return resto === Number.parseInt(cpf.substring(10, 11))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Resetar estados
    setErrors({})
    setStatusMessage("")

    // Validação
    setLoadingState("validating")
    setStatusMessage("Validando dados...")

    await new Promise((resolve) => setTimeout(resolve, 500)) // Simular delay de validação

    if (!validateForm()) {
      setLoadingState("error")
      setStatusMessage("Por favor, corrija os erros no formulário")
      setTimeout(() => {
        setLoadingState("idle")
        setStatusMessage("")
      }, 3000)
      return
    }

    try {
      // Registrar evento de compra no Facebook Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        ;(window as any).fbq("track", "InitiateCheckout", {
          value: calculateTotal(),
          currency: "BRL",
        })
      }

      // Gerar PIX
      setLoadingState("generating")
      setStatusMessage("Gerando seu PIX... Aguarde alguns instantes")

      // Gerar ID único para o pedido
      const orderId = `pedido-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Preparar dados para a API
      const paymentData = {
        value: calculateTotal(),
        payer_name: nome,
        payer_email: email,
        payer_phone: telefone.replace(/\D/g, ""),
        payer_document: cpf.replace(/\D/g, ""),
        reference: orderId,
        description: `Desvendando a Bíblia - ${orderBumps.filter((b) => b.selected).length > 0 ? "Produto Principal + " + orderBumps.filter((b) => b.selected).length + " Bônus" : "Produto Principal"}`,
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
        throw new Error(result.error || "Erro ao gerar PIX")
      }

      // Sucesso
      setLoadingState("success")
      setStatusMessage("PIX gerado com sucesso! Redirecionando...")

      // Preparar dados do pedido para salvar
      const orderData = {
        nome,
        email,
        telefone,
        cpf,
        total: calculateTotal(),
        orderBumps: orderBumps.filter((bump) => bump.selected),
        orderId,
        paymentId: result.data.id,
        qrCode: result.data.pix_code,
        qrCodeUrl: result.data.qr_code_url,
        expiresAt: result.data.expires_at,
        status: result.data.status,
      }

      // Salvar dados no localStorage
      localStorage.setItem("orderData", JSON.stringify(orderData))

      // Registrar evento no Facebook Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        ;(window as any).fbq("track", "AddPaymentInfo", {
          value: calculateTotal(),
          currency: "BRL",
        })
      }

      // Aguardar um pouco para mostrar a mensagem de sucesso
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirecionar para página de pagamento
      window.location.href = "/pagamento"
    } catch (error) {
      console.error("Erro ao processar pedido:", error)
      setLoadingState("error")

      let errorMessage = "Erro ao processar o pedido. Tente novamente."

      if (error instanceof Error) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
        } else if (error.message.includes("timeout")) {
          errorMessage = "Tempo limite excedido. Tente novamente."
        } else {
          errorMessage = error.message
        }
      }

      setStatusMessage(errorMessage)
      setErrors({ submit: errorMessage })

      // Resetar estado após alguns segundos
      setTimeout(() => {
        setLoadingState("idle")
        setStatusMessage("")
      }, 5000)
    }
  }

  // Inicializar Facebook Pixel
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      ;(window as any).fbq("track", "PageView")
    }
  }, [])

  const getStatusIcon = () => {
    switch (loadingState) {
      case "validating":
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
      case "validating":
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20">
        {/* Banner */}
        <div className="mb-6">
          <Image
            src="/images/banner-checkout.png"
            alt="Desvendando a Bíblia"
            width={1200}
            height={300}
            className="rounded-lg shadow-md w-full"
            priority
          />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <Alert className={`mb-6 ${getStatusColor()}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <AlertDescription className="font-medium">{statusMessage}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Produto Principal */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Você está adquirindo:</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src="/images/produto-principal.png"
                    alt="Desvendando a Bíblia"
                    width={120}
                    height={120}
                    className="rounded-md"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Desvendando a Bíblia + 4 Bônus Especiais</h3>
                  <p className="text-gray-600 mb-3">
                    Aplicativo completo para aprofundar seus conhecimentos bíblicos + materiais exclusivos.
                  </p>
                  <div className="text-xl font-bold text-green-600 bg-green-50 p-2 rounded-md inline-block">
                    {formatCurrency(basePrice)}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Acesso imediato</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Aplicativo completo</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <Shield className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Garantia de 7 dias</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={errors.nome ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="telefone">Telefone com DDD</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                className={errors.telefone ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className={errors.cpf ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
            </div>
          </div>

          {/* Order Bumps */}
          <div className="mt-8">
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-6">
              <h2 className="text-lg font-bold text-orange-800">🎉 Você tem ({orderBumps.length}) ofertas!</h2>
            </div>

            <div className="space-y-4">
              {orderBumps.map((bump) => (
                <div key={bump.id}>
                  <Card
                    className={`transition-all border-2 cursor-pointer ${
                      bump.selected ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isLoading && toggleOrderBump(bump.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Image
                            src={bump.image || "/placeholder.svg"}
                            alt={bump.title}
                            width={80}
                            height={80}
                            className="rounded-md"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {bump.percentage}% dos usuários levam junto!
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-gray-800 mb-1">
                            {bump.title.split(":")[0].toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {bump.title.includes(":") ? bump.title.split(":")[1].trim() : bump.title}
                          </p>
                          <div className="text-lg font-bold text-green-600">{formatCurrency(bump.price)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                        <div className="text-red-600 text-xl">➤</div>
                        <div className="flex items-center h-4 w-4">
                          <input
                            type="checkbox"
                            id={`${bump.id}-check`}
                            checked={bump.selected}
                            onChange={() => !isLoading && toggleOrderBump(bump.id)}
                            className="h-4 w-4 cursor-pointer"
                            disabled={isLoading}
                          />
                        </div>
                        <label htmlFor={`${bump.id}-check`} className="font-bold text-red-600 cursor-pointer">
                          {bump.id === "checklist" && "Sim, começar meu estudo!"}
                          {bump.id === "promessas" && "Sim, quero as promessas!"}
                          {bump.id === "parabolas" && "Sim, quero entender melhor!"}
                          {bump.id === "evangelizar" && "Sim, quero compartilhar!"}
                          {bump.id === "caderno" && "Sim, quero organizar!"}
                          {bump.id === "glossario" && "Sim, quero entender com clareza!"}
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Total e Botão de Pagamento */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-2xl font-bold text-green-600 bg-green-50 p-2 rounded-md">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
            {/* Informações de segurança */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium">Liberação imediata!</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>É simples, só usar o aplicativo de seu banco para pagar PIX.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>
                  Super seguro. O pagamento PIX foi desenvolvido pelo Banco Central para facilitar pagamentos.
                </span>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {loadingState === "validating" && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Validando dados...
                </div>
              )}
              {loadingState === "generating" && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando PIX...
                </div>
              )}
              {loadingState === "success" && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  PIX Gerado! Redirecionando...
                </div>
              )}
              {loadingState === "error" && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Tentar Novamente
                </div>
              )}
              {loadingState === "idle" && "Pagar com PIX"}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}
