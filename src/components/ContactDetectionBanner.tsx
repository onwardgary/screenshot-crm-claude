import { AlertCircle, CheckCircle, Info } from 'lucide-react'
import { ContactDetectionResult } from '@/lib/contactDetection'

interface ContactDetectionBannerProps {
  detectionResult: ContactDetectionResult | null
  className?: string
}

/**
 * Shared component for displaying contact detection results
 * Used in OrganizeContactModal, ConvertContactsModal, and ActivityAssignmentCard
 */
export default function ContactDetectionBanner({ 
  detectionResult, 
  className = "" 
}: ContactDetectionBannerProps) {
  if (!detectionResult) {
    return null
  }

  // Case 1: Existing contact found
  if (detectionResult.existingContact) {
    const isHighConfidence = detectionResult.confidence === 'high'
    
    return (
      <div className={`p-4 rounded-lg border ${
        isHighConfidence
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      } ${className}`}>
        <div className="flex items-start gap-3">
          {isHighConfidence ? (
            <CheckCircle className="w-5 h-5 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold mb-1">
              {isHighConfidence ? 'Existing Contact Found!' : 'Possible Match Found'}
            </p>
            <p className="text-sm">
              Found existing contact: <strong>{detectionResult.existingContact.name}</strong>
              {detectionResult.existingContact.phone && ` (${detectionResult.existingContact.phone})`}
            </p>
            <p className="text-xs mt-1 opacity-75">
              {detectionResult.reason} • {detectionResult.confidence} confidence
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Case 2: No existing contact found
  return (
    <div className={`p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 ${className}`}>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold mb-1">No Existing Contact Found</p>
          <p className="text-sm">
            No similar contacts detected. A new contact will be created.
          </p>
          <p className="text-xs mt-1 opacity-75">
            {detectionResult.reason}
          </p>
        </div>
      </div>
    </div>
  )
}