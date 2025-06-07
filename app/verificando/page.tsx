'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerificandoPage() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      const transactionId = localStorage.getItem('transaction_id')
      if (!transactionId) return

      try {
        const response = await fetch(`/api/check-payment?id=${transactionId}`)
        const data = await response.json()

        if (data?.status === 'paid') {
          clearInterval(interval)
          router.push('/upsell')
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen text-xl">
      Verificando pagamento... Aguarde.
    </div>
  )
}
