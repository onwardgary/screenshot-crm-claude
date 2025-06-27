import { NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function GET() {
  try {
    const dueFollowups = leadOperations.getDueFollowups()

    return NextResponse.json({
      followups: dueFollowups,
      count: dueFollowups.length
    })

  } catch (error) {
    console.error('Error getting due follow-ups:', error)
    return NextResponse.json(
      { error: 'Failed to get due follow-ups' },
      { status: 500 }
    )
  }
}