import { NextRequest, NextResponse } from 'next/server'
import { activityOperations } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const updates = await request.json()
    
    activityOperations.update(id, updates)
    
    return NextResponse.json({ message: 'Activity updated successfully' })
  } catch (error) {
    console.error('Failed to update activity:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    activityOperations.delete(id)
    
    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Failed to delete activity:', error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}