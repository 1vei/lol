import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'timezone')
    .single()

  return NextResponse.json({ timezone: data?.value || 'UTC' })
}

export async function POST(request: NextRequest) {
  const { timezone } = await request.json()

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ key: 'timezone', value: timezone })

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
