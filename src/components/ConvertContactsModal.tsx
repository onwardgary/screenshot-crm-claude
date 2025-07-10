'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { FileStack, AlertCircle } from 'lucide-react'
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (open && activities.length > 0) {
      initializeAssignments()
    }
  }, [open, activities])

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

      // Link activity to contact
      await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId })
      })

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

    } catch (error) {
      console.error('Assignment error:', error)
      
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

  const handleAssignAll = async () => {
    setIsProcessing(true)
    setProgress(0)
    
    const pendingItems = assignmentItems.filter(item => item.status === 'pending')
    let successCount = 0
    let errorCount = 0

    // Auto-assign all pending items based on smart detection
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i]
      
      try {
        // Use smart detection to determine best assignment
        // For now, create new contacts for all (can be enhanced later)
        await handleAssignment(item.activity.id, {
          mode: 'create',
          contactData: {
            name: item.activity.person_name,
            phone: item.activity.phone || '',
            notes: `Auto-assigned from ${item.activity.platform} activity`
          }
        })
        successCount++
      } catch (error) {
        errorCount++
      }
      
      setProgress(((i + 1) / pendingItems.length) * 100)
    }

    setIsProcessing(false)
    
    if (errorCount === 0) {
      toast({
        title: "All activities assigned",
        description: `Successfully assigned ${successCount} activities to contacts`
      })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } else {
      toast({
        title: "Assignment completed with errors",
        description: `${successCount} succeeded, ${errorCount} failed`,
        variant: "destructive"
      })
    }
  }

  const pendingCount = assignmentItems.filter(item => item.status === 'pending').length
  const successCount = assignmentItems.filter(item => item.status === 'success').length
  const errorCount = assignmentItems.filter(item => item.status === 'error').length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="w-5 h-5" />
            Assign {activities.length} Activities to Contacts
          </DialogTitle>
          <DialogDescription>
            Each activity will be assigned to a contact (creating new contacts as needed)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Banner */}
          {assignmentItems.length > 0 && (
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Assignment Status</p>
                  <p className="text-sm">
                    {pendingCount} pending, {successCount} completed, {errorCount} failed
                  </p>
                </div>
              </div>
            </div>
          )}

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
                    disabled={isProcessing}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <Label>Assignment Progress</Label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Assigning activities... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignAll} 
            disabled={isProcessing || pendingCount === 0}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            {isProcessing ? 'Assigning...' : `Auto-Assign ${pendingCount} ${pendingCount === 1 ? 'Activity' : 'Activities'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}