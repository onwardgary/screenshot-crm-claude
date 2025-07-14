import { NextRequest, NextResponse } from 'next/server'
import { contactOperations, contactHistoryOperations, activityOperations } from '@/lib/database'

export async function DELETE(request: NextRequest) {
  try {
    const { contactIds } = await request.json()
    
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Invalid contact IDs provided' }, { status: 400 })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each contact
    for (const contactId of contactIds) {
      try {
        // First, unlink any activities associated with this contact
        // (Set their contact_id to NULL instead of deleting the activities)
        const activities = activityOperations.getAll()
        const linkedActivities = activities.filter(a => a.contact_id === contactId)
        
        for (const activity of linkedActivities) {
          activityOperations.update(activity.id!, { contact_id: undefined })
        }

        // Delete contact history
        contactHistoryOperations.deleteByContactId(contactId)

        // Delete the contact
        const deleteResult = contactOperations.delete(contactId)

        if (deleteResult.changes > 0) {
          successCount++
        } else {
          errors.push(`Contact ${contactId} not found or already deleted`)
          errorCount++
        }
      } catch (error) {
        console.error(`Error deleting contact ${contactId}:`, error)
        errors.push(`Error deleting contact ${contactId}`)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk delete completed`,
      results: {
        total: contactIds.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      }
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk delete' },
      { status: 500 }
    )
  }
}