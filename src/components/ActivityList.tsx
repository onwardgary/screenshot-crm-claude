'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Phone, 
  Image,
  ArrowRight,
  Users,
  Activity
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
  contact_id?: number // Links to organized contact
  created_at: string
  updated_at?: string
}

interface ActivityListProps {
  organized?: boolean // true = show linked to contacts, false = show unorganized
  activities: Activity[]
  loading?: boolean
  onSelectionChange?: (selectedIds: number[]) => void
  selectedIds?: number[]
}

export default function ActivityList({ organized = false, activities, loading = false, onSelectionChange, selectedIds = [] }: ActivityListProps) {
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set())
  const [isClient, setIsClient] = useState(false)

  // Ensure client-side rendering for date operations
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sync selectedActivities with external selectedIds
  useEffect(() => {
    setSelectedActivities(new Set(selectedIds))
  }, [selectedIds])


  const toggleSelection = (activityId: number) => {
    const newSelected = new Set(selectedActivities)
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId)
    } else {
      newSelected.add(activityId)
    }
    setSelectedActivities(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }

  const toggleSelectAll = () => {
    if (selectedActivities.size === activities.length && activities.length > 0) {
      // Deselect all
      setSelectedActivities(new Set())
      onSelectionChange?.([])
    } else {
      // Select all
      const allIds = new Set(activities.map(a => a.id))
      setSelectedActivities(allIds)
      onSelectionChange?.(Array.from(allIds))
    }
  }

  const getPlatformIcon = (platform: string, size = 16) => {
    const iconMap: Record<string, string> = {
      'whatsapp': '/icons/whatsapp.svg',
      'instagram': '/icons/instagram.svg',
      'messenger': '/icons/messenger.svg',
      'telegram': '/icons/telegram.svg',
      'tiktok': '/icons/tiktok.svg',
      'line': '/icons/line.svg',
      'linkedin': '/icons/linkedin.svg',
      'wechat': '/icons/wechat.svg'
    }
    
    const iconPath = iconMap[platform.toLowerCase()] || '/icons/phone.svg'
    
    return (
      <img 
        src={iconPath} 
        alt={`${platform} icon`}
        width={size} 
        height={size}
        className="inline-block"
      />
    )
  }

  const getTemperatureBadge = (temperature?: string) => {
    switch (temperature) {
      case 'hot':
        return <Badge className="bg-red-100 text-red-800">🔥 Hot</Badge>
      case 'warm':
        return <Badge className="bg-orange-100 text-orange-800">🌡️ Warm</Badge>
      case 'cold':
        return <Badge className="bg-blue-100 text-blue-800">❄️ Cold</Badge>
      default:
        return <Badge className="bg-orange-100 text-orange-800">🌡️ Warm</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center p-8">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {organized ? 'No organized activities' : 'No unorganized activities'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {organized 
            ? 'Activities linked to contacts will appear here' 
            : 'Upload screenshots to create new activities'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {!organized && activities.length > 0 && (
            <Checkbox
              checked={selectedActivities.size === activities.length}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all activities"
            />
          )}
          <h2 className="text-xl font-semibold">
            {organized ? 'Organized Activities' : 'Unorganized Activities'}
          </h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedActivities.size > 0 ? (
            <span className="font-medium text-primary">
              {selectedActivities.size} selected
            </span>
          ) : (
            `${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}`
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card 
            key={activity.id} 
            className={`hover:shadow-md transition-shadow ${
              selectedActivities.has(activity.id) ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {!organized && (
                    <Checkbox
                      checked={selectedActivities.has(activity.id)}
                      onCheckedChange={() => toggleSelection(activity.id)}
                      aria-label={`Select ${activity.person_name}`}
                    />
                  )}
                  <div>
                    <CardTitle className="text-base">{activity.person_name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <span className="flex items-center gap-1">
                        {getPlatformIcon(activity.platform, 14)}
                        {activity.platform}
                      </span>
                      {activity.phone && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {activity.phone}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTemperatureBadge(activity.temperature)}
                  {activity.is_group_chat && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      <Users className="h-3 w-3 mr-1" />
                      Group
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {activity.message_content && (
                <div className={`mb-3 p-3 bg-slate-50 rounded-lg border-l-4 ${
                  activity.message_from === 'user' ? 'border-l-blue-400' : 'border-l-green-400'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                        activity.message_from === 'user' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {activity.message_from === 'user' ? (
                          <>← You sent</>
                        ) : (
                          <>→ They sent</>
                        )}
                      </span>
                      {activity.timestamp && (
                        <span className="text-xs text-slate-500">
                          💬 Message: {activity.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 italic">&ldquo;{activity.message_content}&rdquo;</p>
                </div>
              )}

              {activity.notes && (
                <div className="mb-3">
                  <p className="text-sm text-slate-600">{activity.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  {activity.screenshot_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/api/screenshots/${activity.screenshot_id}`, '_blank')}
                      className="h-6 px-2 text-xs hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Image className="h-3 w-3 mr-1" />
                      View Screenshot
                    </Button>
                  )}
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    📱 Added: {isClient ? new Date(activity.created_at).toLocaleDateString() : activity.created_at.split('T')[0]}
                  </span>
                </div>

                <div className="flex space-x-2">
                  {activity.contact_id && (
                    <Badge variant="outline" className="text-xs">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Contact #{activity.contact_id}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}