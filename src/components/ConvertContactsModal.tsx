'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileStack } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { fetchExistingContacts, type ExistingContact } from '@/lib/contactDetection'
import ActivityAssignmentCard from './ActivityAssignmentCard'

interface Activity {
  id: number
  person_name: string
  phone?: string
  platform: string
  temperature?: 'hot' | 'warm' | 'cold'
  is_group_chat?: boolean
}

interface ConvertContactsModalProps {
  open: boolean
  onClose: () => void
  activities: Activity[]
  onSuccess: () => void
}

interface AssignmentItem {
  activity: Activity
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
}

export default function ConvertContactsModal({
  open,
  onClose,
  activities,
  onSuccess
}: ConvertContactsModalProps) {
  const [assignmentItems, setAssignmentItems] = useState<AssignmentItem[]>([])
  const [existingContacts, setExistingContacts] = useState<ExistingContact[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open && activities.length > 0) {
      initializeAssignments()
    }
  }, [open, activities]) // eslint-disable-line react-hooks/exhaustive-deps


  const initializeAssignments = async () => {
    // Fetch existing contacts for detection
    const existingContactsData = await fetchExistingContacts()
    setExistingContacts(existingContactsData)

    // Initialize assignment items - exclude group chats by default
    const items = activities
      .filter(activity => !activity.is_group_chat)
      .map(activity => ({
        activity,
        status: 'pending' as const
      }))
    
    setAssignmentItems(items)
  }

  const handleAssignment = async (
    activityId: number, 
    assignmentData: {
      mode: 'create' | 'link'
      contactId?: number
      contactData?: {
        name: string
        phone: string
        notes: string
      }
    }
  ) => {
    // Update status to processing
    setAssignmentItems(prev => prev.map(item => 
      item.activity.id === activityId 
        ? { ...item, status: 'processing' } 
        : item
    ))

    try {
      let contactId: number

      if (assignmentData.mode === 'create' && assignmentData.contactData) {
        // Create new contact
        const contactResponse = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: assignmentData.contactData.name,
            phone: assignmentData.contactData.phone,
            platforms: [assignmentItems.find(item => item.activity.id === activityId)?.activity.platform],
            notes: assignmentData.contactData.notes
          })
        })

        if (!contactResponse.ok) throw new Error('Failed to create contact')
        const { id: newContactId } = await contactResponse.json()
        contactId = newContactId
      } else if (assignmentData.mode === 'link' && assignmentData.contactId) {
        // Use existing contact
        contactId = assignmentData.contactId
      } else {
        throw new Error('Invalid assignment data')
      }

      // Link activity to contact using bulk API
      const linkResponse = await fetch('/api/activities/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityIds: [activityId],
          contactId
        })
      })

      if (!linkResponse.ok) {
        throw new Error('Failed to link activity to contact')
      }

      // Update status to success
      setAssignmentItems(prev => prev.map(item => 
        item.activity.id === activityId 
          ? { ...item, status: 'success', message: 'Successfully assigned' } 
          : item
      ))

      toast({
        title: "Activity assigned",
        description: `Activity successfully assigned to contact`
      })

      // Immediately refresh activities list
      onSuccess()

    } catch (err) {
      console.error('Assignment error:', err)
      
      // Update status to error
      setAssignmentItems(prev => prev.map(item => 
        item.activity.id === activityId 
          ? { ...item, status: 'error', message: 'Assignment failed' } 
          : item
      ))

      toast({
        title: "Assignment failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    }
  }


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="w-5 h-5" />
            Assign {activities.length} Activities to Contacts
          </DialogTitle>
          <DialogDescription>
            Review and assign each activity individually. Use Smart Organize for bulk automated assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignment List */}
          <div>
            <Label className="mb-2 block">Activities to Assign</Label>
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-4">
                {assignmentItems.map((item) => (
                  <ActivityAssignmentCard
                    key={item.activity.id}
                    activity={item.activity}
                    existingContacts={existingContacts}
                    onAssign={handleAssignment}
                    status={item.status}
                    disabled={false}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}