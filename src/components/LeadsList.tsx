'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  Phone, 
  Star, 
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Upload,
  Loader2,
  GitMerge,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Image,
  ExternalLink,
  ArrowRight,
  Archive,
  RotateCcw,
  Calendar,
  Bell,
  UserCheck
} from 'lucide-react'


interface Lead {
  id: number
  name: string
  phone?: string
  platform: string
  last_message?: string
  last_message_from?: string
  timestamp?: string
  conversation_summary?: string
  lead_score?: number
  notes?: string
  merged_from_ids?: number[]
  screenshot_id?: number
  created_at: string
  updated_at?: string
  // Follow-up system
  next_followup_date?: string
  followup_notes?: string
  last_contact_attempt?: string
  contact_attempts?: number
  relationship_type?: string
  // Performance dashboard fields
  contact_type?: 'lead' | 'contact'
  conversion_date?: string
}


interface LeadsListProps {
  statusFilter?: string
  contactTypeFilter?: 'lead' | 'contact'
  showConvertButton?: boolean
}

export default function LeadsList({ statusFilter, contactTypeFilter, showConvertButton = false }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set())
  const [merging, setMerging] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [expandedLeads, setExpandedLeads] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  const [selectedScreenshotId, setSelectedScreenshotId] = useState<number | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const url = statusFilter ? `/api/leads?status=${statusFilter}` : '/api/leads'
      const response = await fetch(url)
      const data = await response.json()
      // Filter by contact type if specified
      const filteredData = contactTypeFilter 
        ? data.filter((lead: Lead) => lead.contact_type === contactTypeFilter)
        : data
      setLeads(filteredData)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, contactTypeFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const toggleLeadSelection = (leadId: number) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const selectAllLeads = () => {
    if (filteredLeads && filteredLeads.length > 0) {
      const allIds = new Set(filteredLeads.map(lead => lead.id))
      setSelectedLeads(allIds)
    }
  }

  const clearSelection = () => {
    setSelectedLeads(new Set())
  }

  const toggleLeadExpansion = (leadId: number) => {
    const newExpanded = new Set(expandedLeads)
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId)
    } else {
      newExpanded.add(leadId)
    }
    setExpandedLeads(newExpanded)
  }

  // Filter and search leads
  const filteredLeads = (leads || []).filter(lead => {
    if (!lead) return false
    
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = searchQuery === '' || 
      (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
      (lead.phone && lead.phone.includes(searchQuery)) ||
      (lead.conversation_summary && lead.conversation_summary.toLowerCase().includes(searchLower)) ||
      (lead.last_message && lead.last_message.toLowerCase().includes(searchLower))

    // Platform filter
    const matchesPlatform = platformFilter === 'all' || lead.platform === platformFilter

    // Score filter
    const matchesScore = scoreFilter === 'all' || 
      (scoreFilter === 'high' && (lead.lead_score || 0) >= 8) ||
      (scoreFilter === 'medium' && (lead.lead_score || 0) >= 5 && (lead.lead_score || 0) < 8) ||
      (scoreFilter === 'low' && (lead.lead_score || 0) < 5)

    return matchesSearch && matchesPlatform && matchesScore
  })

  const handleMergeRequest = () => {
    if (selectedLeads.size < 2) {
      alert('Please select at least 2 leads to merge.')
      return
    }
    setShowMergeDialog(true)
  }

  const handleMergeConfirm = async () => {
    setShowMergeDialog(false)
    setMerging(true)
    
    try {
      // Use the first selected lead as target, rest as sources
      const selectedArray = Array.from(selectedLeads)
      const targetId = selectedArray[0]
      const sourceIds = selectedArray.slice(1)

      const response = await fetch('/api/leads/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetId, sourceIds }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ ${result.message}`)
        await fetchLeads() // Refresh the leads list
        setSelectedLeads(new Set()) // Clear selection
      } else {
        alert(`❌ ${result.error || 'Failed to merge leads'}`)
      }
    } catch (error) {
      console.error('Error merging leads:', error)
      alert('❌ Failed to merge leads. Please try again.')
    } finally {
      setMerging(false)
    }
  }

  const getPlatformInfo = (platform: string) => {
    const platforms = {
      whatsapp: { 
        color: 'bg-green-100 text-green-700 border-green-200', 
        name: 'WhatsApp' 
      },
      instagram: { 
        color: 'bg-pink-100 text-pink-700 border-pink-200', 
        name: 'Instagram' 
      },
      tiktok: { 
        color: 'bg-slate-100 text-slate-700 border-slate-200', 
        name: 'TikTok' 
      },
      messenger: { 
        color: 'bg-blue-100 text-blue-700 border-blue-200', 
        name: 'Messenger' 
      },
      other: { 
        color: 'bg-gray-100 text-gray-700 border-gray-200', 
        name: 'Other' 
      }
    }
    return platforms[platform as keyof typeof platforms] || platforms.other
  }

  const getLastMessageStatus = (lastMessageFrom?: string, compact = false) => {
    if (compact) {
      if (lastMessageFrom === 'contact') {
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Follow up</span>
          </div>
        )
      } else if (lastMessageFrom === 'user') {
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs font-medium">Waiting</span>
          </div>
        )
      }
      return (
        <div className="flex items-center gap-1 text-slate-500">
          <HelpCircle className="h-3 w-3" />
          <span className="text-xs">Unknown</span>
        </div>
      )
    }

    // Full size for expanded view
    if (lastMessageFrom === 'contact') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">They messaged last</span>
        </div>
      )
    } else if (lastMessageFrom === 'user') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">You messaged last</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <HelpCircle className="h-4 w-4" />
        <span className="text-sm">Unknown status</span>
      </div>
    )
  }

  const getLeadScoreColor = (score?: number) => {
    if (!score) return 'bg-slate-100 text-slate-700'
    if (score >= 8) return 'bg-green-100 text-green-700'
    if (score >= 6) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const handleViewScreenshot = (screenshotId: number) => {
    setSelectedScreenshotId(screenshotId)
    setShowScreenshotModal(true)
  }

  const closeScreenshotModal = () => {
    setShowScreenshotModal(false)
    setSelectedScreenshotId(null)
  }

  // Individual lead status update
  const updateLeadStatus = async (leadId: number, newStatus: 'raw' | 'active' | 'archived') => {
    setUpdatingLeadId(leadId)
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchLeads() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Failed to update lead: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
      alert('Failed to update lead status')
    } finally {
      setUpdatingLeadId(null)
    }
  }

  // Bulk status update
  const updateBulkStatus = async (newStatus: 'raw' | 'active' | 'archived') => {
    if (selectedLeads.size === 0) return

    const leadIds = Array.from(selectedLeads)
    setUpdatingStatus(true)

    try {
      const response = await fetch('/api/leads/bulk-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds, status: newStatus })
      })

      if (response.ok) {
        const result = await response.json()
        clearSelection()
        await fetchLeads() // Refresh the list
        alert(`✅ Successfully updated ${result.totalUpdated} leads to ${newStatus}`)
      } else {
        const error = await response.json()
        alert(`Failed to update leads: ${error.error}`)
      }
    } catch (error) {
      console.error('Error in bulk status update:', error)
      alert('Failed to update lead statuses')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Follow-up functionality
  const setFollowupDate = async (leadId: number, daysFromNow: number) => {
    const followupDate = new Date()
    followupDate.setDate(followupDate.getDate() + daysFromNow)
    const dateString = followupDate.toISOString().split('T')[0]

    try {
      const response = await fetch(`/api/leads/${leadId}/followup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          next_followup_date: dateString,
          followup_notes: `Follow-up in ${daysFromNow} day${daysFromNow > 1 ? 's' : ''}`
        })
      })

      if (response.ok) {
        await fetchLeads() // Refresh the list
        alert(`✅ Follow-up set for ${followupDate.toLocaleDateString()}`)
      } else {
        const error = await response.json()
        alert(`Failed to set follow-up: ${error.error}`)
      }
    } catch (error) {
      console.error('Error setting follow-up:', error)
      alert('Failed to set follow-up')
    }
  }

  const logContactAttempt = async (leadId: number) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/contact-attempt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.ok) {
        await fetchLeads() // Refresh the list
        alert('✅ Contact attempt logged')
      } else {
        const error = await response.json()
        alert(`Failed to log contact: ${error.error}`)
      }
    } catch (error) {
      console.error('Error logging contact attempt:', error)
      alert('Failed to log contact attempt')
    }
  }

  // Convert lead to contact
  const convertToContact = async (leadId: number) => {
    try {
      const response = await fetch('/api/leads/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      })

      if (response.ok) {
        await fetchLeads() // Refresh the list
        alert('✅ Lead converted to contact successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to convert lead: ${error.error}`)
      }
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('Failed to convert lead to contact')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        <span className="ml-2 text-slate-600">Loading your leads...</span>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <Card className="border-2 border-dashed border-sky-200 bg-sky-50/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-sky-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No leads yet!</h3>
          <p className="text-slate-600 text-center max-w-md">
            Upload your first screenshot to start extracting leads from your social media conversations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card className="border-slate-200">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads by name, phone, or conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">All Platforms</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="messenger">Messenger</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">All Scores</option>
                <option value="high">High (8-10)</option>
                <option value="medium">Medium (5-7)</option>
                <option value="low">Low (1-4)</option>
              </select>
              
              {(searchQuery || platformFilter !== 'all' || scoreFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setPlatformFilter('all')
                    setScoreFilter('all')
                  }}
                  className="w-full sm:w-auto px-3 h-10 sm:h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {/* Filter Results Summary */}
          {filteredLeads.length !== (leads?.length || 0) && (
            <div className="mt-3 text-sm text-slate-600">
              Showing {filteredLeads.length} of {leads?.length || 0} leads
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Toolbar */}
      {selectedLeads.size > 0 && (
        <Card className="border-sky-200 bg-sky-50/50 sticky top-0 z-40 backdrop-blur-sm shadow-lg">
          <CardContent className="py-3 sm:py-4">
            {/* Mobile Layout: Stacked */}
            <div className="block sm:hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {selectedLeads.size} selected
                </span>
                <div className="flex gap-2">
                  {/* Status Actions Mobile */}
                  {statusFilter === 'raw' && (
                    <Button
                      onClick={() => updateBulkStatus('active')}
                      disabled={selectedLeads.size === 0 || updatingStatus}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-11 px-3"
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {statusFilter === 'active' && (
                    <>
                      <Button
                        onClick={() => updateBulkStatus('raw')}
                        disabled={selectedLeads.size === 0 || updatingStatus}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 h-11 px-3"
                      >
                        {updatingStatus ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => updateBulkStatus('archived')}
                        disabled={selectedLeads.size === 0 || updatingStatus}
                        size="sm"
                        className="bg-slate-600 hover:bg-slate-700 h-11 px-3"
                      >
                        {updatingStatus ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}

                  {(statusFilter === 'archived' || statusFilter === 'archived,merged') && (
                    <Button
                      onClick={() => updateBulkStatus('active')}
                      disabled={selectedLeads.size === 0 || updatingStatus}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-11 px-3"
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* Convert Action Mobile - only for leads */}
                  {showConvertButton && contactTypeFilter === 'lead' && (
                    <Button
                      onClick={() => {
                        if (selectedLeads.size === 0) return
                        const leadIds = Array.from(selectedLeads)
                        Promise.all(leadIds.map(id => convertToContact(id)))
                          .then(() => clearSelection())
                      }}
                      disabled={selectedLeads.size === 0}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 h-11 px-3"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Merge Action Mobile */}
                  <Button
                    onClick={handleMergeRequest}
                    disabled={selectedLeads.size < 2 || merging}
                    size="sm"
                    className="bg-sky-600 hover:bg-sky-700 h-11 px-4"
                  >
                    {merging ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <GitMerge className="h-5 w-5 mr-2" />
                    )}
                    Merge
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllLeads}
                  className="flex-1 h-11"
                >
                  <Check className="h-4 w-4 mr-2" />
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="flex-1 h-11"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Desktop Layout: Horizontal */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">
                  {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllLeads}
                  className="h-9"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="h-9"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {/* Status Actions */}
                {statusFilter === 'active' && (
                  <Button
                    onClick={() => updateBulkStatus('archived')}
                    disabled={selectedLeads.size === 0 || updatingStatus}
                    size="sm"
                    className="bg-slate-600 hover:bg-slate-700"
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4 mr-2" />
                    )}
                    Archive Selected
                  </Button>
                )}

                {(statusFilter === 'archived' || statusFilter === 'archived,merged') && (
                  <Button
                    onClick={() => updateBulkStatus('active')}
                    disabled={selectedLeads.size === 0 || updatingStatus}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Reactivate Selected
                  </Button>
                )}

                {/* Convert Action - only for leads */}
                {showConvertButton && contactTypeFilter === 'lead' && (
                  <Button
                    onClick={() => {
                      if (selectedLeads.size === 0) return
                      const leadIds = Array.from(selectedLeads)
                      // Convert each selected lead
                      Promise.all(leadIds.map(id => convertToContact(id)))
                        .then(() => clearSelection())
                    }}
                    disabled={selectedLeads.size === 0}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Convert to Contacts
                  </Button>
                )}

                {/* Merge Action */}
                <Button
                  onClick={handleMergeRequest}
                  disabled={selectedLeads.size < 2 || merging}
                  size="sm"
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  {merging ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GitMerge className="h-4 w-4 mr-2" />
                  )}
                  Merge Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Filtered Results */}
      {filteredLeads.length === 0 && (leads?.length || 0) > 0 && (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No matches found</h3>
            <p className="text-slate-600 text-center max-w-sm text-sm">
              Try adjusting your search terms or filters to find the leads you&apos;re looking for.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leads Grid */}
      {filteredLeads.length > 0 && (
        <div className="grid gap-3 sm:gap-4">
          {filteredLeads.map((lead) => {
        const platformInfo = getPlatformInfo(lead.platform)
        const isSelected = selectedLeads.has(lead.id)
        const isExpanded = expandedLeads.has(lead.id)
        
        return (
          <Card 
            key={lead.id} 
            className={`hover:shadow-md transition-all duration-200 border-l-4 ${
              isSelected 
                ? 'border-l-sky-600 bg-sky-50/30 ring-1 ring-sky-200' 
                : 'border-l-sky-400'
            }`}
          >
            {/* Compact Header - Always Visible */}
            <CardHeader className="pb-2 sm:pb-3">
              {/* Mobile Layout */}
              <div className="block sm:hidden">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLeadSelection(lead.id)}
                    className="h-5 w-5 text-sky-600 focus:ring-sky-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
                  />
                  <Avatar className="h-10 w-10 bg-gradient-to-r from-sky-400 to-blue-500 flex-shrink-0">
                    <AvatarFallback className="text-white font-medium text-sm">
                      {lead.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base text-slate-900 truncate">{lead.name}</CardTitle>
                    {lead.phone && (
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLeadExpansion(lead.id)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${platformInfo.color} text-xs`}>
                      {platformInfo.name}
                    </Badge>
                    {lead.lead_score && (
                      <Badge className={`${getLeadScoreColor(lead.lead_score)} flex items-center gap-1 text-xs`}>
                        <Star className="h-3 w-3" />
                        {lead.lead_score}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs">
                    {getLastMessageStatus(lead.last_message_from, true)}
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleLeadSelection(lead.id)}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded cursor-pointer"
                    />
                    <Avatar className="h-10 w-10 bg-gradient-to-r from-sky-400 to-blue-500">
                      <AvatarFallback className="text-white font-medium text-sm">
                        {lead.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg text-slate-900">{lead.name}</CardTitle>
                      {lead.phone && (
                        <CardDescription className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={platformInfo.color}>
                      {platformInfo.name}
                    </Badge>
                    {lead.lead_score && (
                      <Badge className={`${getLeadScoreColor(lead.lead_score)} flex items-center gap-1`}>
                        <Star className="h-3 w-3" />
                        {lead.lead_score}/10
                      </Badge>
                    )}
                    {getLastMessageStatus(lead.last_message_from)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLeadExpansion(lead.id)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Collapsible Details */}
            {isExpanded && (
              <CardContent className="pt-0 space-y-5">
                {/* Last Message Section - Always first for context */}
                {lead.last_message && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4" />
                      Last Message
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-3 border-l-2 border-sky-200">
                      <p className="text-slate-700 text-sm italic">
                        &ldquo;{lead.last_message}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* LEADS LAYOUT - Focus on evaluation and conversion */}
                {contactTypeFilter === 'lead' && (
                  <>
                    {/* Lead Quality Section - Grouped evaluation data */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4" />
                        Lead Quality
                      </h4>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                        {/* Lead Score & Notes */}
                        <div className="space-y-2">
                          {lead.lead_score && (
                            <div className="flex items-center gap-2">
                              <Badge className={`${getLeadScoreColor(lead.lead_score)} flex items-center gap-1`}>
                                <Star className="h-3 w-3" />
                                {lead.lead_score}/10 Priority
                              </Badge>
                            </div>
                          )}
                          {lead.notes && (
                            <p className="text-amber-800 text-sm">
                              <strong>Notes:</strong> {lead.notes}
                            </p>
                          )}
                          {/* Merged indicator in context */}
                          {lead.merged_from_ids && lead.merged_from_ids.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-amber-700">
                              <GitMerge className="h-4 w-4" />
                              <span>Consolidated from {lead.merged_from_ids.length} duplicate{lead.merged_from_ids.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Source Traceability */}
                    {lead.screenshot_id && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                          <Image className="h-4 w-4" />
                          Source
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewScreenshot(lead.screenshot_id!)}
                          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400"
                        >
                          <Image className="h-4 w-4" />
                          View Original Screenshot
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Primary Action - Convert to Contact (Prominent) */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="flex flex-col gap-3">
                        {showConvertButton && (
                          <Button
                            onClick={() => convertToContact(lead.id)}
                            size="lg"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                          >
                            <UserCheck className="h-5 w-5 mr-2" />
                            Convert to Active Contact
                          </Button>
                        )}
                        
                        {/* Secondary Action - Archive (Subtle) */}
                        {statusFilter === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateLeadStatus(lead.id, 'archived')}
                            disabled={updatingLeadId === lead.id}
                            className="text-slate-600 hover:text-slate-700 border-slate-300"
                          >
                            {updatingLeadId === lead.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Archive className="h-4 w-4 mr-2" />
                            )}
                            Archive Lead
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* CONTACTS LAYOUT - Focus on nurture and follow-up */}
                {contactTypeFilter === 'contact' && (
                  <>
                    {/* Relationship Info */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4" />
                        Contact Relationship
                      </h4>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                        {lead.conversion_date && (
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Converted {new Date(lead.conversion_date).toLocaleDateString()}
                            </Badge>
                          </div>
                        )}
                        {lead.notes && (
                          <p className="text-green-800 text-sm">
                            <strong>Notes:</strong> {lead.notes}
                          </p>
                        )}
                        {lead.merged_from_ids && lead.merged_from_ids.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <GitMerge className="h-4 w-4" />
                            <span>Consolidated contact history</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Follow-up Management - Prominent for contacts */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        Follow-up Management
                      </h4>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                        {/* Current follow-up status */}
                        {lead.next_followup_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Bell className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800 font-medium">
                              Next follow-up: {new Date(lead.next_followup_date).toLocaleDateString()}
                            </span>
                            {lead.followup_notes && (
                              <span className="text-blue-600 text-xs">({lead.followup_notes})</span>
                            )}
                          </div>
                        )}

                        {/* Contact attempts */}
                        {lead.contact_attempts && lead.contact_attempts > 0 && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <UserCheck className="h-4 w-4" />
                            <span>
                              {lead.contact_attempts} contact attempt{lead.contact_attempts > 1 ? 's' : ''}
                              {lead.last_contact_attempt && (
                                <span> (last: {new Date(lead.last_contact_attempt).toLocaleDateString()})</span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Quick follow-up scheduling */}
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-2">Schedule Follow-up:</p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFollowupDate(lead.id, 1)}
                              className="text-xs h-8 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                            >
                              Tomorrow
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFollowupDate(lead.id, 3)}
                              className="text-xs h-8 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                            >
                              3 Days
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFollowupDate(lead.id, 7)}
                              className="text-xs h-8 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                            >
                              1 Week
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFollowupDate(lead.id, 30)}
                              className="text-xs h-8 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                            >
                              1 Month
                            </Button>
                          </div>
                        </div>

                        {/* Contact tracking */}
                        <Button
                          onClick={() => logContactAttempt(lead.id)}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Log Contact Attempt
                        </Button>
                      </div>
                    </div>

                    {/* Source Reference for contacts */}
                    {lead.screenshot_id && (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewScreenshot(lead.screenshot_id!)}
                          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 border-slate-300 text-xs"
                        >
                          <Image className="h-3 w-3" />
                          Original Screenshot
                        </Button>
                      </div>
                    )}

                    {/* Secondary Action - Archive for contacts */}
                    <div className="pt-2 border-t border-slate-200">
                      {statusFilter === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateLeadStatus(lead.id, 'archived')}
                          disabled={updatingLeadId === lead.id}
                          className="text-slate-600 hover:text-slate-700 border-slate-300"
                        >
                          {updatingLeadId === lead.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Archive className="h-4 w-4 mr-2" />
                          )}
                          Archive Contact
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* Archived items - simplified layout */}
                {(statusFilter === 'archived' || statusFilter === 'archived,merged') && (
                  <div className="pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateLeadStatus(lead.id, 'active')}
                      disabled={updatingLeadId === lead.id}
                      className="flex items-center gap-2 text-green-700 hover:text-green-800 border-green-300 hover:border-green-400 hover:bg-green-50"
                    >
                      {updatingLeadId === lead.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Reactivate
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
        </div>
      )}

    {/* Merge Confirmation Dialog */}
    {showMergeDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <GitMerge className="h-5 w-5" />
              Confirm Lead Merge
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              This action will combine {selectedLeads.size} leads into one. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
              <p className="text-amber-800 text-sm sm:text-base font-medium">
                What will happen:
              </p>
              <ul className="text-amber-700 text-sm sm:text-base mt-2 space-y-1">
                <li>• Conversation histories will be combined</li>
                <li>• Best contact details will be kept</li>
                <li>• Higher lead score will be preserved</li>
                <li>• Other leads will be deleted</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowMergeDialog(false)}
                variant="outline"
                className="flex-1 h-11 sm:h-10 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMergeConfirm}
                className="flex-1 h-11 sm:h-10 bg-sky-600 hover:bg-sky-700 order-1 sm:order-2"
              >
                Merge Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Screenshot Modal */}
    {showScreenshotModal && selectedScreenshotId && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Image className="h-5 w-5" />
              Source Screenshot
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeScreenshotModal}
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 max-h-[calc(90vh-4rem)] overflow-auto">
            <img
              src={`/api/screenshots/${selectedScreenshotId}`}
              alt="Source screenshot"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ maxHeight: 'calc(90vh - 8rem)' }}
            />
          </div>
        </div>
      </div>
    )}
  </div>
  )
}