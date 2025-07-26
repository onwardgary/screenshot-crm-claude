'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import ActivityStreakCalendar from '@/components/ActivityStreakCalendar'
import GoalProgressCard from '@/components/GoalProgressCard'
import { getPlatformIcon } from '@/lib/platformUtils'
import { 
  Users,
  TrendingUp,
  Target,
  MessageCircle,
  Star,
  BarChart3
} from 'lucide-react'
import { getBrowserTimezone, DEFAULT_TIMEZONE } from '@/lib/timezoneUtils'

interface DashboardData {
  activities: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
    screenshots: number
    uniquePeople: number
  }
  contacts: {
    total: number
    new: number
    active: number
    converted: number
    dormant: number
  }
  goals: {
    newContacts: {
      today: number
      thisWeek: number
      thisMonth: number
    }
    activeTwoWay: {
      today: number
      thisWeek: number
      thisMonth: number
    }
  }
  temperature: {
    hot: number
    warm: number
    cold: number
  }
  streak: {
    current: number
    data: Array<{
      activity_date: string
      daily_count: number
    }>
  }
  platforms: Array<{
    platform: string
    count: number
  }>
  timeframe: string
  lastUpdated: string
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)


  useEffect(() => {
    setIsClient(true)
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Get user's timezone (defaults to Singapore if unable to detect)
      const userTimezone = isClient ? getBrowserTimezone() : DEFAULT_TIMEZONE
      const response = await fetch(`/api/analytics/dashboard?timezone=${encodeURIComponent(userTimezone)}`)
      const data = await response.json()
      setDashboard(data)
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStreak = () => {
    if (!dashboard?.streak || !isClient) return 0
    return dashboard.streak.current
  }

  const getTopPlatform = () => {
    if (!dashboard?.platforms || dashboard.platforms.length === 0) return null
    return dashboard.platforms[0] // Already sorted by count DESC
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

  const currentStreak = getCurrentStreak()
  const topPlatform = getTopPlatform()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="dashboard" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Activity Dashboard</h1>
          <div className="flex items-center justify-between">
            <p className="text-slate-600">Track your sales activities and relationship building</p>
            {isClient && (
              <p className="text-slate-500 text-sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
        </div>


        {/* Hero Motivation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3">
            <ActivityStreakCalendar 
              activityStreak={dashboard?.streak.data || []}
              currentStreak={currentStreak}
            />
          </div>
          
          <div className="lg:col-span-2">
            <GoalProgressCard dashboard={dashboard} />
          </div>
        </div>

        {/* Performance Pulse Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.activities.today || 0}</div>
              <p className="text-xs text-muted-foreground">
                Activities today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.activities.thisWeek || 0}</div>
              <p className="text-xs text-muted-foreground">
                Activities this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.activities.thisMonth || 0}</div>
              <p className="text-xs text-muted-foreground">
                Activities this month
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
                {topPlatform ? topPlatform.platform : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                {topPlatform ? `${topPlatform.count} activities` : 'No activities yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Relationship Health Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">People Contacted</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard?.activities.uniquePeople || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Unique individuals reached
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.contacts.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently engaging
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Engagement Rate</CardTitle>
              <MessageCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(((dashboard?.contacts.active || 0) / Math.max((dashboard?.contacts.active || 0) + (dashboard?.contacts.new || 0), 1)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Active prospects responding
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Network</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.contacts.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                People in database
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        {dashboard?.platforms && dashboard.platforms.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Platform Activity Breakdown</CardTitle>
              <CardDescription>Your activity across different platforms (this week)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.platforms.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {getPlatformIcon(platform.platform, 20)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{platform.platform}</div>
                        <div className="text-sm text-muted-foreground">
                          {platform.count} activities this week
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{platform.count}</div>
                      <div className="text-sm text-muted-foreground">activities</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Status Distribution */}
        {dashboard?.contacts && dashboard.contacts.total > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact Status Distribution</CardTitle>
              <CardDescription>Breakdown of your contact relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboard.contacts.new}
                  </div>
                  <div className="text-sm text-blue-700">New</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboard.contacts.active}
                  </div>
                  <div className="text-sm text-green-700">Active</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboard.contacts.converted}
                  </div>
                  <div className="text-sm text-purple-700">Converted</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {dashboard.contacts.dormant}
                  </div>
                  <div className="text-sm text-gray-700">Dormant</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Temperature Distribution */}
        {dashboard?.temperature && (
          <Card>
            <CardHeader>
              <CardTitle>Activity Temperature Distribution</CardTitle>
              <CardDescription>Engagement level of your recent conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {dashboard.temperature.hot}
                  </div>
                  <div className="text-sm text-red-700 flex items-center justify-center gap-1">
                    🔥 Hot
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {dashboard.temperature.warm}
                  </div>
                  <div className="text-sm text-yellow-700 flex items-center justify-center gap-1">
                    🌡️ Warm
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboard.temperature.cold}
                  </div>
                  <div className="text-sm text-blue-700 flex items-center justify-center gap-1">
                    ❄️ Cold
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
