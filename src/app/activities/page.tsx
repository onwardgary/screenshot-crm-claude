'use client'

import { useState, useEffect } from 'react'
import ActivityList from '@/components/ActivityList'
import ActivityFilters, { FilterState } from '@/components/ActivityFilters'
import BulkActionBar from '@/components/BulkActionBar'
import OrganizeContactModal from '@/components/OrganizeContactModal'
import ConvertContactsModal from '@/components/ConvertContactsModal'
import Navbar from '@/components/Navbar'
import { useToast } from '@/hooks/use-toast'
import { analyzeActivities } from '@/lib/smartDetection'

export default function ActivitiesPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    platforms: [],
    temperatures: [],
    dateRange: 'all',
    excludeGroups: false,
    hasPhone: 'all',
    sort: 'created_at',
    order: 'desc'
  })
  const [stats, setStats] = useState<any>(null)
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [showOrganizeModal, setShowOrganizeModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log('🔄 Filters changed:', filters)
    fetchStats()
    fetchActivities()
  }, [filters])

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
      
      if (filters.search) params.append('search', filters.search)
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
    } catch (error) {
      console.error('Failed to fetch activities:', error)
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
      } catch (error) {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Unorganized Activities</h1>
          <p className="text-slate-600">
            Activities from screenshots that haven't been organized into contacts yet
          </p>
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
    </div>
  )
}