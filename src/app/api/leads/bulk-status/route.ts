import { NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function PUT(request: Request) {
  try {
    const { leadIds, status } = await request.json()

    // Validate input
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs array is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['raw', 'active', 'archived', 'merged']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update all leads
    const results = []
    const errors = []

    for (const leadId of leadIds) {
      try {
        const id = parseInt(leadId)
        if (isNaN(id)) {
          errors.push(`Invalid lead ID: ${leadId}`)
          continue
        }

        const result = leadOperations.updateStatus(id, status)
        if (result.changes === 0) {
          errors.push(`Lead not found: ${id}`)
        } else {
          results.push(id)
        }
      } catch (error) {
        errors.push(`Failed to update lead ${leadId}: ${error}`)
      }
    }

    return NextResponse.json({
      message: `Updated ${results.length} leads to ${status}`,
      updated: results,
      errors: errors,
      totalRequested: leadIds.length,
      totalUpdated: results.length
    })
  } catch (error) {
    console.error('Error in bulk status update:', error)
    return NextResponse.json({ error: 'Failed to update lead statuses' }, { status: 500 })
  }
}