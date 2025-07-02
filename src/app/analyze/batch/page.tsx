'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Save, 
  AlertCircle, 
  User, 
  Phone, 
  MessageSquare, 
  TrendingUp, 
  FileImage,
  ChevronDown,
  CheckCircle
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Activity {
  person_name: string
  phone?: string
  platform?: string
  message_content?: string
  message_from?: string
  timestamp?: string
  temperature?: 'hot' | 'warm' | 'cold'
  notes?: string
  is_group_chat?: boolean
  group_warning?: string
  screenshot_id?: number
  included?: boolean
}

interface BatchAnalysisData {
  activities: Activity[]
  totalExtracted: number
  screenshots: Array<{
    id: number
    platform: string
    activities: Activity[]
  }>
}

const PLATFORMS = ['WhatsApp', 'Instagram', 'TikTok', 'Messenger', 'Telegram', 'Other'] as const
type Platform = typeof PLATFORMS[number]

export default function BatchAnalyzePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<BatchAnalysisData | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [groupChatsExcluded, setGroupChatsExcluded] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')

  useEffect(() => {
    const analysisData = sessionStorage.getItem('batchAnalysisData')
    if (!analysisData) {
      router.push('/')
      return
    }

    try {
      const parsed = JSON.parse(analysisData)
      setData(parsed)
      
      // Initialize activities with included flag and screenshot_id
      const activitiesWithFlags = parsed.activities.map((activity: Activity, index: number) => ({
        ...activity,
        included: !activity.is_group_chat,
        screenshot_id: activity.screenshot_id || parsed.screenshots?.[0]?.id
      }))
      
      setActivities(activitiesWithFlags)
    } catch (error) {
      console.error('Failed to parse analysis data:', error)
      router.push('/')
    }
  }, [router])

  const updateActivity = (index: number, updates: Partial<Activity>) => {
    setActivities(prev => {
      const newActivities = [...prev]
      newActivities[index] = { ...newActivities[index], ...updates }
      return newActivities
    })
  }

  const toggleActivity = (index: number) => {
    updateActivity(index, { included: !activities[index].included })
  }

  const toggleGroupChats = () => {
    const newExcluded = !groupChatsExcluded
    setGroupChatsExcluded(newExcluded)
    
    setActivities(prev => prev.map(activity => ({
      ...activity,
      included: activity.is_group_chat ? !newExcluded : activity.included
    })))
  }

  const bulkUpdatePlatform = (platform: Platform) => {
    setActivities(prev => prev.map(activity => ({
      ...activity,
      platform: platform.toLowerCase()
    })))
  }

  const saveActivities = async () => {
    setIsSaving(true)
    
    const includedActivities = activities.filter(a => a.included)
    let savedCount = 0
    let failedCount = 0
    
    try {
      for (const activity of includedActivities) {
        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...activity,
            temperature: activity.temperature || 'warm'
          })
        })
        
        if (response.ok) {
          savedCount++
        } else {
          failedCount++
          console.error('Failed to save activity:', activity)
        }
      }
      
      if (savedCount > 0) {
        toast({
          variant: "success",
          title: "Activities Saved Successfully!",
          description: `${savedCount} activities have been saved to your activity list.`,
        })
        
        sessionStorage.removeItem('batchAnalysisData')
        
        // Delay navigation to show the success toast
        setTimeout(() => {
          router.push('/activities')
        }, 1500)
      }
      
      if (failedCount > 0) {
        toast({
          variant: "destructive",
          title: "Some Activities Failed to Save",
          description: `${failedCount} activities could not be saved. Please try again.`,
        })
      }
      
    } catch (error) {
      console.error('Failed to save activities:', error)
      toast({
        variant: "destructive",
        title: "Error Saving Activities",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4">
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  // Group activities by platform
  const groupedActivities = activities.reduce((acc, activity, index) => {
    const platform = activity.platform || 'unknown'
    if (!acc[platform]) acc[platform] = []
    acc[platform].push({ ...activity, originalIndex: index })
    return acc
  }, {} as Record<string, (Activity & { originalIndex: number })[]>)

  // Get actual platforms present in the data (no "Other" unless it exists)
  const platformsPresent = Object.keys(groupedActivities).sort()
  
  const platformCounts = platformsPresent.map(platform => ({
    platform,
    total: groupedActivities[platform].length,
    included: groupedActivities[platform].filter(a => a.included).length
  }))

  const totalIncluded = activities.filter(a => a.included).length
  const filteredActivities = selectedPlatform === 'all' 
    ? activities.map((a, i) => ({ ...a, originalIndex: i }))
    : (groupedActivities[selectedPlatform] || [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Review Batch Activities</CardTitle>
                <CardDescription>
                  Extracted {data.totalExtracted} activities from {data.screenshots?.length || 0} screenshots
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <span>Bulk Platform Update</span>
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {PLATFORMS.map((platform) => (
                      <DropdownMenuItem 
                        key={platform}
                        onClick={() => bulkUpdatePlatform(platform)}
                      >
                        Set all to {platform}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={saveActivities} 
                  disabled={isSaving || totalIncluded === 0}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save {totalIncluded} Activities
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Platform Tabs */}
        <Tabs defaultValue="all" value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full overflow-x-auto">
            <TabsTrigger value="all" className="whitespace-nowrap">
              All ({totalIncluded}/{activities.length})
            </TabsTrigger>
            {platformCounts.map(({ platform, included, total }) => (
              <TabsTrigger key={platform} value={platform} className="capitalize whitespace-nowrap">
                {platform === 'unknown' ? 'Unknown' : platform} ({included}/{total})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedPlatform} className="mt-6">
            {/* Group Chat Filter */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exclude-groups"
                      checked={groupChatsExcluded}
                      onCheckedChange={toggleGroupChats}
                    />
                    <Label htmlFor="exclude-groups" className="cursor-pointer">
                      Exclude all group chats
                    </Label>
                  </div>
                  <Badge variant="secondary">
                    {activities.filter(a => a.is_group_chat).length} group chats detected
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Activities List */}
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const index = activity.originalIndex
                return (
                  <Card 
                    key={index}
                    className={`transition-all ${
                      !activity.included ? 'opacity-50 bg-slate-50' : ''
                    } ${activity.is_group_chat ? 'border-l-4 border-l-orange-400 bg-orange-50/30' : 'border-l-4 border-l-blue-400 bg-blue-50/10'}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox 
                          checked={activity.included}
                          onCheckedChange={() => toggleActivity(index)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 grid gap-4 md:grid-cols-2">
                          {/* Left Column */}
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-slate-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Name
                              </Label>
                              <Input 
                                value={activity.person_name || ''}
                                onChange={(e) => updateActivity(index, { person_name: e.target.value })}
                                placeholder="Contact name"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs text-slate-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Phone
                              </Label>
                              <Input 
                                value={activity.phone || ''}
                                onChange={(e) => updateActivity(index, { phone: e.target.value })}
                                placeholder="+1234567890"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs text-slate-500">Platform</Label>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between mt-1">
                                    <span className="capitalize">{activity.platform || 'Select'}</span>
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full">
                                  {PLATFORMS.map((platform) => (
                                    <DropdownMenuItem 
                                      key={platform}
                                      onClick={() => updateActivity(index, { platform: platform.toLowerCase() })}
                                    >
                                      {platform}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {/* Right Column */}
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-slate-500 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                Last Message
                              </Label>
                              <Textarea 
                                value={activity.message_content || ''}
                                onChange={(e) => updateActivity(index, { message_content: e.target.value })}
                                placeholder="Message content"
                                className="mt-1 min-h-[60px]"
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <Label className="text-xs text-slate-500">From</Label>
                                <select 
                                  value={activity.message_from || 'contact'}
                                  onChange={(e) => updateActivity(index, { message_from: e.target.value })}
                                  className="w-full mt-1 px-3 py-2 border rounded-md"
                                >
                                  <option value="contact">Contact</option>
                                  <option value="user">You</option>
                                </select>
                              </div>
                              
                              <div className="flex-1">
                                <Label className="text-xs text-slate-500">Temperature</Label>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between mt-1">
                                      <span className="capitalize flex items-center gap-1">
                                        {activity.temperature === 'hot' && '🔥 Hot'}
                                        {activity.temperature === 'warm' && '🌡️ Warm'}
                                        {activity.temperature === 'cold' && '❄️ Cold'}
                                        {!activity.temperature && '🌡️ Warm'}
                                      </span>
                                      <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-full">
                                    <DropdownMenuItem onClick={() => updateActivity(index, { temperature: 'hot' })}>
                                      🔥 Hot
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateActivity(index, { temperature: 'warm' })}>
                                      🌡️ Warm
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateActivity(index, { temperature: 'cold' })}>
                                      ❄️ Cold
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-slate-500">Notes</Label>
                              <Input 
                                value={activity.notes || ''}
                                onChange={(e) => updateActivity(index, { notes: e.target.value })}
                                placeholder="Additional notes"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Status badges */}
                        <div className="flex flex-col gap-2">
                          {activity.is_group_chat ? (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              GROUP CHAT
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              <User className="w-3 h-3 mr-1" />
                              1-on-1
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            <FileImage className="w-3 h-3 mr-1" />
                            {activity.platform || 'unknown'}
                          </Badge>
                          {activity.screenshot_id && (
                            <Badge variant="outline" className="text-xs">
                              Screenshot #{activity.screenshot_id}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {activity.group_warning && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-sm text-orange-700">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            {activity.group_warning}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                {totalIncluded} activities selected for saving
              </div>
              <Button 
                onClick={saveActivities} 
                disabled={isSaving || totalIncluded === 0}
                size="lg"
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save {totalIncluded} Activities
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}