'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, Link, CheckCircle2, XCircle } from 'lucide-react'
import { detectExistingContactForActivities, type ExistingContact, type ContactDetectionResult } from '@/lib/contactDetection'
import ContactDetectionBanner from './ContactDetectionBanner'
import ContactForm, { type ContactFormData } from './ContactForm'
import ContactPicker from './ContactPicker'
import { getPlatformIcon, getTemperatureEmoji } from '@/lib/platformUtils'

interface Activity {
  id: number
  person_name: string
  phone?: string
  platform: string
  message_content?: string
  temperature?: 'hot' | 'warm' | 'cold'
  is_group_chat?: boolean
}

interface ActivityAssignmentCardProps {
  activity: Activity
  existingContacts: ExistingContact[]
  onAssign: (activityId: number, assignmentData: {
    mode: 'create' | 'link'
    contactId?: number
    contactData?: {
      name: string
      phone: string
      notes: string
    }
  }) => Promise<void>
  status?: 'pending' | 'processing' | 'success' | 'error'
  disabled?: boolean
}

export default function ActivityAssignmentCard({
  activity,
  existingContacts,
  onAssign,
  status = 'pending',
  disabled = false
}: ActivityAssignmentCardProps) {
  const [mode, setMode] = useState<'create' | 'link'>('create')
  const [detectionResult, setDetectionResult] = useState<ContactDetectionResult | null>(null)
  const [expanded, setExpanded] = useState(false)
  
  // Form states for create mode
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    name: activity.person_name,
    phone: activity.phone || '',
    notes: ''
  })

  // Selected contact for link mode
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)

  useEffect(() => {
    // Run detection for this activity
    const detection = detectExistingContactForActivities([activity], existingContacts)
    setDetectionResult(detection)
    
    // Auto-suggest mode based on detection
    if (detection.existingContact && detection.confidence === 'high') {
      setMode('link')
      setSelectedContactId(detection.existingContact.id)
    } else {
      setMode('create')
    }
  }, [activity, existingContacts])

  const handleAssign = async () => {
    if (mode === 'create') {
      await onAssign(activity.id, {
        mode: 'create',
        contactData: { 
          name: contactFormData.name, 
          phone: contactFormData.phone, 
          notes: contactFormData.notes 
        }
      })
    } else {
      if (selectedContactId) {
        await onAssign(activity.id, {
          mode: 'link',
          contactId: selectedContactId
        })
      }
    }
  }


  return (
    <div className={`border rounded-lg p-4 ${
      status === 'success' ? 'border-green-200 bg-green-50' :
      status === 'error' ? 'border-red-200 bg-red-50' :
      status === 'processing' ? 'border-blue-200 bg-blue-50' :
      'border-gray-200'
    }`}>
      {/* Activity Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{activity.person_name}</span>
            <span className="text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {getPlatformIcon(activity.platform, 14)}
                {activity.platform}
              </span>
            </span>
            {activity.temperature && (
              <span className="text-sm">
                {getTemperatureEmoji(activity.temperature)}
              </span>
            )}
          </div>
          {activity.phone && (
            <span className="text-sm text-muted-foreground">{activity.phone}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
          {status === 'error' && (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          
          {status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              disabled={disabled}
            >
              {expanded ? 'Collapse' : 'Assign'}
            </Button>
          )}
        </div>
      </div>

      {/* Assignment Interface */}
      {expanded && status === 'pending' && (
        <div className="space-y-4">
          {/* Detection Banner */}
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

            <TabsContent value="create" className="space-y-3">
              <ContactForm 
                data={contactFormData} 
                onChange={setContactFormData}
                idPrefix={activity.id.toString()}
              />
            </TabsContent>

            <TabsContent value="link" className="space-y-3">
              <ContactPicker
                contacts={existingContacts}
                selectedContactId={selectedContactId}
                onSelectContact={setSelectedContactId}
                height="150px"
                compact={true}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={mode === 'create' && !contactFormData.name}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              {mode === 'create' ? 'Create & Assign' : 'Assign Activity'}
            </Button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status === 'success' && (
        <div className="text-sm text-green-600 font-medium">
          ✓ Successfully assigned
        </div>
      )}
      {status === 'error' && (
        <div className="text-sm text-red-600 font-medium">
          ✗ Assignment failed
        </div>
      )}
      {status === 'processing' && (
        <div className="text-sm text-blue-600 font-medium">
          Assigning activity...
        </div>
      )}
    </div>
  )
}