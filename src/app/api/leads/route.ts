import { NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let leads
    if (status) {
      // Handle multiple statuses separated by comma
      const statusList = status.split(',')
      if (statusList.length === 1) {
        leads = leadOperations.getByStatus(statusList[0] as 'raw' | 'active' | 'archived' | 'merged')
      } else {
        // Get leads for multiple statuses
        leads = []
        for (const s of statusList) {
          const statusLeads = leadOperations.getByStatus(s.trim() as 'raw' | 'active' | 'archived' | 'merged')
          leads.push(...statusLeads)
        }
        // Sort by updated_at DESC
        leads.sort((a, b) => new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime())
      }
    } else {
      leads = leadOperations.getAll()
    }
    
    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const leadData = await request.json()
    
    // Validate required fields
    if (!leadData.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Always create new lead (no duplicate checking during save)
    const conversation_history = []
    if (leadData.lastMessage) {
      conversation_history.push({
        message: leadData.lastMessage,
        from: leadData.lastMessageFrom,
        timestamp: leadData.timestamp || new Date().toISOString(),
        platform: leadData.platform || 'unknown'
      })
    }

    const result = leadOperations.create({
      name: leadData.name,
      phone: leadData.phone,
      platform: leadData.platform || 'unknown',
      last_message: leadData.lastMessage,
      last_message_from: leadData.lastMessageFrom,
      timestamp: leadData.timestamp,
      conversation_summary: leadData.conversationSummary,
      lead_score: leadData.leadScore,
      notes: leadData.notes,
      conversation_history: conversation_history,
      status: 'raw',  // All new leads start as raw
      is_group_chat: leadData.isGroupChat || false,
      screenshot_id: leadData.screenshotId
    })
    
    return NextResponse.json({ 
      id: result.lastInsertRowid, 
      message: 'Lead created successfully' 
    })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}