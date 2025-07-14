import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone } from 'lucide-react'

interface Contact {
  id: number
  name: string
  phone?: string
  platforms?: string[]
}

interface ContactPickerProps {
  contacts: Contact[]
  selectedContactId: number | null
  onSelectContact: (contactId: number) => void
  height?: string
  compact?: boolean
  className?: string
}

/**
 * Shared contact picker component for selecting existing contacts
 * Used in OrganizeContactModal, ConvertContactsModal, and ActivityAssignmentCard
 */
export default function ContactPicker({ 
  contacts, 
  selectedContactId, 
  onSelectContact,
  height = '200px',
  compact = false,
  className = ''
}: ContactPickerProps) {
  const containerHeight = compact ? '150px' : height

  return (
    <div className={className}>
      <Label>Select Existing Contact</Label>
      <ScrollArea className={`border rounded-md p-2 mt-2`} style={{ height: containerHeight }}>
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-${compact ? '2' : '3'} rounded-md border cursor-pointer transition-colors ${
                selectedContactId === contact.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectContact(contact.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`font-medium ${compact ? 'text-sm' : ''}`}>{contact.name}</p>
                  {contact.phone && (
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground flex items-center gap-1 mt-1`}>
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {contact.platforms ? (
                    // Full contact object with platforms array
                    contact.platforms.map(platform => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))
                  ) : contact.phone ? (
                    // Simplified contact object with just phone badge (for ActivityAssignmentCard)
                    <Badge variant="secondary" className="text-xs">
                      📱 {contact.phone}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}