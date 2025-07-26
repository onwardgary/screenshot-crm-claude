'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2, Eye, X, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface UploadFile {
  id: string
  file: File
  preview: string
  detectedPlatform?: string
  overridePlatform?: string
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'
  progress: number
  result?: {
    platform: string;
    activities: Array<{
      person_name: string;
      phone?: string;
      platform: string;
      temperature: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }
  error?: string
}

const PLATFORMS = ['WhatsApp', 'Instagram', 'TikTok', 'Messenger', 'Telegram', 'Line', 'LinkedIn', 'WeChat', 'Other'] as const
type Platform = typeof PLATFORMS[number]

export default function MultiScreenshotUpload() {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [extractionResults, setExtractionResults] = useState<null | { activities: any[], screenshots: any[], totalExtracted: number }>(null)

  const generateFileId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

  const handleFilesSelected = useCallback((selectedFiles: FileList) => {
    const newFiles: UploadFile[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: generateFileId(),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0
      }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== fileId)
    })
  }

  const setPlatformOverride = (fileId: string, platform?: Platform) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, overridePlatform: platform } : f
    ))
  }

  const processFiles = async () => {
    setIsProcessing(true)
    const results: Array<{
      platform: string;
      activities: Array<{
        person_name: string;
        phone?: string;
        platform: string;
        temperature: string;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    }> = []

    for (const uploadFile of files) {
      if (uploadFile.status === 'done') continue

      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 30 } : f
      ))

      try {
        const formData = new FormData()
        formData.append('screenshot', uploadFile.file)
        if (uploadFile.overridePlatform) {
          formData.append('platformOverride', uploadFile.overridePlatform.toLowerCase())
        }

        // Update status to analyzing
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'analyzing', progress: 60 } : f
        ))

        const response = await fetch('/api/analyze-screenshot', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        
        // Update detected platform and results
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'done', 
            progress: 100,
            result: data,
            detectedPlatform: data.platform || 'other',
            error: data.error
          } : f
        ))

        if (!data.error) {
          results.push(data)
        }
      } catch (error) {
        console.error('Failed to process file:', error)
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'error', 
            error: 'Failed to process screenshot'
          } : f
        ))
        
        toast({
          variant: "destructive",
          title: "Processing Failed",
          description: `Failed to process ${uploadFile.file.name}. Please try again.`,
        })
      }
    }

    // If we have successful results, store them and navigate to review
    if (results.length > 0) {
      // Map results with file platform overrides
      const activitiesWithPlatforms = results.flatMap((r) => {
        const file = files.find(f => f.result === r)
        const finalPlatform = file?.overridePlatform?.toLowerCase() || r.platform
        
        return (r.activities || []).map((activity) => ({
          ...activity,
          platform: finalPlatform,
          screenshot_id: r.screenshotId
        }))
      })
      
      const combinedResults = {
        activities: activitiesWithPlatforms,
        totalExtracted: results.reduce((sum, r) => sum + (r.activities?.length || 0), 0),
        screenshots: results.map((r) => {
          const file = files.find(f => f.result === r)
          return {
            id: r.screenshotId,
            platform: file?.overridePlatform?.toLowerCase() || r.platform,
            activities: r.activities
          }
        })
      }
      
      sessionStorage.setItem('batchAnalysisData', JSON.stringify(combinedResults))
      
      toast({
        variant: "success",
        title: "Analysis Complete!",
        description: `Found ${combinedResults.activities.length} activities from ${results.length} screenshots.`,
      })
      
      // Store results in state instead of auto-navigating
      setExtractionResults(combinedResults)
    }

    setIsProcessing(false)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList) return
    handleFilesSelected(fileList)
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

    const fileList = e.dataTransfer.files
    if (fileList) {
      handleFilesSelected(fileList)
    }
  }

  const totalActivities = files.reduce((sum, f) => 
    sum + (f.result?.activities?.length || 0), 0
  )

  const successfulFiles = files.filter(f => f.status === 'done' && !f.error).length
  const pendingFiles = files.filter(f => f.status === 'pending').length

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
                {isProcessing ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-white" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-slate-900">
                  Upload Multiple Screenshots
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Drag and drop your screenshots here, or click to browse. Process multiple conversations at once.
                </p>
              </div>

              {!isProcessing && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700">
                    <label className="cursor-pointer">
                      <FileImage className="w-4 h-4 mr-2" />
                      Choose Screenshots
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        multiple
                      />
                    </label>
                  </Button>
                  <p className="text-sm text-slate-500">or drag and drop</p>
                </div>
              )}

              {/* Platform badges */}
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {PLATFORMS.map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-sky-100 text-sky-700 hover:bg-sky-200">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Preview */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Screenshots ({files.length})</span>
              {pendingFiles > 0 && (
                <Button 
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Analyze All ({pendingFiles})
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {successfulFiles > 0 && `Found ${totalActivities} activities from ${successfulFiles} screenshots`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="relative group">
                  <Card className={`overflow-hidden ${
                    file.status === 'error' ? 'border-red-300' : 
                    file.status === 'done' ? 'border-green-300' : 
                    'border-slate-200'
                  }`}>
                    <div className="relative aspect-video bg-slate-100">
                      <img 
                        src={file.preview} 
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Status overlay */}
                      {file.status !== 'pending' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          {file.status === 'uploading' && (
                            <div className="text-white text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Uploading...</p>
                            </div>
                          )}
                          {file.status === 'analyzing' && (
                            <div className="text-white text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Analyzing...</p>
                            </div>
                          )}
                          {file.status === 'done' && !file.error && (
                            <div className="text-white text-center">
                              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                              <p className="text-sm">{file.result?.activities?.length || 0} activities</p>
                            </div>
                          )}
                          {file.status === 'error' && (
                            <div className="text-white text-center">
                              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                              <p className="text-sm">Error</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-3">
                      <p className="text-sm text-slate-600 truncate mb-2">{file.file.name}</p>
                      
                      {/* Platform selector */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-between"
                            disabled={file.status !== 'pending' && file.status !== 'done'}
                          >
                            <span className="text-xs">
                              {file.overridePlatform || file.detectedPlatform || 'Auto-detect'}
                            </span>
                            <ChevronDown className="w-3 h-3 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          <DropdownMenuItem onClick={() => setPlatformOverride(file.id, undefined)}>
                            <span className="font-medium">Auto-detect</span>
                          </DropdownMenuItem>
                          {PLATFORMS.map((platform) => (
                            <DropdownMenuItem 
                              key={platform}
                              onClick={() => setPlatformOverride(file.id, platform)}
                            >
                              {platform}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Progress bar */}
                      {file.status === 'uploading' || file.status === 'analyzing' && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* Continue to Review button - appears when extraction is complete */}
            {extractionResults && (
              <div className="mt-6 text-center">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-800">
                      Analysis Complete!
                    </h3>
                  </div>
                  <p className="text-green-700 mb-4">
                    Found {extractionResults.activities.length} activities from {extractionResults.screenshots.length} screenshots
                  </p>
                  <Button 
                    onClick={() => router.push('/analyze/batch')}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Continue to Review →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}