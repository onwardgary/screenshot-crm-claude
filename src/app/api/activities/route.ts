import { NextRequest, NextResponse } from 'next/server'
import { activityOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organized = searchParams.get('organized')
    const search = searchParams.get('search')
    const searchType = searchParams.get('searchType') || 'all'
    const platforms = searchParams.get('platforms')?.split(',').filter(Boolean)
    const temperatures = searchParams.get('temperatures')?.split(',').filter(Boolean)
    const dateRange = searchParams.get('dateRange')
    const excludeGroups = searchParams.get('excludeGroups') === 'true'
    const hasPhone = searchParams.get('hasPhone')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    
    // Get all activities first
    let activities = organized === 'false' 
      ? activityOperations.getUnorganized()
      : activityOperations.getAll()
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      activities = activities.filter(activity => {
        switch (searchType) {
          case 'name':
            return activity.person_name.toLowerCase().includes(searchLower)
          case 'phone':
            return activity.phone && activity.phone.toLowerCase().includes(searchLower)
          case 'message':
            return activity.message_content && activity.message_content.toLowerCase().includes(searchLower)
          case 'notes':
            return activity.notes && activity.notes.toLowerCase().includes(searchLower)
          case 'all':
          default:
            return activity.person_name.toLowerCase().includes(searchLower) ||
              (activity.phone && activity.phone.toLowerCase().includes(searchLower)) ||
              (activity.message_content && activity.message_content.toLowerCase().includes(searchLower)) ||
              (activity.notes && activity.notes.toLowerCase().includes(searchLower))
        }
      })
    }
    
    if (platforms && platforms.length > 0) {
      activities = activities.filter(activity => 
        platforms.includes(activity.platform.toLowerCase())
      )
    }
    
    if (temperatures && temperatures.length > 0) {
      activities = activities.filter(activity => 
        temperatures.includes(activity.temperature || 'warm')
      )
    }
    
    if (excludeGroups) {
      activities = activities.filter(activity => !activity.is_group_chat)
    }
    
    if (hasPhone === 'true') {
      activities = activities.filter(activity => activity.phone)
    } else if (hasPhone === 'false') {
      activities = activities.filter(activity => !activity.phone)
    }
    
    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      let startDate: Date
      switch (dateRange) {
        case 'today':
          startDate = today
          break
        case 'week':
          startDate = new Date(today)
          startDate.setDate(today.getDate() - 7)
          break
        case 'month':
          startDate = new Date(today)
          startDate.setMonth(today.getMonth() - 1)
          break
        default:
          startDate = new Date(0) // Beginning of time
      }
      
      activities = activities.filter(activity => 
        new Date(activity.created_at) >= startDate
      )
    }
    
    // Apply sorting
    activities.sort((a, b) => {
      let compareValue = 0
      
      switch (sort) {
        case 'person_name':
          compareValue = (a.person_name || '').localeCompare(b.person_name || '')
          break
        case 'temperature':
          const tempOrder = { 'hot': 3, 'warm': 2, 'cold': 1 }
          const aTemp = tempOrder[(a.temperature || 'warm') as keyof typeof tempOrder] || 2
          const bTemp = tempOrder[(b.temperature || 'warm') as keyof typeof tempOrder] || 2
          compareValue = aTemp - bTemp
          break
        case 'created_at':
        default:
          compareValue = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          break
      }
      
      return order === 'desc' ? -compareValue : compareValue
    })
    
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const activity = await request.json()
    const result = activityOperations.create(activity)
    
    return NextResponse.json({ 
      id: result.lastInsertRowid,
      message: 'Activity created successfully' 
    })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}