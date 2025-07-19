'use client'

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

interface ContactFiltersProps {
  onFiltersChange: (filters: ContactFilterState) => void
  totalCount: number
  filters: ContactFilterState
  stats?: {
    new: number // is_new = true
    active: number // is_active = true  
    converted: number // relationship_status = 'converted'
    inactive: number // relationship_status = 'inactive'
    twoWay: number
    platforms: Record<string, number>
    temperatures: Record<string, number>
  }
}

export interface ContactFilterState {
  search: string
  searchType: 'all' | 'name' | 'phone' | 'notes' | 'platforms'
  relationshipStatus: string[] // converted, inactive
  relationshipType: string[]
  platforms: string[]
  temperature: string[]
  dateRange: string
  hasTwoWay: string
  hasPhone: string
  // New separate field filters
  isNew: boolean | null // null=all, true=new only, false=not new
  isActive: boolean | null // null=all, true=active only, false=not active
  sort: string
  order: 'asc' | 'desc'
}

export default function ContactFilters({ onFiltersChange, totalCount, filters, stats }: ContactFiltersProps) {

  const updateFilter = (key: keyof ContactFilterState, value: string | string[] | boolean | null) => {
    const newFilters = { ...filters, [key]: value }
    console.log('🔧 ContactFilters updating:', key, '=', value)
    console.log('🔧 New filters:', newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const defaultFilters: ContactFilterState = {
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
    }
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters = filters.search || 
    filters.relationshipStatus.length > 0 || 
    filters.relationshipType.length > 0 || 
    filters.platforms.length > 0 || 
    filters.temperature.length > 0 || 
    filters.dateRange !== 'all' ||
    filters.hasTwoWay !== 'all' ||
    filters.hasPhone !== 'all' ||
    filters.searchType !== 'all' ||
    filters.isNew !== null ||
    filters.isActive !== null

  const toggleRelationshipStatus = (status: string) => {
    const newStatuses = filters.relationshipStatus.includes(status)
      ? filters.relationshipStatus.filter(s => s !== status)
      : [...filters.relationshipStatus, status]
    updateFilter('relationshipStatus', newStatuses)
  }

  const toggleRelationshipType = (type: string) => {
    const newTypes = filters.relationshipType.includes(type)
      ? filters.relationshipType.filter(t => t !== type)
      : [...filters.relationshipType, type]
    updateFilter('relationshipType', newTypes)
  }

  const togglePlatform = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform]
    updateFilter('platforms', newPlatforms)
  }

  const toggleTemperature = (temp: string) => {
    const newTemps = filters.temperature.includes(temp)
      ? filters.temperature.filter(t => t !== temp)
      : [...filters.temperature, temp]
    updateFilter('temperature', newTemps)
  }

  const platforms = stats?.platforms ? Object.keys(stats.platforms) : []
  const relationshipTypes = ['family', 'friend']

  return (
    <div className="space-y-4 mb-6">
      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg p-3 border">
            <div className="text-2xl font-semibold">{totalCount}</div>
            <div className="text-sm text-muted-foreground">Total Contacts</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-2xl font-semibold text-blue-600">{stats.new || 0}</div>
            <div className="text-sm text-blue-700">New</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-2xl font-semibold text-green-600">{stats.active || 0}</div>
            <div className="text-sm text-green-700">Active</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-2xl font-semibold text-purple-600">{stats.converted || 0}</div>
            <div className="text-sm text-purple-700">Converted</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="text-2xl font-semibold text-emerald-600">{stats.twoWay || 0}</div>
            <div className="text-sm text-emerald-700">Two-Way</div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input with Type Selector */}
          <div className="flex gap-2 flex-1">
            <Select value={filters.searchType} onValueChange={(value) => updateFilter('searchType', value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="name">Name Only</SelectItem>
                <SelectItem value="phone">Phone Only</SelectItem>
                <SelectItem value="notes">Notes Only</SelectItem>
                <SelectItem value="platforms">Platform Only</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={`Search ${filters.searchType === 'all' ? 'across all fields' : 
                  filters.searchType === 'name' ? 'by name' :
                  filters.searchType === 'phone' ? 'by phone number' :
                  filters.searchType === 'notes' ? 'in notes' : 'by platform'}...`}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
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
              {/* Time & Engagement Status */}
              <DropdownMenuLabel>Contact Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.isNew === true}
                onCheckedChange={() => updateFilter('isNew', filters.isNew === true ? null : true)}
              >
                New ({stats?.new || 0})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.isActive === true}
                onCheckedChange={() => updateFilter('isActive', filters.isActive === true ? null : true)}
              >
                Active ({stats?.active || 0})
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              {/* Business Status Filters */}
              <DropdownMenuLabel>Business Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.relationshipStatus.includes('converted')}
                onCheckedChange={() => toggleRelationshipStatus('converted')}
              >
                Converted ({stats?.converted || 0})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.relationshipStatus.includes('inactive')}
                onCheckedChange={() => toggleRelationshipStatus('inactive')}
              >
                Inactive ({stats?.inactive || 0})
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              {/* Relationship Type Filters */}
              <DropdownMenuLabel>Relationship Type</DropdownMenuLabel>
              {relationshipTypes.map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.relationshipType.includes(type)}
                  onCheckedChange={() => toggleRelationshipType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
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
              <DropdownMenuLabel>Latest Temperature</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.temperature.includes('hot')}
                onCheckedChange={() => toggleTemperature('hot')}
              >
                🔥 Hot ({stats?.temperatures?.hot || 0})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.temperature.includes('warm')}
                onCheckedChange={() => toggleTemperature('warm')}
              >
                🌡️ Warm ({stats?.temperatures?.warm || 0})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.temperature.includes('cold')}
                onCheckedChange={() => toggleTemperature('cold')}
              >
                ❄️ Cold ({stats?.temperatures?.cold || 0})
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              {/* Other Filters */}
              <DropdownMenuLabel>Communication</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.hasTwoWay === 'yes'}
                onCheckedChange={(checked) => updateFilter('hasTwoWay', checked ? 'yes' : 'all')}
              >
                Has Two-Way Communication
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.hasPhone === 'yes'}
                onCheckedChange={(checked) => updateFilter('hasPhone', checked ? 'yes' : 'all')}
              >
                Has Phone Number
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
              const newFilters = { ...filters, sort, order: order as 'asc' | 'desc' }
              console.log('🔧 Sort updating both:', { sort, order })
              console.log('🔧 New filters:', newFilters)
              onFiltersChange(newFilters)
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              {filters.order === 'desc' ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
              <SelectItem value="updated_at-asc">Oldest Updated</SelectItem>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="last_contact_date-desc">Recent Contact</SelectItem>
              <SelectItem value="last_contact_date-asc">Oldest Contact</SelectItem>
              <SelectItem value="auto_contact_attempts-desc">Most Active</SelectItem>
              <SelectItem value="auto_contact_attempts-asc">Least Active</SelectItem>
              <SelectItem value="latest_temperature-desc">Hot → Cold</SelectItem>
              <SelectItem value="latest_temperature-asc">Cold → Hot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary">
                {filters.searchType === 'all' ? 'Search' : 
                 filters.searchType === 'name' ? 'Name' :
                 filters.searchType === 'phone' ? 'Phone' :
                 filters.searchType === 'notes' ? 'Notes' : 'Platform'}: {filters.search}
                <button
                  onClick={() => updateFilter('search', '')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.relationshipStatus.map(status => (
              <Badge key={status} variant="secondary">
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <button
                  onClick={() => toggleRelationshipStatus(status)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.relationshipType.map(type => (
              <Badge key={type} variant="secondary">
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                <button
                  onClick={() => toggleRelationshipType(type)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
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
            {filters.temperature.map(temp => (
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
            {filters.hasTwoWay === 'yes' && (
              <Badge variant="secondary">
                Two-Way Communication
                <button
                  onClick={() => updateFilter('hasTwoWay', 'all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.hasPhone === 'yes' && (
              <Badge variant="secondary">
                Has Phone
                <button
                  onClick={() => updateFilter('hasPhone', 'all')}
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