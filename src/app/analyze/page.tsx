'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Upload,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface ExtractedLead {
  id: string
  name: string
  phone?: string
  platform: string
  lastMessage?: string
  lastMessageFrom?: string
  timestamp?: string
  leadScore?: number
  notes?: string
  skip?: boolean
  isGroupChat?: boolean
  groupWarning?: string
}

interface AnalysisResult {
  platform: string
  activities?: ExtractedLead[]
  activitiesCreated?: ExtractedLead[]
  leads?: ExtractedLead[]
  totalActivities?: number
  totalNewLeads?: number
  totalDuplicates?: number
  totalUpdated?: number
  screenshotId?: number
}

function AnalyzePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null)
  const [editedLeads, setEditedLeads] = useState<ExtractedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Get analysis data from URL params or sessionStorage
    const dataParam = searchParams.get('data')
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam)) as AnalysisResult
        setAnalysisData(parsed)
        // Add unique IDs and initialize edited leads - support both old and new structure
        const leadsData = parsed.activities || parsed.leads || []
        const leadsWithIds = leadsData.map((lead, index) => ({
          // Map API field names to expected field names
          id: `lead-${index}`,
          name: lead.person_name || lead.name || '',
          phone: lead.phone || '',
          platform: lead.platform || parsed.platform || '',
          lastMessage: lead.message_content || lead.lastMessage || '',
          lastMessageFrom: lead.message_from || lead.lastMessageFrom || '',
          timestamp: lead.timestamp || '',
          leadScore: lead.activity_score || lead.leadScore || 5,
          notes: lead.notes || '',
          isGroupChat: lead.is_group_chat || lead.isGroupChat || false,
          groupWarning: lead.group_warning || lead.groupWarning || '',
          skip: (lead.is_group_chat || lead.isGroupChat) || false  // Auto-skip group chats
        }))
        setEditedLeads(leadsWithIds)
      } catch (error) {
        console.error('Failed to parse analysis data:', error)
        router.push('/')
      }
    } else {
      // Try to get from sessionStorage
      const storedData = sessionStorage.getItem('analysisData')
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData) as AnalysisResult
          setAnalysisData(parsed)
          // Support both old and new structure
          const leadsData = parsed.activities || parsed.leads || []
          const leadsWithIds = leadsData.map((lead, index) => ({
            // Map API field names to expected field names
            id: `lead-${index}`,
            name: lead.person_name || lead.name || '',
            phone: lead.phone || '',
            platform: lead.platform || parsed.platform || '',
            lastMessage: lead.message_content || lead.lastMessage || '',
            lastMessageFrom: lead.message_from || lead.lastMessageFrom || '',
            timestamp: lead.timestamp || '',
            leadScore: lead.activity_score || lead.leadScore || 5,
            notes: lead.notes || '',
            isGroupChat: lead.is_group_chat || lead.isGroupChat || false,
            groupWarning: lead.group_warning || lead.groupWarning || '',
            skip: (lead.is_group_chat || lead.isGroupChat) || false  // Auto-skip group chats
          }))
          setEditedLeads(leadsWithIds)
        } catch {
          router.push('/')
        }
      } else {
        router.push('/')
      }
    }
    setLoading(false)
  }, [searchParams, router])

  const updateLead = (leadId: string, field: keyof ExtractedLead, value: string | number | boolean | null) => {
    setEditedLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, [field]: value } : lead
    ))
  }

  const toggleSkip = (leadId: string) => {
    setEditedLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, skip: !lead.skip } : lead
    ))
  }

  const removeLead = (leadId: string) => {
    setEditedLeads(prev => prev.filter(lead => lead.id !== leadId))
  }

  const saveLeads = async () => {
    setSaving(true)
    try {
      const leadsToSave = editedLeads.filter(lead => !lead.skip)
      
      // Convert leads to the format expected by the activities API
      const activitiesData = leadsToSave.map(lead => ({
        person_name: lead.name,
        phone: lead.phone,
        platform: lead.platform || analysisData?.platform || 'unknown',
        message_content: lead.lastMessage,
        message_from: lead.lastMessageFrom,
        timestamp: lead.timestamp,
        activity_score: lead.leadScore,
        notes: lead.notes,
        is_group_chat: lead.isGroupChat || false,
        screenshot_id: analysisData?.screenshotId
      }))

      // Call the activities API
      for (const activity of activitiesData) {
        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity)
        })
        
        if (!response.ok) {
          throw new Error('Failed to save activity')
        }
      }

      // Clear stored data and redirect
      sessionStorage.removeItem('analysisData')
      router.push('/activities?success=true')
    } catch (error) {
      console.error('Error saving leads:', error)
      alert('Failed to save leads. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getPlatformColor = (platform: string) => {
    const platforms = {
      whatsapp: 'bg-green-100 text-green-700',
      instagram: 'bg-pink-100 text-pink-700',
      tiktok: 'bg-slate-100 text-slate-700',
      messenger: 'bg-blue-100 text-blue-700',
      other: 'bg-gray-100 text-gray-700'
    }
    return platforms[platform as keyof typeof platforms] || platforms.other
  }

  const getLeadScoreColor = (score?: number) => {
    if (!score) return 'bg-slate-100 text-slate-700'
    if (score >= 8) return 'bg-green-100 text-green-700'
    if (score >= 6) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          <span className="text-slate-600">Loading analysis...</span>
        </div>
      </div>
    )
  }

  if (!analysisData || editedLeads.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No activities to review</h3>
            <p className="text-slate-600 text-center mb-6">
              No activities were extracted from the screenshot, or the data is no longer available.
            </p>
            <Button onClick={() => router.push('/')} className="bg-sky-600 hover:bg-sky-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeLeads = editedLeads.filter(lead => !lead.skip)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Review Extracted Activities</h1>
              <p className="text-slate-600">Review and edit the activities extracted from your screenshot before saving them.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className={getPlatformColor(analysisData.platform)}>
              Platform: {analysisData.platform}
            </Badge>
            <span className="text-sm text-slate-600">
              {activeLeads.length} activities to save ({editedLeads.length - activeLeads.length} skipped)
            </span>
          </div>
        </div>

        {/* Group Chat Warnings */}
        {editedLeads.some(lead => lead.isGroupChat) && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-900 mb-1">
                    Group Chats Detected
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    {editedLeads.filter(lead => lead.isGroupChat).length} group chat{editedLeads.filter(lead => lead.isGroupChat).length > 1 ? 's' : ''} detected and automatically skipped. 
                    Group conversations are typically not individual leads.
                  </p>
                  <div className="space-y-1">
                    {editedLeads.filter(lead => lead.isGroupChat).map(lead => (
                      <div key={lead.id} className="text-xs text-amber-700">
                        <span className="font-medium">{lead.name}</span>
                        {lead.groupWarning && <span className="ml-2">({lead.groupWarning})</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedLeads(prev => prev.map(lead => 
                          lead.isGroupChat ? { ...lead, skip: false } : lead
                        ))
                      }}
                      className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Include All Groups
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedLeads(prev => prev.filter(lead => !lead.isGroupChat))
                      }}
                      className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Remove All Groups
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Activities</CardTitle>
            <CardDescription>
              Edit the information below or mark activities to skip. Only active activities will be saved to your CRM.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {editedLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className={`border rounded-lg p-4 ${
                    lead.skip ? 'bg-slate-50 opacity-60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!lead.skip}
                        onChange={() => toggleSkip(lead.id)}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {lead.skip ? <span className="line-through">{lead.name}</span> : lead.name}
                        </h3>
                        {lead.phone && (
                          <p className="text-sm text-slate-600">{lead.phone}</p>
                        )}
                        {lead.isGroupChat && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            <span className="text-xs text-amber-700 font-medium">Group Chat</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.isGroupChat && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          Group Chat
                        </Badge>
                      )}
                      {lead.leadScore && (
                        <Badge className={getLeadScoreColor(lead.leadScore)}>
                          Score: {lead.leadScore}/10
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLead(lead.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {!lead.skip && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={lead.name}
                          onChange={(e) => updateLead(lead.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={lead.phone || ''}
                          onChange={(e) => updateLead(lead.id, 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Platform
                        </label>
                        <select
                          value={lead.platform || analysisData?.platform || ''}
                          onChange={(e) => updateLead(lead.id, 'platform', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="messenger">Messenger</option>
                          <option value="telegram">Telegram</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Lead Score (1-10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={lead.leadScore || ''}
                          onChange={(e) => updateLead(lead.id, 'leadScore', parseInt(e.target.value) || null)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Last Message From
                        </label>
                        <select
                          value={lead.lastMessageFrom || ''}
                          onChange={(e) => updateLead(lead.id, 'lastMessageFrom', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        >
                          <option value="">Unknown</option>
                          <option value="contact">Contact</option>
                          <option value="user">You</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Last Message
                        </label>
                        <textarea
                          value={lead.lastMessage || ''}
                          onChange={(e) => updateLead(lead.id, 'lastMessage', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={lead.notes || ''}
                          onChange={(e) => updateLead(lead.id, 'notes', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                          placeholder="Add any additional notes about this lead..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="order-2 sm:order-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
          
          <Button 
            onClick={saveLeads}
            disabled={saving || activeLeads.length === 0}
            className="bg-sky-600 hover:bg-sky-700 order-1 sm:order-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save {activeLeads.length} Activit{activeLeads.length !== 1 ? 'ies' : 'y'} to CRM
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
    </div>}>
      <AnalyzePageContent />
    </Suspense>
  )
}