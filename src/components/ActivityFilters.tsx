'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  X,
  Calendar,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react'

interface ActivityFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  totalCount: number
  stats?: {
    hot: number
    warm: number
    cold: number
    platforms: Record<string, number>
  }
}

export interface FilterState {
  search: string
  platforms: string[]
  temperatures: string[]
  dateRange: string
  excludeGroups: boolean
  hasPhone: string
  sort: string
  order: 'asc' | 'desc'
}

export default function ActivityFilters({ onFiltersChange, totalCount, stats }: ActivityFiltersProps) {
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

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      platforms: [],
      temperatures: [],
      dateRange: 'all',
      excludeGroups: false,
      hasPhone: 'all',
      sort: 'created_at',
      order: 'desc'
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters = filters.search || 
    filters.platforms.length > 0 || 
    filters.temperatures.length > 0 || 
    filters.dateRange !== 'all' ||
    filters.excludeGroups ||
    filters.hasPhone !== 'all'

  const togglePlatform = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform]
    updateFilter('platforms', newPlatforms)
  }

  const toggleTemperature = (temp: string) => {
    const newTemps = filters.temperatures.includes(temp)
      ? filters.temperatures.filter(t => t !== temp)
      : [...filters.temperatures, temp]
    updateFilter('temperatures', newTemps)
  }

  const platforms = stats?.platforms ? Object.keys(stats.platforms) : []

  return (
    <div className="space-y-4 mb-6">
      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border">
            <div className="text-2xl font-semibold">{totalCount}</div>
            <div className="text-sm text-muted-foreground">Total Activities</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-2xl font-semibold flex items-center gap-1">
              🔥 {stats.hot}
            </div>
            <div className="text-sm text-red-700">Hot</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="text-2xl font-semibold flex items-center gap-1">
              🌡️ {stats.warm}
            </div>
            <div className="text-sm text-orange-700">Warm</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-2xl font-semibold flex items-center gap-1">
              ❄️ {stats.cold}
            </div>
            <div className="text-sm text-blue-700">Cold</div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, phone, or message..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {/* Platform Filters */}
              <DropdownMenuLabel>Platform</DropdownMenuLabel>
              {platforms.map(platform => (
                <DropdownMenuCheckboxItem
                  key={platform}
                  checked={filters.platforms.includes(platform)}
                  onCheckedChange={() => togglePlatform(platform)}
                >
                  {platform} ({stats?.platforms[platform] || 0})
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              {/* Temperature Filters */}
              <DropdownMenuLabel>Temperature</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.temperatures.includes('hot')}
                onCheckedChange={() => toggleTemperature('hot')}
              >
                🔥 Hot ({stats?.hot || 0})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.temperatures.includes('warm')}
                onCheckedChange={() => toggleTemperature('warm')}
              >
                🌡️ Warm ({stats?.warm || 0})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.temperatures.includes('cold')}
                onCheckedChange={() => toggleTemperature('cold')}
              >
                ❄️ Cold ({stats?.cold || 0})
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              {/* Other Filters */}
              <DropdownMenuCheckboxItem
                checked={filters.excludeGroups}
                onCheckedChange={(checked) => updateFilter('excludeGroups', checked)}
              >
                Exclude Group Chats
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range Select */}
          <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select 
            value={`${filters.sort}-${filters.order}`} 
            onValueChange={(value) => {
              const [sort, order] = value.split('-')
              updateFilter('sort', sort)
              updateFilter('order', order as 'asc' | 'desc')
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              {filters.order === 'desc' ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="temperature-desc">Hot → Cold</SelectItem>
              <SelectItem value="temperature-asc">Cold → Hot</SelectItem>
              <SelectItem value="person_name-asc">Name A-Z</SelectItem>
              <SelectItem value="person_name-desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary">
                Search: {filters.search}
                <button
                  onClick={() => updateFilter('search', '')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.platforms.map(platform => (
              <Badge key={platform} variant="secondary">
                {platform}
                <button
                  onClick={() => togglePlatform(platform)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.temperatures.map(temp => (
              <Badge key={temp} variant="secondary">
                {temp === 'hot' ? '🔥 Hot' : temp === 'warm' ? '🌡️ Warm' : '❄️ Cold'}
                <button
                  onClick={() => toggleTemperature(temp)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.dateRange !== 'all' && (
              <Badge variant="secondary">
                {filters.dateRange === 'today' ? 'Today' : 
                 filters.dateRange === 'week' ? 'This Week' : 
                 'This Month'}
                <button
                  onClick={() => updateFilter('dateRange', 'all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.excludeGroups && (
              <Badge variant="secondary">
                No Groups
                <button
                  onClick={() => updateFilter('excludeGroups', false)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}