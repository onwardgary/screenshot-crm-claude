import { NextRequest, NextResponse } from 'next/server'
import { activityOperations } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const updates = await request.json()
    
    const result = activityOperations.update(id, updates)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Activity updated successfully',
      changes: result.changes
    })
  } catch (error) {
    console.error('Failed to update activity:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

// Add PATCH handler for Smart Organize compatibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PATCH and PUT do the same thing for activity updates
  return PUT(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    
    const result = activityOperations.delete(id)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Activity deleted successfully',
      changes: result.changes
    })
  } catch (error) {
    console.error('Failed to delete activity:', error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}