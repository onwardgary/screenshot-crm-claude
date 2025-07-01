import { NextRequest, NextResponse } from 'next/server'
import { contactOperations } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    contactOperations.logContactAttempt(id)
    
    return NextResponse.json({ 
      message: 'Contact attempt logged successfully' 
    })
  } catch (error) {
    console.error('Failed to log contact attempt:', error)
    return NextResponse.json({ error: 'Failed to log contact attempt' }, { status: 500 })
  }
}