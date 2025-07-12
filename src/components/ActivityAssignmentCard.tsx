'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserPlus, Link, Phone, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { detectExistingContactForActivities, type ExistingContact, type ContactDetectionResult } from '@/lib/contactDetection'

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
  const [name, setName] = useState(activity.person_name)
  const [phone, setPhone] = useState(activity.phone || '')
  const [notes, setNotes] = useState('')

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
        contactData: { name, phone, notes }
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

  const getPlatformIcon = (platform: string, size = 16) => {
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

  const getTemperatureEmoji = (temperature?: string) => {
    switch (temperature) {
      case 'hot': return '🔥'
      case 'warm': return '🌡️'
      case 'cold': return '❄️'
      default: return '🌡️'
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
          {detectionResult?.existingContact && (
            <div className={`p-3 rounded-lg border ${
              detectionResult.confidence === 'high' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">
                    {detectionResult.confidence === 'high' ? 'Existing Contact Found!' : 'Possible Match Found'}
                  </p>
                  <p className="text-xs">
                    <strong>{detectionResult.existingContact.name}</strong>
                    {detectionResult.existingContact.phone && ` (${detectionResult.existingContact.phone})`}
                  </p>
                  <p className="text-xs opacity-75">
                    {detectionResult.reason} • {detectionResult.confidence} confidence
                  </p>
                </div>
              </div>
            </div>
          )}

          {detectionResult && !detectionResult.existingContact && (
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">No Existing Contact Found</p>
                  <p className="text-xs">A new contact will be created.</p>
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
                Assign to Existing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-3">
              <div className="grid gap-3">
                <div>
                  <Label htmlFor={`name-${activity.id}`}>Contact Name</Label>
                  <Input
                    id={`name-${activity.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter contact name"
                    className="h-8"
                  />
                </div>

                <div>
                  <Label htmlFor={`phone-${activity.id}`}>Phone Number</Label>
                  <Input
                    id={`phone-${activity.id}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="h-8"
                  />
                </div>

                <div>
                  <Label htmlFor={`notes-${activity.id}`}>Notes</Label>
                  <Textarea
                    id={`notes-${activity.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-3">
              <div>
                <Label>Select Existing Contact</Label>
                <ScrollArea className="h-[150px] border rounded-md p-2 mt-2">
                  <div className="space-y-2">
                    {existingContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-2 rounded-md border cursor-pointer transition-colors ${
                          selectedContactId === contact.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedContactId(contact.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            {contact.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {contact.phone && (
                              <Badge variant="secondary" className="text-xs">
                                📱 {contact.phone}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
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
              disabled={mode === 'create' && !name}
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