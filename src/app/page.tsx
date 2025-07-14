'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import ActivityStreakCalendar from '@/components/ActivityStreakCalendar'
import { getPlatformIcon } from '@/lib/platformUtils'
import { 
  Users,
  Camera,
  TrendingUp,
  Target,
  MessageCircle,
  Star,
  BarChart3
} from 'lucide-react'

interface AnalyticsData {
  activityMetrics: {
    date: string;
    count: number;
    platform: string;
    platform_breakdown: Record<string, number>;
    temperature_breakdown: Record<string, number>;
  }[]
  contactMetrics: {
    total_contacts: number
    new_contacts: number
    active_contacts: number
    converted_contacts: number
    dormant_contacts: number
    avg_contact_attempts: number
    avg_response_rate: number
  }
  activityStreak: Array<{
    activity_date: string
    daily_count: number
  }>
  timeframe: string
}

export default function HomePage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState(7)
  const [isClient, setIsClient] = useState(false)


  useEffect(() => {
    setIsClient(true)
    fetchAnalytics()
  }, [timeframe]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?days=${timeframe}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateActivityStreak = () => {
    if (!analytics?.activityStreak || !isClient) return 0
    
    let streak = 0
    const today = new Date()
    const sortedDates = analytics.activityStreak.sort((a, b) => 
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    )
    
    // Start from yesterday (or today if we have today's activity)
    const currentDate = new Date(today)
    const todayStr = today.toISOString().split('T')[0]
    const hasToday = sortedDates.some(d => d.activity_date === todayStr && d.daily_count > 0)
    
    // If no activity today, start from yesterday
    if (!hasToday) {
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    // Count backwards to find consecutive days
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayActivity = sortedDates.find(d => d.activity_date === dateStr)
      
      if (dayActivity && dayActivity.daily_count > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  const getTotalActivities = () => {
    if (!analytics?.activityMetrics) return 0
    return analytics.activityMetrics.reduce((sum, metric) => sum + (metric.count || 0), 0)
  }

  const getTopPlatform = () => {
    if (!analytics?.activityMetrics || analytics.activityMetrics.length === 0) return null
    return analytics.activityMetrics.reduce((top, current) => 
      (current.count || 0) > (top.count || 0) ? current : top
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar currentPage="dashboard" />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const activityStreak = calculateActivityStreak()
  const totalActivities = getTotalActivities()
  const topPlatform = getTopPlatform()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="dashboard" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Activity Dashboard</h1>
          <p className="text-slate-600">Track your sales activities and relationship building</p>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setTimeframe(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {/* Activity Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-2">
            <ActivityStreakCalendar 
              activityStreak={analytics?.activityStreak || []}
              currentStreak={activityStreak}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Screenshots Processed</CardTitle>
              <Camera className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.activityMetrics.reduce((sum, m) => sum + (m.count || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Last {timeframe} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <MessageCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActivities}</div>
              <p className="text-xs text-muted-foreground">
                Conversations recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Platform</CardTitle>
              <Star className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topPlatform ? topPlatform.date : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                {topPlatform ? `${topPlatform.count} activities` : 'No activities yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.contactMetrics.total_contacts || 0}</div>
              <p className="text-xs text-muted-foreground">
                People in your network
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.contactMetrics.active_contacts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently engaging
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Contact Attempts</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics?.contactMetrics.avg_contact_attempts || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per contact
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <MessageCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((analytics?.contactMetrics.avg_response_rate || 0) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average response
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        {analytics?.activityMetrics && analytics.activityMetrics.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Platform Activity Breakdown</CardTitle>
              <CardDescription>Your activity across different platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.activityMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {getPlatformIcon(metric.platform, 20)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{metric.platform}</div>
                        <div className="text-sm text-muted-foreground">
                          {metric.count || 0} total activities
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.count}</div>
                      <div className="text-sm text-muted-foreground">activities</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Status Distribution */}
        {analytics?.contactMetrics && analytics.contactMetrics.total_contacts > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Status Distribution</CardTitle>
              <CardDescription>Breakdown of your contact relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.contactMetrics.new_contacts}
                  </div>
                  <div className="text-sm text-blue-700">New</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.contactMetrics.active_contacts}
                  </div>
                  <div className="text-sm text-green-700">Active</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.contactMetrics.converted_contacts}
                  </div>
                  <div className="text-sm text-purple-700">Converted</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {analytics.contactMetrics.dormant_contacts}
                  </div>
                  <div className="text-sm text-gray-700">Dormant</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
