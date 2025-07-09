import { NextRequest, NextResponse } from 'next/server'
import { contactOperations } from '@/lib/database'
import Database from 'better-sqlite3'
import path from 'path'

// Use the same database path as the main database module
const dbPath = path.join(process.cwd(), 'sales-activity.db')

// Enhanced function to get contacts with auto-calculated metrics
function getContactsWithMetrics(contacts: any[]) {
  // Create a separate database connection for this operation
  const db = new Database(dbPath)
  
  try {
    return contacts.map(contact => {
      // Get activity count for this contact
      const activityCountStmt = db.prepare('SELECT COUNT(*) as count FROM activities WHERE contact_id = ?')
      const activityCount = activityCountStmt.get(contact.id) as { count: number }
      
      // Check for two-way communication (contact has replied)
      const twoWayStmt = db.prepare('SELECT COUNT(*) as count FROM activities WHERE contact_id = ? AND message_from = ?')
      const twoWayCount = twoWayStmt.get(contact.id, 'contact') as { count: number }
      
      // Get latest activity for temperature and last contact date
      const latestActivityStmt = db.prepare('SELECT temperature, created_at FROM activities WHERE contact_id = ? ORDER BY created_at DESC LIMIT 1')
      const latestActivity = latestActivityStmt.get(contact.id) as { temperature: string, created_at: string } | undefined
      
      return {
        ...contact,
        auto_contact_attempts: activityCount.count, // Total engagements (all activities)
        has_two_way_communication: twoWayCount.count > 0,
        latest_temperature: latestActivity?.temperature || 'warm',
        last_contact_date: latestActivity?.created_at || contact.last_contact_date
      }
    })
  } finally {
    // Clean up the database connection
    db.close()
  }
}

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
    
    // Add auto-calculated metrics
    const enhancedContacts = getContactsWithMetrics(contacts)
    
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