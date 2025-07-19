'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Contact {
  id: number
  name: string
  phone?: string
  platforms?: string[]
  relationship_type?: 'family' | 'friend'
  notes?: string
}

interface ContactEditFormProps {
  contact: Contact
  onSave: (contactId: number, updates: Partial<Contact>) => void
  onCancel: () => void
  className?: string
}

export default function ContactEditForm({ 
  contact, 
  onSave, 
  onCancel, 
  className = '' 
}: ContactEditFormProps) {
  const [formData, setFormData] = useState({
    name: contact.name || '',
    phone: contact.phone || '',
    platforms: contact.platforms || [],
    relationship_type: contact.relationship_type || '',
    notes: contact.notes || ''
  })
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-focus name field when component mounts
  useEffect(() => {
    setTimeout(() => {
      nameInputRef.current?.focus()
    }, 0)
  }, [])

  // Phone number validation
  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) return null // Allow empty phone numbers
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')
    
    if (digitsOnly.length < 10) {
      return 'Phone number must be at least 10 digits'
    }
    if (digitsOnly.length > 15) {
      return 'Phone number cannot exceed 15 digits'
    }
    
    return null
  }

  // Check for duplicate phone numbers
  const checkDuplicatePhone = async (phone: string): Promise<string | null> => {
    if (!phone.trim()) return null
    
    try {
      const response = await fetch(`/api/contacts?search=${encodeURIComponent(phone)}&searchType=phone`)
      
      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${response.statusText}`)
        return null // Don't block save if duplicate check fails
      }
      
      const data = await response.json()
      
      // Ensure data is an array (API might return object with contacts array)
      const contacts = Array.isArray(data) ? data : (data.contacts || [])
      
      // Filter out current contact and check for others with same phone
      const duplicates = contacts.filter((c: { id: number; phone?: string; name: string }) => 
        c.id !== contact.id && c.phone === phone.trim()
      )
      
      if (duplicates.length > 0) {
        return `Another contact "${duplicates[0].name}" already has this phone number`
      }
      
      return null
    } catch (error) {
      console.error('Failed to check duplicate phone:', error)
      return null // Don't block save if duplicate check fails
    }
  }

  const handlePhoneChange = async (newPhone: string) => {
    setFormData(prev => ({ ...prev, phone: newPhone }))
    setValidationError(null)
    setDuplicateWarning(null)
    
    // Validate format
    const validation = validatePhone(newPhone)
    if (validation) {
      setValidationError(validation)
      return
    }
    
    // Check for duplicates (debounced)
    if (newPhone.trim() && newPhone !== contact.phone) {
      setTimeout(async () => {
        const duplicate = await checkDuplicatePhone(newPhone)
        if (duplicate) {
          setDuplicateWarning(duplicate)
        }
      }, 500)
    }
  }

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      platforms: checked 
        ? [...prev.platforms, platform]
        : prev.platforms.filter(p => p !== platform)
    }))
  }

  const handleSave = async () => {
    // Validate before saving
    const phoneValidation = validatePhone(formData.phone)
    if (phoneValidation) {
      setValidationError(phoneValidation)
      return
    }
    
    // Check for duplicates one more time before saving
    const duplicate = await checkDuplicatePhone(formData.phone)
    if (duplicate) {
      setDuplicateWarning(duplicate)
      return
    }

    setSaving(true)
    setValidationError(null)
    setDuplicateWarning(null)

    try {
      // Prepare updates - only include changed fields
      const updates: Partial<Contact> = {}
      
      if (formData.name !== contact.name) updates.name = formData.name
      if (formData.phone !== contact.phone) updates.phone = formData.phone || undefined
      if (JSON.stringify(formData.platforms) !== JSON.stringify(contact.platforms)) {
        updates.platforms = formData.platforms
      }
      if (formData.relationship_type !== contact.relationship_type) {
        updates.relationship_type = formData.relationship_type === '' ? undefined : formData.relationship_type as 'family' | 'friend'
      }
      if (formData.notes !== contact.notes) updates.notes = formData.notes

      // Only make API call if there are actual changes
      if (Object.keys(updates).length === 0) {
        onCancel()
        return
      }

      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Call parent's save handler with updates
      onSave(contact.id, updates)
      
      toast({
        title: "Contact updated",
        description: "Changes saved successfully"
      })
      
    } catch (error) {
      console.error('Failed to update contact:', error)
      toast({
        title: "Update failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const availablePlatforms = ['whatsapp', 'instagram', 'tiktok', 'messenger', 'telegram', 'line', 'linkedin', 'wechat']

  return (
    <div className={`bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4 ${className}`} onKeyDown={handleKeyDown}>
      {/* Edit Mode Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-blue-900">Edit Contact</h3>
        <div className="flex items-center gap-2">
          {saving ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Name</label>
        <Input
          ref={nameInputRef}
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Contact name"
          className="text-sm"
        />
      </div>

      {/* Phone Field */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Phone Number</label>
        <div className="space-y-1">
          <Input
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Phone number"
            type="tel"
            className={`text-sm ${validationError ? 'border-red-500' : duplicateWarning ? 'border-yellow-500' : ''}`}
          />
          {validationError && (
            <p className="text-xs text-red-600">{validationError}</p>
          )}
          {duplicateWarning && (
            <p className="text-xs text-yellow-600">{duplicateWarning}</p>
          )}
        </div>
      </div>

      {/* Platforms Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Platforms</label>
        <div className="grid grid-cols-2 gap-2 bg-white rounded border p-3">
          {availablePlatforms.map(platform => (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={`edit-${platform}`}
                checked={formData.platforms.includes(platform)}
                onCheckedChange={(checked) => handlePlatformToggle(platform, !!checked)}
              />
              <label htmlFor={`edit-${platform}`} className="text-sm capitalize cursor-pointer">
                {platform}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Type Field */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Relationship Type</label>
        <Select value={formData.relationship_type || 'none'} onValueChange={(val) => 
          setFormData(prev => ({ ...prev, relationship_type: val === 'none' ? '' : val }))
        }>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select relationship type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes Field */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Add notes about this contact..."
          className="text-sm min-h-[80px]"
        />
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-200">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={saving}
          className="text-sm"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saving || !!validationError || !!duplicateWarning}
          className="text-sm bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-slate-500 text-center pt-2 border-t border-blue-100">
        Press Escape to cancel • Ctrl+Enter to save
      </div>
    </div>
  )
}