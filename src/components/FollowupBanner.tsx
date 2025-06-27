'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Lead {
  id: number
  name: string
  next_followup_date: string
  followup_notes?: string
  lead_score?: number
}

export default function FollowupBanner() {
  const [dueFollowups, setDueFollowups] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDueFollowups()
  }, [])

  const fetchDueFollowups = async () => {
    try {
      const response = await fetch('/api/leads/due-followups')
      const data = await response.json()
      setDueFollowups(data.followups || [])
    } catch (error) {
      console.error('Failed to fetch due follow-ups:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || dueFollowups.length === 0) {
    return null
  }

  const overdueDays = (dateString: string) => {
    const followupDate = new Date(dateString)
    const today = new Date()
    const diffTime = today.getTime() - followupDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyColor = (dateString: string) => {
    const days = overdueDays(dateString)
    if (days > 0) return 'bg-red-100 border-red-200'
    if (days === 0) return 'bg-orange-100 border-orange-200'
    return 'bg-yellow-100 border-yellow-200'
  }

  const getUrgencyText = (dateString: string) => {
    const days = overdueDays(dateString)
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} overdue`
    if (days === 0) return 'Due today'
    return 'Due soon'
  }

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 mb-6">
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                {dueFollowups.length} Lead{dueFollowups.length > 1 ? 's' : ''} Need Follow-up
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                You have leads scheduled for follow-up that need your attention.
              </p>
              
              <div className="space-y-2">
                {dueFollowups.slice(0, 3).map((lead) => (
                  <div key={lead.id} className={`flex items-center justify-between p-2 rounded-lg border ${getUrgencyColor(lead.next_followup_date)}`}>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-600" />
                      <div>
                        <span className="font-medium text-slate-900">{lead.name}</span>
                        {lead.followup_notes && (
                          <span className="text-xs text-slate-600 ml-2">({lead.followup_notes})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.lead_score && (
                        <Badge variant="secondary" className="text-xs">
                          Score: {lead.lead_score}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getUrgencyText(lead.next_followup_date)}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {dueFollowups.length > 3 && (
                  <p className="text-sm text-orange-600 mt-2">
                    +{dueFollowups.length - 3} more lead{dueFollowups.length - 3 > 1 ? 's' : ''} need follow-up
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Link href="/leads/inbox" className="flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}