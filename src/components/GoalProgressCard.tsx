'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Users, MessageCircle, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Goal configuration with different targets for each KPI and timeframe
const GOALS = {
  activities: { 
    daily: 10, 
    weekly: 50, 
    monthly: 200,
    color: 'orange',
    icon: Target
  },
  newContacts: { 
    daily: 5, 
    weekly: 25, 
    monthly: 100,
    color: 'blue',
    icon: Users
  },
  activeTwoWay: { 
    daily: 3, 
    weekly: 15, 
    monthly: 60,
    color: 'green',
    icon: MessageCircle
  }
} as const

type KPIType = keyof typeof GOALS
type TimeframeType = 'daily' | 'weekly' | 'monthly'

interface GoalProgressCardProps {
  dashboard: {
    activities: {
      today: number
      thisWeek: number
      thisMonth: number
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
  } | null
}

const KPI_CYCLE_ORDER: Array<{kpi: KPIType, timeframe: TimeframeType}> = [
  { kpi: 'activities', timeframe: 'daily' },
  { kpi: 'activities', timeframe: 'weekly' },
  { kpi: 'activities', timeframe: 'monthly' },
  { kpi: 'newContacts', timeframe: 'daily' },
  { kpi: 'newContacts', timeframe: 'weekly' },
  { kpi: 'newContacts', timeframe: 'monthly' },
  { kpi: 'activeTwoWay', timeframe: 'daily' },
  { kpi: 'activeTwoWay', timeframe: 'weekly' },
  { kpi: 'activeTwoWay', timeframe: 'monthly' },
]

export default function GoalProgressCard({ dashboard }: GoalProgressCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const current = KPI_CYCLE_ORDER[currentIndex]
  const config = GOALS[current.kpi]

  const handleCycle = () => {
    setCurrentIndex((prev) => (prev + 1) % KPI_CYCLE_ORDER.length)
  }

  const getCurrentValue = () => {
    if (!dashboard) return 0
    
    switch (current.kpi) {
      case 'activities':
        return current.timeframe === 'daily' ? dashboard.activities.today :
               current.timeframe === 'weekly' ? dashboard.activities.thisWeek :
               dashboard.activities.thisMonth
      case 'newContacts':
        return current.timeframe === 'daily' ? dashboard.goals.newContacts.today :
               current.timeframe === 'weekly' ? dashboard.goals.newContacts.thisWeek :
               dashboard.goals.newContacts.thisMonth
      case 'activeTwoWay':
        return current.timeframe === 'daily' ? dashboard.goals.activeTwoWay.today :
               current.timeframe === 'weekly' ? dashboard.goals.activeTwoWay.thisWeek :
               dashboard.goals.activeTwoWay.thisMonth
      default:
        return 0
    }
  }

  const getGoalTarget = () => {
    return config[current.timeframe]
  }

  const getKPILabel = () => {
    const timeframeLabel = current.timeframe === 'daily' ? 'Daily' :
                          current.timeframe === 'weekly' ? 'Weekly' :
                          'Monthly'
    
    const kpiLabel = current.kpi === 'activities' ? 'Activities' :
                     current.kpi === 'newContacts' ? 'New Contacts' :
                     'Active Two-Way'
    
    return `${timeframeLabel} ${kpiLabel}`
  }

  const getDescription = () => {
    switch (current.kpi) {
      case 'activities':
        return 'Total conversation activities'
      case 'newContacts':
        return 'New people you reached out to'
      case 'activeTwoWay':
        return 'Contacts actively responding'
      default:
        return ''
    }
  }

  const currentValue = getCurrentValue()
  const goalTarget = getGoalTarget()
  const percentage = Math.min((currentValue / goalTarget) * 100, 100)
  const isGoalAchieved = currentValue >= goalTarget
  const remaining = Math.max(goalTarget - currentValue, 0)

  const IconComponent = config.icon
  const colorClasses = {
    orange: {
      bg: 'bg-orange-600',
      text: 'text-orange-600',
      light: 'bg-orange-50'
    },
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      light: 'bg-blue-50'
    },
    green: {
      bg: 'bg-green-600',
      text: 'text-green-600',
      light: 'bg-green-50'
    }
  }[config.color]

  return (
    <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-md" onClick={handleCycle}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{getKPILabel()}</CardTitle>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>
        <IconComponent className={`h-4 w-4 ${colorClasses.text}`} />
      </CardHeader>
      <CardContent className="flex flex-col justify-center h-full">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{getDescription()}</span>
              <span className="text-sm text-muted-foreground">{currentValue}/{goalTarget}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className={`${colorClasses.bg} h-2 rounded-full transition-all duration-500`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                key={`${current.kpi}-${current.timeframe}`}
              />
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              className="text-center pt-2"
              key={`${current.kpi}-${current.timeframe}-content`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`text-2xl font-bold ${colorClasses.text}`}>
                {Math.round(percentage)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {isGoalAchieved ? (
                  <span className="flex items-center justify-center gap-1">
                    🎉 Goal achieved!
                  </span>
                ) : (
                  `${remaining} more to go`
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress indicator dots */}
        <div className="flex justify-center gap-1 mt-4">
          {KPI_CYCLE_ORDER.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                index === currentIndex ? colorClasses.bg : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}