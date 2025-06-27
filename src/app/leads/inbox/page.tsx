'use client'

import { useEffect, useState } from 'react'
import LeadsList from '@/components/LeadsList'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Upload, Inbox, AlertTriangle, GitMerge, X, Check, Eye, Users } from 'lucide-react'
import { Lead } from '@/lib/database'

interface MergeSuggestion {
  targetLead: Lead
  duplicateLeads: Lead[]
  confidence: number
  reason: string
}

export default function LeadInboxPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)

  useEffect(() => {
    fetchInboxLeads()
    fetchMergeSuggestions()
  }, [])

  const fetchInboxLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=raw')
      const data = await response.json()
      setLeads(data)
    } catch (error) {
      console.error('Failed to fetch inbox leads:', error)
    }
  }

  const fetchMergeSuggestions = async () => {
    try {
      const response = await fetch('/api/leads/merge-suggestions?status=raw')
      const data = await response.json()
      setMergeSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Failed to fetch merge suggestions:', error)
    }
  }

  const groupChats = leads.filter(lead => lead.is_group_chat)
  const individualLeads = leads.filter(lead => !lead.is_group_chat)
  const highConfidenceSuggestions = mergeSuggestions.filter(s => s.confidence >= 90)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Bar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/leads" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg"></div>
            <h1 className="text-xl font-semibold text-slate-900">Screenshot CRM</h1>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <Button asChild variant="outline" size="sm">
                <Link href="/leads/pipeline">Pipeline</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/leads/archive">Archive</Link>
              </Button>
            </div>
            <Button asChild className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700">
              <Link href="/">
                <Upload className="w-4 h-4 mr-2" />
                Upload Screenshot
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Inbox className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Lead Inbox</h1>
              <p className="text-slate-600 text-lg">Review and qualify raw leads from screenshot imports</p>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Raw Leads</p>
                  <p className="text-2xl font-bold text-slate-900">{individualLeads.length}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Inbox className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Group Chats</p>
                  <p className="text-2xl font-bold text-amber-600">{groupChats.length}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Merge Suggestions</p>
                  <p className="text-2xl font-bold text-blue-600">{mergeSuggestions.length}</p>
                  {highConfidenceSuggestions.length > 0 && (
                    <p className="text-xs text-green-600">{highConfidenceSuggestions.length} high confidence</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GitMerge className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              Inbox View
            </Badge>
            <div className="text-sm text-slate-600">
              Qualify leads to move them to your active pipeline
            </div>
          </div>
        </div>

        {/* Group Chat Warning */}
        {groupChats.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 mb-6">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-900 mb-1">
                    {groupChats.length} Group Chat{groupChats.length > 1 ? 's' : ''} in Inbox
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Group conversations detected. Consider reviewing if these should be individual leads or archived.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Review Group Chats
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Merge Suggestions */}
        {showSuggestions && mergeSuggestions.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50 mb-6">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <GitMerge className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-blue-900">
                        {mergeSuggestions.length} Potential Duplicate{mergeSuggestions.length > 1 ? 's' : ''} Found
                      </h3>
                      <p className="text-sm text-blue-800">
                        AI detected possible duplicate leads that could be merged to clean up your inbox.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuggestions(false)}
                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {mergeSuggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="bg-white rounded-lg border border-blue-200 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-xs ${
                                suggestion.confidence >= 90 ? 'bg-green-100 text-green-700' :
                                suggestion.confidence >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {suggestion.confidence}% confidence
                              </Badge>
                              <span className="text-sm text-slate-600">{suggestion.reason}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-500" />
                              <span className="font-medium text-slate-900">{suggestion.targetLead.name}</span>
                              <span className="text-slate-400">+</span>
                              <span className="text-slate-700">
                                {suggestion.duplicateLeads.length} similar lead{suggestion.duplicateLeads.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Merge
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">Similar leads:</span> {suggestion.duplicateLeads.map(lead => lead.name).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {mergeSuggestions.length > 3 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        View All {mergeSuggestions.length} Suggestions
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Accept All High Confidence (90%+)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuggestions(false)}
                      className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Dismiss All
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <LeadsList statusFilter="raw" />
      </div>
    </div>
  )
}