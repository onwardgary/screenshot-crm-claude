import { NextRequest, NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const leadId = parseInt(resolvedParams.id)
    
    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { next_followup_date, followup_notes } = body

    // Validate date format if provided
    if (next_followup_date && !/^\d{4}-\d{2}-\d{2}$/.test(next_followup_date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Update follow-up information
    const result = leadOperations.updateFollowup(leadId, {
      next_followup_date,
      followup_notes
    })

    if (result && result.changes === 0) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Follow-up updated successfully',
      leadId,
      next_followup_date,
      followup_notes
    })

  } catch (error) {
    console.error('Error updating follow-up:', error)
    return NextResponse.json(
      { error: 'Failed to update follow-up' },
      { status: 500 }
    )
  }
}