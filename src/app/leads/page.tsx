'use client'

import { useEffect, useState } from 'react'
import LeadsList from '@/components/LeadsList'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Upload, Users, AlertTriangle, GitMerge, X, Check, Eye, TrendingUp, RefreshCw } from 'lucide-react'
import { Lead } from '@/lib/database'

interface MergeSuggestion {
  targetLead: Lead
  duplicateLeads: Lead[]
  confidence: number
  reason: string
}

export default function ActiveLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [contacts, setContacts] = useState<Lead[]>([])
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const [scanningForDuplicates, setScanningForDuplicates] = useState(false)

  useEffect(() => {
    fetchActiveLeads()
    fetchContacts()
    fetchMergeSuggestions()
  }, [])

  const fetchActiveLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=active')
      const data = await response.json()
      // Filter for leads only (not contacts)
      setLeads(data.filter((lead: Lead) => lead.contact_type === 'lead'))
    } catch (error) {
      console.error('Failed to fetch active leads:', error)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/leads?status=active')
      const data = await response.json()
      // Filter for contacts only
      setContacts(data.filter((lead: Lead) => lead.contact_type === 'contact'))
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    }
  }

  const fetchMergeSuggestions = async () => {
    try {
      const response = await fetch('/api/leads/merge-suggestions?status=active')
      const data = await response.json()
      setMergeSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Failed to fetch merge suggestions:', error)
    }
  }

  const handleScanForDuplicates = async () => {
    setScanningForDuplicates(true)
    try {
      await fetchMergeSuggestions()
      setShowSuggestions(true) // Show suggestions panel if it was hidden
      setShowAllSuggestions(false) // Reset to showing limited view
    } catch (error) {
      console.error('Failed to scan for duplicates:', error)
      alert('❌ Failed to scan for duplicates')
    } finally {
      setScanningForDuplicates(false)
    }
  }

  const handleMergeSuggestion = async (suggestion: MergeSuggestion) => {
    try {
      const targetId = suggestion.targetLead.id!
      const sourceIds = suggestion.duplicateLeads.map(lead => lead.id!)

      const response = await fetch('/api/leads/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, sourceIds }),
      })

      if (response.ok) {
        alert('✅ Leads merged successfully!')
        // Refresh data
        await fetchActiveLeads()
        await fetchContacts()
        await fetchMergeSuggestions()
      } else {
        alert('❌ Failed to merge leads')
      }
    } catch (error) {
      console.error('Error merging leads:', error)
      alert('❌ Failed to merge leads')
    }
  }

  const handleAcceptAllHighConfidence = async () => {
    const highConfidenceSuggestions = mergeSuggestions.filter(s => s.confidence >= 90)
    
    if (highConfidenceSuggestions.length === 0) {
      alert('No high confidence suggestions to merge')
      return
    }

    const confirmed = confirm(`Are you sure you want to merge ${highConfidenceSuggestions.length} high confidence suggestions?`)
    if (!confirmed) return

    try {
      for (const suggestion of highConfidenceSuggestions) {
        await handleMergeSuggestion(suggestion)
      }
      alert(`✅ Merged ${highConfidenceSuggestions.length} high confidence suggestions!`)
    } catch (error) {
      console.error('Error in batch merge:', error)
      alert('❌ Some merges may have failed')
    }
  }

  const groupChats = leads.filter(lead => lead.is_group_chat)
  const individualLeads = leads.filter(lead => !lead.is_group_chat)
  const highConfidenceSuggestions = mergeSuggestions.filter(s => s.confidence >= 90)
  const displayedSuggestions = showAllSuggestions ? mergeSuggestions : mergeSuggestions.slice(0, 3)
  // Removed unused variables for cleaner performance dashboard

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="leads" showLeadTabs={true} />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Performance Dashboard</h1>
              <p className="text-slate-600 text-lg">Track your outreach activity and manage nurture pipeline</p>
            </div>
          </div>
          
          {/* Performance KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">New Leads</p>
                  <p className="text-2xl font-bold text-blue-600">{individualLeads.length}</p>
                  <p className="text-xs text-slate-500">Extracted from screenshots</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Contacts</p>
                  <p className="text-2xl font-bold text-green-600">{contacts.length}</p>
                  <p className="text-xs text-slate-500">Converted leads</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Need Follow-up</p>
                  <p className="text-2xl font-bold text-red-600">{contacts.filter(c => c.last_message_from === 'contact').length}</p>
                  <p className="text-xs text-slate-500">Contacts waiting</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Duplicates</p>
                  <p className="text-2xl font-bold text-amber-600">{mergeSuggestions.length}</p>
                  <p className="text-xs text-slate-500">Potential merges</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <GitMerge className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                New Leads: {leads.length}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                Active Contacts: {contacts.length}
              </Badge>
              <div className="text-sm text-slate-600">
                Performance dashboard and nurture management
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleScanForDuplicates}
                disabled={scanningForDuplicates}
                className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <RefreshCw className={`h-4 w-4 ${scanningForDuplicates ? 'animate-spin' : ''}`} />
                {scanningForDuplicates ? 'Scanning...' : 'Scan for Duplicates'}
              </Button>
              <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700">
                <Link href="/">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Screenshot
                </Link>
              </Button>
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
                    {groupChats.length} Group Chat{groupChats.length > 1 ? 's' : ''} in Active Leads
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
                        AI detected possible duplicate leads that could be merged to clean up your active leads.
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
                    {displayedSuggestions.map((suggestion, index) => (
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
                              onClick={() => {
                                // For now, just show details - could open a modal later
                                alert(`Review ${suggestion.targetLead.name} + ${suggestion.duplicateLeads.length} similar leads\n\nConfidence: ${suggestion.confidence}%\nReason: ${suggestion.reason}\n\nSimilar leads: ${suggestion.duplicateLeads.map(l => l.name).join(', ')}`)
                              }}
                              className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleMergeSuggestion(suggestion)}
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
                        onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {showAllSuggestions ? 'Show Less' : `View All ${mergeSuggestions.length} Suggestions`}
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAcceptAllHighConfidence}
                      disabled={highConfidenceSuggestions.length === 0}
                      className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      Accept All High Confidence (90%+) {highConfidenceSuggestions.length > 0 && `(${highConfidenceSuggestions.length})`}
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
        
        {/* New Leads Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-slate-900">New Leads ({leads.length})</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              From Screenshots
            </Badge>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-slate-600 mb-4">Convert qualified leads to active contacts for nurturing</p>
            <LeadsList statusFilter="active" contactTypeFilter="lead" showConvertButton={true} />
          </div>
        </div>

        {/* Active Contacts Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Active Contacts ({contacts.length})</h2>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              Nurture Pipeline
            </Badge>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-slate-600 mb-4">Manage follow-ups and track conversations</p>
            <LeadsList statusFilter="active" contactTypeFilter="contact" showConvertButton={false} />
          </div>
        </div>
      </div>
    </div>
  )
}