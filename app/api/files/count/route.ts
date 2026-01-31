import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const { count } = await supabaseAdmin
    .from('file_manager')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'file')

  return NextResponse.json({ count: count || 0 })
}
