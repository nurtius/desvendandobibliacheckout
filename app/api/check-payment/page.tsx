
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function CheckPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState("Verificando pagamento...")

  const transactionId = searchParams.get("id")

  useEffect(() => {
    if (!transactionId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(\`/api/check-payment?id=\${transactionId}\`)
        const data = await response.json()

        if (data.status === "paid") {
          console.log("✅ Pagamento confirmado, redirecionando para upsell...")
          clearInterval(interval)
          router.push("/upsell")
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [transactionId])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">Aguardando Confirmação do Pagamento</h1>
      <p>{status}</p>
      <div className="mt-6 animate-pulse text-sm text-gray-500">Isso pode levar alguns segundos...</div>
    </div>
  )
}
