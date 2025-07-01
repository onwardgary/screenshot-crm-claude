import { NextRequest, NextResponse } from 'next/server'
import { contactOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'new' | 'active' | 'converted' | 'dormant' | null
    
    if (status) {
      const contacts = contactOperations.getByStatus(status)
      return NextResponse.json(contacts)
    }
    
    const contacts = contactOperations.getAll()
    return NextResponse.json(contacts)
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