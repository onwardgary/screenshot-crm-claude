import { useState, useEffect, useCallback } from 'react'

interface Contact {
  id: number
  name: string
  phone?: string
  platforms?: string[]
  auto_contact_attempts?: number
  latest_temperature?: 'hot' | 'warm' | 'cold'
}

interface UseContactSearchOptions {
  fuzzy?: boolean
  limit?: number
  debounceMs?: number
}

interface UseContactSearchReturn {
  contacts: Contact[]
  searching: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

/**
 * Reusable hook for contact search with fuzzy matching and debouncing
 */
export function useContactSearch(options: UseContactSearchOptions = {}): UseContactSearchReturn {
  const {
    fuzzy = true,
    limit = 8,
    debounceMs = 200
  } = options

  const [contacts, setContacts] = useState<Contact[]>([])
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Contact search function
  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setContacts([])
      return
    }

    setSearching(true)
    try {
      // Build search URL with options
      const params = new URLSearchParams({
        search: query,
        quickSearch: 'true',
        limit: limit.toString()
      })
      
      if (fuzzy) {
        params.append('fuzzy', 'true')
      }

      const response = await fetch(`/api/contacts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to search contacts')
      }
      
      const data = await response.json()
      const contactList = data.contacts || data
      setContacts(Array.isArray(contactList) ? contactList : [])
    } catch (error) {
      console.error('Contact search error:', error)
      setContacts([])
    } finally {
      setSearching(false)
    }
  }, [fuzzy, limit])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContacts(searchQuery)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchQuery, searchContacts, debounceMs])

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setContacts([])
  }, [])

  return {
    contacts,
    searching,
    searchQuery,
    setSearchQuery,
    clearSearch
  }
}