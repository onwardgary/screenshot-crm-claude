'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Download, ExternalLink, Image as ImageIcon } from 'lucide-react'

interface ScreenshotModalProps {
  screenshotId: number | null
  isOpen: boolean
  onClose: () => void
}

export default function ScreenshotModal({ screenshotId, isOpen, onClose }: ScreenshotModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (screenshotId && isOpen) {
      setLoading(true)
      setError(null)
      setImageUrl(`/api/screenshots/${screenshotId}`)
      setLoading(false)
    } else {
      setImageUrl(null)
      setError(null)
    }
  }, [screenshotId, isOpen])

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `screenshot-${screenshotId}.png`
      link.click()
    }
  }

  const handleOpenInNewTab = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank')
    }
  }

  const handleImageError = () => {
    setError('Failed to load screenshot')
    setLoading(false)
  }

  const handleImageLoad = () => {
    setLoading(false)
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Screenshot #{screenshotId}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {imageUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 px-2"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    className="h-8 px-2"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 animate-pulse mx-auto mb-4 text-slate-400" />
                <p className="text-slate-500">Loading screenshot...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-red-600 font-medium">Error loading screenshot</p>
                <p className="text-slate-500 text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    // Retry loading
                    if (screenshotId) {
                      setImageUrl(`/api/screenshots/${screenshotId}?t=${Date.now()}`)
                    }
                  }}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {imageUrl && !error && (
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt={`Screenshot ${screenshotId}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: loading ? 'none' : 'block' }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}