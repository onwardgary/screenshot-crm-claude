'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  Phone, 
  Calendar,
  Users,
  ArrowLeftRight,
  ArrowRight,
  Star
} from 'lucide-react'

interface Contact {
  id: number
  name: string
  phone?: string
  platforms?: string[]
  relationship_status?: 'new' | 'active' | 'converted' | 'dormant'
  relationship_type?: 'family' | 'friend' | 'stranger' | 'referral' | 'existing_customer'
  last_contact_date?: string
  contact_attempts?: number
  response_rate?: number
  notes?: string
  follow_up_date?: string
  follow_up_notes?: string
  created_at: string
  updated_at?: string
  // New auto-calculated fields
  auto_contact_attempts?: number
  has_two_way_communication?: boolean
  latest_temperature?: 'hot' | 'warm' | 'cold'
  days_since_last_contact?: number
}

interface ContactsListProps {
  statusFilter?: 'new' | 'active' | 'converted' | 'dormant'
}

export default function ContactsList({ statusFilter }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchContacts = useCallback(async () => {
    try {
      const url = statusFilter 
        ? `/api/contacts?status=${statusFilter}` 
        : `/api/contacts`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fetched contacts data:', data)
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setContacts(data)
      } else {
        console.error('Expected array but got:', typeof data, data)
        setContacts([])
        toast({
          title: "Error loading contacts",
          description: "Invalid data format received from server",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      setContacts([])
      toast({
        title: "Error loading contacts", 
        description: "Failed to load contacts. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleMarkAsCustomer = async (contactId: number) => {
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          relationship_status: 'converted'
        })
      })
      
      toast({
        title: "Contact converted",
        description: "Contact has been marked as a customer"
      })
      
      fetchContacts() // Refresh data
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
      await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          relationship_status: 'active'
        })
      })
      
      toast({
        title: "Customer status removed",
        description: "Contact has been changed back to active"
      })
      
      fetchContacts() // Refresh data
    } catch (error) {
      console.error('Failed to remove customer status:', error)
      toast({
        title: "Error",
        description: "Failed to remove customer status",
        variant: "destructive"
      })
    }
  }

  const handleScheduleFollowUp = async (contactId: number) => {
    // For now, just set follow-up for tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const followUpDate = tomorrow.toISOString().split('T')[0]
    
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          follow_up_date: followUpDate
        })
      })
      
      toast({
        title: "Follow-up scheduled",
        description: "Reminder set for tomorrow"
      })
      
      fetchContacts() // Refresh data
    } catch (error) {
      console.error('Failed to schedule follow-up:', error)
      toast({
        title: "Error",
        description: "Failed to schedule follow-up",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">NEW</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
      case 'converted':
        return <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
          <Star className="w-3 h-3" />
          CUSTOMER
        </Badge>
      case 'dormant':
        return <Badge className="bg-gray-100 text-gray-800">DORMANT</Badge>
      default:
        return <Badge variant="outline">UNKNOWN</Badge>
    }
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

  const getPlatformIcons = (platforms?: string[]) => {
    if (!platforms || platforms.length === 0) return null
    
    const iconMap: { [key: string]: string } = {
      whatsapp: '💬',
      instagram: '📷',
      tiktok: '🎵',
      messenger: '💬'
    }
    
    return (
      <span className="flex items-center space-x-1">
        {platforms.map(platform => (
          <span key={platform} title={platform} className="text-sm">
            {iconMap[platform.toLowerCase()] || '📱'}
          </span>
        ))}
      </span>
    )
  }

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const getNextFollowUpText = (followUpDate?: string) => {
    if (!followUpDate) return null
    
    const date = new Date(followUpDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Overdue!'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    return `In ${diffDays} days`
  }

  const isFollowUpDue = (followUpDate?: string) => {
    if (!followUpDate) return false
    const today = new Date().toISOString().split('T')[0]
    return followUpDate <= today
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
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
        <h2 className="text-xl font-semibold">
          {statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Contacts` : 'All Contacts'}
        </h2>
        <div className="text-sm text-muted-foreground">
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </div>
      </div>

      <div className="grid gap-3">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{contact.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </span>
                    )}
                    {contact.phone && contact.platforms && contact.platforms.length > 0 && (
                      <span className="text-slate-400">•</span>
                    )}
                    {getPlatformIcons(contact.platforms)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTemperatureBadge(contact.latest_temperature)}
                  {getStatusBadge(contact.relationship_status)}
                </div>
              </div>

              {/* Communication Status */}
              <div className="mb-3">
                {getCommunicationBadge(contact.has_two_way_communication ?? false)}
              </div>

              {/* Metrics Row */}
              <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                <span className="font-medium">
                  {contact.auto_contact_attempts || contact.contact_attempts || 0} contacts
                </span>
                <span>
                  Last: {formatRelativeTime(contact.last_contact_date)}
                </span>
                {contact.follow_up_date && (
                  <span className={isFollowUpDue(contact.follow_up_date) ? 'text-red-600 font-medium' : ''}>
                    Next: {getNextFollowUpText(contact.follow_up_date)}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleScheduleFollowUp(contact.id)}
                  className="flex-1"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Schedule Follow-up
                </Button>
                
                {contact.relationship_status === 'converted' ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRemoveCustomer(contact.id)}
                    className="flex-1"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Remove Customer
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handleMarkAsCustomer(contact.id)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Mark as Customer
                  </Button>
                )}
              </div>

              {/* Overdue Follow-up Alert */}
              {isFollowUpDue(contact.follow_up_date) && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Follow-up is overdue!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}