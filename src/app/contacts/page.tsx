'use client'

import { useState, useEffect } from 'react'
import ContactsList from '@/components/ContactsList'
import ContactFilters, { ContactFilterState } from '@/components/ContactFilters'
import ContactBulkActionBar from '@/components/ContactBulkActionBar'
import Navbar from '@/components/Navbar'
import { useToast } from '@/hooks/use-toast'

export default function ContactsPage() {
  const [filters, setFilters] = useState<ContactFilterState>({
    search: '',
    searchType: 'all',
    relationshipStatus: [],
    relationshipType: [],
    platforms: [],
    temperature: [],
    dateRange: 'all',
    hasTwoWay: 'all',
    hasPhone: 'all',
    isNew: null,
    isActive: null,
    sort: 'updated_at',
    order: 'desc'
  })
  const [stats, setStats] = useState<{
    new: number;
    active: number;
    converted: number;
    inactive: number;
    total: number;
    twoWay: number;
    platforms: Record<string, number>;
    temperatures: Record<string, number>;
  } | null>(null)
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([])
  const [selectedContacts, setSelectedContacts] = useState<{id: number; name: string; relationship_status?: string | null}[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    console.log('🔄 Contact filters changed:', filters)
    fetchStats()
  }, [filters])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/contacts/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch contact stats:', error)
    }
  }

  const handleSelectionChange = (contactIds: number[], contacts: {id: number; name: string; relationship_status?: string | null}[]) => {
    setSelectedContactIds(contactIds)
    setSelectedContacts(contacts)
  }

  const handleBulkMarkAsCustomers = async () => {
    if (selectedContactIds.length === 0) return

    if (confirm(`Mark ${selectedContactIds.length} contacts as customers?`)) {
      try {
        const response = await fetch('/api/contacts/bulk/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactIds: selectedContactIds })
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Customers marked",
            description: `Successfully marked ${result.results.success} contacts as customers`
          })
          handleClearSelection() // Clear both selectedContactIds and selectedContacts
          fetchStats() // Refresh stats
          setRefreshTrigger(prev => prev + 1) // Trigger contacts list refresh
        } else {
          throw new Error(result.error || 'Failed to mark contacts as customers')
        }
      } catch (error) {
        console.error('Bulk customer marking error:', error)
        toast({
          title: "Error",
          description: "Failed to mark contacts as customers",
          variant: "destructive"
        })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContactIds.length === 0) return

    if (confirm(`Delete ${selectedContactIds.length} contacts? This action cannot be undone.`)) {
      try {
        const response = await fetch('/api/contacts/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactIds: selectedContactIds })
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Contacts deleted",
            description: `Successfully deleted ${result.results.success} contacts`
          })
          handleClearSelection() // Clear both selectedContactIds and selectedContacts
          fetchStats() // Refresh stats
          setRefreshTrigger(prev => prev + 1) // Trigger contacts list refresh
        } else {
          throw new Error(result.error || 'Failed to delete contacts')
        }
      } catch (error) {
        console.error('Bulk delete error:', error)
        toast({
          title: "Error",
          description: "Failed to delete contacts",
          variant: "destructive"
        })
      }
    }
  }

  const handleClearSelection = () => {
    setSelectedContactIds([])
    setSelectedContacts([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="contacts" />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Contacts</h1>
          <p className="text-slate-600">
            People you&apos;re building relationships with through sales activities
          </p>
        </div>
        
        <ContactFilters 
          onFiltersChange={setFilters}
          totalCount={stats?.total || 0}
          filters={filters}
          stats={stats ? {
            new: stats.new,
            active: stats.active,
            converted: stats.converted,
            inactive: stats.inactive,
            twoWay: stats.twoWay,
            platforms: stats.platforms,
            temperatures: stats.temperatures
          } : undefined}
        />
        
        <ContactsList 
          filters={filters}
          onSelectionChange={handleSelectionChange}
          selectedIds={selectedContactIds}
          refreshTrigger={refreshTrigger}
        />
      </div>

      <ContactBulkActionBar
        selectedContacts={selectedContacts}
        onMarkAsCustomers={handleBulkMarkAsCustomers}
        onDelete={handleBulkDelete}
        onClear={handleClearSelection}
      />
    </div>
  )
}