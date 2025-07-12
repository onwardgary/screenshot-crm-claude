import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const contactId = parseInt(resolvedParams.id)
    
    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }

    // Fetch all activities for this contact, ordered by creation date (newest first)
    const stmt = db.prepare(`
      SELECT * FROM activities 
      WHERE contact_id = ? 
      ORDER BY created_at DESC
    `)
    
    const rows = stmt.all(contactId) as Record<string, unknown>[]
    const activities = rows.map(row => ({
      ...row,
      is_group_chat: Boolean(row.is_group_chat as number)
    }))

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching contact activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact activities' },
      { status: 500 }
    )
  }
}