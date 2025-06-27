import { NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const leadId = parseInt(resolvedParams.id)
    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 })
    }

    const { status, merged_into_id } = await request.json()

    // Validate status
    const validStatuses = ['raw', 'active', 'archived', 'merged']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update lead status
    const result = leadOperations.updateStatus(leadId, status, merged_into_id)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: `Lead status updated to ${status}`,
      id: leadId,
      status: status
    })
  } catch (error) {
    console.error('Error updating lead status:', error)
    return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 })
  }
}