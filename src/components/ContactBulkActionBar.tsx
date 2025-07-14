'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Star, Trash2 } from 'lucide-react'

interface ContactBulkActionBarProps {
  selectedCount: number
  onMarkAsCustomers: () => void
  onDelete: () => void
  onClear: () => void
}

export default function ContactBulkActionBar({
  selectedCount,
  onMarkAsCustomers,
  onDelete,
  onClear
}: ContactBulkActionBarProps) {
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
              {selectedCount} {selectedCount === 1 ? 'contact' : 'contacts'} selected
            </span>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <Button
              onClick={onMarkAsCustomers}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              <Star className="w-4 h-4 mr-1" />
              Mark as {selectedCount === 1 ? 'Customer' : 'Customers'}
            </Button>
            
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