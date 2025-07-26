import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { 
  getDateInTimezone, 
  getTimeDetailsInTimezone, 
  getMondayOfWeekInTimezone, 
  getFirstOfMonthInTimezone, 
  isWithinGracePeriod, 
  DEFAULT_TIMEZONE 
} from '@/lib/timezoneUtils'

const dbPath = path.join(process.cwd(), 'sales-activity.db')

export async function GET(request: NextRequest) {
  const db = new Database(dbPath)
  
  try {
    
    // Get timezone from query parameter or use default (Singapore)
    const { searchParams } = new URL(request.url)
    const userTimezone = searchParams.get('timezone') || DEFAULT_TIMEZONE
    
    // Calculate date ranges using timezone-aware utilities
    const todayStr = getDateInTimezone(userTimezone)
    const mondayStr = getMondayOfWeekInTimezone(userTimezone)
    const firstOfMonthStr = getFirstOfMonthInTimezone(userTimezone)
    const timeDetails = getTimeDetailsInTimezone(userTimezone)
    
    // Get activity metrics with time-based breakdowns
    const activityStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as today,
        COUNT(CASE WHEN DATE(created_at) >= ? THEN 1 END) as thisWeek,
        COUNT(CASE WHEN DATE(created_at) >= ? THEN 1 END) as thisMonth,
        COUNT(DISTINCT screenshot_id) as screenshots,
        COUNT(DISTINCT person_name) as uniquePeople
      FROM activities
    `)
    const activityMetrics = activityStmt.get(todayStr, mondayStr, firstOfMonthStr) as Record<string, number>
    
    // Get contact metrics using correct field mappings
    const contactStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_new = 1 THEN 1 END) as new,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
        COUNT(CASE WHEN relationship_status = 'converted' THEN 1 END) as converted,
        COUNT(CASE WHEN relationship_status = 'inactive' THEN 1 END) as dormant
      FROM contacts
    `)
    const contactMetrics = contactStmt.get() as Record<string, number>
    
    // Get goal tracking metrics with time-based breakdowns
    const goalMetricsStmt = db.prepare(`
      SELECT 
        -- New contacts created (time-based)
        COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as newContactsToday,
        COUNT(CASE WHEN DATE(created_at) >= ? THEN 1 END) as newContactsThisWeek,
        COUNT(CASE WHEN DATE(created_at) >= ? THEN 1 END) as newContactsThisMonth
      FROM contacts
    `)
    const goalMetrics = goalMetricsStmt.get(todayStr, mondayStr, firstOfMonthStr) as Record<string, number>
    
    // Get active two-way conversations based on recent activity
    const activeTwoWayStmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT CASE WHEN DATE(a.created_at) = ? THEN c.id END) as activeTwoWayToday,
        COUNT(DISTINCT CASE WHEN DATE(a.created_at) >= ? THEN c.id END) as activeTwoWayThisWeek,
        COUNT(DISTINCT CASE WHEN DATE(a.created_at) >= ? THEN c.id END) as activeTwoWayThisMonth
      FROM contacts c
      INNER JOIN activities a ON c.id = a.contact_id
      WHERE c.is_active = 1 AND a.message_from = 'contact'
    `)
    const activeTwoWayMetrics = activeTwoWayStmt.get(todayStr, mondayStr, firstOfMonthStr) as Record<string, number>
    
    // Get temperature distribution from latest activities
    const temperatureStmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN latest_activity.temperature = 'hot' THEN 1 END) as hot,
        COUNT(CASE WHEN latest_activity.temperature = 'warm' OR latest_activity.temperature IS NULL THEN 1 END) as warm,
        COUNT(CASE WHEN latest_activity.temperature = 'cold' THEN 1 END) as cold
      FROM contacts c
      LEFT JOIN (
        SELECT DISTINCT 
          contact_id,
          FIRST_VALUE(temperature) OVER (
            PARTITION BY contact_id 
            ORDER BY created_at DESC
          ) as temperature
        FROM activities
        WHERE contact_id IS NOT NULL
      ) latest_activity ON c.id = latest_activity.contact_id
    `)
    const temperatureMetrics = temperatureStmt.get() as Record<string, number>
    
    // Get activity streak data (last 30 days)
    const streakStmt = db.prepare(`
      SELECT DATE(created_at) as activity_date, COUNT(*) as daily_count
      FROM activities
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY activity_date DESC
    `)
    const streakData = streakStmt.all() as Array<{ activity_date: string, daily_count: number }>
    
    // Calculate current streak (only counts if today has activity OR if it's early in the day)
    let currentStreak = 0
    const sortedDates = streakData.sort((a, b) => 
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    )
    
    const hasToday = sortedDates.some(d => d.activity_date === todayStr && d.daily_count > 0)
    
    // Only count streak if user has activity today
    // Exception: If it's early in the day (before 23:59), allow yesterday's streak to continue
    const allowYesterdayStreak = !hasToday && isWithinGracePeriod(userTimezone)
    
    if (hasToday) {
      // Start counting from today using timezone-aware dates
      let checkDate = todayStr
      
      while (true) {
        const dayActivity = sortedDates.find(d => d.activity_date === checkDate)
        
        if (dayActivity && dayActivity.daily_count > 0) {
          currentStreak++
          // Move to previous day
          const currentDateObj = new Date(`${checkDate}T00:00:00`)
          currentDateObj.setDate(currentDateObj.getDate() - 1)
          checkDate = currentDateObj.toISOString().split('T')[0]
        } else {
          break
        }
      }
    } else if (allowYesterdayStreak) {
      // If it's early in the day, count yesterday's streak (grace period)
      const yesterdayDateObj = new Date(`${todayStr}T00:00:00`)
      yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1)
      let checkDate = yesterdayDateObj.toISOString().split('T')[0]
      
      while (true) {
        const dayActivity = sortedDates.find(d => d.activity_date === checkDate)
        
        if (dayActivity && dayActivity.daily_count > 0) {
          currentStreak++
          // Move to previous day
          const currentDateObj = new Date(`${checkDate}T00:00:00`)
          currentDateObj.setDate(currentDateObj.getDate() - 1)
          checkDate = currentDateObj.toISOString().split('T')[0]
        } else {
          break
        }
      }
    }
    // If no activity today and it's late in the day, streak = 0 (broken)
    
    // Get platform breakdown
    const platformStmt = db.prepare(`
      SELECT platform, COUNT(*) as count
      FROM activities
      WHERE DATE(created_at) >= ?
      GROUP BY platform
      ORDER BY count DESC
    `)
    const platformData = platformStmt.all(mondayStr) as Array<{ platform: string, count: number }>
    
    const response = {
      activities: {
        today: activityMetrics.today || 0,
        thisWeek: activityMetrics.thisWeek || 0,
        thisMonth: activityMetrics.thisMonth || 0,
        total: activityMetrics.total || 0,
        screenshots: activityMetrics.screenshots || 0,
        uniquePeople: activityMetrics.uniquePeople || 0
      },
      contacts: {
        total: contactMetrics.total || 0,
        new: contactMetrics.new || 0,
        active: contactMetrics.active || 0,
        converted: contactMetrics.converted || 0,
        dormant: contactMetrics.dormant || 0
      },
      goals: {
        newContacts: {
          today: goalMetrics.newContactsToday || 0,
          thisWeek: goalMetrics.newContactsThisWeek || 0,
          thisMonth: goalMetrics.newContactsThisMonth || 0
        },
        activeTwoWay: {
          today: activeTwoWayMetrics.activeTwoWayToday || 0,
          thisWeek: activeTwoWayMetrics.activeTwoWayThisWeek || 0,
          thisMonth: activeTwoWayMetrics.activeTwoWayThisMonth || 0
        }
      },
      temperature: {
        hot: temperatureMetrics.hot || 0,
        warm: temperatureMetrics.warm || 0,
        cold: temperatureMetrics.cold || 0
      },
      streak: {
        current: currentStreak,
        data: streakData
      },
      platforms: platformData,
      lastUpdated: timeDetails.timestamp,
      timezone: userTimezone,
      currentTime: timeDetails.date + ' ' + timeDetails.time
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch dashboard analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard analytics' }, { status: 500 })
  } finally {
    db.close()
  }
}