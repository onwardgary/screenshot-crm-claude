'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  Phone, 
  Star, 
  AlertCircle,
  Image,
  ArrowRight,
  UserPlus,
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
  activity_score?: number
  notes?: string
  is_group_chat?: boolean
  contact_id?: number // Links to organized contact
  created_at: string
  updated_at?: string
}

interface ActivityListProps {
  organized?: boolean // true = show linked to contacts, false = show unorganized
}

export default function ActivityList({ organized = false }: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set())

  const fetchActivities = useCallback(async () => {
    try {
      const url = organized 
        ? `/api/activities` 
        : `/api/activities?organized=false`
      const response = await fetch(url)
      const data = await response.json()
      setActivities(data)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }, [organized])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleOrganizeActivity = async (activityId: number) => {
    // For now, just show that it's being organized
    // Later we'll add a modal to create/link to contact
    console.log('Organizing activity:', activityId)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return '💬'
      case 'instagram':
        return '📷'
      case 'tiktok':
        return '🎵'
      case 'messenger':
        return '💬'
      default:
        return '📱'
    }
  }

  const getActivityScoreBadge = (score?: number) => {
    if (!score) return null
    
    if (score >= 8) return <Badge className="bg-green-100 text-green-800">Hot</Badge>
    if (score >= 6) return <Badge className="bg-yellow-100 text-yellow-800">Warm</Badge>
    if (score >= 4) return <Badge className="bg-blue-100 text-blue-800">Cool</Badge>
    return <Badge className="bg-gray-100 text-gray-800">Cold</Badge>
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
        <h2 className="text-xl font-semibold">
          {organized ? 'Organized Activities' : 'Unorganized Activities'}
        </h2>
        <div className="text-sm text-muted-foreground">
          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
        </div>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {activity.person_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{activity.person_name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <span>{getPlatformIcon(activity.platform)} {activity.platform}</span>
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
                  {getActivityScoreBadge(activity.activity_score)}
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
                <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">
                      {activity.message_from === 'user' ? 'You' : activity.person_name}
                    </span>
                    {activity.timestamp && (
                      <span className="text-xs text-slate-500">{activity.timestamp}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{activity.message_content}</p>
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
                    <span className="flex items-center">
                      <Image className="h-3 w-3 mr-1" />
                      Screenshot
                    </span>
                  )}
                  <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex space-x-2">
                  {!organized && !activity.contact_id && (
                    <Button 
                      size="sm" 
                      onClick={() => handleOrganizeActivity(activity.id)}
                      className="text-xs"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Organize
                    </Button>
                  )}
                  
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