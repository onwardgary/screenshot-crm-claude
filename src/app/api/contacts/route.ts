import { NextRequest, NextResponse } from 'next/server'
import { contactOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'new' | 'active' | 'converted' | 'dormant' | null
    
    let contacts
    if (status) {
      contacts = contactOperations.getByStatus(status)
    } else {
      contacts = contactOperations.getAll()
    }
    
    // For now, return contacts without auto-calculated metrics to avoid database conflicts
    // We'll add the metrics calculation later after ensuring it works
    const enhancedContacts = contacts.map(contact => ({
      ...contact,
      auto_contact_attempts: contact.contact_attempts || 0,
      has_two_way_communication: false, // Default for now
      latest_temperature: 'warm', // Default for now
      last_contact_date: contact.last_contact_date
    }))
    
    return NextResponse.json(enhancedContacts)
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contact = await request.json()
    const result = contactOperations.create(contact)
    
    return NextResponse.json({ 
      id: result.lastInsertRowid,
      message: 'Contact created successfully' 
    })
  } catch (error) {
    console.error('Failed to create contact:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}