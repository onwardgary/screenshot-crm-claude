'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react'

export default function ScreenshotUpload() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<{
    error?: string;
    extractedLeads?: unknown[];
    mergedLeads?: unknown[];
    totalExtracted?: number;
    totalMerged?: number;
    suggestion?: string;
    details?: string;
    rawResponse?: string;
    message?: string;
  } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setResults(null)
    
    try {
      const formData = new FormData()
      formData.append('screenshot', file)

      const response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      console.log('API Response:', data) // Debug log
      console.log('Extracted leads:', data.extractedLeads) // Debug log
      
      if ((data.extractedLeads && data.extractedLeads.length > 0) || (data.activities && data.activities.length > 0)) {
        // Store analysis data and redirect to review page
        sessionStorage.setItem('analysisData', JSON.stringify(data))
        router.push('/analyze')
      } else {
        // Show results if no leads found or error
        console.log('No activities found, showing results') // Debug log
        setResults(data)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setResults({ error: 'Failed to upload and analyze screenshot' })
    } finally {
      setIsUploading(false)
    }
  }

  const reviewLeads = () => {
    if (results && results.extractedLeads) {
      sessionStorage.setItem('analysisData', JSON.stringify(results))
      router.push('/analyze')
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    handleFileUpload(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="border-2 border-dashed border-sky-200 bg-sky-50/30 hover:border-sky-300 transition-colors">
        <CardContent className="p-8">
          <div
            className={`relative ${dragActive ? 'bg-sky-100 border-sky-400' : ''} border-2 border-dashed border-transparent rounded-xl p-8 transition-all`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-white" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {isUploading ? 'Analyzing Screenshot...' : 'Upload Conversation Screenshot'}
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Drag and drop your screenshot here, or click to browse. We support WhatsApp, Instagram, TikTok, and more.
                </p>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={66} className="w-64 mx-auto" />
                  <p className="text-sm text-sky-600">Extracting lead information with AI...</p>
                </div>
              )}

              {!isUploading && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700">
                    <label className="cursor-pointer">
                      <FileImage className="w-4 h-4 mr-2" />
                      Choose Screenshot
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleInputChange}
                        disabled={isUploading}
                      />
                    </label>
                  </Button>
                  <p className="text-sm text-slate-500">or drag and drop</p>
                </div>
              )}

              {/* Platform badges */}
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {['WhatsApp', 'Instagram', 'TikTok', 'Messenger', 'Telegram'].map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-sky-100 text-sky-700 hover:bg-sky-200">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      {results && (
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Analysis Results
            </CardTitle>
            <CardDescription>
              {results.error 
                ? 'There was an issue processing your screenshot'
                : results.message || (results.extractedLeads 
                  ? `Found ${results.totalExtracted || 0} leads ready for review`
                  : 'No leads found in this screenshot')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">{results.error}</p>
                {results.suggestion && (
                  <p className="text-red-600 text-sm mt-1">{results.suggestion}</p>
                )}
              </div>
            ) : (results.extractedLeads && results.extractedLeads.length > 0) || (results.mergedLeads && results.mergedLeads.length > 0) ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {results.extractedLeads && results.extractedLeads.length > 0 && (
                      <Badge className="bg-sky-100 text-sky-800">
                        {results.totalExtracted || 0} New Leads
                      </Badge>
                    )}
                    {results.mergedLeads && results.mergedLeads.length > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        {results.totalMerged || 0} Pipeline Updated
                      </Badge>
                    )}
                  </div>
                  {results.extractedLeads && results.extractedLeads.length > 0 && (
                    <Button onClick={reviewLeads} className="bg-sky-600 hover:bg-sky-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Review & Save Leads
                    </Button>
                  )}
                </div>

                {/* Show merged leads info */}
                {results.mergedLeads && results.mergedLeads.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium text-green-800 mb-2">Pipeline Leads Updated:</h4>
                    <div className="space-y-2">
                      {(results.mergedLeads as Array<{name: string; preservedFollowup?: string; preservedAttempts?: number}>).slice(0, 3).map((lead, index: number) => (
                        <div key={index} className="text-sm text-green-700">
                          <span className="font-medium">{lead.name}</span>
                          {lead.preservedFollowup && (
                            <span className="ml-2 text-xs">(follow-up: {new Date(lead.preservedFollowup).toLocaleDateString()})</span>
                          )}
                        </div>
                      ))}
                      {results.mergedLeads.length > 3 && (
                        <p className="text-sm text-green-600">+{results.mergedLeads.length - 3} more updated</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid gap-3">
                  {(results.extractedLeads as Array<{name: string; phone?: string; lastMessage?: string; leadScore?: number}>).slice(0, 3).map((lead, index: number) => (
                    <div key={index} className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900">{lead.name}</p>
                          {lead.phone && <p className="text-sm text-slate-600">{lead.phone}</p>}
                          {lead.lastMessage && (
                            <p className="text-sm text-slate-700 mt-1 line-clamp-2">
                              &ldquo;{lead.lastMessage}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {lead.leadScore && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Score: {lead.leadScore}/10
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {results.extractedLeads && results.extractedLeads.length > 3 && (
                    <p className="text-sm text-slate-600 text-center">
                      +{results.extractedLeads.length - 3} more lead{results.extractedLeads.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <p className="text-slate-600">
                  No conversation data could be extracted from this screenshot. 
                  Try uploading a different image with clearer text.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}