'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Star,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react'

interface ContactHistory {
  id: number
  contact_id: number
  action_type: 'customer_conversion' | 'status_change' | 'bulk_operation' | 'created'
  old_value?: string
  new_value?: string
  description: string
  created_at: string
}

interface ContactHistoryTimelineProps {
  history: ContactHistory[]
  loading?: boolean
}

export default function ContactHistoryTimeline({ 
  history, 
  loading = false 
}: ContactHistoryTimelineProps) {
  const getHistoryIcon = (actionType: string) => {
    switch (actionType) {
      case 'customer_conversion':
        return <Star className="w-4 h-4 text-purple-600" />
      case 'status_change':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'bulk_operation':
        return <Users className="w-4 h-4 text-orange-600" />
      case 'created':
        return <TrendingUp className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getHistoryBadge = (actionType: string) => {
    switch (actionType) {
      case 'customer_conversion':
        return <Badge className="bg-purple-100 text-purple-800">Customer</Badge>
      case 'status_change':
        return <Badge className="bg-blue-100 text-blue-800">Status</Badge>
      case 'bulk_operation':
        return <Badge className="bg-orange-100 text-orange-800">Bulk</Badge>
      case 'created':
        return <Badge className="bg-gray-100 text-gray-800">Created</Badge>
      default:
        return <Badge variant="outline">Event</Badge>
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffWeeks = Math.floor(diffDays / 7)
      const diffMonths = Math.floor(diffDays / 30)
      
      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffWeeks === 1) return '1 week ago'
      if (diffWeeks < 4) return `${diffWeeks} weeks ago`
      if (diffMonths === 1) return '1 month ago'
      if (diffMonths < 12) return `${diffMonths} months ago`
      return date.toLocaleDateString()
    } catch {
      return 'Unknown time'
    }
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 border-t">
        <div className="flex items-center justify-center py-4">
          <Clock className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading contact history...</span>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="mt-4 p-4 border-t">
        <h4 className="font-semibold text-sm text-slate-700 mb-2">Contact History</h4>
        <div className="text-center py-4">
          <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No history events yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 border-t">
      <h4 className="font-semibold text-sm text-slate-700 mb-3">Contact History</h4>
      
      <div className="space-y-3">
        {history.map((entry, index) => (
          <div key={entry.id} className="flex items-start gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border">
                {getHistoryIcon(entry.action_type)}
              </div>
              {index < history.length - 1 && (
                <div className="w-px h-6 bg-gray-200 mt-2" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getHistoryBadge(entry.action_type)}
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(entry.created_at)}
                </span>
              </div>
              
              <p className="text-sm text-slate-700 mb-1">{entry.description}</p>
              
              {/* Show old/new values for status changes */}
              {entry.old_value && entry.new_value && (
                <div className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">{entry.old_value}</span>
                    <span>→</span>
                    <span className="font-medium">{entry.new_value}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}