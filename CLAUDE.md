# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenshot CRM - A comprehensive lead management system that analyzes social media conversation screenshots (WhatsApp, Instagram, TikTok, Messenger) and extracts lead information using GPT-4 Vision API. Features complete lead lifecycle management with pipeline views, bulk operations, and screenshot traceability.

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
2. **Three-View Lead Pipeline** - Lead Inbox (raw) → Active Pipeline → Archive with seamless movement
3. **Individual & Bulk Actions** - Move single leads or bulk operations with selection system
4. **Screenshot Traceability** - View original screenshot source for any lead with modal viewer
5. **GPT-4 Vision Analysis** - Processes screenshots to extract structured lead data with group chat detection
6. **Auto-Merge Suggestions** - AI-powered duplicate detection with confidence scoring (60-100%)
7. **Manual Lead Merging** - Combine duplicate leads with conversation history preservation
8. **Follow-up Tracking** - Visual indicators for who sent last message (contact = red, user = green)

### Database Schema
- **leads table**: Core lead data with status, screenshot_id, and merge tracking
- **screenshots table**: Base64 image storage with analysis results for traceability

### API Endpoints
- `POST /api/analyze-screenshot` - Processes uploaded screenshots with GPT-4 Vision and saves screenshot data
- `GET /api/leads` - Retrieves leads with optional status filtering (?status=raw|active|archived)
- `PUT /api/leads/[id]/status` - Update individual lead status
- `PUT /api/leads/bulk-status` - Bulk status updates for multiple leads
- `POST /api/leads/merge` - Merge multiple leads into one with history preservation
- `GET /api/leads/merge-suggestions` - Get AI-powered duplicate suggestions with confidence scores
- `GET /api/screenshots/[id]` - Serve screenshot images with proper caching headers

### Key Components
- `ScreenshotUpload` - File upload interface with drag & drop
- `LeadsList` - Advanced lead display with bulk selection, status actions, merge suggestions, and screenshot viewing
- `database.ts` - SQLite operations with leadOperations and screenshotOperations
- **Lead Pipeline Pages**: `/leads/inbox`, `/leads/pipeline`, `/leads/archive` with context-aware actions

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
    "leadScore": 1-10,
    "notes": "additional context",
    "isGroupChat": true,
    "groupWarning": "Multiple participants detected"
  }],
  "screenshotId": 123
}
```

## Follow-up System Logic

- **Red indicator**: Contact sent the last message (follow-up needed)
- **Green indicator**: User sent the last message (waiting for response)
- Lead scoring helps prioritize high-value prospects

## Lead Lifecycle Management

### Status Flow
- **Raw** (Inbox) → **Active** (Pipeline) → **Archived** (Completed)
- **Merged** status for consolidated leads

### Individual Actions
- **Inbox**: "Qualify to Pipeline" (raw → active)
- **Pipeline**: "Back to Inbox" (active → raw) + "Archive" (active → archived)  
- **Archive**: "Reactivate" (archived → active)

### Bulk Actions
- Select multiple leads with checkboxes
- Context-aware bulk buttons appear in sticky toolbar
- "Qualify Selected", "Archive Selected", "Reactivate Selected"
- Merge functionality for duplicate consolidation

## Auto-Merge Suggestions

### Duplicate Detection Algorithm
- **Phone matching**: Exact phone number match (100% confidence)
- **Name similarity**: Levenshtein distance calculations with substring matching
- **Platform matching**: Bonus points for same platform  
- **Temporal proximity**: Created within 24 hours (bonus confidence)
- **Message similarity**: Common word analysis

### Confidence Scoring
- **60-69%**: Low confidence (orange badge)
- **70-89%**: Medium confidence (yellow badge)  
- **90-100%**: High confidence (green badge) - eligible for auto-accept

### Merge Process
- Combines conversation histories (keeps last 5)
- Preserves best data (highest lead score, phone numbers, etc.)
- Tracks merged_from_ids for audit trail
- Updates target lead, deletes source leads

## Screenshot Traceability System

### Implementation
- Screenshots saved as base64 in database with unique IDs
- Each lead linked to source screenshot via `screenshot_id` foreign key
- API endpoint `/api/screenshots/[id]` serves images with caching headers

### User Experience  
- "View Source Screenshot" button in expanded lead details
- Modal viewer with full-screen image display
- Only appears for leads with associated screenshots
- Helps users remember context and verify lead quality

## Troubleshooting

### Common Issues
- **Turbopack navigation errors**: Use `npm run dev` (without Turbopack) instead of `npm run dev:turbo` in development
- **Missing environment variables**: Ensure `OPENAI_API_KEY` is set in `.env.local`
- **Database column errors**: Database migrations run automatically on startup

### Development Notes
- Conversation summary/history removed - only `last_message` displayed for simplicity
- Group chats auto-detected and can be filtered/skipped during lead review
- All status changes refresh lead lists automatically
- Bulk operations provide detailed success/error feedback