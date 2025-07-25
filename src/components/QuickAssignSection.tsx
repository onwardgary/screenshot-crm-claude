'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, 
  Users, 
  ArrowRight,
  Plus,
  Link,
  Loader2 
} from 'lucide-react'

interface Contact {
  id: number
  name: string
  phone?: string
  platforms?: string[]
  auto_contact_attempts?: number
  latest_temperature?: 'hot' | 'warm' | 'cold'
}

interface QuickAssignSectionProps {
  selectedActivityIds: number[]
  onAssignmentSuccess: () => void
  onCreateNew: () => void
}

export default function QuickAssignSection({ 
  selectedActivityIds, 
  onAssignmentSuccess,
  onCreateNew 
}: QuickAssignSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searching, setSearching] = useState(false)
  const [assigning, setAssigning] = useState<number | null>(null)
  const { toast } = useToast()

  // Debounced search for contacts
  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setContacts([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/contacts?search=${encodeURIComponent(query)}&quickSearch=true&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to search contacts')
      }
      
      const data = await response.json()
      // Handle both paginated and non-paginated responses
      const contactList = data.contacts || data
      setContacts(Array.isArray(contactList) ? contactList : [])
    } catch (error) {
      console.error('Contact search error:', error)
      setContacts([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContacts(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchContacts])

  const handleAssignToContact = async (contactId: number, contactName: string) => {
    setAssigning(contactId)
    try {
      const response = await fetch('/api/activities/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityIds: selectedActivityIds,
          contactId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign activities')
      }

      const result = await response.json()
      
      toast({
        title: "Activities assigned",
        description: `Successfully assigned ${result.successCount} activities to ${contactName}`
      })

      // Reset state and notify parent
      setSearchQuery('')
      setContacts([])
      onAssignmentSuccess()
    } catch (error) {
      console.error('Assignment error:', error)
      toast({
        title: "Assignment failed",
        description: "Failed to assign activities to contact",
        variant: "destructive"
      })
    } finally {
      setAssigning(null)
    }
  }

  const getPlatformIcon = (platform: string, size = 12) => {
    const iconMap: Record<string, string> = {
      'whatsapp': '/icons/whatsapp.svg',
      'instagram': '/icons/instagram.svg',
      'messenger': '/icons/messenger.svg',
      'telegram': '/icons/telegram.svg',
      'tiktok': '/icons/tiktok.svg',
      'line': '/icons/line.svg',
      'linkedin': '/icons/linkedin.svg',
      'wechat': '/icons/wechat.svg'
    }
    
    const iconPath = iconMap[platform.toLowerCase()] || '/icons/phone.svg'
    
    return (
      <img 
        src={iconPath} 
        alt={`${platform} icon`}
        width={size} 
        height={size}
        className="inline-block"
      />
    )
  }

  const getTemperatureBadge = (temperature?: string) => {
    switch (temperature) {
      case 'hot':
        return <Badge className="bg-red-100 text-red-800 text-xs">🔥</Badge>
      case 'warm':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">🌡️</Badge>
      case 'cold':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">❄️</Badge>
      default:
        return <Badge className="bg-orange-100 text-orange-800 text-xs">🌡️</Badge>
    }
  }

  if (selectedActivityIds.length === 0) {
    return null
  }

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-4 h-4 text-purple-600" />
          <h3 className="font-medium text-purple-900">
            Quick Assign {selectedActivityIds.length} {selectedActivityIds.length === 1 ? 'Activity' : 'Activities'}
          </h3>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search contacts by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-purple-200 focus:border-purple-400"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 animate-spin" />
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-2 mb-4">
            {contacts.length === 0 && !searching ? (
              <div className="text-center py-4 text-slate-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No contacts found</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{contact.name}</span>
                        {contact.platforms && contact.platforms.length > 0 && (
                          <span className="flex items-center gap-1">
                            {contact.platforms.slice(0, 3).map(platform => (
                              <span key={platform}>
                                {getPlatformIcon(platform, 12)}
                              </span>
                            ))}
                          </span>
                        )}
                        {getTemperatureBadge(contact.latest_temperature)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {contact.auto_contact_attempts || 0} activities
                        {contact.phone && (
                          <span className="ml-2">• {contact.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAssignToContact(contact.id, contact.name)}
                    disabled={assigning === contact.id}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {assigning === contact.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Assign
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create New Contact Option */}
        <div className="pt-3 border-t border-purple-200">
          <Button
            variant="outline"
            onClick={onCreateNew}
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Contact from Selected Activities
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}