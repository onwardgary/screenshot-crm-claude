import { NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'raw' | 'active' || 'raw'

    const suggestions = leadOperations.getMergeSuggestions(status)

    return NextResponse.json({
      suggestions,
      count: suggestions.length,
      highConfidenceCount: suggestions.filter(s => s.confidence >= 90).length,
      mediumConfidenceCount: suggestions.filter(s => s.confidence >= 70 && s.confidence < 90).length,
      lowConfidenceCount: suggestions.filter(s => s.confidence >= 60 && s.confidence < 70).length
    })
  } catch (error) {
    console.error('Error getting merge suggestions:', error)
    return NextResponse.json({ error: 'Failed to get merge suggestions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    if (action === 'accept') {
      // This would implement auto-accepting a merge suggestion
      // For now, we'll just return success - the actual merge will be handled by the existing merge endpoint
      return NextResponse.json({ message: 'Suggestion accepted. Use the merge endpoint to complete the merge.' })
    } else if (action === 'dismiss') {
      // This could be enhanced to store dismissed suggestions to avoid re-suggesting
      return NextResponse.json({ message: 'Suggestion dismissed' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing suggestion action:', error)
    return NextResponse.json({ error: 'Failed to process suggestion' }, { status: 500 })
  }
}