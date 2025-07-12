'use client'

import { useState, useEffect } from 'react'
import ActivityList from '@/components/ActivityList'
import ActivityFilters, { FilterState } from '@/components/ActivityFilters'
import BulkActionBar from '@/components/BulkActionBar'
import OrganizeContactModal from '@/components/OrganizeContactModal'
import ConvertContactsModal from '@/components/ConvertContactsModal'
import SmartOrganizeModal from '@/components/SmartOrganizeModal'
import Navbar from '@/components/Navbar'
import { useToast } from '@/hooks/use-toast'
import { analyzeActivities } from '@/lib/smartDetection'
import { Wand2 } from 'lucide-react'

export default function ActivitiesPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    searchType: 'all',
    platforms: [],
    temperatures: [],
    dateRange: 'all',
    excludeGroups: false,
    hasPhone: 'all',
    sort: 'created_at',
    order: 'desc'
  })
  const [stats, setStats] = useState<{
    total: number;
    hot: number;
    warm: number;
    cold: number;
    platforms: Record<string, number>;
  } | null>(null)
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([])
  const [activities, setActivities] = useState<{
    id: number;
    person_name: string;
    platform: string;
    temperature: 'hot' | 'warm' | 'cold';
    created_at: string;
    [key: string]: unknown;
  }[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [showOrganizeModal, setShowOrganizeModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showSmartOrganizeModal, setShowSmartOrganizeModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log('🔄 Filters changed:', filters)
    fetchStats()
    fetchActivities()
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/activities/stats?organized=false')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchActivities = async () => {
    setActivitiesLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('organized', 'false')
      
      if (filters.search) {
        params.append('search', filters.search)
        params.append('searchType', filters.searchType)
      }
      if (filters.platforms?.length > 0) params.append('platforms', filters.platforms.join(','))
      if (filters.temperatures?.length > 0) params.append('temperatures', filters.temperatures.join(','))
      if (filters.dateRange && filters.dateRange !== 'all') params.append('dateRange', filters.dateRange)
      if (filters.excludeGroups) params.append('excludeGroups', 'true')
      if (filters.hasPhone && filters.hasPhone !== 'all') params.append('hasPhone', filters.hasPhone)
      if (filters.sort) params.append('sort', filters.sort)
      if (filters.order) params.append('order', filters.order)
      
      const response = await fetch(`/api/activities?${params.toString()}`)
      const data = await response.json()
      
      setActivities(data)
    } catch {
      console.error('Failed to fetch activities')
    } finally {
      setActivitiesLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Delete ${selectedActivityIds.length} activities?`)) {
      try {
        const promises = selectedActivityIds.map(id =>
          fetch(`/api/activities/${id}`, { method: 'DELETE' })
        )
        await Promise.all(promises)
        
        toast({
          title: "Activities deleted",
          description: `${selectedActivityIds.length} activities have been deleted`
        })
        
        setSelectedActivityIds([])
        fetchActivities()
        fetchStats()
      } catch {
        toast({
          title: "Error deleting activities",
          description: "Some activities could not be deleted",
          variant: "destructive"
        })
      }
    }
  }

  const selectedActivities = activities.filter(a => selectedActivityIds.includes(a.id))
  
  // Analyze selected activities for smart detection
  const detection = selectedActivities.length > 0 
    ? analyzeActivities(selectedActivities)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="activities" />
      
      <div className="max-w-6xl mx-auto px-6 py-8 pb-24">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Unorganized Activities</h1>
            <p className="text-slate-600">
              Activities from screenshots that haven&apos;t been organized into contacts yet
            </p>
          </div>
          {stats?.total && stats.total > 0 && (
            <button
              onClick={() => setShowSmartOrganizeModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Wand2 className="w-4 h-4" />
              Smart Organize All
            </button>
          )}
        </div>
        
        <ActivityFilters 
          onFiltersChange={setFilters}
          totalCount={stats?.total || 0}
          filters={filters}
          stats={stats ? {
            hot: stats.hot,
            warm: stats.warm,
            cold: stats.cold,
            platforms: stats.platforms
          } : undefined}
        />
        
        <ActivityList 
          organized={false} 
          activities={activities}
          loading={activitiesLoading}
          onSelectionChange={setSelectedActivityIds}
          selectedIds={selectedActivityIds}
        />
      </div>

      <BulkActionBar
        selectedCount={selectedActivityIds.length}
        onMerge={() => setShowOrganizeModal(true)}
        onConvert={() => setShowConvertModal(true)}
        onDelete={handleDelete}
        onClear={() => setSelectedActivityIds([])}
        recommendation={detection?.recommendation}
        recommendationReason={detection?.reason}
      />

      <OrganizeContactModal
        open={showOrganizeModal}
        onClose={() => setShowOrganizeModal(false)}
        activities={selectedActivities}
        onSuccess={() => {
          setSelectedActivityIds([])
          fetchActivities()
          fetchStats()
        }}
      />

      <ConvertContactsModal
        open={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        activities={selectedActivities}
        onSuccess={() => {
          setSelectedActivityIds([])
          fetchActivities()
          fetchStats()
        }}
      />

      <SmartOrganizeModal
        isOpen={showSmartOrganizeModal}
        onClose={() => setShowSmartOrganizeModal(false)}
        activities={activities}
        onComplete={() => {
          fetchActivities()
          fetchStats()
        }}
      />
    </div>
  )
}