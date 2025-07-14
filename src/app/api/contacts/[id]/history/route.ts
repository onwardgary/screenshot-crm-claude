import { NextRequest, NextResponse } from 'next/server'
import { contactHistoryOperations } from '@/lib/database'

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

    const history = contactHistoryOperations.getByContactId(contactId)
    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching contact history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact history' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const contactId = parseInt(resolvedParams.id)
    
    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }

    const historyData = await request.json()
    
    const result = contactHistoryOperations.create({
      contact_id: contactId,
      action_type: historyData.action_type,
      old_value: historyData.old_value || null,
      new_value: historyData.new_value || null,
      description: historyData.description
    })

    return NextResponse.json({
      id: result.lastInsertRowid,
      message: 'History entry created successfully'
    })
  } catch (error) {
    console.error('Error creating contact history:', error)
    return NextResponse.json(
      { error: 'Failed to create history entry' },
      { status: 500 }
    )
  }
}