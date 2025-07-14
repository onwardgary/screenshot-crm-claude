import { NextRequest, NextResponse } from 'next/server'
import { contactOperations, contactHistoryOperations } from '@/lib/database'

export async function PUT(request: NextRequest) {
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
        // Get current contact to log old status
        const contacts = contactOperations.getAll()
        const contact = contacts.find(c => c.id === contactId)
        
        if (!contact) {
          errors.push(`Contact ${contactId} not found`)
          errorCount++
          continue
        }

        const oldStatus = contact.relationship_status || 'new'

        // Update contact to customer status
        const updateResult = contactOperations.update(contactId, {
          relationship_status: 'converted'
        })

        if (updateResult.changes > 0) {
          // Log history entry for the conversion
          contactHistoryOperations.create({
            contact_id: contactId,
            action_type: 'customer_conversion',
            old_value: oldStatus,
            new_value: 'converted',
            description: `Marked as customer via bulk operation (${contactIds.length} contacts selected)`
          })

          successCount++
        } else {
          errors.push(`Failed to update contact ${contactId}`)
          errorCount++
        }
      } catch (error) {
        console.error(`Error processing contact ${contactId}:`, error)
        errors.push(`Error processing contact ${contactId}`)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk customer conversion completed`,
      results: {
        total: contactIds.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      }
    })

  } catch (error) {
    console.error('Bulk customer conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk customer conversion' },
      { status: 500 }
    )
  }
}