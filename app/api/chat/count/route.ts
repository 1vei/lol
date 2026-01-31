import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isAdmin = searchParams.get('is_admin') === 'true'
  const sessionId = searchParams.get('session_id')

  if (isAdmin) {
    // Admin sees all messages
    const { count } = await supabaseAdmin
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
    
    return NextResponse.json({ count: count || 0 })
  } else {
    // Regular users see public messages + their own private messages
    if (!sessionId) {
      return NextResponse.json({ count: 0 })
    }

    const { count: publicCount } = await supabaseAdmin
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_private', false)
    
    const { count: privateCount } = await supabaseAdmin
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_private', true)
      .eq('session_id', sessionId)
    
    const total = (publicCount || 0) + (privateCount || 0)
    return NextResponse.json({ count: total })
  }
}
