import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ title: url }, { status: 200 })
    }

    const html = await response.text()
    
    // Try to extract title from various meta tags
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
    const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i)
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)

    const title = ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleMatch?.[1] || url

    return NextResponse.json({ title: title.trim() })
  } catch (error) {
    console.error('Error fetching title:', error)
    return NextResponse.json({ title: url }, { status: 200 })
  }
}
