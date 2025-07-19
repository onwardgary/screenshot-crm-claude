'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle2, XCircle, Edit2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ContactEditFieldProps {
  contactId: number
  field: 'name' | 'phone' | 'notes' | 'relationship_type' | 'platforms'
  value: string | string[] | null | undefined
  onUpdate: (field: string, value: string | string[] | null) => void
  className?: string
}

export default function ContactEditField({ 
  contactId, 
  field, 
  value, 
  onUpdate, 
  className = '' 
}: ContactEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(
    field === 'relationship_type' ? (value || 'none') : (value ?? '')
  )
  const [savingField, setSavingField] = useState<string | null>(null)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Reset edit value when prop value changes, ensuring controlled inputs
  useEffect(() => {
    setEditValue(
      field === 'relationship_type' ? (value || 'none') : (value ?? '')
    )
  }, [value, field])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        if (field === 'notes') {
          textareaRef.current?.focus()
        } else if (field !== 'relationship_type' && field !== 'platforms') {
          inputRef.current?.focus()
        }
      }, 0)
    }
  }, [isEditing, field])

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
      const data = await response.json()
      
      // Ensure data is an array (API might return object with contacts array)
      const contacts = Array.isArray(data) ? data : (data.contacts || [])
      
      // Filter out current contact and check for others with same phone
      const duplicates = contacts.filter((contact: { id: number; phone?: string; name: string }) => 
        contact.id !== contactId && contact.phone === phone.trim()
      )
      
      if (duplicates.length > 0) {
        return `Another contact "${duplicates[0].name}" already has this phone number`
      }
      
      return null
    } catch (error) {
      console.error('Failed to check duplicate phone:', error)
      return null
    }
  }

  // Handle phone number input changes with validation
  const handlePhoneChange = async (newPhone: string) => {
    setEditValue(newPhone)
    setValidationError(null)
    setDuplicateWarning(null)
    
    if (field === 'phone') {
      // Validate format
      const validation = validatePhone(newPhone)
      if (validation) {
        setValidationError(validation)
        return
      }
      
      // Check for duplicates (debounced)
      if (newPhone.trim() && newPhone !== value) {
        setTimeout(async () => {
          const duplicate = await checkDuplicatePhone(newPhone)
          if (duplicate) {
            setDuplicateWarning(duplicate)
          }
        }, 500)
      }
    }
  }

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    // Validate before saving
    if (field === 'phone') {
      const phoneValue = typeof editValue === 'string' ? editValue : ''
      const validation = validatePhone(phoneValue)
      if (validation) {
        setValidationError(validation)
        return
      }
      
      // Check for duplicates one more time before saving
      const duplicate = await checkDuplicatePhone(phoneValue)
      if (duplicate) {
        setDuplicateWarning(duplicate)
        return
      }
    }

    setSavingField(field)
    setErrorField(null)
    setValidationError(null)
    setDuplicateWarning(null)

    try {
      let valueToSend: string | string[] | null = editValue
      if (field === 'relationship_type' && editValue === '') {
        valueToSend = null
      }
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: valueToSend })
      })

      if (!response.ok) {
        throw new Error('Failed to update contact')
      }

      // Optimistic update
      onUpdate(field, editValue)
      
      // Show success feedback
      setSavedField(field)
      setTimeout(() => setSavedField(null), 2000)
      
      setIsEditing(false)
      
    } catch (error) {
      console.error('Failed to update contact:', error)
      setErrorField(field)
      toast({
        title: "Update failed",
        description: `Failed to update ${field}`,
        variant: "destructive"
      })
      // Revert to original value
      setEditValue(value ?? '')
    } finally {
      setSavingField(null)
    }
  }

  const handleCancel = () => {
    setEditValue(value ?? '')
    setIsEditing(false)
    setErrorField(null)
    setValidationError(null)
    setDuplicateWarning(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field !== 'notes') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const renderEditableField = () => {
    if (!isEditing) {
      return (
        <div 
          className={`group flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-2 py-1 -mx-2 -my-1 ${className}`}
          onClick={() => setIsEditing(true)}
        >
          {renderDisplayValue()}
          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )
    }

    switch (field) {
      case 'name':
        return (
          <div className="space-y-2">
            <Input
              ref={inputRef}
              value={editValue || ''}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              placeholder="Contact name"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={savingField === field}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {renderStatusIcon()}
            </div>
          </div>
        )

      case 'phone':
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <Input
                ref={inputRef}
                value={editValue || ''}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`h-8 text-sm ${validationError ? 'border-red-500' : duplicateWarning ? 'border-yellow-500' : ''}`}
                placeholder="Phone number"
                type="tel"
              />
              {validationError && (
                <p className="text-xs text-red-600">{validationError}</p>
              )}
              {duplicateWarning && (
                <p className="text-xs text-yellow-600">{duplicateWarning}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={savingField === field}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {renderStatusIcon()}
            </div>
          </div>
        )

      case 'notes':
        return (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={editValue || ''}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm min-h-[60px]"
              placeholder="Add notes about this contact..."
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={savingField === field}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {renderStatusIcon()}
            </div>
          </div>
        )

      case 'relationship_type':
        return (
          <div className="flex items-center gap-2">
            <Select value={typeof editValue === 'string' ? (editValue || 'none') : 'none'} onValueChange={(val) => setEditValue(val === 'none' ? '' : val)}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleSave} disabled={savingField === field}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-3 h-3" />
            </Button>
            {renderStatusIcon()}
          </div>
        )

      case 'platforms':
        const availablePlatforms = ['whatsapp', 'instagram', 'tiktok', 'messenger', 'telegram', 'line', 'linkedin', 'wechat']
        const selectedPlatforms = Array.isArray(editValue) ? editValue : []
        
        return (
          <div className="space-y-3">
            {/* Platform editing container with visual separation */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 ml-8">
              <div className="text-xs text-slate-600 font-medium mb-2">Select platforms for this contact:</div>
              <div className="grid grid-cols-2 gap-2">
                {availablePlatforms.map(platform => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditValue([...selectedPlatforms, platform])
                        } else {
                          setEditValue(selectedPlatforms.filter((p: string) => p !== platform))
                        }
                      }}
                    />
                    <label htmlFor={platform} className="text-sm capitalize cursor-pointer">
                      {platform}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-8">
              <Button size="sm" onClick={handleSave} disabled={savingField === field}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {renderStatusIcon()}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderDisplayValue = () => {
    switch (field) {
      case 'name':
        return <span className="font-medium">{value || 'Unnamed Contact'}</span>
      
      case 'phone':
        return value ? (
          <span className="text-slate-600">{value}</span>
        ) : (
          <span className="text-slate-400 italic">No phone number</span>
        )
      
      case 'notes':
        return value ? (
          <span className="text-slate-600 text-sm">{value}</span>
        ) : (
          <span className="text-slate-400 italic text-sm">Click to add notes...</span>
        )
      
      case 'relationship_type':
        return value ? (
          <Badge variant="outline" className="capitalize">
            {value}
          </Badge>
        ) : (
          <span className="text-slate-400 italic text-sm">No relationship type</span>
        )
      
      case 'platforms':
        const platforms = Array.isArray(value) ? value : []
        return platforms.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {platforms.map((platform: string) => (
              <Badge key={platform} variant="secondary" className="text-xs capitalize">
                {platform}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 italic text-sm">No platforms</span>
        )
      
      default:
        return null
    }
  }

  const renderStatusIcon = () => {
    if (savingField === field) {
      return <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
    }
    if (savedField === field) {
      return <CheckCircle2 className="w-3 h-3 text-green-600" />
    }
    if (errorField === field) {
      return <XCircle className="w-3 h-3 text-red-600" />
    }
    return null
  }

  return renderEditableField()
}