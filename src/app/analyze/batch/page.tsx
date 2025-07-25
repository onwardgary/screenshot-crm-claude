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
  FileImage,
  ChevronDown,
  CheckCircle,
  ArrowLeftRight,
  Eye
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScreenshotModal from '@/components/ScreenshotModal'

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
  is_two_way_communication?: boolean
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

const PLATFORMS = ['WhatsApp', 'Instagram', 'TikTok', 'Messenger', 'Telegram', 'Line', 'LinkedIn', 'WeChat', 'Other'] as const
type Platform = typeof PLATFORMS[number]

export default function BatchAnalyzePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<BatchAnalysisData | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [groupChatsExcluded, setGroupChatsExcluded] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(null)
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false)

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
      const activitiesWithFlags = parsed.activities.map((activity: Activity) => ({
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
    const activity = activities[index]
    const newIncluded = !activity.included
    
    updateActivity(index, { included: newIncluded })
    
    // If this is a group chat being included, check if we need to uncheck the global exclusion
    if (activity.is_group_chat && newIncluded && groupChatsExcluded) {
      setGroupChatsExcluded(false)
    }
    
    // If this is a group chat being excluded, check if all group chats are now excluded
    if (activity.is_group_chat && !newIncluded) {
      const allGroupChatsExcluded = activities.every(act => 
        !act.is_group_chat || !act.included || act === activity
      )
      if (allGroupChatsExcluded) {
        setGroupChatsExcluded(true)
      }
    }
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

  const openScreenshotModal = (screenshotId: number) => {
    setSelectedScreenshot(screenshotId)
    setIsScreenshotModalOpen(true)
  }

  const closeScreenshotModal = () => {
    setIsScreenshotModalOpen(false)
    setSelectedScreenshot(null)
  }


  const saveActivities = async () => {
    setIsSaving(true)
    
    const includedActivities = activities.filter(a => a.included)
    let savedCount = 0
    let failedCount = 0
    
    try {
      for (const activity of includedActivities) {
        // Validate required fields
        if (!activity.person_name || activity.person_name.trim() === '') {
          failedCount++
          console.error('Skipping activity with missing person_name:', activity)
          continue
        }

        if (!activity.platform || activity.platform.trim() === '') {
          failedCount++
          console.error('Skipping activity with missing platform:', activity)
          continue
        }

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
          const errorText = await response.text()
          console.error('Failed to save activity:', {
            activity,
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
        }
      }
      
      if (savedCount > 0 && failedCount === 0) {
        toast({
          variant: "success",
          title: "Activities Saved Successfully!",
          description: `${savedCount} activities have been saved to your activity list.`,
        })
        
        sessionStorage.removeItem('batchAnalysisData')
        router.push('/activities')
      } else if (savedCount > 0 && failedCount > 0) {
        toast({
          variant: "default",
          title: "Partially Saved",
          description: `${savedCount} activities saved, ${failedCount} failed (missing required data).`,
        })
        
        sessionStorage.removeItem('batchAnalysisData')
        router.push('/activities')
      } else if (failedCount > 0) {
        toast({
          variant: "destructive",
          title: "All Activities Failed to Save",
          description: `${failedCount} activities could not be saved due to missing required data.`,
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
      <div className="max-w-7xl mx-auto p-4 py-8 space-y-6">
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
                    <CardContent className="p-6">
                      <div className="grid grid-cols-[40px_80px_1fr_1fr_200px] gap-6 items-start">
                        {/* Include/Exclude Checkbox Column */}
                        <div className="flex justify-center pt-2">
                          <Checkbox 
                            checked={activity.included}
                            onCheckedChange={() => toggleActivity(index)}
                          />
                        </div>

                        {/* Screenshot Thumbnail Column */}
                        <div className="flex flex-col items-center space-y-2">
                          {activity.screenshot_id ? (
                            <div 
                              className="w-16 h-16 bg-slate-100 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden hover:border-blue-400 transition-colors"
                              onClick={() => openScreenshotModal(activity.screenshot_id!)}
                            >
                              <img
                                src={`/api/screenshots/${activity.screenshot_id}`}
                                alt={`Screenshot ${activity.screenshot_id}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                              <FileImage className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs px-2 py-1 h-auto"
                            onClick={() => activity.screenshot_id && openScreenshotModal(activity.screenshot_id)}
                            disabled={!activity.screenshot_id}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>

                        {/* Contact Information Column */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                            <User className="w-4 h-4 text-blue-600" />
                            Contact Information
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1 block">Contact Name</Label>
                              <Input 
                                value={activity.person_name || ''}
                                onChange={(e) => updateActivity(index, { person_name: e.target.value })}
                                placeholder="Contact name"
                                className="h-9"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1 block">Phone Number</Label>
                              <Input 
                                value={activity.phone || ''}
                                onChange={(e) => updateActivity(index, { phone: e.target.value })}
                                placeholder="+1234567890"
                                className="h-9"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1 block">Platform</Label>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between h-9">
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
                        </div>
                        
                        {/* Message Context Column */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                            Message Context
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1 block">Last Message</Label>
                              <Textarea 
                                value={activity.message_content || ''}
                                onChange={(e) => updateActivity(index, { message_content: e.target.value })}
                                placeholder="Message content"
                                className="min-h-[60px] text-sm"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-medium text-slate-600 mb-1 block">From</Label>
                                <select 
                                  value={activity.message_from || 'contact'}
                                  onChange={(e) => updateActivity(index, { message_from: e.target.value })}
                                  className="w-full h-9 px-3 py-2 border border-input bg-background text-sm rounded-md"
                                >
                                  <option value="contact">Contact</option>
                                  <option value="user">You</option>
                                </select>
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium text-slate-600 mb-1 block">Temperature</Label>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between h-9">
                                      <span className="flex items-center gap-1 text-sm">
                                        {activity.temperature === 'hot' && '🔥 Hot'}
                                        {activity.temperature === 'warm' && '🌡️ Warm'}
                                        {activity.temperature === 'cold' && '❄️ Cold'}
                                        {!activity.temperature && '🌡️ Warm'}
                                      </span>
                                      <ChevronDown className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
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

                            {/* Two-Way Communication - Prominent */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Checkbox 
                                  checked={activity.is_two_way_communication || false}
                                  onCheckedChange={(checked) => updateActivity(index, { is_two_way_communication: !!checked })}
                                />
                                <div className="flex items-center gap-2">
                                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                                  <Label className="text-sm font-medium text-blue-900 cursor-pointer">
                                    Two-way conversation
                                  </Label>
                                </div>
                              </div>
                              <p className="text-xs text-blue-700 mt-1 ml-6">Both sides have communicated</p>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1 block">Notes</Label>
                              <Input 
                                value={activity.notes || ''}
                                onChange={(e) => updateActivity(index, { notes: e.target.value })}
                                placeholder="Additional notes"
                                className="h-9"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions Column */}
                        <div className="space-y-4">
                          
                          {/* Status badges */}
                          <div className="space-y-2">
                            {activity.is_group_chat ? (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                GROUP CHAT
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                <User className="w-3 h-3 mr-1" />
                                1-on-1
                              </Badge>
                            )}
                            
                            <Badge variant="outline" className="text-xs capitalize block">
                              <FileImage className="w-3 h-3 mr-1" />
                              {activity.platform || 'unknown'}
                            </Badge>
                            
                            {activity.timestamp && (
                              <Badge variant="outline" className="text-xs block">
                                {activity.timestamp}
                              </Badge>
                            )}
                          </div>
                          
                          {activity.group_warning && (
                            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              {activity.group_warning}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Clean Bottom Save Section */}
        <div className="bg-white border-t border-slate-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">{totalIncluded} activities selected</span>
              </div>
              {totalIncluded > 0 && (
                <div className="text-xs text-slate-500">
                  Ready to save to your activity list
                </div>
              )}
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
        </div>
      </div>

      {/* Screenshot Modal */}
      <ScreenshotModal
        screenshotId={selectedScreenshot}
        isOpen={isScreenshotModalOpen}
        onClose={closeScreenshotModal}
      />
    </div>
  )
}