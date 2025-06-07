import { NextResponse } from 'next/server'
import { POST as CreatePaymentPOST } from '../create-payment/route'

export const POST = CreatePaymentPOST

export function GET() {
  return NextResponse.json({ message: 'Use POST para gerar Pix.' })
}
