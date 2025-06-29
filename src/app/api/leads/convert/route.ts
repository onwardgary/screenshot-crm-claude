import { NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json()
    
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Update lead to contact type with conversion date
    const result = leadOperations.update(leadId, {
      contact_type: 'contact',
      conversion_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    })

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Lead converted to contact successfully',
      leadId 
    })
  } catch (error) {
    console.error('Error converting lead to contact:', error)
    return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 })
  }
}