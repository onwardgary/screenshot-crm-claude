import { NextRequest, NextResponse } from 'next/server'
import { activityOperations } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { activityIds, contactId } = await request.json()
    
    // Validate input
    if (!Array.isArray(activityIds) || activityIds.length === 0) {
      return NextResponse.json({ error: 'activityIds must be a non-empty array' }, { status: 400 })
    }
    
    if (!contactId || typeof contactId !== 'number') {
      return NextResponse.json({ error: 'contactId must be a valid number' }, { status: 400 })
    }
    
    // Track successful assignments
    let successCount = 0
    const errors: { activityId: number; error: string }[] = []
    
    // Assign each activity to the contact
    for (const activityId of activityIds) {
      try {
        activityOperations.linkToContact(activityId, contactId)
        successCount++
      } catch (error) {
        console.error(`Failed to link activity ${activityId} to contact ${contactId}:`, error)
        errors.push({
          activityId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Return success response with details
    return NextResponse.json({
      success: true,
      successCount,
      totalRequested: activityIds.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully assigned ${successCount} of ${activityIds.length} activities to contact`
    })
  } catch (error) {
    console.error('Bulk assignment error:', error)
    return NextResponse.json({ 
      error: 'Failed to assign activities to contact',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}