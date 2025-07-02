'use client'

import { useState, useEffect } from 'react'
import ActivityList from '@/components/ActivityList'
import ActivityFilters, { FilterState } from '@/components/ActivityFilters'
import Navbar from '@/components/Navbar'

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

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/activities/stats?organized=false')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="activities" />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Unorganized Activities</h1>
          <p className="text-slate-600">
            Activities from screenshots that haven't been organized into contacts yet
          </p>
        </div>
        
        <ActivityFilters 
          onFiltersChange={setFilters}
          totalCount={stats?.total || 0}
          stats={stats ? {
            hot: stats.hot,
            warm: stats.warm,
            cold: stats.cold,
            platforms: stats.platforms
          } : undefined}
        />
        
        <ActivityList organized={false} filters={filters} />
      </div>
    </div>
  )
}