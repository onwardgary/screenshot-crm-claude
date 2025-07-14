'use client'

import { useState, useEffect } from 'react'
import { X, Users, AlertCircle, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { findSimilarNames, fuzzyMatch } from '@/lib/smartDetection'

interface ExistingContact {
  id: number
  name: string
  phone?: string
}
import { useToast } from '@/hooks/use-toast'

interface Activity {
  id: number
  person_name: string
  phone?: string
  platform: string
  temperature: string
  message_content?: string
  timestamp?: string
  created_at?: string
}

interface ContactGroup {
  name: string
  activities: Activity[]
  suggestedMerges?: string[]
  phone?: string
  temperature: string
  existingContact?: ExistingContact // Will link to existing contact instead of creating new
}

interface Props {
  isOpen: boolean
  onClose: () => void
  activities: Activity[]
  onComplete: () => void
}

export default function SmartOrganizeModal({ isOpen, onClose, activities, onComplete }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [existingContacts, setExistingContacts] = useState<ExistingContact[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && activities.length > 0) {
      analyzeActivitiesWithContacts()
    }
  }, [isOpen, activities]) // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeActivitiesWithContacts = async () => {
    setIsAnalyzing(true)
    
    // First fetch existing contacts
    const existingContactsData = await fetchExistingContactsSync()
    
    // Then analyze with the fresh data
    analyzeActivities(existingContactsData)
  }

  const fetchExistingContactsSync = async (): Promise<ExistingContact[]> => {
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
      let contacts: ExistingContact[]
      if (data && data.contacts && Array.isArray(data.contacts)) {
        contacts = data.contacts
        console.log('🔍 Fetched existing contacts:', contacts.length, contacts)
      } else if (Array.isArray(data)) {
        // Fallback for old response format
        contacts = data
        console.log('🔍 Fetched existing contacts (legacy format):', contacts.length, contacts)
      } else {
        console.error('🚨 Unexpected API response format:', data)
        contacts = []
      }
      
      setExistingContacts(contacts)
      return contacts
    } catch (error) {
      console.error('❌ Failed to fetch existing contacts:', error)
      setExistingContacts([])
      return []
    }
  }

  const findExistingContact = (groupName: string, groupPhone?: string, contactsList?: ExistingContact[]): ExistingContact | undefined => {
    const contactsToSearch = contactsList || existingContacts
    console.log(`🔍 Looking for existing contact: "${groupName}" phone: "${groupPhone}"`)
    console.log(`📊 Searching through ${contactsToSearch.length} existing contacts`)
    
    for (const contact of contactsToSearch) {
      // Priority 1: Exact phone match (highest confidence)
      if (groupPhone && contact.phone && groupPhone === contact.phone) {
        console.log(`✅ Found phone match: ${contact.name} (ID: ${contact.id})`)
        return contact
      }

      // Priority 2: Exact name match
      if (contact.name.toLowerCase().trim() === groupName.toLowerCase().trim()) {
        // Only if phone is compatible (same or one is missing)
        if (!groupPhone || !contact.phone || groupPhone === contact.phone) {
          console.log(`✅ Found exact name match: ${contact.name} (ID: ${contact.id})`)
          return contact
        }
      }

      // Priority 3: Fuzzy name match (only if no phone conflict)
      const similarity = fuzzyMatch(groupName, contact.name)
      if (similarity > 0.7) { // High confidence threshold for existing contact matching
        // Only if phone is compatible
        if (!groupPhone || !contact.phone || groupPhone === contact.phone) {
          console.log(`✅ Found fuzzy match: "${groupName}" -> "${contact.name}" (similarity: ${similarity}, ID: ${contact.id})`)
          return contact
        }
      }
    }
    
    console.log(`❌ No existing contact found for: "${groupName}"`)
    return undefined
  }

  const analyzeActivities = async (existingContactsData: ExistingContact[]) => {
    
    // Group activities by person name (case-insensitive)
    const groups = new Map<string, Activity[]>()
    
    activities.forEach(activity => {
      const normalizedName = activity.person_name.toLowerCase().trim()
      let foundGroup = false
      
      // Check if this activity can join any existing group
      for (const [groupName, groupActivities] of groups.entries()) {
        // CRITICAL: Check phone number compatibility first
        const groupPhone = groupActivities.find(a => a.phone)?.phone
        
        // If both activity and group have phone numbers, they must match
        if (activity.phone && groupPhone && activity.phone !== groupPhone) {
          continue // Skip this group - different phone numbers
        }
        
        // Check name similarity only after phone compatibility
        const similarity = fuzzyMatch(normalizedName, groupName.toLowerCase())
        if (similarity > 0.6) {
          groupActivities.push(activity)
          foundGroup = true
          break
        }
      }
      
      if (!foundGroup) {
        groups.set(activity.person_name, [activity])
      }
    })
    
    // Convert to ContactGroup array and find potential merges
    const groupArray: ContactGroup[] = []
    const allNames = Array.from(groups.keys())
    
    for (const [name, activities] of groups.entries()) {
      // Find the most common phone number
      const phoneCount = new Map<string, number>()
      activities.forEach(a => {
        if (a.phone) {
          phoneCount.set(a.phone, (phoneCount.get(a.phone) || 0) + 1)
        }
      })
      const phone = Array.from(phoneCount.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0]
      
      // Determine overall temperature (most frequent)
      const tempCount = new Map<string, number>()
      activities.forEach(a => {
        tempCount.set(a.temperature, (tempCount.get(a.temperature) || 0) + 1)
      })
      const temperature = Array.from(tempCount.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'warm'
      
      // Find similar names (using 60% threshold)
      const similarNames = findSimilarNames(name, allNames, 0.6)
        .slice(0, 3)
      
      // Check if this group matches an existing contact
      const existingContact = findExistingContact(name, phone, existingContactsData)
      
      groupArray.push({
        name,
        activities,
        suggestedMerges: similarNames.length > 0 ? similarNames : undefined,
        phone,
        temperature,
        existingContact
      })
    }
    
    // Sort by number of activities (most active first)
    groupArray.sort((a, b) => b.activities.length - a.activities.length)
    
    setContactGroups(groupArray)
    setSelectedGroups(new Set(groupArray.map(g => g.name)))
    setIsAnalyzing(false)
  }


  const toggleGroup = (name: string) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(name)) {
      newSelected.delete(name)
    } else {
      newSelected.add(name)
    }
    setSelectedGroups(newSelected)
  }

  const toggleExpanded = (name: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedGroups(newExpanded)
  }

  const expandAll = () => {
    setExpandedGroups(new Set(contactGroups.map(g => g.name)))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  const formatTimestamp = (timestamp?: string, createdAt?: string) => {
    const dateStr = timestamp || createdAt
    if (!dateStr) return ''
    
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const handleOrganize = async () => {
    setIsProcessing(true)
    
    try {
      const selectedGroupData = contactGroups.filter(g => selectedGroups.has(g.name))
      let linkedCount = 0
      let createdCount = 0
      
      // Process each selected group
      for (const group of selectedGroupData) {
        let contactId: number
        
        if (group.existingContact) {
          // Link to existing contact
          console.log(`🔗 Linking "${group.name}" to existing contact: ${group.existingContact.name} (ID: ${group.existingContact.id})`)
          contactId = group.existingContact.id
          linkedCount++
        } else {
          // Create new contact
          console.log(`➕ Creating new contact: "${group.name}"`)
          const contactRes = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: group.name,
              phone: group.phone,
              temperature: group.temperature,
              notes: `Auto-organized from ${group.activities.length} activities`
            })
          })
          
          if (!contactRes.ok) throw new Error('Failed to create contact')
          
          const contact = await contactRes.json()
          contactId = contact.id
          createdCount++
        }
        
        // Update all activities to link to this contact
        for (const activity of group.activities) {
          await fetch(`/api/activities/${activity.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: contactId })
          })
        }
      }
      
      const totalActivities = selectedGroupData.reduce((sum, g) => sum + g.activities.length, 0)
      let description = `Organized ${totalActivities} activities. `
      if (createdCount > 0) description += `Created ${createdCount} new contacts. `
      if (linkedCount > 0) description += `Linked to ${linkedCount} existing contacts.`
      
      toast({
        title: "Successfully organized!",
        description: description.trim()
      })
      
      onComplete()
      onClose()
    } catch (error) {
      console.error('Error organizing contacts:', error)
      toast({
        title: "Error organizing contacts",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Smart Organize to Contacts</h2>
              <p className="text-gray-600 mt-1">
                Automatically group activities by person and create contacts
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
                <p className="text-gray-600">Analyzing activities and finding patterns...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Smart Detection Results:</p>
                        <p>Found {contactGroups.length} unique contacts from {activities.length} activities.</p>
                        <p>Similar names have been grouped together automatically.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={expandAll}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Expand All
                    </button>
                    <button
                      onClick={collapseAll}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Minimize2 className="w-4 h-4" />
                      Collapse All
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {contactGroups.map((group) => (
                    <motion.div
                      key={group.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`
                        border rounded-lg transition-all
                        ${selectedGroups.has(group.name) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => toggleExpanded(group.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedGroups.has(group.name)}
                              onChange={() => {}}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleGroup(group.name)
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <h3 className="font-semibold text-lg">{group.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>{group.activities.length} {group.activities.length === 1 ? 'activity' : 'activities'}</span>
                                {group.phone && <span>📱 {group.phone}</span>}
                                <span className="capitalize">
                                  {group.temperature === 'hot' && '🔥'}
                                  {group.temperature === 'warm' && '🌡️'}
                                  {group.temperature === 'cold' && '❄️'}
                                  {' '}{group.temperature}
                                </span>
                                {group.existingContact && (
                                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                                    Link to: {group.existingContact.name}
                                  </span>
                                )}
                                {!group.existingContact && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                    Create new
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                Platforms: {Array.from(new Set(group.activities.map(a => a.platform))).join(', ')}
                              </div>
                              {group.suggestedMerges && (
                                <div className="text-xs text-orange-600 mt-1">
                                  Similar to: {group.suggestedMerges.join(', ')}
                                </div>
                              )}
                            </div>
                            <motion.div
                              animate={{ rotate: expandedGroups.has(group.name) ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedGroups.has(group.name) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0">
                              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <p className="text-xs text-gray-500 font-medium mb-2">Activities to be merged:</p>
                                {group.activities.map((activity, idx) => (
                                  <div key={idx} className="bg-white rounded p-2 text-sm border border-gray-200">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium capitalize">{activity.platform}</span>
                                          <span className="text-gray-400">•</span>
                                          <span className="text-gray-600">{formatTimestamp(activity.timestamp, activity.created_at)}</span>
                                          <span className="text-gray-400">•</span>
                                          <span className="font-medium text-blue-700">{activity.person_name}</span>
                                          <span className="capitalize">
                                            {activity.temperature === 'hot' && '🔥'}
                                            {activity.temperature === 'warm' && '🌡️'}
                                            {activity.temperature === 'cold' && '❄️'}
                                          </span>
                                        </div>
                                        {activity.message_content && (
                                          <p className="text-gray-600 truncate">&ldquo;{activity.message_content}&rdquo;</p>
                                        )}
                                        {activity.phone && (
                                          <p className="text-xs text-gray-500 mt-1">📱 {activity.phone}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {(() => {
                  const selectedGroupData = contactGroups.filter(g => selectedGroups.has(g.name))
                  const totalActivities = selectedGroupData.reduce((sum, g) => sum + g.activities.length, 0)
                  const linkCount = selectedGroupData.filter(g => g.existingContact).length
                  const createCount = selectedGroupData.filter(g => !g.existingContact).length
                  
                  let text = `${totalActivities} activities will be organized`
                  if (createCount > 0) text += ` • ${createCount} new contacts`
                  if (linkCount > 0) text += ` • ${linkCount} linked to existing`
                  
                  return text
                })()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleOrganize}
                  disabled={selectedGroups.size === 0 || isProcessing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Organizing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <div className="flex flex-col items-center">
                        <span className="text-base font-medium">
                          Organize {(() => {
                            const selectedGroupData = contactGroups.filter(g => selectedGroups.has(g.name))
                            return selectedGroupData.reduce((sum, g) => sum + g.activities.length, 0)
                          })()} activities
                        </span>
                        <span className="text-xs opacity-75">
                          {(() => {
                            const selectedGroupData = contactGroups.filter(g => selectedGroups.has(g.name))
                            const createCount = selectedGroupData.filter(g => !g.existingContact).length
                            const linkCount = selectedGroupData.filter(g => g.existingContact).length
                            
                            if (createCount > 0 && linkCount > 0) {
                              return `${createCount} new • ${linkCount} linked`
                            } else if (createCount > 0) {
                              return `${createCount} new contacts`
                            } else if (linkCount > 0) {
                              return `${linkCount} linked`
                            }
                            return ''
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}