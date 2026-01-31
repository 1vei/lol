import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { processImageAggressive, processThumbnail } from '@/lib/image-processor'
import { isValidUrl } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const reqContentType = request.headers.get('content-type')
    
    if (reqContentType?.includes('application/json')) {
      const { url, caption } = await request.json()
      
      if (!url || !isValidUrl(url)) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }

      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('youtube.com') || url.includes('youtu.be')

      const { data, error } = await supabaseAdmin
        .from('feed_items')
        .insert({
          type: isVideo ? 'video' : 'image',
          url,
          thumbnail_url: null,
          caption: caption || null,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB original
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const isVideo = file.type.startsWith('video/')
    const timestamp = Date.now()
    const fileName = `${timestamp}.webp`

    let processedBuffer: Buffer = buffer
    let thumbnailUrl: string | null = null
    let uploadContentType = file.type

    if (!isVideo) {
      processedBuffer = await processImageAggressive(buffer)
      uploadContentType = 'image/webp'
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from('feed-media')
      .upload(fileName, processedBuffer, {
        contentType: uploadContentType,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('feed-media')
      .getPublicUrl(fileName)

    if (isVideo) {
      const thumbBuffer = await processThumbnail(buffer)
      const thumbFileName = `thumb-${timestamp}.webp`
      
      await supabaseAdmin.storage
        .from('feed-media')
        .upload(thumbFileName, thumbBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        })

      const { data: { publicUrl: thumbUrl } } = supabaseAdmin.storage
        .from('feed-media')
        .getPublicUrl(thumbFileName)
      
      thumbnailUrl = thumbUrl
    }

    const { data, error } = await supabaseAdmin
      .from('feed_items')
      .insert({
        type: isVideo ? 'video' : 'image',
        url: publicUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption || null,
      })
      .select()
      .single()

    if (error) {
      await supabaseAdmin.storage.from('feed-media').remove([fileName])
      if (thumbnailUrl) {
        await supabaseAdmin.storage.from('feed-media').remove([`thumb-${timestamp}.webp`])
      }
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Feed upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
