import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'leads.db')
const db = new Database(dbPath)

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    platform TEXT NOT NULL,
    last_message TEXT,
    last_message_from TEXT,
    timestamp TEXT,
    conversation_summary TEXT,
    lead_score INTEGER,
    notes TEXT,
    conversation_history TEXT DEFAULT '[]',
    merged_from_ids TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Migration: Add new columns if they don't exist
try {
  db.exec(`ALTER TABLE leads ADD COLUMN conversation_history TEXT DEFAULT '[]'`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN merged_from_ids TEXT DEFAULT '[]'`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'active'`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN merged_into_id INTEGER`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN is_group_chat BOOLEAN DEFAULT 0`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN screenshot_id INTEGER`)
} catch {
  // Column already exists, ignore error
}

// Follow-up system columns
try {
  db.exec(`ALTER TABLE leads ADD COLUMN next_followup_date DATE`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN followup_notes TEXT`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN last_contact_attempt DATE`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN contact_attempts INTEGER DEFAULT 0`)
} catch {
  // Column already exists, ignore error
}

try {
  db.exec(`ALTER TABLE leads ADD COLUMN relationship_type TEXT`)
} catch {
  // Column already exists, ignore error
}

db.exec(`
  CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_data TEXT NOT NULL,
    analysis_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export interface ConversationEntry {
  message: string
  from: 'user' | 'contact'
  timestamp: string
  platform: string
}

export interface Lead {
  id?: number
  name: string
  phone?: string
  platform: string
  last_message?: string
  last_message_from?: string
  timestamp?: string
  conversation_summary?: string
  lead_score?: number
  notes?: string
  conversation_history?: ConversationEntry[]
  merged_from_ids?: number[]
  status?: 'raw' | 'active' | 'archived' | 'merged'
  merged_into_id?: number
  is_group_chat?: boolean
  screenshot_id?: number
  created_at?: string
  updated_at?: string
  // Follow-up system for direct sales
  next_followup_date?: string
  followup_notes?: string
  last_contact_attempt?: string
  contact_attempts?: number
  relationship_type?: 'family' | 'friend' | 'stranger' | 'referral' | 'existing_customer'
}

// Lead operations
export const leadOperations = {
  // Insert a new lead
  create: (lead: Omit<Lead, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO leads (name, phone, platform, last_message, last_message_from, timestamp, conversation_summary, lead_score, notes, conversation_history, merged_from_ids, status, merged_into_id, is_group_chat, screenshot_id, next_followup_date, followup_notes, last_contact_attempt, contact_attempts, relationship_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      lead.name,
      lead.phone || null,
      lead.platform,
      lead.last_message || null,
      lead.last_message_from || null,
      lead.timestamp || null,
      lead.conversation_summary || null,
      lead.lead_score || null,
      lead.notes || null,
      JSON.stringify(lead.conversation_history || []),
      JSON.stringify(lead.merged_from_ids || []),
      lead.status || 'active',
      lead.merged_into_id || null,
      lead.is_group_chat ? 1 : 0,
      lead.screenshot_id || null,
      lead.next_followup_date || null,
      lead.followup_notes || null,
      lead.last_contact_attempt || null,
      lead.contact_attempts || 0,
      lead.relationship_type || null
    )
  },

  // Get all leads
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM leads ORDER BY updated_at DESC')
    const rows = stmt.all() as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      conversation_history: JSON.parse((row.conversation_history as string) || '[]'),
      merged_from_ids: JSON.parse((row.merged_from_ids as string) || '[]'),
      is_group_chat: Boolean(row.is_group_chat as number)
    })) as Lead[]
  },

  // Find similar leads (for deduplication)
  findSimilar: (name: string, phone?: string) => {
    let query = 'SELECT * FROM leads WHERE '
    const params: (string | number)[] = []
    
    // Exact phone match (highest priority)
    if (phone) {
      query += 'phone = ? OR '
      params.push(phone)
    }
    
    // Name similarity matching
    const cleanName = name.toLowerCase().trim()
    
    // Exact name match
    query += 'LOWER(name) = ? OR '
    params.push(cleanName)
    
    // Check if one name is contained in another (e.g., "al" in "Alice Lim")
    query += 'LOWER(name) LIKE ? OR LOWER(?) LIKE LOWER(name) OR '
    params.push(`%${cleanName}%`)
    params.push(`%${name}%`)
    
    // Remove the trailing ' OR '
    query = query.slice(0, -4)
    
    const stmt = db.prepare(query)
    const rows = stmt.all(...params) as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      conversation_history: JSON.parse((row.conversation_history as string) || '[]'),
      merged_from_ids: JSON.parse((row.merged_from_ids as string) || '[]'),
      is_group_chat: Boolean(row.is_group_chat as number)
    })) as Lead[]
  },

  // Update lead
  update: (id: number, updates: Partial<Lead>) => {
    const fields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => {
      const value = updates[field as keyof Lead]
      // Stringify JSON fields
      if (field === 'conversation_history' || field === 'merged_from_ids') {
        return JSON.stringify(value || [])
      }
      // Convert boolean to integer for SQLite
      if (field === 'is_group_chat') {
        return value ? 1 : 0
      }
      return value
    })
    
    const stmt = db.prepare(`
      UPDATE leads SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
    return stmt.run(...values, id)
  },

  // Add conversation to history (keep only last 5 entries)
  addConversation: (leadId: number, conversation: ConversationEntry) => {
    const lead = leadOperations.getAll().find(l => l.id === leadId)
    if (!lead) return null
    
    const history = lead.conversation_history || []
    history.unshift(conversation) // Add to beginning
    
    // Keep only last 5 conversations
    const trimmedHistory = history.slice(0, 5)
    
    return leadOperations.update(leadId, {
      conversation_history: trimmedHistory,
      last_message: conversation.message,
      last_message_from: conversation.from,
      timestamp: conversation.timestamp
    })
  },

  // Merge leads
  merge: (targetId: number, sourceIds: number[]) => {
    const target = leadOperations.getAll().find(l => l.id === targetId)
    const sources = sourceIds.map(id => leadOperations.getAll().find(l => l.id === id)).filter(Boolean) as Lead[]
    
    if (!target || sources.length === 0) return null
    
    // Combine conversation histories
    const allHistory = [
      ...(target.conversation_history || []),
      ...sources.flatMap(s => s.conversation_history || [])
    ]
    
    // Sort by timestamp and keep last 5
    const sortedHistory = allHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
    
    // Combine merged_from_ids
    const allMergedIds = [
      ...(target.merged_from_ids || []),
      ...sources.flatMap(s => s.merged_from_ids || []),
      ...sourceIds
    ]
    const uniqueMergedIds = [...new Set(allMergedIds)]
    
    // Update target with merged data
    const mergedData: Partial<Lead> = {
      conversation_history: sortedHistory,
      merged_from_ids: uniqueMergedIds,
      // Use best values from all leads
      phone: target.phone || sources.find(s => s.phone)?.phone,
      lead_score: Math.max(target.lead_score || 0, ...sources.map(s => s.lead_score || 0)),
      // Update with latest conversation data
      last_message: sortedHistory[0]?.message || target.last_message,
      last_message_from: sortedHistory[0]?.from || target.last_message_from,
      timestamp: sortedHistory[0]?.timestamp || target.timestamp
    }
    
    // Update target lead
    leadOperations.update(targetId, mergedData)
    
    // Delete source leads
    sourceIds.forEach(id => leadOperations.delete(id))
    
    return targetId
  },

  // Delete lead
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM leads WHERE id = ?')
    return stmt.run(id)
  },

  // Get leads by status
  getByStatus: (status: 'raw' | 'active' | 'archived' | 'merged') => {
    const stmt = db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY updated_at DESC')
    const rows = stmt.all(status) as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      conversation_history: JSON.parse((row.conversation_history as string) || '[]'),
      merged_from_ids: JSON.parse((row.merged_from_ids as string) || '[]'),
      is_group_chat: Boolean(row.is_group_chat as number)
    })) as Lead[]
  },

  // Update lead status
  updateStatus: (id: number, status: 'raw' | 'active' | 'archived' | 'merged', merged_into_id?: number) => {
    const stmt = db.prepare(`
      UPDATE leads SET status = ?, merged_into_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
    return stmt.run(status, merged_into_id || null, id)
  },

  // Auto-merge suggestion algorithm with confidence scoring
  getMergeSuggestions: (status: 'raw' | 'active' = 'active') => {
    const leads = leadOperations.getByStatus(status).filter(lead => !lead.is_group_chat)
    const suggestions: Array<{
      targetLead: Lead
      duplicateLeads: Lead[]
      confidence: number
      reason: string
    }> = []

    // Track processed leads to avoid duplicate suggestions
    const processed = new Set<number>()

    for (const targetLead of leads) {
      if (processed.has(targetLead.id!)) continue

      const duplicates: Array<{ lead: Lead; confidence: number; reason: string }> = []

      for (const otherLead of leads) {
        if (otherLead.id === targetLead.id || processed.has(otherLead.id!)) continue

        const score = calculateDuplicateScore(targetLead, otherLead)
        
        if (score.confidence >= 60) { // Only suggest if confidence >= 60%
          duplicates.push({
            lead: otherLead,
            confidence: score.confidence,
            reason: score.reason
          })
        }
      }

      if (duplicates.length > 0) {
        // Sort by confidence (highest first)
        duplicates.sort((a, b) => b.confidence - a.confidence)
        
        // Use highest confidence as the overall confidence
        const highestConfidence = duplicates[0].confidence
        
        suggestions.push({
          targetLead,
          duplicateLeads: duplicates.map(d => d.lead),
          confidence: highestConfidence,
          reason: duplicates[0].reason
        })

        // Mark all involved leads as processed
        processed.add(targetLead.id!)
        duplicates.forEach(d => processed.add(d.lead.id!))
      }
    }

    // Sort suggestions by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence)
  },

  // Get leads due for follow-up
  getDueFollowups: () => {
    const today = new Date().toISOString().split('T')[0]
    const stmt = db.prepare(`
      SELECT * FROM leads 
      WHERE next_followup_date IS NOT NULL 
      AND next_followup_date <= ? 
      AND status = 'active'
      ORDER BY next_followup_date ASC, lead_score DESC
    `)
    const rows = stmt.all(today) as Record<string, unknown>[]
    return rows.map(row => ({
      ...row,
      conversation_history: JSON.parse((row.conversation_history as string) || '[]'),
      merged_from_ids: JSON.parse((row.merged_from_ids as string) || '[]'),
      is_group_chat: Boolean(row.is_group_chat as number)
    })) as Lead[]
  },

  // Update follow-up information
  updateFollowup: (id: number, followupData: { next_followup_date?: string; followup_notes?: string }) => {
    const fields = Object.keys(followupData).filter(key => followupData[key as keyof typeof followupData] !== undefined)
    if (fields.length === 0) return null
    
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => followupData[field as keyof typeof followupData])
    
    const stmt = db.prepare(`
      UPDATE leads SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
    return stmt.run(...values, id)
  },

  // Log contact attempt
  logContactAttempt: (id: number, attemptType?: string) => {
    const today = new Date().toISOString().split('T')[0]
    const stmt = db.prepare(`
      UPDATE leads 
      SET last_contact_attempt = ?, 
          contact_attempts = COALESCE(contact_attempts, 0) + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    return stmt.run(today, id)
  },

  // Smart merge for existing leads (preserve manual data, update conversation)
  smartMerge: (leadId: number, conversationUpdate: {
    last_message?: string
    last_message_from?: string
    timestamp?: string
    lead_score?: number
    platform?: string
  }) => {
    const fields = Object.keys(conversationUpdate).filter(key => 
      conversationUpdate[key as keyof typeof conversationUpdate] !== undefined
    )
    
    if (fields.length === 0) return null
    
    // Only update lead_score if new score is higher
    const existingLead = leadOperations.getAll().find(l => l.id === leadId)
    if (existingLead && conversationUpdate.lead_score && existingLead.lead_score) {
      if (conversationUpdate.lead_score <= existingLead.lead_score) {
        delete conversationUpdate.lead_score
        fields.splice(fields.indexOf('lead_score'), 1)
      }
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => conversationUpdate[field as keyof typeof conversationUpdate])
    
    const stmt = db.prepare(`
      UPDATE leads SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
    return stmt.run(...values, leadId)
  },

  // Find existing lead by phone or name for smart merging
  findExistingForMerge: (name: string, phone?: string) => {
    // Prioritize exact phone match
    if (phone) {
      const phoneStmt = db.prepare("SELECT * FROM leads WHERE phone = ? AND status = 'active' LIMIT 1")
      const phoneMatch = phoneStmt.get(phone) as Record<string, unknown> | undefined
      if (phoneMatch) {
        return {
          ...phoneMatch,
          conversation_history: JSON.parse((phoneMatch.conversation_history as string) || '[]'),
          merged_from_ids: JSON.parse((phoneMatch.merged_from_ids as string) || '[]'),
          is_group_chat: Boolean(phoneMatch.is_group_chat as number)
        } as Lead
      }
    }
    
    // Fallback to name similarity (high confidence only)
    const cleanName = name.toLowerCase().trim()
    const nameStmt = db.prepare(`
      SELECT * FROM leads 
      WHERE LOWER(name) = ? 
      AND status = 'active' 
      LIMIT 1
    `)
    const nameMatch = nameStmt.get(cleanName) as Record<string, unknown> | undefined
    
    if (nameMatch) {
      return {
        ...nameMatch,
        conversation_history: JSON.parse((nameMatch.conversation_history as string) || '[]'),
        merged_from_ids: JSON.parse((nameMatch.merged_from_ids as string) || '[]'),
        is_group_chat: Boolean(nameMatch.is_group_chat as number)
      } as Lead
    }
    
    return null
  }
}

// Screenshot operations
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

// Helper function to calculate duplicate score between two leads
function calculateDuplicateScore(lead1: Lead, lead2: Lead): { confidence: number; reason: string } {
  let confidence = 0
  const reasons: string[] = []

  // Phone number matching (highest priority)
  if (lead1.phone && lead2.phone) {
    const phone1 = normalizePhoneNumber(lead1.phone)
    const phone2 = normalizePhoneNumber(lead2.phone)
    
    if (phone1 === phone2) {
      confidence = 100
      reasons.push('Exact phone match')
      return { confidence, reason: reasons.join(', ') }
    }
  }

  // Name similarity matching
  const name1 = lead1.name.toLowerCase().trim()
  const name2 = lead2.name.toLowerCase().trim()
  
  // Normalize names by removing parenthetical additions like "(You)", "(Me)", etc.
  const normalized1 = name1.replace(/\s*\([^)]*\)\s*$/, '').trim()
  const normalized2 = name2.replace(/\s*\([^)]*\)\s*$/, '').trim()

  // Exact name match (original or normalized)
  if (name1 === name2 || normalized1 === normalized2) {
    confidence += 85
    reasons.push(normalized1 === normalized2 ? 'Exact name match (normalized)' : 'Exact name match')
  }
  // Check if one name contains the other (e.g., "John" vs "John Smith")
  else if (name1.includes(name2) || name2.includes(name1) || normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    // Use normalized names for better similarity calculation
    const baseName1 = normalized1 || name1
    const baseName2 = normalized2 || name2
    const similarity = Math.min(baseName1.length, baseName2.length) / Math.max(baseName1.length, baseName2.length)
    confidence += Math.round(80 * similarity) // Increased from 70 to 80 for better matching
    reasons.push('Name similarity')
  }
  // Check for similar names with typos or variations
  else {
    const similarity = calculateNameSimilarity(name1, name2)
    if (similarity > 0.7) {
      confidence += Math.round(60 * similarity)
      reasons.push('Similar names')
    }
  }

  // Platform matching (bonus points for same platform)
  if (lead1.platform === lead2.platform) {
    confidence += 10
    reasons.push('Same platform')
  }

  // Last message similarity (if they have similar conversation patterns)
  if (lead1.last_message && lead2.last_message) {
    const msgSimilarity = calculateMessageSimilarity(lead1.last_message, lead2.last_message)
    if (msgSimilarity > 0.8) {
      confidence += 15
      reasons.push('Similar conversations')
    }
  }

  // Temporal proximity (if created close in time, might be duplicates)
  if (lead1.created_at && lead2.created_at) {
    const timeDiff = Math.abs(new Date(lead1.created_at).getTime() - new Date(lead2.created_at).getTime())
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    
    if (hoursDiff < 24) { // Within 24 hours
      confidence += 5
      reasons.push('Created within 24 hours')
    }
  }

  return {
    confidence: Math.min(confidence, 100), // Cap at 100%
    reason: reasons.length > 0 ? reasons.join(', ') : 'Low similarity'
  }
}

// Helper function to normalize phone numbers for comparison
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '') // Remove all non-digits
}

// Helper function to calculate name similarity using Levenshtein distance
function calculateNameSimilarity(name1: string, name2: string): number {
  const distance = levenshteinDistance(name1, name2)
  const maxLength = Math.max(name1.length, name2.length)
  return maxLength === 0 ? 1 : 1 - (distance / maxLength)
}

// Helper function to calculate message similarity
function calculateMessageSimilarity(msg1: string, msg2: string): number {
  const words1 = msg1.toLowerCase().split(/\s+/)
  const words2 = msg2.toLowerCase().split(/\s+/)
  
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = new Set([...words1, ...words2]).size
  
  return totalWords === 0 ? 0 : commonWords.length / totalWords
}

// Levenshtein distance algorithm for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

export default db