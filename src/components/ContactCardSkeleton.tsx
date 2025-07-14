'use client'

import { Card, CardContent } from '@/components/ui/card'

interface ContactCardSkeletonProps {
  count?: number
}

function SingleContactCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Checkbox skeleton */}
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
            <div className="flex-1">
              {/* Name skeleton */}
              <div className="h-6 bg-slate-200 rounded w-32 mb-1"></div>
              {/* Phone/platform skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          </div>
          {/* Badges skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-6 bg-slate-200 rounded-full w-16"></div>
            <div className="h-6 bg-slate-200 rounded-full w-12"></div>
          </div>
        </div>

        {/* Communication badge skeleton */}
        <div className="mb-3">
          <div className="h-6 bg-slate-200 rounded-full w-20"></div>
        </div>

        {/* Metrics row skeleton */}
        <div className="flex items-center gap-6 text-sm mb-4">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-4 bg-slate-200 rounded w-20"></div>
          <div className="h-4 bg-slate-200 rounded w-18"></div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-9 bg-slate-200 rounded flex-1"></div>
          <div className="h-9 bg-slate-200 rounded flex-1"></div>
        </div>

        {/* Expansion indicator skeleton */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t">
          <div className="h-4 bg-slate-200 rounded w-32"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContactCardSkeleton({ count = 3 }: ContactCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <SingleContactCardSkeleton key={index} />
      ))}
    </div>
  )
}