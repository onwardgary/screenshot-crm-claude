import { NextRequest, NextResponse } from 'next/server'
import { activityOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organized = searchParams.get('organized')
    
    // Get activities based on organized parameter
    const activities = organized === 'false' 
      ? activityOperations.getUnorganized()
      : activityOperations.getAll()
    
    // Calculate stats
    const stats = {
      total: activities.length,
      hot: activities.filter(a => a.temperature === 'hot').length,
      warm: activities.filter(a => a.temperature === 'warm' || !a.temperature).length,
      cold: activities.filter(a => a.temperature === 'cold').length,
      platforms: {} as Record<string, number>,
      today: 0
    }
    
    // Count by platform
    activities.forEach(activity => {
      const platform = activity.platform.toLowerCase()
      stats.platforms[platform] = (stats.platforms[platform] || 0) + 1
    })
    
    // Count today's activities
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    stats.today = activities.filter(a => {
      if (!a.created_at) return false
      const activityDate = new Date(a.created_at)
      activityDate.setHours(0, 0, 0, 0)
      return activityDate.getTime() === today.getTime()
    }).length
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch activity stats:', error)
    return NextResponse.json({ error: 'Failed to fetch activity stats' }, { status: 500 })
  }
}