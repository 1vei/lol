import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const body = await request.json()
  const { url, title, image_url, comment, tags } = body

  const { data: item } = await supabaseAdmin
    .from('browser_links')
    .select('id')
    .eq('id', params.id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('browser_links')
    .update({
      url,
      title,
      image_url,
      comment,
      tags,
    })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  const { data: item } = await supabaseAdmin
    .from('browser_links')
    .select('id')
    .eq('id', params.id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('browser_links')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
