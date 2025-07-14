import { Badge } from '@/components/ui/badge'

/**
 * Platform icon mapping and rendering utilities
 */
export const getPlatformIcon = (platform: string, size = 16) => {
  const iconMap: Record<string, string> = {
    'whatsapp': '/icons/whatsapp.svg',
    'instagram': '/icons/instagram.svg',
    'messenger': '/icons/messenger.svg',
    'telegram': '/icons/telegram.svg',
    'tiktok': '/icons/tiktok.svg',
    'line': '/icons/line.svg',
    'linkedin': '/icons/linkedin.svg',
    'wechat': '/icons/wechat.svg'
  }
  
  const iconPath = iconMap[platform.toLowerCase()] || '/icons/phone.svg'
  
  return (
    <img 
      src={iconPath} 
      alt={`${platform} icon`}
      width={size} 
      height={size}
      className="inline-block"
    />
  )
}

/**
 * Temperature emoji utilities
 */
export const getTemperatureEmoji = (temperature?: string) => {
  switch (temperature) {
    case 'hot': return '🔥'
    case 'warm': return '🌡️'
    case 'cold': return '❄️'
    default: return '🌡️'
  }
}

/**
 * Temperature badge utilities with proper styling
 */
export const getTemperatureBadge = (temperature?: string) => {
  switch (temperature) {
    case 'hot':
      return <Badge className="bg-red-100 text-red-800 text-xs px-1 py-0">🔥</Badge>
    case 'warm':
      return <Badge className="bg-orange-100 text-orange-800 text-xs px-1 py-0">🌡️</Badge>
    case 'cold':
      return <Badge className="bg-blue-100 text-blue-800 text-xs px-1 py-0">❄️</Badge>
    default:
      return <Badge className="bg-orange-100 text-orange-800 text-xs px-1 py-0">🌡️</Badge>
  }
}

/**
 * Temperature badge utilities with text labels (for detailed views like ActivityList)
 */
export const getTemperatureBadgeWithText = (temperature?: string) => {
  switch (temperature) {
    case 'hot':
      return <Badge className="bg-red-100 text-red-800">🔥 Hot</Badge>
    case 'warm':
      return <Badge className="bg-orange-100 text-orange-800">🌡️ Warm</Badge>
    case 'cold':
      return <Badge className="bg-blue-100 text-blue-800">❄️ Cold</Badge>
    default:
      return <Badge className="bg-orange-100 text-orange-800">🌡️ Warm</Badge>
  }
}

/**
 * Get platform icon path without rendering component (for cases where you need just the path)
 */
export const getPlatformIconPath = (platform: string): string => {
  const iconMap: Record<string, string> = {
    'whatsapp': '/icons/whatsapp.svg',
    'instagram': '/icons/instagram.svg',
    'messenger': '/icons/messenger.svg',
    'telegram': '/icons/telegram.svg',
    'tiktok': '/icons/tiktok.svg',
    'line': '/icons/line.svg',
    'linkedin': '/icons/linkedin.svg',
    'wechat': '/icons/wechat.svg'
  }
  
  return iconMap[platform.toLowerCase()] || '/icons/phone.svg'
}