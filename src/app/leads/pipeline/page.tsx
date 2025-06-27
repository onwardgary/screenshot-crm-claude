'use client'

import { useEffect, useState } from 'react'
import LeadsList from '@/components/LeadsList'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Upload, Target, Users, TrendingUp } from 'lucide-react'
import { Lead } from '@/lib/database'

export default function LeadPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    fetchPipelineLeads()
  }, [])

  const fetchPipelineLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=active')
      const data = await response.json()
      setLeads(data)
    } catch (error) {
      console.error('Failed to fetch pipeline leads:', error)
    }
  }

  const highScoreLeads = leads.filter(lead => (lead.lead_score || 0) >= 8)
  const needFollowUp = leads.filter(lead => lead.last_message_from === 'contact')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="pipeline" showLeadTabs={true} />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Active Pipeline</h1>
              <p className="text-slate-600 text-lg">Qualified leads in your active sales process</p>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Leads</p>
                  <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Need Follow-up</p>
                  <p className="text-2xl font-bold text-red-600">{needFollowUp.length}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">High Priority</p>
                  <p className="text-2xl font-bold text-amber-600">{highScoreLeads.length}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Badge className="w-5 h-5 bg-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              Pipeline View
            </Badge>
            <div className="text-sm text-slate-600">
              Focus on qualified leads ready for conversion
            </div>
          </div>
        </div>
        
        <LeadsList statusFilter="active" />
      </div>
    </div>
  )
}