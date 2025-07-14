'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, Link, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { fetchExistingContacts, detectExistingContactForActivities, type ContactDetectionResult } from '@/lib/contactDetection'
import ContactDetectionBanner from './ContactDetectionBanner'
import ContactForm, { type ContactFormData } from './ContactForm'
import ContactPicker from './ContactPicker'

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
  const { toast } = useToast()

  // Form states for create mode
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    notes: ''
  })

  // Selected contact for link mode
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)

  useEffect(() => {
    if (open && activities.length > 0) {
      initializeModal()
    }
  }, [open, activities]) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeModal = async () => {
    // Auto-fill from activities
    const firstActivity = activities[0]
    const phoneActivity = activities.find(a => a.phone)
    
    setContactFormData({
      name: firstActivity.person_name,
      phone: phoneActivity?.phone || '',
      notes: ''
    })
    
    // Fetch existing contacts for intelligent detection
    const existingContactsData = await fetchExistingContacts()
    setContacts(existingContactsData as unknown as Contact[]) // For backward compatibility with existing UI
    
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
            name: contactFormData.name,
            phone: contactFormData.phone,
            platforms,
            notes: contactFormData.notes
          })
        })
        
        if (!contactResponse.ok) throw new Error('Failed to create contact')
        const { id: contactId } = await contactResponse.json()
        
        // Link activities to contact using bulk API
        const linkResult = await linkActivitiesToContact(contactId)
        
        toast({
          title: "Contact created successfully",
          description: `${linkResult.successCount} of ${activities.length} activities organized under ${contactFormData.name}`
        })
      } else {
        // Link to existing contact
        if (!selectedContactId) {
          toast({
            title: "Please select a contact",
            description: "Choose an existing contact to assign activities to",
            variant: "destructive"
          })
          return
        }
        
        const linkResult = await linkActivitiesToContact(selectedContactId)
        
        const contact = contacts.find(c => c.id === selectedContactId)
        toast({
          title: "Activities assigned successfully",
          description: `${linkResult.successCount} of ${activities.length} activities assigned to ${contact?.name}`
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
    // Use bulk assignment API for better performance and error handling
    const activityIds = activities.map(activity => activity.id)
    
    const response = await fetch('/api/activities/bulk-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityIds,
        contactId
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to assign activities to contact')
    }
    
    const result = await response.json()
    
    // Log any partial failures
    if (result.errors && result.errors.length > 0) {
      console.warn('Some activities failed to assign:', result.errors)
    }
    
    return result
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
            Combine and Assign {activities.length} Activities to 1 Contact
          </DialogTitle>
          <DialogDescription>
            Combine multiple activities from the same person into a single contact
          </DialogDescription>
        </DialogHeader>

        {/* Intelligent Detection Banner */}
        <ContactDetectionBanner detectionResult={detectionResult} />


        <Tabs value={mode} onValueChange={(v) => setMode(v as 'create' | 'link')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Contact
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="w-4 h-4 mr-2" />
              Assign to Existing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <ContactForm 
              data={contactFormData} 
              onChange={setContactFormData}
              disabled={loading}
            />
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <ContactPicker
              contacts={contacts}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
              height="200px"
            />
          </TabsContent>
        </Tabs>

        {/* Activity Preview */}
        <div className="mt-4">
          <Label className="mb-2 block">Activities to Assign</Label>
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
          <Button onClick={handleSubmit} disabled={loading || (mode === 'create' && !contactFormData.name)}>
            {loading ? 'Assigning...' : mode === 'create' ? 'Create & Assign' : 'Assign Activities'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}