import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { screenshotOperations } from '@/lib/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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
          - Escape all quotes in message content properly
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
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanJson = analysisText.trim()
      
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
      
      const parsedResults = JSON.parse(cleanJson)
      
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