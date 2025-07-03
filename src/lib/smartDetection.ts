interface Activity {
  id: number
  person_name: string
  phone?: string
  platform: string
}

interface DetectionResult {
  recommendation: 'merge' | 'convert' | 'mixed'
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

// Simple fuzzy match for names
function fuzzyMatch(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()
  
  // Exact match
  if (n1 === n2) return 1.0
  
  // One name contains the other (e.g., "John" in "John Doe")
  if (n1.includes(n2) || n2.includes(n1)) return 0.8
  
  // Check initials match (e.g., "John D." vs "John Doe")
  const initials1 = n1.split(' ').map(w => w[0]).join('')
  const initials2 = n2.split(' ').map(w => w[0]).join('')
  if (initials1 && initials2 && initials1 === initials2) return 0.7
  
  // Simple character similarity
  const chars1 = new Set(n1.split(''))
  const chars2 = new Set(n2.split(''))
  const intersection = [...chars1].filter(c => chars2.has(c)).length
  const union = new Set([...chars1, ...chars2]).size
  const similarity = intersection / union
  
  return similarity
}

export function analyzeActivities(activities: Activity[]): DetectionResult {
  if (activities.length === 0) {
    return { recommendation: 'mixed', confidence: 'low', reason: 'No activities selected' }
  }
  
  if (activities.length === 1) {
    return { recommendation: 'convert', confidence: 'high', reason: 'Single activity selected' }
  }
  
  // Check for phone number matches
  const phones = activities.map(a => a.phone).filter(Boolean)
  const uniquePhones = new Set(phones)
  if (phones.length > 1 && uniquePhones.size === 1) {
    return { recommendation: 'merge', confidence: 'high', reason: 'Same phone number detected' }
  }
  
  // Analyze names
  const names = activities.map(a => a.person_name)
  let allSimilar = true
  let allDifferent = true
  const threshold = 0.6 // 60% similarity threshold
  
  for (let i = 0; i < names.length - 1; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const similarity = fuzzyMatch(names[i], names[j])
      if (similarity < threshold) {
        allSimilar = false
      }
      if (similarity > threshold) {
        allDifferent = false
      }
    }
  }
  
  // Determine recommendation
  if (allSimilar) {
    return { 
      recommendation: 'merge', 
      confidence: 'high', 
      reason: 'Same person detected' 
    }
  }
  
  if (allDifferent) {
    return { 
      recommendation: 'convert', 
      confidence: 'high', 
      reason: 'Different people detected' 
    }
  }
  
  // Mixed case
  return { 
    recommendation: 'mixed', 
    confidence: 'medium', 
    reason: 'Mixed - some names appear similar' 
  }
}