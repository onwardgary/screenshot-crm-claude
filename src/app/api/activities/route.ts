import { NextRequest, NextResponse } from 'next/server'
import { activityOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organized = searchParams.get('organized')
    
    // If organized=false, return only unorganized activities
    if (organized === 'false') {
      const activities = activityOperations.getUnorganized()
      return NextResponse.json(activities)
    }
    
    // Default: return all activities
    const activities = activityOperations.getAll()
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const activity = await request.json()
    const result = activityOperations.create(activity)
    
    return NextResponse.json({ 
      id: result.lastInsertRowid,
      message: 'Activity created successfully' 
    })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}