'use client'

import { useEffect, useState } from 'react'
import LeadsList from '@/components/LeadsList'
import Navbar from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { Archive, GitMerge, CheckCircle } from 'lucide-react'
import { Lead } from '@/lib/database'

export default function LeadArchivePage() {
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    fetchArchivedLeads()
  }, [])

  const fetchArchivedLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=archived,merged')
      const data = await response.json()
      setLeads(data)
    } catch (error) {
      console.error('Failed to fetch archived leads:', error)
    }
  }

  const archivedLeads = leads.filter(lead => lead.status === 'archived')
  const mergedLeads = leads.filter(lead => lead.status === 'merged')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="archive" showLeadTabs={true} />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-slate-400 to-gray-500 rounded-xl flex items-center justify-center">
              <Archive className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Archive</h1>
              <p className="text-slate-600 text-lg">Completed, merged, and archived leads for reference</p>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Archived</p>
                  <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Archive className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Merged Leads</p>
                  <p className="text-2xl font-bold text-blue-600">{mergedLeads.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GitMerge className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{archivedLeads.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
              Archive View
            </Badge>
            <div className="text-sm text-slate-600">
              Historical data and completed lead records
            </div>
          </div>
        </div>
        
        <LeadsList statusFilter="archived,merged" />
      </div>
    </div>
  )
}