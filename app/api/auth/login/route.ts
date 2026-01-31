import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const isValid = await verifyPassword(password)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
