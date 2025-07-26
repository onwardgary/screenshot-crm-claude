import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { screenshotOperations } from '@/lib/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Phone number normalization function
function normalizePhoneNumber(phone: string | null): string | null {
  if (!phone || typeof phone !== 'string') return phone
  
  // Remove common separators and formatting  
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // Remove extensions (common patterns)
  cleaned = cleaned.replace(/(?:ext|x|extension).*$/i, '')
  
  // Keep only digits and + 
  cleaned = cleaned.replace(/[^\d+]/g, '')
  
  // Add + if missing for international numbers (7+ digits)
  if (!cleaned.startsWith('+') && cleaned.length >= 7) {
    return '+' + cleaned
  }
  
  return cleaned
}

// Phone number detection function
function isPhoneNumber(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  
  // Remove common separators and check if it looks like a phone number
  const cleaned = text.replace(/[\s\-\(\)\.]/g, '')
  
  // Check if it contains mostly digits and phone symbols, and has reasonable length
  const phonePattern = /^[\+]?[\d]{7,15}$/
  return phonePattern.test(cleaned)
}

// Partial extraction function for salvaging individual activities
function attemptPartialExtraction(text: string, platformOverride?: string | null): { platform: string; activities: any[]; skipped: number } | null {
  try {
    let platform = 'unknown'
    const validActivities: any[] = []
    let skippedCount = 0
    
    // Try to extract platform
    const platformMatch = text.match(/"platform"\s*:\s*"([^"]+)"/i)
    if (platformMatch) {
      platform = platformMatch[1]
    }
    
    // Override platform if provided
    if (platformOverride) {
      platform = platformOverride.toLowerCase()
    }
    
    // Find all activity-like objects in the text
    const activityRegex = /\{\s*"person_name"\s*:\s*"[^"]*"[^}]*\}/g
    const activityMatches = text.match(activityRegex)
    
    if (!activityMatches) {
      console.log('No activity objects found in partial extraction')
      return null
    }
    
    console.log(`Found ${activityMatches.length} potential activity objects`)
    
    // Try to parse each activity individually
    for (const activityText of activityMatches) {
      try {
        // Clean the activity text
        let cleanActivity = activityText.trim()
        
        // Fix common issues
        cleanActivity = cleanActivity.replace(/\\'/g, "'")
        
        // Try to parse this individual activity
        const activity = JSON.parse(cleanActivity)
        
        // Validate it has required fields
        if (activity.person_name) {
          // Apply phone normalization
          if (activity.phone) {
            activity.phone = normalizePhoneNumber(activity.phone)
          }
          
          if (activity.person_name && isPhoneNumber(activity.person_name)) {
            activity.person_name = normalizePhoneNumber(activity.person_name) || activity.person_name
          }
          
          validActivities.push(activity)
        } else {
          skippedCount++
        }
      } catch (activityParseError) {
        console.log('Failed to parse individual activity:', activityParseError)
        skippedCount++
      }
    }
    
    if (validActivities.length === 0) {
      console.log('No valid activities extracted in partial mode')
      return null
    }
    
    return {
      platform,
      activities: validActivities,
      skipped: skippedCount
    }
  } catch (error) {
    console.error('Partial extraction failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('screenshot') as File
    const platformOverride = formData.get('platformOverride') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type
    
    console.log('File info:', { 
      name: file.name, 
      size: file.size, 
      type: mimeType,
      base64Length: base64.length 
    })

    // Analyze the screenshot with GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing social media conversation screenshots. 
          Extract activity information and return ONLY valid JSON with this exact structure:
          {
            "platform": "whatsapp|instagram|tiktok|messenger|other",
            "activities": [
              {
                "person_name": "contact name or username",
                "phone": "phone number if visible or null",
                "message_content": "the last message content",
                "message_from": "user|contact",
                "timestamp": "timestamp if visible or null",
                "temperature": "warm",
                "is_group_chat": true,
                "group_warning": "explanation why this appears to be a group chat"
              }
            ]
          }
          
          IMPORTANT: 
          - Return ONLY valid JSON, no additional text
          - Use \" for quotes inside strings, NEVER use \'
          - Escape all quotes in message content properly with \"
          - Use null for missing values, not empty strings
          - Keep messages brief to avoid quote issues
          - Identify who sent the last message based on message alignment and platform styling
          - DETECT GROUP CHATS: Look for multiple participants, group names (Family, Work Team, etc.), or group indicators
          - Set isGroupChat to true if you detect group conversation patterns
          - Set groupWarning with reason like "Multiple participants detected" or "Group name suggests family/work group"
          - Individual 1-on-1 conversations should have isGroupChat: false or null
          - TEMPERATURE ASSESSMENT: Set temperature based on conversation quality:
            * "hot" - Recent active conversation, person asking questions or showing strong interest
            * "warm" - Normal conversation, some engagement, default for most interactions
            * "cold" - Old messages, one-word responses, or minimal engagement`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this social media screenshot. If you can see any conversations, names, or contact information, extract them. If the image is unclear or you cannot identify conversations, return: {\"platform\": \"unknown\", \"activities\": [], \"error\": \"Could not identify clear conversation data\"}"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    })

    const analysisText = response.choices[0]?.message?.content
    
    console.log('GPT-4 Vision Response:', analysisText)
    console.log('Response type:', typeof analysisText)
    console.log('Token usage:', response.usage)
    
    if (!analysisText) {
      return NextResponse.json({ error: 'Failed to analyze screenshot' }, { status: 500 })
    }

    // Clean and parse the JSON response
    let cleanJson = analysisText.trim()
    try {
      // Clean the response - remove any markdown formatting or extra text
      
      // Remove markdown code blocks if present
      if (cleanJson.includes('```json')) {
        cleanJson = cleanJson.split('```json')[1].split('```')[0].trim()
      } else if (cleanJson.includes('```')) {
        cleanJson = cleanJson.split('```')[1].split('```')[0].trim()
      }
      
      // Find JSON object in the response
      const jsonStart = cleanJson.indexOf('{')
      const jsonEnd = cleanJson.lastIndexOf('}') + 1
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanJson = cleanJson.substring(jsonStart, jsonEnd)
      }
      
      // Fix common JSON escape sequence issues
      cleanJson = cleanJson.replace(/\\'/g, "'")  // Fix invalid \' escape
      // Removed aggressive quote replacement that was corrupting Unicode characters
      
      console.log('Cleaned JSON (first 200 chars):', cleanJson.substring(0, 200))
      
      const parsedResults = JSON.parse(cleanJson)
      
      // Normalize phone numbers in all extracted activities
      if (parsedResults.activities) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parsedResults.activities = parsedResults.activities.map((activity: any) => {
          const normalizedActivity = { ...activity }
          
          // Normalize phone field if it exists
          if (activity.phone) {
            normalizedActivity.phone = normalizePhoneNumber(activity.phone)
          }
          
          // Normalize person_name if it's a phone number
          if (activity.person_name && isPhoneNumber(activity.person_name)) {
            normalizedActivity.person_name = normalizePhoneNumber(activity.person_name)
            console.log(`Normalized phone in name field: "${activity.person_name}" -> "${normalizedActivity.person_name}"`)
          }
          
          return normalizedActivity
        })
        console.log('Phone numbers normalized for', parsedResults.activities.length, 'activities')
      }
      
      console.log('Parsed results:', parsedResults)
      console.log('Activities found:', parsedResults.activities?.length || 0)
      
      // Save screenshot to database for future reference
      const screenshotResult = screenshotOperations.create(
        file.name,
        base64,
        JSON.stringify(parsedResults)
      )
      const screenshotId = screenshotResult.lastInsertRowid
      
      // Apply platform override if provided
      if (platformOverride) {
        parsedResults.platform = platformOverride.toLowerCase()
      }
      
      // Return extracted data for user review (don't auto-save activities)
      const responseData = {
        ...parsedResults,
        screenshotId: screenshotId,
        totalActivities: parsedResults.activities?.length || 0,
        message: `${parsedResults.activities?.length || 0} activities extracted for review`
      }
      
      console.log('Final response data:', responseData)
      
      // Return the created activities
      return NextResponse.json(responseData)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('AI Response that failed to parse:', analysisText)
      console.error('Cleaned JSON that failed:', cleanJson?.substring(0, 300) || 'undefined')
      
      // Try alternative parsing strategies
      try {
        // Strategy 1: Try to fix truncated JSON by adding missing closing braces
        let fixedJson = cleanJson || analysisText
        const openBraces = (fixedJson.match(/{/g) || []).length
        const closeBraces = (fixedJson.match(/}/g) || []).length
        if (openBraces > closeBraces) {
          fixedJson += '}'.repeat(openBraces - closeBraces)
          console.log('Attempting to fix truncated JSON...')
          const parsedResults = JSON.parse(fixedJson)
          console.log('✅ Successfully parsed with truncation fix')
          
          // Continue with normal flow...
          if (parsedResults.activities) {
            parsedResults.activities = parsedResults.activities.map((activity: { phone?: string; [key: string]: unknown }) => {
              const normalizedActivity = { ...activity }
              
              if (activity.phone) {
                normalizedActivity.phone = normalizePhoneNumber(activity.phone as string) || undefined
              }
              
              if (activity.person_name && isPhoneNumber(activity.person_name as string)) {
                normalizedActivity.person_name = normalizePhoneNumber(activity.person_name as string) || activity.person_name
                console.log(`Normalized phone in name field: "${activity.person_name}" -> "${normalizedActivity.person_name}"`)
              }
              
              return normalizedActivity
            })
            console.log('Phone numbers normalized for', parsedResults.activities.length, 'activities')
          }
          
          const screenshotResult = screenshotOperations.create(
            file.name,
            base64,
            JSON.stringify(parsedResults)
          )
          const screenshotId = screenshotResult.lastInsertRowid
          
          if (platformOverride) {
            parsedResults.platform = platformOverride.toLowerCase()
          }
          
          const responseData = {
            ...parsedResults,
            screenshotId: screenshotId,
            totalActivities: parsedResults.activities?.length || 0,
            message: `${parsedResults.activities?.length || 0} activities extracted for review`
          }
          
          return NextResponse.json(responseData)
        }
      } catch (retryError) {
        console.error('Alternative parsing also failed:', retryError)
      }
      
      // Strategy 2: Try partial extraction of individual activities
      try {
        console.log('Attempting partial activity extraction...')
        const partialResults = attemptPartialExtraction(cleanJson || analysisText, platformOverride)
        
        if (partialResults && partialResults.activities.length > 0) {
          console.log(`✅ Partial extraction successful: ${partialResults.activities.length} activities recovered`)
          
          // Create screenshot record for partial results
          const screenshotResult = screenshotOperations.create(
            file.name,
            base64,
            JSON.stringify(partialResults)
          )
          const screenshotId = screenshotResult.lastInsertRowid
          
          const responseData = {
            ...partialResults,
            screenshotId: screenshotId,
            totalActivities: partialResults.activities.length,
            message: `${partialResults.activities.length} activities extracted (partial success)`,
            warning: partialResults.skipped > 0 ? `${partialResults.skipped} activities skipped due to parsing issues` : undefined
          }
          
          return NextResponse.json(responseData)
        }
      } catch (partialError) {
        console.error('Partial extraction also failed:', partialError)
      }
      
      // If JSON parsing fails, try to handle common AI responses
      if (analysisText.toLowerCase().includes("sorry") || 
          analysisText.toLowerCase().includes("can't") ||
          analysisText.toLowerCase().includes("unable") ||
          analysisText.toLowerCase().includes("unclear") ||
          analysisText.toLowerCase().includes("not contain")) {
        return NextResponse.json({
          platform: "unknown",
          activities: [],
          error: "Could not parse AI response",
          suggestion: "The image may be unclear or not contain recognizable conversation data",
          details: "AI indicated the image content was not clear enough to extract conversation data",
          rawResponse: analysisText.substring(0, 500) // Limit response length
        })
      }
      
      return NextResponse.json({ 
        error: 'Could not parse AI response',
        rawResponse: analysisText.substring(0, 500), // Limit response length
        suggestion: "The image may be unclear or not contain recognizable conversation data",
        details: `JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      })
    }

  } catch (error) {
    console.error('Error analyzing screenshot:', error)
    return NextResponse.json({ 
      error: 'Failed to process screenshot' 
    }, { status: 500 })
  }
}