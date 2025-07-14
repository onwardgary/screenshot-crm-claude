import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ContactFormData {
  name: string
  phone: string
  notes: string
}

interface ContactFormProps {
  data: ContactFormData
  onChange: (data: ContactFormData) => void
  idPrefix?: string
  className?: string
  disabled?: boolean
}

/**
 * Shared contact form component for creating/editing contacts
 * Used in OrganizeContactModal, ConvertContactsModal, and ActivityAssignmentCard
 */
export default function ContactForm({ 
  data, 
  onChange, 
  idPrefix = '',
  className = '',
  disabled = false
}: ContactFormProps) {
  const handleChange = (field: keyof ContactFormData, value: string) => {
    onChange({
      ...data,
      [field]: value
    })
  }

  const getFieldId = (field: string) => {
    return idPrefix ? `${field}-${idPrefix}` : field
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      <div>
        <Label htmlFor={getFieldId('name')}>Contact Name</Label>
        <Input
          id={getFieldId('name')}
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter contact name"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor={getFieldId('phone')}>Phone Number</Label>
        <Input
          id={getFieldId('phone')}
          value={data.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="Enter phone number"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor={getFieldId('notes')}>Notes</Label>
        <Textarea
          id={getFieldId('notes')}
          value={data.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Add any notes about this contact..."
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

// Export the type for consumers
export type { ContactFormData }