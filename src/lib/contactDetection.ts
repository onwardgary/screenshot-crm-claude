import { fuzzyMatch } from './smartDetection'

export interface ExistingContact {
  id: number
  name: string
  phone?: string
}

export interface Activity {
  id: number
  person_name: string
  phone?: string
  platform: string
  temperature?: string
}

export interface ContactDetectionResult {
  existingContact?: ExistingContact
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Fetch all existing contacts from the API
 */
export async function fetchExistingContacts(): Promise<ExistingContact[]> {
  try {
    console.log('📡 Fetching existing contacts from /api/contacts...')
    
    // Fetch all contacts by using a large limit for contact detection
    const response = await fetch('/api/contacts?limit=1000')
    console.log('📡 Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Handle new paginated response format
    if (data && data.contacts && Array.isArray(data.contacts)) {
      console.log('🔍 Fetched existing contacts:', data.contacts.length)
      return data.contacts
    } else if (Array.isArray(data)) {
      // Fallback for old response format
      console.log('🔍 Fetched existing contacts (legacy format):', data.length)
      return data
    } else {
      console.error('🚨 Unexpected API response format:', data)
      return []
    }
  } catch (error) {
    console.error('❌ Failed to fetch existing contacts:', error)
    return []
  }
}

/**
 * Find if an existing contact matches the given name and phone
 */
export function findExistingContact(
  groupName: string, 
  groupPhone: string | undefined, 
  existingContacts: ExistingContact[]
): ContactDetectionResult {
  console.log(`🔍 Looking for existing contact: "${groupName}" phone: "${groupPhone}"`)
  console.log(`📊 Searching through ${existingContacts.length} existing contacts`)
  
  for (const contact of existingContacts) {
    // Priority 1: Exact phone match (highest confidence)
    if (groupPhone && contact.phone && groupPhone === contact.phone) {
      console.log(`✅ Found phone match: ${contact.name} (ID: ${contact.id})`)
      return {
        existingContact: contact,
        confidence: 'high',
        reason: 'Same phone number'
      }
    }

    // Priority 2: Exact name match
    if (contact.name.toLowerCase().trim() === groupName.toLowerCase().trim()) {
      // Only if phone is compatible (same or one is missing)
      if (!groupPhone || !contact.phone || groupPhone === contact.phone) {
        console.log(`✅ Found exact name match: ${contact.name} (ID: ${contact.id})`)
        return {
          existingContact: contact,
          confidence: 'high',
          reason: 'Exact name match'
        }
      }
    }

    // Priority 3: Fuzzy name match (only if no phone conflict)
    const similarity = fuzzyMatch(groupName, contact.name)
    if (similarity > 0.7) { // High confidence threshold for existing contact matching
      // Only if phone is compatible
      if (!groupPhone || !contact.phone || groupPhone === contact.phone) {
        console.log(`✅ Found fuzzy match: "${groupName}" -> "${contact.name}" (similarity: ${similarity}, ID: ${contact.id})`)
        return {
          existingContact: contact,
          confidence: similarity > 0.9 ? 'high' : 'medium',
          reason: `Similar name (${Math.round(similarity * 100)}% match)`
        }
      }
    }
  }
  
  console.log(`❌ No existing contact found for: "${groupName}"`)
  return {
    confidence: 'low',
    reason: 'No similar contacts found'
  }
}

/**
 * Detect existing contacts for a group of activities
 */
export function detectExistingContactForActivities(
  activities: Activity[],
  existingContacts: ExistingContact[]
): ContactDetectionResult {
  if (activities.length === 0) {
    return { confidence: 'low', reason: 'No activities provided' }
  }

  // Use the first activity's name and find the most common phone
  const groupName = activities[0].person_name
  
  // Find the most common phone number
  const phoneCount = new Map<string, number>()
  activities.forEach(a => {
    if (a.phone) {
      phoneCount.set(a.phone, (phoneCount.get(a.phone) || 0) + 1)
    }
  })
  
  const groupPhone = Array.from(phoneCount.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  return findExistingContact(groupName, groupPhone, existingContacts)
}