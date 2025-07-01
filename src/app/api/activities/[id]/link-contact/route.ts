import { NextRequest, NextResponse } from 'next/server'
import { activityOperations } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activityId = parseInt(params.id)
    const { contactId } = await request.json()
    
    activityOperations.linkToContact(activityId, contactId)
    
    return NextResponse.json({ 
      message: 'Activity linked to contact successfully' 
    })
  } catch (error) {
    console.error('Failed to link activity to contact:', error)
    return NextResponse.json({ error: 'Failed to link activity to contact' }, { status: 500 })
  }
}