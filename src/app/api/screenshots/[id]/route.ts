import { NextRequest, NextResponse } from 'next/server'
import { screenshotOperations } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const screenshotId = parseInt(resolvedParams.id)
    
    if (isNaN(screenshotId)) {
      return NextResponse.json({ error: 'Invalid screenshot ID' }, { status: 400 })
    }

    const screenshot = screenshotOperations.getById(screenshotId)
    
    if (!screenshot) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 })
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(screenshot.file_data, 'base64')
    
    // Determine content type based on data URL prefix or default to PNG
    let contentType = 'image/png'
    if (screenshot.file_data.startsWith('/9j/')) {
      contentType = 'image/jpeg'
    } else if (screenshot.file_data.startsWith('iVBORw0KGgo')) {
      contentType = 'image/png'
    } else if (screenshot.file_data.startsWith('R0lGOD')) {
      contentType = 'image/gif'
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('Error serving screenshot:', error)
    return NextResponse.json({ error: 'Failed to serve screenshot' }, { status: 500 })
  }
}