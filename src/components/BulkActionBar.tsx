'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Link, FileStack, Trash2 } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onMerge: () => void
  onConvert: () => void
  onDelete: () => void
  onClear: () => void
  recommendation?: 'merge' | 'convert' | 'mixed'
  recommendationReason?: string
}

export default function BulkActionBar({
  selectedCount,
  onMerge,
  onConvert,
  onDelete,
  onClear,
  recommendation,
  recommendationReason
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {selectedCount} {selectedCount === 1 ? 'activity' : 'activities'} selected
            </span>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="relative">
              <Button
                onClick={onMerge}
                size="sm"
                className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 ${
                  recommendation === 'merge' ? 'ring-2 ring-sky-400 ring-offset-2' : ''
                }`}
              >
                <Link className="w-4 h-4 mr-1" />
                Merge into 1 Contact
              </Button>
              {recommendation === 'merge' && recommendationReason && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-sky-600 text-white text-xs px-2 py-1 rounded">
                    {recommendationReason}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-sky-600" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <Button
                onClick={onConvert}
                size="sm"
                className={`bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 ${
                  recommendation === 'convert' ? 'ring-2 ring-emerald-400 ring-offset-2' : ''
                }`}
              >
                <FileStack className="w-4 h-4 mr-1" />
                Convert to {selectedCount} {selectedCount === 1 ? 'Contact' : 'Contacts'}
              </Button>
              {recommendation === 'convert' && recommendationReason && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-emerald-600 text-white text-xs px-2 py-1 rounded">
                    {recommendationReason}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-emerald-600" />
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            
            <Button
              onClick={onClear}
              variant="ghost"
              size="sm"
              className="text-gray-600"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}