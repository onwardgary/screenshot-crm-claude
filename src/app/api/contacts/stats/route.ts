import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'sales-activity.db')

export async function GET() {
  const db = new Database(dbPath)
  
  try {
    // Get contact counts by new separate field system
    const statusStmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN is_new = 1 THEN 1 END) as new,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
        COUNT(CASE WHEN relationship_status = 'converted' THEN 1 END) as converted,
        COUNT(CASE WHEN relationship_status = 'inactive' THEN 1 END) as inactive,
        COUNT(*) as total
      FROM contacts
    `)
    const statusCounts = statusStmt.get() as Record<string, number>

    // Get two-way communication count
    const twoWayStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM contacts c
      WHERE EXISTS (
        SELECT 1 FROM activities a 
        WHERE a.contact_id = c.id 
        AND a.message_from = 'contact'
      )
    `)
    const twoWayCount = twoWayStmt.get() as { count: number }

    // Get platform distribution from contacts
    const platformStmt = db.prepare(`
      SELECT c.platforms, COUNT(*) as contact_count
      FROM contacts c
      WHERE c.platforms IS NOT NULL AND c.platforms != '[]'
      GROUP BY c.platforms
    `)
    const platformRows = platformStmt.all() as { platforms: string, contact_count: number }[]
    
    // Process platform data
    const platforms: Record<string, number> = {}
    platformRows.forEach(row => {
      try {
        const contactPlatforms = JSON.parse(row.platforms) as string[]
        contactPlatforms.forEach(platform => {
          platforms[platform] = (platforms[platform] || 0) + row.contact_count
        })
      } catch {
        // Skip invalid JSON
      }
    })

    // Get temperature distribution from latest activities
    const temperatureStmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN latest_activity.temperature = 'hot' THEN 1 END) as hot,
        COUNT(CASE WHEN latest_activity.temperature = 'warm' THEN 1 END) as warm,
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
    const temperatureCounts = temperatureStmt.get() as Record<string, number>

    return NextResponse.json({
      new: statusCounts.new || 0,
      active: statusCounts.active || 0,
      converted: statusCounts.converted || 0,
      inactive: statusCounts.inactive || 0,
      total: statusCounts.total || 0,
      twoWay: twoWayCount.count || 0,
      platforms,
      temperatures: {
        hot: temperatureCounts.hot || 0,
        warm: temperatureCounts.warm || 0,
        cold: temperatureCounts.cold || 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch contact stats:', error)
    return NextResponse.json({ error: 'Failed to fetch contact stats' }, { status: 500 })
  } finally {
    db.close()
  }
}