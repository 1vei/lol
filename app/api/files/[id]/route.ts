import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

async function deleteFileFromStorage(fileUrl: string | null) {
  if (!fileUrl) return
  
  try {
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/')
    const fileName = pathParts[pathParts.length - 1]
    
    if (fileName && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      await supabaseAdmin.storage.from('file-manager').remove([fileName])
    }
  } catch (error) {
    console.error('Error deleting file from storage:', error)
  }
}

async function deleteChildFiles(parentId: string) {
  const { data: children } = await supabaseAdmin
    .from('file_manager')
    .select('id, type, file_url')
    .eq('parent_id', parentId)
  
  if (children) {
    for (const child of children) {
      if (child.type === 'folder') {
        await deleteChildFiles(child.id)
      } else if (child.file_url) {
        await deleteFileFromStorage(child.file_url)
      }
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: item } = await supabaseAdmin
    .from('file_manager')
    .select('type, file_url')
    .eq('id', id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  if (item.type === 'folder') {
    await deleteChildFiles(id)
  } else if (item.file_url) {
    await deleteFileFromStorage(item.file_url)
  }

  const { error } = await supabaseAdmin
    .from('file_manager')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
