import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { processImage } from '@/lib/image-processor'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const parentId = formData.get('parent_id') as string
    const iconUrl = formData.get('icon_url') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const maxSize = 15 * 1024 * 1024 // 15MB original
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const isImage = file.type.startsWith('image/')
    const timestamp = Date.now()
    const ext = isImage ? 'webp' : file.name.split('.').pop()
    const fileName = `${timestamp}.${ext}`

    let processedBuffer: Buffer = buffer
    let contentType = file.type

    if (isImage) {
      processedBuffer = await processImage(buffer)
      contentType = 'image/webp'
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from('file-manager')
      .upload(fileName, processedBuffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('file-manager')
      .getPublicUrl(fileName)

    const { data, error } = await supabaseAdmin
      .from('file_manager')
      .insert({
        name: file.name,
        type: 'file',
        parent_id: parentId || null,
        file_url: publicUrl,
        icon_url: iconUrl || null,
        mime_type: contentType,
        size: processedBuffer.length,
      })
      .select()
      .single()

    if (error) {
      await supabaseAdmin.storage.from('file-manager').remove([fileName])
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
