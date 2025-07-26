/**
 * Timezone utilities for SaaS deployment
 * Handles proper date calculations for users in different timezones
 */

// Default timezone for the application (Singapore)
export const DEFAULT_TIMEZONE = 'Asia/Singapore' // UTC+8

/**
 * Get current date in a specific timezone
 * @param timezone - IANA timezone string (e.g., 'Asia/Singapore', 'America/New_York')
 * @returns Date string in YYYY-MM-DD format
 */
export const getDateInTimezone = (timezone: string = DEFAULT_TIMEZONE): string => {
  const now = new Date()
  
  // Use Intl.DateTimeFormat for accurate timezone conversion
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD format
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  return formatter.format(now)
}

/**
 * Get current time details in a specific timezone
 * @param timezone - IANA timezone string
 * @returns Object with date, time components, and formatted strings
 */
export const getTimeDetailsInTimezone = (timezone: string = DEFAULT_TIMEZONE) => {
  const now = new Date()
  
  // Get date components in the specified timezone
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Get individual components
  const dateParts = dateFormatter.formatToParts(now)
  const timeParts = timeFormatter.formatToParts(now)
  
  const year = parseInt(dateParts.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(dateParts.find(p => p.type === 'month')?.value || '0')
  const day = parseInt(dateParts.find(p => p.type === 'day')?.value || '0')
  const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0')
  
  return {
    date: dateFormatter.format(now), // YYYY-MM-DD
    time: timeFormatter.format(now), // HH:MM:SS
    year,
    month,
    day,
    hour,
    minute,
    timezone,
    timestamp: now.toISOString() // Keep UTC timestamp for database storage
  }
}

/**
 * Get Monday of current week in a specific timezone
 * @param timezone - IANA timezone string
 * @returns Date string in YYYY-MM-DD format
 */
export const getMondayOfWeekInTimezone = (timezone: string = DEFAULT_TIMEZONE): string => {
  const today = getTimeDetailsInTimezone(timezone)
  
  // Create a Date object for the current date in the timezone
  const currentDate = new Date(`${today.date}T00:00:00`)
  
  // Calculate Monday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = currentDate.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  // Calculate Monday's date
  const mondayDate = new Date(currentDate)
  mondayDate.setDate(currentDate.getDate() - daysFromMonday)
  
  // Format back to YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA')
  return formatter.format(mondayDate)
}

/**
 * Get first day of current month in a specific timezone
 * @param timezone - IANA timezone string
 * @returns Date string in YYYY-MM-DD format
 */
export const getFirstOfMonthInTimezone = (timezone: string = DEFAULT_TIMEZONE): string => {
  const today = getTimeDetailsInTimezone(timezone)
  return `${today.year}-${String(today.month).padStart(2, '0')}-01`
}

/**
 * Check if it's within grace period for streak calculation
 * Grace period: before 23:59 of the current day
 * @param timezone - IANA timezone string
 * @returns boolean indicating if within grace period
 */
export const isWithinGracePeriod = (timezone: string = DEFAULT_TIMEZONE): boolean => {
  const timeDetails = getTimeDetailsInTimezone(timezone)
  
  // Grace period: before 23:59 (23 hours, 59 minutes)
  return timeDetails.hour < 23 || (timeDetails.hour === 23 && timeDetails.minute < 59)
}

/**
 * Convert UTC date string to timezone-specific date string
 * @param utcDateString - Date string in YYYY-MM-DD format (UTC)
 * @param timezone - Target timezone
 * @returns Date string in YYYY-MM-DD format (timezone-specific)
 */
export const convertUTCToTimezone = (utcDateString: string, timezone: string = DEFAULT_TIMEZONE): string => {
  const utcDate = new Date(`${utcDateString}T00:00:00Z`)
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  return formatter.format(utcDate)
}

/**
 * Get user's timezone from browser (for client-side usage)
 * @returns IANA timezone string
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return DEFAULT_TIMEZONE // Fallback to Singapore timezone
  }
}

/**
 * Validate if a timezone string is valid
 * @param timezone - IANA timezone string to validate
 * @returns boolean indicating validity
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

// Common timezone options for SaaS deployment
export const COMMON_TIMEZONES = {
  'Asia/Singapore': 'Singapore (UTC+8)',
  'Asia/Tokyo': 'Tokyo (UTC+9)', 
  'Asia/Seoul': 'Seoul (UTC+9)',
  'Asia/Hong_Kong': 'Hong Kong (UTC+8)',
  'Asia/Kuala_Lumpur': 'Kuala Lumpur (UTC+8)',
  'Asia/Jakarta': 'Jakarta (UTC+7)',
  'Asia/Bangkok': 'Bangkok (UTC+7)',
  'Australia/Sydney': 'Sydney (UTC+10/+11)',
  'America/New_York': 'New York (UTC-5/-4)',
  'America/Los_Angeles': 'Los Angeles (UTC-8/-7)',
  'Europe/London': 'London (UTC+0/+1)',
  'UTC': 'UTC (UTC+0)'
} as const

export type SupportedTimezone = keyof typeof COMMON_TIMEZONES