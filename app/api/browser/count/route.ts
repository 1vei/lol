import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const { count } = await supabaseAdmin
    .from('browser_links')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({ count: count || 0 })
}
