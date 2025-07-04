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

// Detect if a string looks like a phone number
function isPhoneNumber(name: string): boolean {
  const cleaned = name.trim()
  // Match patterns like: +60 10-235 5099, 0123456789, (555) 123-4567, +1-555-123-4567
  return /^[\+]?[\d\s\-\(\)]{8,}$/.test(cleaned)
}

// Advanced name similarity using Levenshtein distance and name structure
export function fuzzyMatch(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()
  
  // Exact match
  if (n1 === n2) return 1.0
  
  // CRITICAL: If either name looks like a phone number, use exact matching only
  if (isPhoneNumber(n1) || isPhoneNumber(n2)) {
    return 0 // Phone numbers must match exactly, no fuzzy matching
  }
  
  // One name contains the other (e.g., "John" in "John Doe")
  if (n1.includes(n2) || n2.includes(n1)) return 0.8
  
  // Parse names into parts
  const parts1 = n1.split(/\s+/).filter(p => p.length > 0)
  const parts2 = n2.split(/\s+/).filter(p => p.length > 0)
  
  // Check if any name parts match exactly
  for (const part1 of parts1) {
    for (const part2 of parts2) {
      if (part1 === part2 && part1.length > 2) { // Avoid matching single letters
        return 0.7 // High similarity for matching name parts
      }
    }
  }
  
  // Check initials match (e.g., "John D." vs "John Doe") - but only if both have multiple parts
  if (parts1.length > 1 && parts2.length > 1) {
    const initials1 = parts1.map(w => w[0]).join('')
    const initials2 = parts2.map(w => w[0]).join('')
    if (initials1 === initials2) return 0.6
  }
  
  // Use Levenshtein distance for final similarity
  const longer = n1.length > n2.length ? n1 : n2
  const shorter = n1.length > n2.length ? n2 : n1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = getEditDistance(longer, shorter)
  const similarity = (longer.length - editDistance) / longer.length
  
  // Only consider it similar if Levenshtein similarity is > 80% and names are reasonably close in length
  const lengthRatio = shorter.length / longer.length
  if (similarity > 0.8 && lengthRatio > 0.6) {
    return similarity
  }
  
  return 0 // Not similar
}

// Levenshtein distance calculation
function getEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

export function findSimilarNames(targetName: string, allNames: string[], threshold: number = 0.6): string[] {
  const similarNames: { name: string; score: number }[] = []
  
  for (const name of allNames) {
    if (name === targetName) continue
    const score = fuzzyMatch(targetName, name)
    if (score >= threshold) {
      similarNames.push({ name, score })
    }
  }
  
  // Sort by similarity score (highest first) and return just the names
  return similarNames
    .sort((a, b) => b.score - a.score)
    .map(item => item.name)
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