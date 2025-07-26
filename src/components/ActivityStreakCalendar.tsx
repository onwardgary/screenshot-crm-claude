'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Flame, Circle } from 'lucide-react'
import { motion } from 'framer-motion'
import { getDateInTimezone, getBrowserTimezone, DEFAULT_TIMEZONE } from '@/lib/timezoneUtils'

interface ActivityStreakCalendarProps {
  activityStreak: Array<{
    activity_date: string
    daily_count: number
  }>
  currentStreak: number
}

export default function ActivityStreakCalendar({ 
  activityStreak, 
  currentStreak 
}: ActivityStreakCalendarProps) {
  const [currentWeekDays, setCurrentWeekDays] = useState<Date[]>([])
  const [isClient, setIsClient] = useState(false)

  // Get current week (Monday - Sunday) - client-side only
  useEffect(() => {
    const getCurrentWeekDays = () => {
      const days = []
      const today = new Date()
      
      // Get Monday of current week
      const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      
      // Generate Monday through Sunday
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        days.push(date)
      }
      
      return days
    }

    setCurrentWeekDays(getCurrentWeekDays())
    setIsClient(true)
  }, [])

  // Get activity for a specific date using timezone-aware formatting
  const getActivityForDate = (date: Date) => {
    // Use timezone-aware date formatting to match API
    const userTimezone = isClient ? getBrowserTimezone() : DEFAULT_TIMEZONE
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: userTimezone })
    return activityStreak.find(a => a.activity_date === dateStr)
  }


  // Get motivational message
  const getMotivationalMessage = () => {
    if (currentStreak === 0) return "Start your streak today!"
    if (currentStreak < 7) return "Keep it going!"
    if (currentStreak < 14) return "You're on fire! 🔥"
    if (currentStreak < 30) return "Incredible consistency!"
    return "Streak master! 🏆"
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Activity Streak</CardTitle>
        <Activity className="h-4 w-4 text-orange-600" />
      </CardHeader>
      <CardContent>
        {/* Streak Counter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
          <div className="flex-1">
            <div className="text-sm font-medium">{getMotivationalMessage()}</div>
            <div className="text-xs text-muted-foreground">
              {currentStreak === 1 ? 'day' : 'days'} in a row
            </div>
          </div>
        </div>


        {/* Month Header */}
        <div className="text-center mb-3">
          <div className="text-sm font-medium text-slate-600">
            {isClient && currentWeekDays.length > 0 
              ? currentWeekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : '...'
            }
          </div>
        </div>

        {/* Weekly Calendar (Monday - Sunday) */}
        <div className="grid grid-cols-7 gap-1">
          {!isClient || currentWeekDays.length === 0 ? (
            // Loading state for SSR/hydration
            Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="text-xs text-muted-foreground font-medium">...</div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Circle className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            ))
          ) : (
            currentWeekDays.map((date, index) => {
              const activity = getActivityForDate(date)
              const hasActivity = activity && activity.daily_count > 0
              const isToday = date.toDateString() === new Date().toDateString()
            
            return (
              <div key={index} className="flex flex-col items-center gap-1">
                {/* Day Label */}
                <div className="text-xs text-muted-foreground font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                
                {/* Activity Indicator */}
                <motion.div
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={
                    hasActivity 
                      ? `${activity!.daily_count} activities on ${date.toLocaleDateString()}`
                      : `No activity on ${date.toLocaleDateString()}`
                  }
                >
                  {hasActivity ? (
                    <Flame className="w-6 h-6 text-orange-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 fill-gray-100" />
                  )}
                </motion.div>

                {/* Date Number */}
                <div className="text-xs text-muted-foreground">
                  {date.getDate()}
                </div>
              </div>
            )
          }))}
        </div>

        {/* Streak Achievement */}
        {currentStreak > 0 && currentStreak % 7 === 0 && (
          <motion.div
            className="mt-4 text-center py-2 px-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-sm font-medium text-orange-800">
              🎉 {currentStreak} day milestone achieved!
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}