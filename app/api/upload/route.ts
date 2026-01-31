import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { processImage } from '@/lib/image-processor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const isImage = file.type.startsWith('image/')
    
    let finalBuffer: Buffer = buffer
    let finalType = file.type
    let finalName = file.name

    if (isImage && !file.type.includes('gif')) {
      try {
        const processed = await processImage(buffer)
        finalBuffer = Buffer.from(processed)
        finalType = 'image/webp'
        finalName = file.name.replace(/\.[^.]+$/, '.webp')
      } catch (error) {
        console.error('Image processing failed, using original:', error)
      }
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${finalName}`
    const filePath = `uploads/${fileName}`

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, finalBuffer, {
        contentType: finalType,
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
