import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url, title, image_url, comment, tags } = body

  const { data, error } = await supabaseAdmin
    .from('browser_links')
    .insert({
      url,
      title,
      image_url,
      comment,
      tags: tags || [],
    })
    .select('id, url, title, image_url, comment, tags, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }

  return NextResponse.json(data)
}
