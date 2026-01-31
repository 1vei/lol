import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getClientIp, hashIp } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { encrypt, decrypt } from '@/lib/encryption'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const isAdmin = searchParams.get('is_admin') === 'true'

  if (!sessionId) {
    return NextResponse.json({ messages: [] })
  }

  let query = supabaseAdmin
    .from('chat_messages')
    .select('id, content, author_name, session_id, created_at, is_admin, is_private, reply_to, youtube_id, giphy_url, image_url, video_url')
    .order('created_at', { ascending: true })
    .limit(100)

  if (!isAdmin) {
    query = query.or(`is_private.eq.false,session_id.eq.${sessionId}`)
  }

  const { data } = await query

  if (data) {
    const decryptedMessages = data.map(msg => {
      if (msg.is_private) {
        return {
          ...msg,
          content: decrypt(msg.content)
        }
      }
      return msg
    })
    
    return NextResponse.json({ messages: decryptedMessages })
  }

  return NextResponse.json({ messages: [] })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  const { data: banned } = await supabaseAdmin
    .from('ip_bans')
    .select('ip_hash')
    .eq('ip_hash', ipHash)
    .single()

  if (banned) {
    return NextResponse.json({ error: 'You are banned' }, { status: 403 })
  }

  if (!checkRateLimit(ipHash, 10, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await request.json()
  const { 
    content, 
    author_name, 
    session_id,
    is_admin,
    is_private,
    reply_to,
    youtube_id, 
    giphy_url, 
    image_url, 
    video_url 
  } = body

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Content too long' }, { status: 400 })
  }

  if (!session_id) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  const messageContent = is_private ? encrypt(content.trim()) : content.trim()

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      content: messageContent,
      author_name: author_name?.trim() || null,
      ip_hash: ipHash,
      session_id,
      is_admin: is_admin || false,
      is_private: is_private || false,
      reply_to: reply_to || null,
      youtube_id: youtube_id || null,
      giphy_url: giphy_url || null,
      image_url: image_url || null,
      video_url: video_url || null,
    })
    .select('id, content, author_name, session_id, created_at, is_admin, is_private, reply_to, youtube_id, giphy_url, image_url, video_url')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }

  return NextResponse.json(data)
}
