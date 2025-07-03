'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { FileStack, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

interface ConversionItem {
  activity: Activity
  selected: boolean
  status: 'pending' | 'creating' | 'success' | 'error'
  message?: string
}

export default function ConvertContactsModal({
  open,
  onClose,
  activities,
  onSuccess
}: ConvertContactsModalProps) {
  const [conversionItems, setConversionItems] = useState<ConversionItem[]>([])
  const [relationshipType, setRelationshipType] = useState('stranger')
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (open && activities.length > 0) {
      // Initialize conversion items
      const items = activities.map(activity => ({
        activity,
        selected: !activity.is_group_chat, // Auto-exclude group chats
        status: 'pending' as const,
      }))
      setConversionItems(items)
    }
  }, [open, activities])

  const selectedCount = conversionItems.filter(item => item.selected).length

  const toggleSelection = (index: number) => {
    setConversionItems(prev => {
      const updated = [...prev]
      updated[index].selected = !updated[index].selected
      return updated
    })
  }

  const handleConvert = async () => {
    setIsConverting(true)
    setProgress(0)
    
    const itemsToConvert = conversionItems.filter(item => item.selected)
    const totalItems = itemsToConvert.length
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < itemsToConvert.length; i++) {
      const item = itemsToConvert[i]
      
      // Update status to creating
      setConversionItems(prev => prev.map(ci => 
        ci.activity.id === item.activity.id 
          ? { ...ci, status: 'creating' } 
          : ci
      ))

      try {
        // Create contact
        const contactResponse = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.activity.person_name,
            phone: item.activity.phone,
            platforms: [item.activity.platform],
            relationship_type: relationshipType,
            notes: `Created from ${item.activity.platform} activity`
          })
        })

        if (!contactResponse.ok) throw new Error('Failed to create contact')
        const { id: contactId } = await contactResponse.json()

        // Link activity to contact
        await fetch(`/api/activities/${item.activity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_id: contactId })
        })

        // Update status to success
        setConversionItems(prev => prev.map(ci => 
          ci.activity.id === item.activity.id 
            ? { ...ci, status: 'success', message: 'Contact created' } 
            : ci
        ))
        successCount++
      } catch (error) {
        // Update status to error
        setConversionItems(prev => prev.map(ci => 
          ci.activity.id === item.activity.id 
            ? { ...ci, status: 'error', message: 'Failed to create contact' } 
            : ci
        ))
        errorCount++
      }

      // Update progress
      setProgress(((i + 1) / totalItems) * 100)
    }

    // Show summary toast
    if (successCount > 0) {
      toast({
        title: "Conversion complete",
        description: `Successfully created ${successCount} contacts${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
      })
    } else {
      toast({
        title: "Conversion failed",
        description: "No contacts were created. Please try again.",
        variant: "destructive"
      })
    }

    // If all successful, close after a delay to show results
    if (errorCount === 0) {
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    }

    setIsConverting(false)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp': return '💬'
      case 'instagram': return '📷'
      case 'tiktok': return '🎵'
      case 'messenger': return '💬'
      default: return '📱'
    }
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="w-5 h-5" />
            Convert {activities.length} Activities to Individual Contacts
          </DialogTitle>
          <DialogDescription>
            Each selected activity will be converted into its own contact
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Relationship Type Selector */}
          <div>
            <Label htmlFor="relationship">Default Relationship Type for All</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType} disabled={isConverting}>
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

          {/* Conversion List */}
          <div>
            <Label className="mb-2 block">Activities to Convert</Label>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <div className="space-y-2">
                {conversionItems.map((item, index) => (
                  <div
                    key={item.activity.id}
                    className={`p-3 rounded-md border ${
                      item.status === 'success' ? 'border-green-200 bg-green-50' :
                      item.status === 'error' ? 'border-red-200 bg-red-50' :
                      item.status === 'creating' ? 'border-blue-200 bg-blue-50' :
                      'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.status === 'pending' && (
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => toggleSelection(index)}
                            disabled={isConverting}
                          />
                        )}
                        {item.status === 'creating' && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        {item.status === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                        {item.status === 'error' && (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.activity.person_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {getPlatformIcon(item.activity.platform)} {item.activity.platform}
                            </span>
                            {item.activity.temperature && (
                              <span className="text-sm">
                                {getTemperatureEmoji(item.activity.temperature)}
                              </span>
                            )}
                          </div>
                          {item.activity.phone && (
                            <div className="text-sm text-muted-foreground">{item.activity.phone}</div>
                          )}
                          {item.activity.is_group_chat && (
                            <div className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              Group chat - not selected
                            </div>
                          )}
                          {item.message && (
                            <div className={`text-sm mt-1 ${
                              item.status === 'error' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {item.message}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        → New Contact
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Progress Bar */}
          {isConverting && (
            <div className="space-y-2">
              <Label>Conversion Progress</Label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Creating contacts... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConvert} 
            disabled={isConverting || selectedCount === 0}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            {isConverting ? 'Converting...' : `Convert ${selectedCount} Contacts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}