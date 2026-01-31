import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, parent_id, icon_url } = body

    const { data, error } = await supabaseAdmin
      .from('file_manager')
      .insert({
        name,
        type,
        parent_id: parent_id || null,
        icon_url: icon_url || null,
      })
      .select('id, name, type, parent_id, icon_url, created_at')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
