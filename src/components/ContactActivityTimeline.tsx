'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPlatformIcon, getTemperatureBadgeWithText } from '@/lib/platformUtils'
import { 
  Image,
  Clock,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

interface Activity {
  id: number
  screenshot_id?: number
  person_name: string
  phone?: string
  platform: string
  message_content?: string
  message_from?: string
  timestamp?: string
  temperature?: 'hot' | 'warm' | 'cold'
  notes?: string
  is_group_chat?: boolean
  contact_id?: number
  created_at: string
  updated_at?: string
}

interface ContactActivityTimelineProps {
  activities: Activity[]
  loading?: boolean
  onViewScreenshot: (screenshotId: number) => void
}

export default function ContactActivityTimeline({ 
  activities, 
  loading = false, 
  onViewScreenshot 
}: ContactActivityTimelineProps) {

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    } catch {
      return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">Loading activity history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="border-t pt-4 mt-4">
        <div className="text-center py-8">
          <Clock className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-500">No activities found for this contact</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-slate-500" />
        <h4 className="font-medium text-slate-700">Activity History ({activities.length})</h4>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative">
            {/* Timeline connector */}
            {index < activities.length - 1 && (
              <div className="absolute left-4 top-12 w-px h-8 bg-slate-200"></div>
            )}
            
            <div className="flex gap-3">
              {/* Timeline dot with platform icon */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
                  {getPlatformIcon(activity.platform, 12)}
                </div>
              </div>
              
              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {activity.person_name} 
                    <span className="text-slate-500 font-normal">({activity.platform})</span>
                  </span>
                  {getTemperatureBadgeWithText(activity.temperature)}
                  <span className="text-xs text-slate-500">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
                
                {activity.message_content && (
                  <div className={`p-3 rounded-lg border-l-4 ${
                    activity.message_from === 'user' 
                      ? 'bg-blue-50 border-l-blue-400' 
                      : 'bg-green-50 border-l-green-400'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                        activity.message_from === 'user' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {activity.message_from === 'user' ? (
                          <>
                            <ArrowLeft className="w-3 h-3" />
                            You sent
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            They sent
                          </>
                        )}
                      </span>
                      {activity.timestamp && (
                        <span className="text-xs text-slate-500">
                          💬 Message: {activity.timestamp}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 italic">
                      &ldquo;{activity.message_content}&rdquo;
                    </p>
                  </div>
                )}

                {activity.notes && (
                  <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-l-yellow-400 rounded">
                    <p className="text-sm text-slate-600">{activity.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {activity.screenshot_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewScreenshot(activity.screenshot_id!)}
                      className="h-6 px-2 text-xs hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Image className="h-3 w-3 mr-1" />
                      View Screenshot
                    </Button>
                  )}
                  
                  {activity.is_group_chat && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                      Group Chat
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}