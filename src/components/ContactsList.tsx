'use client'

import { useEffect, useState, useCallback } from 'react'
import { ContactFilterState } from '@/components/ContactFilters'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import ContactActivityTimeline from '@/components/ContactActivityTimeline'
import ContactHistoryTimeline from '@/components/ContactHistoryTimeline'
import ScreenshotModal from '@/components/ScreenshotModal'
import LoadMoreButton from '@/components/LoadMoreButton'
import ContactCardSkeleton from '@/components/ContactCardSkeleton'
import ContactEditForm from '@/components/ContactEditForm'
import { 
  Phone, 
  Users,
  ArrowLeftRight,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  Image,
  Edit2
} from 'lucide-react'

interface Activity {
  id: number
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
  contact_id?: number
  created_at: string
  updated_at?: string
}

interface ContactHistory {
  id: number
  contact_id: number
  action_type: 'customer_conversion' | 'status_change' | 'bulk_operation' | 'created'
  old_value?: string
  new_value?: string
  description: string
  created_at: string
}

interface Contact {
  id: number
  name: string
  phone?: string
  platforms?: string[]
  relationship_status?: 'converted' | 'inactive' | null
  relationship_type?: 'family' | 'friend'
  last_contact_date?: string
  contact_attempts?: number
  response_rate?: number
  notes?: string
  created_at: string
  updated_at?: string
  // New auto-calculated fields
  auto_contact_attempts?: number
  has_two_way_communication?: boolean
  latest_temperature?: 'hot' | 'warm' | 'cold'
  days_since_last_contact?: number
  screenshot_count?: number
  // New separate status fields
  is_new?: boolean
  is_active?: boolean
}

interface ContactsListProps {
  statusFilter?: 'converted' | 'inactive' | null
  filters?: ContactFilterState
  onSelectionChange?: (selectedIds: number[], selectedContacts: Contact[]) => void
  selectedIds?: number[]
  refreshTrigger?: number // Increment this to force refresh
}

export default function ContactsList({ statusFilter, filters, onSelectionChange, selectedIds = [], refreshTrigger }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    hasMore: false,
    totalPages: 0
  })
  const [expandedContactId, setExpandedContactId] = useState<number | null>(null)
  const [contactActivities, setContactActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [screenshotModalId, setScreenshotModalId] = useState<number | null>(null)
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set())
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const { toast } = useToast()

  // Sync selectedContacts with external selectedIds
  useEffect(() => {
    setSelectedContacts(new Set(selectedIds))
  }, [selectedIds])

  // Mobile detection and responsive page size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update pagination limit based on screen size
  useEffect(() => {
    const newLimit = isMobile ? 10 : 15
    if (pagination.limit !== newLimit) {
      setPagination(prev => ({ ...prev, limit: newLimit }))
    }
  }, [isMobile, pagination.limit])

  const toggleSelection = (contactId: number) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
    const selectedContactObjects = contacts.filter(c => newSelected.has(c.id!))
    onSelectionChange?.(Array.from(newSelected), selectedContactObjects)
  }

  const toggleSelectAll = () => {
    if (selectedContacts.size === contacts.length && contacts.length > 0) {
      // Deselect all
      setSelectedContacts(new Set())
      onSelectionChange?.([], [])
    } else {
      // Select all
      const allIds = new Set(contacts.map(c => c.id!))
      setSelectedContacts(allIds)
      onSelectionChange?.(Array.from(allIds), contacts)
    }
  }

  const fetchContacts = useCallback(async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setContacts([]) // Clear contacts when starting fresh
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    
    try {
      const params = new URLSearchParams()
      
      // Add pagination parameters
      params.append('page', page.toString())
      params.append('limit', pagination.limit.toString())
      
      // Add legacy status filter for backward compatibility
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      
      // Add new filter parameters
      if (filters) {
        if (filters.search) {
          params.append('search', filters.search)
          params.append('searchType', filters.searchType)
        }
        if (filters.relationshipStatus.length > 0) params.append('relationshipStatus', filters.relationshipStatus.join(','))
        if (filters.relationshipType.length > 0) params.append('relationshipType', filters.relationshipType.join(','))
        if (filters.platforms.length > 0) params.append('platforms', filters.platforms.join(','))
        if (filters.temperature.length > 0) params.append('temperature', filters.temperature.join(','))
        if (filters.dateRange && filters.dateRange !== 'all') params.append('dateRange', filters.dateRange)
        if (filters.hasTwoWay && filters.hasTwoWay !== 'all') params.append('hasTwoWay', filters.hasTwoWay)
        if (filters.hasPhone && filters.hasPhone !== 'all') params.append('hasPhone', filters.hasPhone)
        if (filters.isNew !== null) params.append('isNew', filters.isNew.toString())
        if (filters.isActive !== null) params.append('isActive', filters.isActive.toString())
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.order) params.append('order', filters.order)
      }
      
      const url = `/api/contacts?${params.toString()}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fetched contacts data:', data)
      
      // Handle new paginated response format
      if (data && data.contacts && Array.isArray(data.contacts)) {
        if (append) {
          setContacts(prev => [...prev, ...data.contacts])
        } else {
          setContacts(data.contacts)
        }
        setPagination(data.pagination)
      } else {
        console.error('Expected paginated response but got:', typeof data, data)
        setContacts([])
        toast({
          title: "Error loading contacts",
          description: "Invalid data format received from server",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      if (!append) {
        setContacts([])
      }
      toast({
        title: "Error loading contacts", 
        description: "Failed to load contacts. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [statusFilter, filters, toast, pagination.limit])

  // Function to refresh all loaded contacts without resetting pagination
  const refreshAllContacts = useCallback(async () => {
    if (pagination.page === 1) {
      // If we're only on page 1, just refresh normally
      fetchContacts(1, false)
      return
    }

    setLoading(true)
    const allContacts: Contact[] = []
    
    try {
      // Fetch all pages from 1 to current page
      for (let page = 1; page <= pagination.page; page++) {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', pagination.limit.toString())
        
        // Add legacy status filter for backward compatibility
        if (statusFilter) {
          params.append('status', statusFilter)
        }
        
        // Add new filter parameters
        if (filters) {
          if (filters.search) {
            params.append('search', filters.search)
            params.append('searchType', filters.searchType)
          }
          if (filters.relationshipStatus.length > 0) params.append('relationshipStatus', filters.relationshipStatus.join(','))
          if (filters.relationshipType.length > 0) params.append('relationshipType', filters.relationshipType.join(','))
          if (filters.platforms.length > 0) params.append('platforms', filters.platforms.join(','))
          if (filters.temperature.length > 0) params.append('temperature', filters.temperature.join(','))
          if (filters.dateRange && filters.dateRange !== 'all') params.append('dateRange', filters.dateRange)
          if (filters.hasTwoWay && filters.hasTwoWay !== 'all') params.append('hasTwoWay', filters.hasTwoWay)
          if (filters.hasPhone && filters.hasPhone !== 'all') params.append('hasPhone', filters.hasPhone)
          if (filters.isNew !== null) params.append('isNew', filters.isNew.toString())
          if (filters.isActive !== null) params.append('isActive', filters.isActive.toString())
          if (filters.sort) params.append('sort', filters.sort)
          if (filters.order) params.append('order', filters.order)
        }
        
        const url = `/api/contacts?${params.toString()}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        if (data && data.contacts && Array.isArray(data.contacts)) {
          allContacts.push(...data.contacts)
          // Update pagination with latest data (from the last page fetched)
          if (page === pagination.page) {
            setPagination(data.pagination)
          }
        }
      }
      
      setContacts(allContacts)
    } catch (error) {
      console.error('Failed to refresh all contacts:', error)
      toast({
        title: "Error refreshing contacts", 
        description: "Failed to refresh contacts. Please reload the page.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, filters, toast, pagination.limit, pagination.page, fetchContacts])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts, filters, refreshTrigger]) // Add refreshTrigger as dependency

  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchContacts(pagination.page + 1, true)
    }
  }

  const handleMarkAsCustomer = async (contactId: number) => {
    try {
      // Get current contact to log old status
      const contact = contacts.find(c => c.id === contactId)
      const oldStatus = contact?.relationship_status || null

      // Update contact status
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          relationship_status: 'converted'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Log history entry
      const historyResponse = await fetch(`/api/contacts/${contactId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'customer_conversion',
          old_value: oldStatus,
          new_value: 'converted',
          description: 'Marked as customer'
        })
      })

      if (!historyResponse.ok) {
        console.warn('Failed to log history entry, but contact update succeeded')
      }
      
      toast({
        title: "Contact converted",
        description: "Contact has been marked as a customer"
      })
      
      refreshAllContacts() // Refresh all loaded contacts
    } catch (error) {
      console.error('Failed to mark as customer:', error)
      toast({
        title: "Error",
        description: "Failed to mark contact as customer",
        variant: "destructive"
      })
    }
  }

  const handleRemoveCustomer = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          relationship_status: null // Set back to prospect (null instead of 'active')
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      toast({
        title: "Customer status removed",
        description: "Contact has been changed back to prospect"
      })
      
      refreshAllContacts() // Refresh all loaded contacts
    } catch (error) {
      console.error('Failed to remove customer status:', error)
      toast({
        title: "Error",
        description: "Failed to remove customer status",
        variant: "destructive"
      })
    }
  }


  const getStatusBadges = (contact: Contact) => {
    const badges = []
    
    // New badge (time-based)
    if (contact.is_new) {
      badges.push(
        <Badge key="new" className="bg-blue-100 text-blue-800">NEW</Badge>
      )
    }
    
    // Active badge (engagement-based)
    if (contact.is_active) {
      badges.push(
        <Badge key="active" className="bg-green-100 text-green-800">ACTIVE</Badge>
      )
    }
    
    // Business status badges
    if (contact.relationship_status === 'converted') {
      badges.push(
        <Badge key="customer" className="bg-purple-100 text-purple-800 flex items-center gap-1">
          <Star className="w-3 h-3" />
          CUSTOMER
        </Badge>
      )
    } else if (contact.relationship_status === 'inactive') {
      badges.push(
        <Badge key="inactive" className="bg-gray-100 text-gray-800">INACTIVE</Badge>
      )
    }
    
    return badges
  }

  const getTemperatureBadge = (temperature?: string) => {
    switch (temperature) {
      case 'hot':
        return <Badge className="bg-red-100 text-red-800">🔥 HOT</Badge>
      case 'warm':
        return <Badge className="bg-orange-100 text-orange-800">🌡️ WARM</Badge>
      case 'cold':
        return <Badge className="bg-blue-100 text-blue-800">❄️ COLD</Badge>
      default:
        return <Badge className="bg-orange-100 text-orange-800">🌡️ WARM</Badge>
    }
  }

  const getCommunicationBadge = (hasTwoWay?: boolean) => {
    if (hasTwoWay) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <ArrowLeftRight className="w-3 h-3" />
          Two-Way
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          One-Way
        </Badge>
      )
    }
  }



  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    try {
      // Use only date parts to avoid hydration mismatches
      const date = new Date(dateString)
      const now = new Date()
      
      // Normalize to date only (remove time component)
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const diffTime = Math.abs(nowOnly.getTime() - dateOnly.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return '1 day ago'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    } catch {
      return 'Unknown'
    }
  }

  const handleContactClick = async (contactId: number) => {
    if (expandedContactId === contactId) {
      // Collapse if already expanded
      setExpandedContactId(null)
      setContactActivities([])
      setContactHistory([])
    } else {
      // Expand and fetch activities and history
      setExpandedContactId(contactId)
      setActivitiesLoading(true)
      setHistoryLoading(true)
      
      try {
        // Fetch activities and history in parallel
        const [activitiesResponse, historyResponse] = await Promise.all([
          fetch(`/api/contacts/${contactId}/activities`),
          fetch(`/api/contacts/${contactId}/history`)
        ])
        
        // Handle activities response
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json()
          setContactActivities(activities)
        } else {
          console.error('Failed to fetch contact activities')
          setContactActivities([])
        }
        
        // Handle history response
        if (historyResponse.ok) {
          const history = await historyResponse.json()
          setContactHistory(history)
        } else {
          console.error('Failed to fetch contact history')
          setContactHistory([])
        }
      } catch (error) {
        console.error('Error fetching contact data:', error)
        setContactActivities([])
        setContactHistory([])
      } finally {
        setActivitiesLoading(false)
        setHistoryLoading(false)
      }
    }
  }

  const handleViewScreenshot = (screenshotId: number) => {
    setScreenshotModalId(screenshotId)
    setIsScreenshotModalOpen(true)
  }

  const handleCloseScreenshotModal = () => {
    setIsScreenshotModalOpen(false)
    setScreenshotModalId(null)
  }

  const handleEditContact = (contactId: number) => {
    setEditingContactId(contactId)
  }

  const handleCancelEdit = () => {
    setEditingContactId(null)
  }

  const handleSaveContact = (contactId: number, updates: Partial<Contact>) => {
    // Update local state optimistically
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, ...updates }
          : contact
      )
    )
    
    // Exit edit mode
    setEditingContactId(null)
    
    // Refresh all loaded contacts to get updated data from server
    refreshAllContacts()
  }



  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
        </div>
        <ContactCardSkeleton count={5} />
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {statusFilter ? `No ${statusFilter} contacts` : 'No contacts yet'}
        </h3>
        <p className="text-muted-foreground mb-4">
          Organize activities into contacts to start building relationships
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {contacts.length > 0 && (
            <Checkbox
              checked={selectedContacts.size === contacts.length}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all contacts"
            />
          )}
          <h2 className="text-xl font-semibold">
            {statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Contacts` : 'All Contacts'}
          </h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </div>
      </div>

      <div className="grid gap-3">
        {contacts.map((contact) => (
          <Card 
            key={contact.id} 
            className={`transition-shadow ${
              editingContactId === contact.id 
                ? '' 
                : selectedContacts.has(contact.id!) 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:shadow-md cursor-pointer'
            }`}
          >
            <CardContent className="p-4">
              {editingContactId === contact.id ? (
                /* Edit Mode */
                <ContactEditForm
                  contact={contact}
                  onSave={handleSaveContact}
                  onCancel={handleCancelEdit}
                />
              ) : (
                /* View Mode */
                <div onClick={() => handleContactClick(contact.id!)}>
                  {/* Header Row */}
                  <div className="flex justify-between mb-3">
                    <div className="flex gap-3 flex-1">
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={selectedContacts.has(contact.id!)}
                          onCheckedChange={() => toggleSelection(contact.id!)}
                          aria-label={`Select ${contact.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-slate-900">
                          {contact.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{contact.phone || 'No phone number'}</span>
                          {contact.platforms && contact.platforms.length > 0 && (
                            <>
                              <span className="text-slate-400">•</span>
                              <div className="flex gap-1 flex-wrap">
                                {contact.platforms.map((platform) => (
                                  <span key={platform} className="text-xs bg-slate-100 px-2 py-1 rounded capitalize">
                                    {platform}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTemperatureBadge(contact.latest_temperature)}
                      {getStatusBadges(contact)}
                    </div>
                  </div>

                  {/* Communication Status */}
                  <div className="mb-3">
                    {getCommunicationBadge(contact.has_two_way_communication ?? false)}
                  </div>

                  {/* Metrics Row */}
                  <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                    <span className="font-medium">
                      {contact.auto_contact_attempts || contact.contact_attempts || 0} activities
                    </span>
                    <span>
                      Last: {formatRelativeTime(contact.last_contact_date)}
                    </span>
                    {contact.screenshot_count && contact.screenshot_count > 0 && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Image className="w-3 h-3" />
                        {contact.screenshot_count} screenshot{contact.screenshot_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 mb-4 pt-3 border-t border-slate-100">
                    {contact.relationship_type && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Relationship:</span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded capitalize">
                          {contact.relationship_type}
                        </span>
                      </div>
                    )}
                    {contact.notes && (
                      <div>
                        <span className="text-xs text-slate-500 font-medium block mb-1">Notes:</span>
                        <p className="text-sm text-slate-600">{contact.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditContact(contact.id)
                      }}
                      className="flex-1"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit Contact
                    </Button>
                    {contact.relationship_status === 'converted' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveCustomer(contact.id)
                        }}
                        className="flex-1"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Remove Customer
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsCustomer(contact.id)
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Mark as Customer
                      </Button>
                    )}
                  </div>

                  {/* Expansion Indicator */}
                  <div className="flex items-center justify-center mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {expandedContactId === contact.id ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Click to collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Click to view activity history
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Timeline */}
                  {expandedContactId === contact.id && (
                    <>
                      <ContactActivityTimeline
                        activities={contactActivities}
                        loading={activitiesLoading}
                        onViewScreenshot={handleViewScreenshot}
                      />
                      <ContactHistoryTimeline
                        history={contactHistory}
                        loading={historyLoading}
                      />
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading skeletons for "Load More" */}
      {loadingMore && (
        <ContactCardSkeleton count={3} />
      )}

      {/* Load More Button */}
      {!loading && (
        <LoadMoreButton
          onClick={handleLoadMore}
          loading={loadingMore}
          disabled={!pagination.hasMore}
          remainingCount={pagination.total - contacts.length}
        />
      )}

      <ScreenshotModal
        screenshotId={screenshotModalId}
        isOpen={isScreenshotModalOpen}
        onClose={handleCloseScreenshotModal}
      />
    </div>
  )
}