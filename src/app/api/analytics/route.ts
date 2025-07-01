import { NextRequest, NextResponse } from 'next/server'
import { analyticsOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    const activityMetrics = analyticsOperations.getActivityMetrics(days)
    const contactMetrics = analyticsOperations.getContactMetrics()
    const activityStreak = analyticsOperations.getActivityStreak()
    
    return NextResponse.json({
      activityMetrics,
      contactMetrics,
      activityStreak,
      timeframe: `${days} days`
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}