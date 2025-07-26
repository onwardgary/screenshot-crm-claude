import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'sales-activity.db')
const db = new Database(dbPath)

// Create activities table (screenshots processed)
db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screenshot_id INTEGER,
    person_name TEXT NOT NULL,
    phone TEXT,
    platform TEXT NOT NULL,
    message_content TEXT,
    message_from TEXT,
    timestamp TEXT,
    temperature TEXT DEFAULT 'warm', -- hot, warm, cold
    notes TEXT,
    is_group_chat BOOLEAN DEFAULT 0,
    contact_id INTEGER, -- Links to contacts table when organized
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Add temperature column to existing tables
try {
  db.exec(`ALTER TABLE activities ADD COLUMN temperature TEXT DEFAULT 'warm'`)
} catch {
  // Column already exists
}

// Add two-way communication column to existing tables
try {
  db.exec(`ALTER TABLE activities ADD COLUMN is_two_way_communication BOOLEAN DEFAULT 0`)
} catch {
  // Column already exists
}

// Create contacts table (organized people/relationships)
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    platforms TEXT DEFAULT '[]', -- JSON array of platforms they use
    relationship_status TEXT DEFAULT NULL, -- null=prospect, converted=customer, inactive=dormant
    relationship_type TEXT, -- family, friend
    last_contact_date DATE,
    contact_attempts INTEGER DEFAULT 0,
    response_rate REAL DEFAULT 0,
    notes TEXT,
    is_new BOOLEAN DEFAULT 1, -- Time-based: first 7 days
    is_active BOOLEAN DEFAULT 0, -- Engagement-based: has two-way communication
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Add new columns to existing table if they don't exist
try {
  db.exec(`ALTER TABLE contacts ADD COLUMN is_new BOOLEAN DEFAULT 1`)
} catch {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE contacts ADD COLUMN is_active BOOLEAN DEFAULT 0`)
} catch {
  // Column already exists
}

// Contact history table for tracking changes
db.exec(`
  CREATE TABLE IF NOT EXISTS contact_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`)

// Screenshots table (unchanged)
db.exec(`
  CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_data TEXT NOT NULL,
    analysis_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// New data model interfaces
export interface Activity {
  id?: number
  screenshot_id?: number
  person_name: string
  phone?: string
  platform: string
  message_content?: string
  message_from?: string
  timestamp?: string
  temperature?: 'hot' | 'warm' | 'cold'
  notes?: string
  is_group_chat?: boolean
  is_two_way_communication?: boolean
  contact_id?: number // Links to organized contact
  created_at?: string
  updated_at?: string
}

export interface Contact {
  id?: number
  name: string
  phone?: string
  platforms?: string[] // Array of platforms they use
  relationship_status?: 'converted' | 'inactive' | null // Business outcome: null=prospect, converted=customer, inactive=dormant
  relationship_type?: 'family' | 'friend'
  last_contact_date?: string
  contact_attempts?: number // Total activities (activities linked to this contact)
  response_rate?: number
  notes?: string
  is_new?: boolean // Time-based: first 7 days after creation
  is_active?: boolean // Engagement-based: has two-way communication
  created_at?: string
  updated_at?: string
}

export interface ContactHistory {
  id?: number
  contact_id: number
  action_type: 'customer_conversion' | 'status_change' | 'bulk_operation' | 'created'
  old_value?: string
  new_value?: string
  description: string
  created_at?: string
}

// Activity operations
export const activityOperations = {
  // Create new activity from screenshot
  create: (activity: Omit<Activity, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO activities (screenshot_id, person_name, phone, platform, message_content, message_from, timestamp, temperature, notes, is_group_chat, is_two_way_communication, contact_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      activity.screenshot_id || null,
      activity.person_name,
      activity.phone || null,
      activity.platform,
      activity.message_content || null,
      activity.message_from || null,
      activity.timestamp || null,
      activity.temperature || 'warm',
      activity.notes || null,
      activity.is_group_chat ? 1 : 0,
      activity.is_two_way_communication ? 1 : 0,
      activity.contact_id || null
    )
  },

  // Get all activities
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM activities ORDER BY created_at DESC')
    const rows = stmt.all() as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      is_group_chat: Boolean(row.is_group_chat as number)
    })) as Activity[]
  },

  // Get unorganized activities (not linked to contact)
  getUnorganized: () => {
    const stmt = db.prepare('SELECT * FROM activities WHERE contact_id IS NULL ORDER BY created_at DESC')
    const rows = stmt.all() as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      is_group_chat: Boolean(row.is_group_chat as number)
    })) as Activity[]
  },

  // Link activity to contact
  linkToContact: (activityId: number, contactId: number) => {
    const stmt = db.prepare('UPDATE activities SET contact_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    return stmt.run(contactId, activityId)
  },

  // Update activity
  update: (id: number, updates: Partial<Activity>) => {
    const fields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => {
      const value = updates[field as keyof Activity]
      if (field === 'is_group_chat') {
        return value ? 1 : 0
      }
      return value
    })
    
    const stmt = db.prepare(`UPDATE activities SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    return stmt.run(...values, id)
  },

  // Delete activity
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM activities WHERE id = ?')
    return stmt.run(id)
  }
}

// Contact operations
export const contactOperations = {
  // Create new contact
  create: (contact: Omit<Contact, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO contacts (name, phone, platforms, relationship_status, relationship_type, last_contact_date, contact_attempts, response_rate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      contact.name,
      contact.phone || null,
      JSON.stringify(contact.platforms || []),
      contact.relationship_status || 'new',
      contact.relationship_type || null,
      contact.last_contact_date || null,
      contact.contact_attempts || 0,
      contact.response_rate || 0,
      contact.notes || null
    )
  },

  // Get all contacts
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM contacts ORDER BY updated_at DESC')
    const rows = stmt.all() as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      platforms: JSON.parse((row.platforms as string) || '[]')
    })) as Contact[]
  },

  // Get contacts by status
  getByStatus: (status: 'new' | 'active' | 'converted' | 'inactive') => {
    const stmt = db.prepare('SELECT * FROM contacts WHERE relationship_status = ? ORDER BY updated_at DESC')
    const rows = stmt.all(status) as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      platforms: JSON.parse((row.platforms as string) || '[]')
    })) as Contact[]
  },

  // Update contact
  update: (id: number, updates: Partial<Contact>) => {
    const fields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => {
      const value = updates[field as keyof Contact]
      if (field === 'platforms') {
        return JSON.stringify(value || [])
      }
      return value
    })
    
    const stmt = db.prepare(`UPDATE contacts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    return stmt.run(...values, id)
  },

  // Delete contact
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?')
    return stmt.run(id)
  },


  // Log contact attempt
  logContactAttempt: (id: number) => {
    const today = new Date().toISOString().split('T')[0]
    const stmt = db.prepare(`
      UPDATE contacts 
      SET last_contact_date = ?, 
          contact_attempts = COALESCE(contact_attempts, 0) + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    return stmt.run(today, id)
  },

  // Update is_new field based on 7-day rule
  updateIsNewStatus: () => {
    const stmt = db.prepare(`
      UPDATE contacts 
      SET is_new = CASE 
        WHEN created_at >= datetime('now', '-7 days') THEN 1
        ELSE 0
      END,
      updated_at = CURRENT_TIMESTAMP
    `)
    return stmt.run()
  },

  // Update is_active field based on two-way communication
  updateIsActiveStatus: () => {
    const stmt = db.prepare(`
      UPDATE contacts 
      SET is_active = CASE
        WHEN EXISTS (
          SELECT 1 FROM activities a 
          WHERE a.contact_id = contacts.id 
          AND a.message_from = 'contact'
        ) THEN 1
        ELSE 0
      END,
      updated_at = CURRENT_TIMESTAMP
    `)
    return stmt.run()
  },

  // Update contacts with no activity for 1+ month to "inactive" relationship_status
  updateInactiveContacts: () => {
    const stmt = db.prepare(`
      UPDATE contacts 
      SET relationship_status = 'inactive', 
          updated_at = CURRENT_TIMESTAMP
      WHERE relationship_status IS NULL  -- Only prospects, not customers
      AND (
        last_contact_date < datetime('now', '-30 days') OR
        (last_contact_date IS NULL AND created_at < datetime('now', '-30 days'))
      )
    `)
    return stmt.run()
  }
}

// Screenshot operations (unchanged)
export const screenshotOperations = {
  // Insert a new screenshot
  create: (filename: string, fileData: string, analysisResult?: string) => {
    const stmt = db.prepare(`
      INSERT INTO screenshots (filename, file_data, analysis_result)
      VALUES (?, ?, ?)
    `)
    return stmt.run(filename, fileData, analysisResult || null)
  },

  // Get screenshot by ID
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM screenshots WHERE id = ?')
    return stmt.get(id) as { id: number; filename: string; file_data: string; analysis_result?: string; created_at: string } | undefined
  },

  // Get all screenshots
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM screenshots ORDER BY created_at DESC')
    return stmt.all() as { id: number; filename: string; file_data: string; analysis_result?: string; created_at: string }[]
  }
}

// Analytics operations for dashboard
export const analyticsOperations = {
  // Get activity metrics
  getActivityMetrics: (days: number = 7) => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]
    
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT screenshot_id) as screenshots_processed,
        COUNT(DISTINCT person_name) as unique_people,
        COUNT(CASE WHEN is_group_chat = 0 THEN 1 END) as individual_conversations,
        COUNT(CASE WHEN is_group_chat = 1 THEN 1 END) as group_conversations,
        platform,
        COUNT(*) as platform_count
      FROM activities 
      WHERE created_at >= ?
      GROUP BY platform
    `)
    
    return stmt.all(sinceStr)
  },

  // Get contact metrics
  getContactMetrics: () => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN relationship_status = 'new' THEN 1 END) as new_contacts,
        COUNT(CASE WHEN relationship_status = 'active' THEN 1 END) as active_contacts,
        COUNT(CASE WHEN relationship_status = 'converted' THEN 1 END) as converted_contacts,
        COUNT(CASE WHEN relationship_status = 'inactive' THEN 1 END) as inactive_contacts,
        AVG(contact_attempts) as avg_contact_attempts,
        AVG(response_rate) as avg_response_rate
      FROM contacts
    `)
    
    return stmt.get()
  },

  // Get activity streaks
  getActivityStreak: () => {
    const stmt = db.prepare(`
      SELECT DATE(created_at) as activity_date, COUNT(*) as daily_count
      FROM activities
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY activity_date DESC
    `)
    
    return stmt.all()
  }
}

// Contact history operations
export const contactHistoryOperations = {
  // Create new history entry
  create: (history: Omit<ContactHistory, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO contact_history (contact_id, action_type, old_value, new_value, description)
      VALUES (?, ?, ?, ?, ?)
    `)
    return stmt.run(
      history.contact_id,
      history.action_type,
      history.old_value || null,
      history.new_value || null,
      history.description
    )
  },

  // Get history for a contact
  getByContactId: (contactId: number) => {
    const stmt = db.prepare(`
      SELECT * FROM contact_history 
      WHERE contact_id = ? 
      ORDER BY created_at DESC
    `)
    return stmt.all(contactId) as ContactHistory[]
  },

  // Get all history entries
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM contact_history ORDER BY created_at DESC')
    return stmt.all() as ContactHistory[]
  },

  // Delete history for a contact (when contact is deleted)
  deleteByContactId: (contactId: number) => {
    const stmt = db.prepare('DELETE FROM contact_history WHERE contact_id = ?')
    return stmt.run(contactId)
  }
}

// Migration script for transitioning to separate fields system
export const migrateToSeparateFieldsSystem = () => {
  console.log('Starting migration to separate fields system...')
  
  try {
    // Step 1: Calculate is_new field based on created_at
    const updateIsNewStmt = db.prepare(`
      UPDATE contacts 
      SET is_new = CASE 
        WHEN created_at >= datetime('now', '-7 days') THEN 1
        ELSE 0
      END
    `)
    const isNewResult = updateIsNewStmt.run()
    console.log(`Updated is_new field for ${isNewResult.changes} contacts`)
    
    // Step 2: Calculate is_active field based on two-way communication
    const updateIsActiveStmt = db.prepare(`
      UPDATE contacts 
      SET is_active = CASE
        WHEN EXISTS (
          SELECT 1 FROM activities a 
          WHERE a.contact_id = contacts.id 
          AND a.message_from = 'contact'
        ) THEN 1
        ELSE 0
      END
    `)
    const isActiveResult = updateIsActiveStmt.run()
    console.log(`Updated is_active field for ${isActiveResult.changes} contacts`)
    
    // Step 3: Convert old relationship_status to new system
    const migrateStatusStmt = db.prepare(`
      UPDATE contacts 
      SET relationship_status = CASE 
        WHEN relationship_status = 'converted' THEN 'converted'
        WHEN relationship_status = 'dormant' THEN 'inactive'
        WHEN relationship_status = 'inactive' THEN 'inactive'
        ELSE NULL  -- 'new' and 'active' become null (prospects)
      END
    `)
    const statusResult = migrateStatusStmt.run()
    console.log(`Migrated relationship_status for ${statusResult.changes} contacts`)
    
    console.log('Migration to separate fields system completed successfully!')
    
    return {
      success: true,
      isNewUpdated: isNewResult.changes,
      isActiveUpdated: isActiveResult.changes,
      statusMigrated: statusResult.changes
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      error: error
    }
  }
}

// Function to run automatic status updates (call this regularly)
export const runAutomaticStatusUpdates = () => {
  try {
    const isNewResult = contactOperations.updateIsNewStatus()
    const isActiveResult = contactOperations.updateIsActiveStatus()
    const inactiveResult = contactOperations.updateInactiveContacts()
    
    return {
      success: true,
      isNewUpdated: isNewResult.changes,
      isActiveUpdated: isActiveResult.changes,
      inactiveUpdated: inactiveResult.changes
    }
  } catch (error) {
    console.error('Automatic status updates failed:', error)
    return {
      success: false,
      error: error
    }
  }
}

export default db