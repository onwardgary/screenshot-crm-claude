import { NextResponse } from 'next/server'
import { contactOperations } from '@/lib/database'

export async function GET() {
  try {
    const dueContacts = contactOperations.getDueFollowups()
    return NextResponse.json(dueContacts)
  } catch (error) {
    console.error('Failed to fetch due follow-ups:', error)
    return NextResponse.json({ error: 'Failed to fetch due follow-ups' }, { status: 500 })
  }
}