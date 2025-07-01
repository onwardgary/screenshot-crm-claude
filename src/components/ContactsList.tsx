'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Phone, 
  Calendar,
  MessageCircle,
  User,
  Users,
  TrendingUp,
  Clock,
  Target
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
}

interface ContactsListProps {
  statusFilter?: 'new' | 'active' | 'converted' | 'dormant'
}

export default function ContactsList({ statusFilter }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set())

  const fetchContacts = useCallback(async () => {
    try {
      const url = statusFilter 
        ? `/api/contacts?status=${statusFilter}` 
        : `/api/contacts`
      const response = await fetch(url)
      const data = await response.json()
      setContacts(data)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleContactAttempt = async (contactId: number) => {
    try {
      await fetch(`/api/contacts/${contactId}/contact-attempt`, {
        method: 'POST'
      })
      fetchContacts() // Refresh data
    } catch (error) {
      console.error('Failed to log contact attempt:', error)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'converted':
        return <Badge className="bg-purple-100 text-purple-800">Converted</Badge>
      case 'dormant':
        return <Badge className="bg-gray-100 text-gray-800">Dormant</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getRelationshipTypeBadge = (type?: string) => {
    switch (type) {
      case 'family':
        return <Badge variant="outline">👨‍👩‍👧‍👦 Family</Badge>
      case 'friend':
        return <Badge variant="outline">👥 Friend</Badge>
      case 'stranger':
        return <Badge variant="outline">🤝 New Contact</Badge>
      case 'referral':
        return <Badge variant="outline">🔗 Referral</Badge>
      case 'existing_customer':
        return <Badge variant="outline">⭐ Customer</Badge>
      default:
        return null
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
      <div className="flex space-x-1">
        {platforms.map(platform => (
          <span key={platform} title={platform}>
            {iconMap[platform.toLowerCase()] || '📱'}
          </span>
        ))}
      </div>
    )
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

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{contact.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      {contact.phone && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.phone}
                        </span>
                      )}
                      {getPlatformIcons(contact.platforms)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(contact.relationship_status)}
                  {getRelationshipTypeBadge(contact.relationship_type)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Target className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-slate-600">Attempts: </span>
                    <span className="font-medium">{contact.contact_attempts || 0}</span>
                  </div>
                  
                  {contact.response_rate !== undefined && (
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-slate-600">Response: </span>
                      <span className="font-medium">{Math.round(contact.response_rate * 100)}%</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {contact.last_contact_date && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-orange-500" />
                      <span className="text-slate-600">Last contact: </span>
                      <span className="font-medium">
                        {new Date(contact.last_contact_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {contact.follow_up_date && (
                    <div className="flex items-center text-sm">
                      <Calendar className={`h-4 w-4 mr-2 ${isFollowUpDue(contact.follow_up_date) ? 'text-red-500' : 'text-blue-500'}`} />
                      <span className="text-slate-600">Follow-up: </span>
                      <span className={`font-medium ${isFollowUpDue(contact.follow_up_date) ? 'text-red-600' : ''}`}>
                        {new Date(contact.follow_up_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {contact.notes && (
                <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">{contact.notes}</p>
                </div>
              )}

              {contact.follow_up_notes && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-1">Follow-up Notes:</p>
                  <p className="text-sm text-blue-700">{contact.follow_up_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Added {new Date(contact.created_at).toLocaleDateString()}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleContactAttempt(contact.id)}
                    className="text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Log Contact
                  </Button>
                  
                  {isFollowUpDue(contact.follow_up_date) && (
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      Follow-up Due!
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}