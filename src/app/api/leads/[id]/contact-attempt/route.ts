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

    // Log contact attempt
    const result = leadOperations.logContactAttempt(leadId)

    if (result && result.changes === 0) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Contact attempt logged successfully',
      leadId,
      timestamp: new Date().toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Error logging contact attempt:', error)
    return NextResponse.json(
      { error: 'Failed to log contact attempt' },
      { status: 500 }
    )
  }
}