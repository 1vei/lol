import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

async function deleteFileFromStorage(url: string, bucket: string) {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const fileName = pathParts[pathParts.length - 1]
    
    if (fileName) {
      await supabaseAdmin.storage.from(bucket).remove([fileName])
    }
  } catch (error) {
    console.error('Error deleting file from storage:', error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: item } = await supabaseAdmin
    .from('feed_items')
    .select('url, thumbnail_url')
    .eq('id', id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Only delete from storage if it's an uploaded file (not external URL)
  if (item.url && item.url.includes('supabase.co')) {
    await deleteFileFromStorage(item.url, 'feed-media')
  }

  if (item.thumbnail_url && item.thumbnail_url.includes('supabase.co')) {
    await deleteFileFromStorage(item.thumbnail_url, 'feed-media')
  }

  const { error } = await supabaseAdmin
    .from('feed_items')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
