import { NextResponse } from 'next/server'
import { leadOperations } from '@/lib/database'

export async function POST(request: Request) {
  try {
    const { targetId, sourceIds } = await request.json()
    
    // Validate input
    if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input. targetId and sourceIds array are required.' },
        { status: 400 }
      )
    }
    
    // Validate that all IDs are numbers
    if (!Number.isInteger(targetId) || !sourceIds.every(id => Number.isInteger(id))) {
      return NextResponse.json(
        { error: 'All IDs must be integers.' },
        { status: 400 }
      )
    }
    
    // Check if target exists
    const allLeads = leadOperations.getAll()
    const targetExists = allLeads.some(lead => lead.id === targetId)
    
    if (!targetExists) {
      return NextResponse.json(
        { error: 'Target lead not found.' },
        { status: 404 }
      )
    }
    
    // Check if all source leads exist
    const existingSourceIds = sourceIds.filter(id => 
      allLeads.some(lead => lead.id === id)
    )
    
    if (existingSourceIds.length !== sourceIds.length) {
      return NextResponse.json(
        { error: 'Some source leads not found.' },
        { status: 404 }
      )
    }
    
    // Perform the merge
    const mergedLeadId = leadOperations.merge(targetId, sourceIds)
    
    if (!mergedLeadId) {
      return NextResponse.json(
        { error: 'Failed to merge leads.' },
        { status: 500 }
      )
    }
    
    // Get the updated lead
    const updatedLead = leadOperations.getAll().find(lead => lead.id === mergedLeadId)
    
    return NextResponse.json({
      success: true,
      mergedLeadId,
      updatedLead,
      message: `Successfully merged ${sourceIds.length} leads into lead ${targetId}`
    })
    
  } catch (error) {
    console.error('Error merging leads:', error)
    return NextResponse.json(
      { error: 'Internal server error while merging leads.' },
      { status: 500 }
    )
  }
}