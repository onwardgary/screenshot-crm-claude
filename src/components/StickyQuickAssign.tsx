'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useContactSearch } from '@/hooks/useContactSearch'
import { getPlatformIcon, getTemperatureBadge } from '@/lib/platformUtils'
import { 
  Search, 
  Users, 
  ArrowRight,
  Plus,
  Link,
  Loader2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface StickyQuickAssignProps {
  selectedActivityIds: number[]
  onAssignmentSuccess: () => void
  onCreateNew: () => void
  onClearSelection: () => void
}

export default function StickyQuickAssign({ 
  selectedActivityIds, 
  onAssignmentSuccess,
  onCreateNew,
  onClearSelection
}: StickyQuickAssignProps) {
  const [assigning, setAssigning] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Use shared contact search hook
  const { contacts, searching, searchQuery, setSearchQuery, clearSearch } = useContactSearch({
    fuzzy: true,
    limit: 8,
    debounceMs: 200
  })

  // Auto-expand when search is focused or has results
  useEffect(() => {
    if (isSearchFocused || contacts.length > 0) {
      setIsExpanded(true)
    }
  }, [isSearchFocused, contacts.length])

  const handleAssignToContact = async (contactId: number, contactName: string) => {
    setAssigning(contactId)
    try {
      const response = await fetch('/api/activities/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityIds: selectedActivityIds,
          contactId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign activities')
      }

      const result = await response.json()
      
      toast({
        title: "Activities assigned! 🎉",
        description: `Successfully assigned ${result.successCount} activities to ${contactName}`
      })

      // Reset state and notify parent
      clearSearch()
      setIsExpanded(false)
      onAssignmentSuccess()
    } catch (error) {
      console.error('Assignment error:', error)
      toast({
        title: "Assignment failed",
        description: "Failed to assign activities to contact",
        variant: "destructive"
      })
    } finally {
      setAssigning(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch()
      setIsExpanded(false)
      searchInputRef.current?.blur()
    }
  }


  if (selectedActivityIds.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="sticky top-16 z-60 bg-white border-b border-purple-200 shadow-lg"
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Compact Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">
                Quick Assign {selectedActivityIds.length} {selectedActivityIds.length === 1 ? 'Activity' : 'Activities'}
              </span>
            </div>
          </div>

          {/* Compact Search Row */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Type contact name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9 h-9 bg-purple-50 border-purple-200 focus:border-purple-400 focus:bg-white"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4 animate-spin" />
              )}
            </div>

            <Button
              size="sm"
              onClick={onCreateNew}
              className="bg-purple-600 hover:bg-purple-700 text-white h-9 px-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onClearSelection}
              className="border-slate-300 text-slate-600 h-9 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Expand/Collapse Button */}
          {(contacts.length > 0 || searchQuery) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-9 w-9 p-0 text-purple-600"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Expandable Search Results */}
        <AnimatePresence>
          {isExpanded && searchQuery && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-purple-100">
                {contacts.length === 0 && !searching ? (
                  <div className="text-center py-6">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500 mb-2">No contacts found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-xs text-slate-400">Try a shorter search term or create a new contact</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {contacts.map((contact) => (
                      <motion.div
                        key={contact.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-300 hover:bg-white transition-all duration-150"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900 truncate">{contact.name}</span>
                              {contact.platforms && contact.platforms.length > 0 && (
                                <span className="flex items-center gap-1">
                                  {contact.platforms.slice(0, 2).map(platform => (
                                    <span key={platform}>
                                      {getPlatformIcon(platform, 12)}
                                    </span>
                                  ))}
                                </span>
                              )}
                              {getTemperatureBadge(contact.latest_temperature)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {contact.auto_contact_attempts || 0} activities
                              {contact.phone && (
                                <span className="ml-2 truncate">• {contact.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAssignToContact(contact.id, contact.name)}
                          disabled={assigning === contact.id}
                          className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-3 ml-2 flex-shrink-0"
                        >
                          {assigning === contact.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Assign
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}