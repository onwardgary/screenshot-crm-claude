import { NextRequest, NextResponse } from 'next/server'
import { contactOperations, runAutomaticStatusUpdates } from '@/lib/database'
import Database from 'better-sqlite3'
import path from 'path'

// Use the same database path as the main database module
const dbPath = path.join(process.cwd(), 'sales-activity.db')

// Enhanced function to get contacts with auto-calculated metrics
function getContactsWithMetrics(contacts: Record<string, unknown>[]) {
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
      
      // Get screenshot count
      const screenshotCountStmt = db.prepare('SELECT COUNT(*) as count FROM activities WHERE contact_id = ? AND screenshot_id IS NOT NULL')
      const screenshotCount = screenshotCountStmt.get(contact.id) as { count: number }
      
      return {
        ...contact,
        auto_contact_attempts: activityCount.count, // Total engagements (all activities)
        has_two_way_communication: twoWayCount.count > 0,
        latest_temperature: latestActivity?.temperature || 'warm',
        last_contact_date: latestActivity?.created_at || contact.last_contact_date,
        screenshot_count: screenshotCount.count
      }
    })
  } finally {
    // Clean up the database connection
    db.close()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Run automatic status updates before fetching contacts
    runAutomaticStatusUpdates()
    
    const { searchParams } = new URL(request.url)
    
    // Extract all filter parameters
    const status = searchParams.get('status') as 'converted' | 'inactive' | null
    const search = searchParams.get('search')
    const searchType = searchParams.get('searchType') || 'all'
    const relationshipStatus = searchParams.get('relationshipStatus')?.split(',').filter(Boolean)
    const relationshipType = searchParams.get('relationshipType')?.split(',').filter(Boolean)
    const platforms = searchParams.get('platforms')?.split(',').filter(Boolean)
    const temperature = searchParams.get('temperature')?.split(',').filter(Boolean)
    const dateRange = searchParams.get('dateRange')
    const hasTwoWay = searchParams.get('hasTwoWay')
    const hasPhone = searchParams.get('hasPhone')
    const isNew = searchParams.get('isNew') // 'true', 'false', or null
    const isActive = searchParams.get('isActive') // 'true', 'false', or null
    const sort = searchParams.get('sort') || 'updated_at'
    const order = searchParams.get('order') || 'desc'
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    
    // Quick search mode for assignment interface
    const quickSearch = searchParams.get('quickSearch') === 'true'
    const fuzzySearch = searchParams.get('fuzzy') === 'true'
    
    // Get base contacts
    const contacts = status ? contactOperations.getByStatus(status) : contactOperations.getAll()
    
    // Add auto-calculated metrics first
    let enhancedContacts = getContactsWithMetrics(contacts as unknown as Record<string, unknown>[])
    
    // Apply search filter with fuzzy matching
    if (search) {
      const searchLower = search.toLowerCase()
      
      if (fuzzySearch) {
        // Enhanced fuzzy search with relevance scoring
        const contactsWithScore = enhancedContacts.map(contact => {
          const c = contact as Record<string, unknown>
          let score = 0
          let matched = false
          
          const name = (c.name as string) || ''
          const phone = (c.phone as string) || ''
          const notes = (c.notes as string) || ''
          const platforms = (c.platforms as string[]) || []
          
          // Exact match bonus (highest score)
          if (name.toLowerCase() === searchLower) {
            score += 100
            matched = true
          } else if (name.toLowerCase().includes(searchLower)) {
            // Substring match with position bonus
            const index = name.toLowerCase().indexOf(searchLower)
            score += 50 - (index * 2) // Earlier matches score higher
            matched = true
          } else {
            // Fuzzy name matching (word boundaries, initials)
            const nameWords = name.toLowerCase().split(/\s+/)
            const searchWords = searchLower.split(/\s+/)
            
            // Check if any search word starts with any name word
            for (const searchWord of searchWords) {
              for (const nameWord of nameWords) {
                if (nameWord.startsWith(searchWord) && searchWord.length >= 2) {
                  score += 30 - (searchWord.length - nameWord.length) * 2
                  matched = true
                }
                // Check for initials match
                if (searchWord.length === 1 && nameWord.startsWith(searchWord)) {
                  score += 20
                  matched = true
                }
              }
            }
            
            // Check for acronym match (first letters)
            const initials = nameWords.map(word => word[0]).join('')
            if (initials.includes(searchLower)) {
              score += 25
              matched = true
            }
          }
          
          // Phone number matching (only when search contains digits)
          const searchDigits = searchLower.replace(/\D/g, '')
          if (phone && searchDigits.length > 0 && phone.replace(/\D/g, '').includes(searchDigits)) {
            score += 40
            matched = true
          }
          
          // Notes matching (lower priority)
          if (notes.toLowerCase().includes(searchLower)) {
            score += 15
            matched = true
          }
          
          // Platform matching
          if (platforms.some((p: string) => p.toLowerCase().includes(searchLower))) {
            score += 10
            matched = true
          }
          
          return { contact, score, matched }
        })
        
        // Filter to only matched contacts and sort by relevance score
        enhancedContacts = contactsWithScore
          .filter(item => item.matched)
          .sort((a, b) => b.score - a.score)
          .map(item => item.contact)
      } else {
        // Standard substring search (legacy behavior)
        enhancedContacts = enhancedContacts.filter(contact => {
          const c = contact as Record<string, unknown>
          switch (searchType) {
            case 'name':
              return (c.name as string)?.toLowerCase().includes(searchLower)
            case 'phone':
              return c.phone && (c.phone as string).toLowerCase().includes(searchLower)
            case 'notes':
              return c.notes && (c.notes as string).toLowerCase().includes(searchLower)
            case 'platforms':
              return c.platforms && (c.platforms as string[]).some((p: string) => p.toLowerCase().includes(searchLower))
            case 'all':
            default:
              return (c.name as string)?.toLowerCase().includes(searchLower) ||
                (c.phone && (c.phone as string).toLowerCase().includes(searchLower)) ||
                (c.notes && (c.notes as string).toLowerCase().includes(searchLower)) ||
                (c.platforms && (c.platforms as string[]).some((p: string) => p.toLowerCase().includes(searchLower)))
          }
        })
      }
    }
    
    // Apply relationship status filter (in addition to the status parameter)
    if (relationshipStatus && relationshipStatus.length > 0) {
      enhancedContacts = enhancedContacts.filter(contact => 
        relationshipStatus.includes((contact as Record<string, unknown>).relationship_status as string || 'new')
      )
    }
    
    // Apply relationship type filter
    if (relationshipType && relationshipType.length > 0) {
      enhancedContacts = enhancedContacts.filter(contact => 
        (contact as Record<string, unknown>).relationship_type && relationshipType.includes((contact as Record<string, unknown>).relationship_type as string)
      )
    }
    
    // Apply platform filter
    if (platforms && platforms.length > 0) {
      enhancedContacts = enhancedContacts.filter(contact => 
        (contact as Record<string, unknown>).platforms && ((contact as Record<string, unknown>).platforms as string[]).some((p: string) => 
          platforms.includes(p.toLowerCase())
        )
      )
    }
    
    // Apply temperature filter
    if (temperature && temperature.length > 0) {
      enhancedContacts = enhancedContacts.filter(contact => 
        contact.latest_temperature && temperature.includes(contact.latest_temperature)
      )
    }
    
    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let cutoffDate: Date
      
      switch (dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          cutoffDate = new Date(0) // All time
      }
      
      enhancedContacts = enhancedContacts.filter(contact => {
        if (!(contact as Record<string, unknown>).last_contact_date) return false
        const contactDate = new Date((contact as Record<string, unknown>).last_contact_date as string)
        return contactDate >= cutoffDate
      })
    }
    
    // Apply two-way communication filter
    if (hasTwoWay === 'yes') {
      enhancedContacts = enhancedContacts.filter(contact => contact.has_two_way_communication)
    } else if (hasTwoWay === 'no') {
      enhancedContacts = enhancedContacts.filter(contact => !contact.has_two_way_communication)
    }
    
    // Apply phone filter
    if (hasPhone === 'yes') {
      enhancedContacts = enhancedContacts.filter(contact => (contact as Record<string, unknown>).phone)
    } else if (hasPhone === 'no') {
      enhancedContacts = enhancedContacts.filter(contact => !(contact as Record<string, unknown>).phone)
    }
    
    // Apply is_new filter
    if (isNew === 'true') {
      enhancedContacts = enhancedContacts.filter(contact => (contact as Record<string, unknown>).is_new)
    } else if (isNew === 'false') {
      enhancedContacts = enhancedContacts.filter(contact => !(contact as Record<string, unknown>).is_new)
    }
    
    // Apply is_active filter
    if (isActive === 'true') {
      enhancedContacts = enhancedContacts.filter(contact => (contact as Record<string, unknown>).is_active)
    } else if (isActive === 'false') {
      enhancedContacts = enhancedContacts.filter(contact => !(contact as Record<string, unknown>).is_active)
    }
    
    // Apply sorting
    enhancedContacts.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      switch (sort) {
        case 'name':
          aValue = (a as Record<string, unknown>).name as string || ''
          bValue = (b as Record<string, unknown>).name as string || ''
          break
        case 'last_contact_date':
          aValue = new Date((a as Record<string, unknown>).last_contact_date as string || 0).getTime()
          bValue = new Date((b as Record<string, unknown>).last_contact_date as string || 0).getTime()
          break
        case 'auto_contact_attempts':
          aValue = a.auto_contact_attempts || 0
          bValue = b.auto_contact_attempts || 0
          break
        case 'created_at':
          aValue = new Date((a as Record<string, unknown>).created_at as string || 0).getTime()
          bValue = new Date((b as Record<string, unknown>).created_at as string || 0).getTime()
          break
        case 'latest_temperature':
          // Sort by temperature priority: hot > warm > cold
          const tempPriority = { hot: 3, warm: 2, cold: 1 }
          aValue = tempPriority[a.latest_temperature as keyof typeof tempPriority] || 0
          bValue = tempPriority[b.latest_temperature as keyof typeof tempPriority] || 0
          break
        case 'updated_at':
        default:
          aValue = new Date((a as Record<string, unknown>).updated_at as string || (a as Record<string, unknown>).created_at as string || 0).getTime()
          bValue = new Date((b as Record<string, unknown>).updated_at as string || (b as Record<string, unknown>).created_at as string || 0).getTime()
          break
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    
    // Apply pagination
    const totalContacts = enhancedContacts.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedContacts = enhancedContacts.slice(startIndex, endIndex)
    const hasMore = endIndex < totalContacts
    
    // For quick search, return simplified format without pagination metadata
    if (quickSearch) {
      // Return only essential fields for assignment interface
      const simplifiedContacts = paginatedContacts.map(contact => ({
        id: (contact as Record<string, unknown>).id,
        name: (contact as Record<string, unknown>).name,
        phone: (contact as Record<string, unknown>).phone,
        platforms: (contact as Record<string, unknown>).platforms,
        auto_contact_attempts: contact.auto_contact_attempts,
        latest_temperature: contact.latest_temperature
      }))
      
      return NextResponse.json(simplifiedContacts)
    }
    
    // Return full paginated response with metadata
    return NextResponse.json({
      contacts: paginatedContacts,
      pagination: {
        page,
        limit,
        total: totalContacts,
        hasMore,
        totalPages: Math.ceil(totalContacts / limit)
      }
    })
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