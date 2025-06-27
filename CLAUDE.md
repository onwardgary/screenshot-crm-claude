# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenshot CRM - A micro-SaaS application that analyzes social media conversation screenshots (WhatsApp, Instagram, TikTok, Messenger) and extracts lead information using GPT-4 Vision API.

## Tech Stack

- **Frontend**: Next.js 15 with React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with better-sqlite3
- **AI**: OpenAI GPT-4 Vision API for screenshot analysis
- **Deployment**: Designed for Vercel

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## Key Architecture

### Core Features
1. **Screenshot Upload** (`/`) - Main upload interface with drag & drop
2. **Lead Management** (`/leads`) - View and manage extracted leads with follow-up indicators
3. **GPT-4 Vision Analysis** - Processes screenshots to extract structured lead data  
4. **Smart Deduplication** - Identifies similar leads and auto-updates with new conversation data
5. **Conversation Tracking** - Tracks who sent last message for follow-up prioritization

### Database Schema
- **leads table**: Stores extracted contact information, conversation context, and lead scoring
- **screenshots table**: Tracks uploaded files and analysis results

### API Endpoints
- `POST /api/analyze-screenshot` - Processes uploaded screenshots with GPT-4 Vision
- `GET /api/leads` - Retrieves all stored leads

### Key Components
- `ScreenshotUpload` - File upload interface with drag & drop
- `LeadsList` - Displays leads with platform badges and follow-up status
- `database.ts` - SQLite operations and lead management

## Environment Variables

```bash
OPENAI_API_KEY=sk-... # Required: OpenAI API key for GPT-4 Vision
```

## Lead Data Structure

GPT-4 Vision extracts leads in this format:
```json
{
  "platform": "whatsapp|instagram|tiktok|messenger|other",
  "leads": [{
    "name": "contact name",
    "phone": "phone number if visible", 
    "lastMessage": "last message content",
    "lastMessageFrom": "user|contact",
    "timestamp": "message timestamp",
    "conversationSummary": "brief conversation summary",
    "leadScore": 1-10,
    "notes": "additional context"
  }]
}
```

## Follow-up System Logic

- **Red indicator**: Contact sent the last message (follow-up needed)
- **Green indicator**: User sent the last message (waiting for response)
- Lead scoring helps prioritize high-value prospects

## Smart Deduplication & Updates

- **Phone matching**: Exact phone number match (highest priority)
- **Name variations**: Handles "Alice Lim" vs "al" intelligently 
- **Substring matching**: "John" matches "John Smith"
- **Case insensitive**: "alice" matches "Alice"
- **Auto-updates**: Updates existing leads with newer conversation data
- **Smart merging**: Updates last message, conversation summary, lead score if better

### Update Logic
When duplicates found, automatically updates:
- `last_message` if different from existing
- `conversation_summary` if new information available  
- `lead_score` if higher than existing
- `phone` if missing from existing record
- `timestamp` with latest interaction

## Future Enhancements Planned

- Follow-up reminder notifications
- Lead export functionality  
- Bulk screenshot processing
- Integration with CRM platforms
- Advanced lead scoring algorithms