'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserPlus, Link, Users, Phone, MessageCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { fetchExistingContacts, detectExistingContactForActivities, type ExistingContact, type ContactDetectionResult } from '@/lib/contactDetection'

interface Activity {
  id: number
  person_name: string
  phone?: string
  platform: string
  message_content?: string
  temperature?: 'hot' | 'warm' | 'cold'
}

interface Contact {
  id: number
  name: string
  phone?: string
  platforms: string[]
}

interface OrganizeContactModalProps {
  open: boolean
  onClose: () => void
  activities: Activity[]
  onSuccess: () => void
}

export default function OrganizeContactModal({
  open,
  onClose,
  activities,
  onSuccess
}: OrganizeContactModalProps) {
  const [mode, setMode] = useState<'create' | 'link'>('create')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [detectionResult, setDetectionResult] = useState<ContactDetectionResult | null>(null)
  const [existingContacts, setExistingContacts] = useState<ExistingContact[]>([])
  const { toast } = useToast()

  // Form states for create mode
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relationshipType, setRelationshipType] = useState('stranger')
  const [notes, setNotes] = useState('')

  // Selected contact for link mode
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)

  useEffect(() => {
    if (open && activities.length > 0) {
      initializeModal()
    }
  }, [open, activities])

  const initializeModal = async () => {
    // Auto-fill from activities
    const firstActivity = activities[0]
    setName(firstActivity.person_name)
    
    // Find first phone number
    const phoneActivity = activities.find(a => a.phone)
    if (phoneActivity?.phone) {
      setPhone(phoneActivity.phone)
    }
    
    // Fetch existing contacts for intelligent detection
    const existingContactsData = await fetchExistingContacts()
    setExistingContacts(existingContactsData)
    setContacts(existingContactsData) // For backward compatibility with existing UI
    
    // Detect if there's an existing contact match
    const detection = detectExistingContactForActivities(activities, existingContactsData)
    setDetectionResult(detection)
    
    // Auto-suggest mode based on detection
    if (detection.existingContact && detection.confidence === 'high') {
      setMode('link')
      setSelectedContactId(detection.existingContact.id)
    } else {
      setMode('create')
    }
  }


  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (mode === 'create') {
        // Create new contact
        const platforms = [...new Set(activities.map(a => a.platform))]
        const contactResponse = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            platforms,
            relationship_type: relationshipType,
            notes
          })
        })
        
        if (!contactResponse.ok) throw new Error('Failed to create contact')
        const { id: contactId } = await contactResponse.json()
        
        // Link activities to contact
        await linkActivitiesToContact(contactId)
        
        toast({
          title: "Contact created successfully",
          description: `${activities.length} activities organized under ${name}`
        })
      } else {
        // Link to existing contact
        if (!selectedContactId) {
          toast({
            title: "Please select a contact",
            description: "Choose an existing contact to link activities to",
            variant: "destructive"
          })
          return
        }
        
        await linkActivitiesToContact(selectedContactId)
        
        const contact = contacts.find(c => c.id === selectedContactId)
        toast({
          title: "Activities linked successfully",
          description: `${activities.length} activities linked to ${contact?.name}`
        })
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error organizing contact:', error)
      toast({
        title: "Error organizing contact",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const linkActivitiesToContact = async (contactId: number) => {
    // Update each activity with the contact_id
    const promises = activities.map(activity =>
      fetch(`/api/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId })
      })
    )
    
    await Promise.all(promises)
  }

  // Group activities by platform for preview
  const groupedActivities = activities.reduce((acc, activity) => {
    if (!acc[activity.platform]) acc[activity.platform] = []
    acc[activity.platform].push(activity)
    return acc
  }, {} as Record<string, Activity[]>)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Merge {activities.length} Activities into 1 Contact
          </DialogTitle>
          <DialogDescription>
            Combine multiple activities from the same person into a single contact
          </DialogDescription>
        </DialogHeader>

        {/* Intelligent Detection Banner */}
        {detectionResult?.existingContact && (
          <div className={`p-4 rounded-lg border ${
            detectionResult.confidence === 'high' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1">
                  {detectionResult.confidence === 'high' ? 'Existing Contact Found!' : 'Possible Match Found'}
                </p>
                <p className="text-sm">
                  Found existing contact: <strong>{detectionResult.existingContact.name}</strong>
                  {detectionResult.existingContact.phone && ` (${detectionResult.existingContact.phone})`}
                </p>
                <p className="text-xs mt-1 opacity-75">
                  {detectionResult.reason} • {detectionResult.confidence} confidence
                </p>
              </div>
            </div>
          </div>
        )}

        {detectionResult && !detectionResult.existingContact && (
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1">No Existing Contact Found</p>
                <p className="text-sm">
                  No similar contacts detected. A new contact will be created.
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'create' | 'link')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Contact
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="w-4 h-4 mr-2" />
              Link to Existing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Contact Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter contact name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="relationship">Relationship Type</Label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stranger">Stranger</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="existing_customer">Existing Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this contact..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div>
              <Label>Select Existing Contact</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2 mt-2">
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedContactId === contact.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          {contact.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {contact.platforms.map(platform => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {/* Activity Preview */}
        <div className="mt-4">
          <Label className="mb-2 block">Activities to Organize</Label>
          <div className="border rounded-md p-3 bg-gray-50 space-y-2">
            {Object.entries(groupedActivities).map(([platform, platformActivities]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-sm capitalize flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {platform}
                </span>
                <span className="text-sm text-muted-foreground">
                  {platformActivities.length} {platformActivities.length === 1 ? 'activity' : 'activities'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || (mode === 'create' && !name)}>
            {loading ? 'Organizing...' : mode === 'create' ? 'Create & Organize' : 'Link Activities'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}