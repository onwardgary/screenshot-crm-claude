'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'

interface LoadMoreButtonProps {
  onClick: () => void
  loading: boolean
  disabled: boolean
  remainingCount: number
  className?: string
}

export default function LoadMoreButton({ 
  onClick, 
  loading, 
  disabled, 
  remainingCount,
  className = '' 
}: LoadMoreButtonProps) {
  if (disabled && !loading) {
    return null // Don't show button if there are no more items
  }

  return (
    <div className={`flex justify-center mt-6 ${className}`}>
      <Button
        onClick={onClick}
        disabled={loading || disabled}
        variant="outline"
        size="lg"
        className="min-w-[200px] bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading contacts...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Load {remainingCount > 0 
              ? `${Math.min(remainingCount, 15)} more contact${Math.min(remainingCount, 15) !== 1 ? 's' : ''}` 
              : 'more contacts'
            }
          </>
        )}
      </Button>
    </div>
  )
}