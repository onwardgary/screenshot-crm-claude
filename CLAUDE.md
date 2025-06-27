# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenshot CRM - A **lightweight, zero-integration CRM** designed for **individual direct sellers** (insurance agents, MLM distributors like Amway/Usana/Mary Kay) to easily manage leads from social media conversations. Uses GPT-4 Vision API to extract lead information from screenshots and provides simple lead management with optional upline/team management features.

## Target Audience & Philosophy

**Primary Users:**
- Individual insurance agents
- Direct sales representatives (MLM/network marketing)
- Welfare product distributors
- Independent sales professionals

**Core Philosophy:**
- **Lightweight & Simple** - No complex integrations or enterprise features
- **Screenshot-first** - Extract leads from existing social conversations
- **Individual-focused** - Personal performance tracking and simple workflows
- **Team-aware** - Upline management for team oversight and coaching
- **Zero Setup** - Works immediately without connecting external systems

**Intentionally NOT building:**
- Enterprise CRM features
- Complex automation workflows  
- Multiple communication channel integrations
- Advanced reporting/analytics
- Heavy customization options

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

### Core Features ✨ **SIMPLIFIED WORKFLOW (Dec 2024)**
1. **Screenshot Upload** (`/`) - Main upload interface with drag & drop
2. **Two-Stage Lead Pipeline** - Active → Archive (eliminated redundant Inbox/Pipeline distinction)
3. **Individual & Bulk Actions** - Archive/Reactivate operations with selection system
4. **Screenshot Traceability** - View original screenshot source for any lead with modal viewer
5. **GPT-4 Vision Analysis** - Processes screenshots to extract structured lead data with group chat detection
6. **Auto-Merge Suggestions** - AI-powered duplicate detection with confidence scoring (60-100%)
7. **Manual Lead Merging** - Combine duplicate leads with conversation history preservation
8. **Follow-up Tracking** - Visual indicators for who sent last message (contact = red, user = green)
9. **Complete Follow-up System** - Contact attempts, follow-up dates, notes, and reminder tracking

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
- **Lead Pages**: `/leads` (Active leads), `/leads/archive` with context-aware actions
- `Navbar` - Responsive navigation with simplified Active/Archive tabs
- `FollowupBanner` - Dashboard for due follow-ups and contact reminders

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

## Lead Lifecycle Management ✨ **SIMPLIFIED (Dec 2024)**

### Status Flow
- **Active** → **Archived** (eliminated raw/inbox status - all leads start as active)
- **Merged** status for consolidated leads

### Individual Actions
- **Active Leads**: "Archive" (active → archived)
- **Archive**: "Reactivate" (archived → active)

### Bulk Actions
- Select multiple leads with checkboxes
- Context-aware bulk buttons appear in sticky toolbar
- "Archive Selected", "Reactivate Selected"
- Merge functionality for duplicate consolidation

### Follow-up System
- **Contact Attempts**: Track calls, messages, meetings with timestamp
- **Follow-up Dates**: Set reminders (Tomorrow, 3 Days, 1 Week, 1 Month)
- **Visual Indicators**: Red (contact sent last) vs Green (user sent last)
- **Due Follow-ups**: Dashboard banner shows overdue contacts

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

## Direct Sales CRM - Next Development Priorities

### Critical Missing Features (for individual direct sellers)

**1. Personal Sales Performance Tracking**
- Sales targets and progress visualization
- Monthly/weekly volume tracking  
- Rank/level progression indicators
- Commission calculations and projections
- Product-specific sales tracking

**2. Team/Upline Management (for team leaders)**
- Team member performance dashboard
- Individual team member overview
- Team leaderboards and rankings
- Coaching notes and feedback system
- Team communication broadcasts

**3. Simple Contact Enrichment**
- Lead temperature classification (hot/warm/cold)
- Interest categories (health/beauty/income opportunity)
- Relationship type (family/friend/stranger/referral)
- Last contact attempt tracking
- Follow-up cadence planning

**4. Lightweight Follow-up System**
- Simple reminder notifications
- Follow-up templates for common scenarios
- Contact attempt logging (called/messaged/met)
- Next action planning (basic)

### Implementation Priority Order

**Phase 1: Individual Seller Essentials**
1. Personal performance dashboard with targets
2. Simple follow-up reminder system
3. Lead temperature/categorization
4. Contact attempt tracking

**Phase 2: Team Management**
1. Team overview dashboard for uplines
2. Individual team member performance views
3. Basic coaching notes system
4. Team communication features

**Phase 3: Analytics & Optimization**
1. Personal conversion rate tracking
2. Lead source effectiveness analysis
3. Monthly activity summaries
4. Goal vs actual reporting

### Keep Simple - Intentionally Avoid

- Enterprise-level integrations
- Complex automation workflows
- Heavy reporting and analytics
- Multiple communication channel integrations
- Advanced customization options

**Remember:** This is a lightweight, screenshot-first CRM for individual direct sellers, not an enterprise solution.

---

## 🚀 Recent Progress & Next Steps (December 2024)

### ✅ **Completed Major Workflow Simplification**

**Date**: December 27, 2024  
**Branch**: `simplify-workflow` (pushed to GitHub)  
**Key Insight**: User identified that Inbox and Pipeline were redundant - both had identical follow-up functionality

**What Was Done:**
1. **Eliminated 3-stage confusion**: Removed separate `/leads/inbox` and `/leads/pipeline` pages
2. **Unified to 2-stage flow**: Active → Archive (much clearer for direct sellers)
3. **Preserved all power**: Follow-up system, merge suggestions, contact tracking fully maintained
4. **Updated defaults**: New leads start as 'active' instead of 'raw'
5. **Simplified navigation**: Navbar now shows only "Active" and "Archive" tabs
6. **Fixed duplicate detection**: Names with parenthetical additions (e.g., "Gannis (You)") now merge correctly

**Technical Changes:**
- Removed `/leads/inbox/page.tsx` and `/leads/pipeline/page.tsx`
- Transformed `/leads/page.tsx` into unified active leads management
- Updated database operations to default to 'active' status
- Simplified bulk operations and individual lead actions
- Updated navbar component for two-tab navigation

### 🎯 **Ready for Next Session**

**Current State**: Fully functional simplified workflow on `simplify-workflow` branch

**Next Priorities** (in order):
1. **Test & Validate**: Create PR and test the simplified workflow thoroughly
2. **User Feedback**: Get user validation on the simplified flow
3. **Merge to Main**: If approved, merge `simplify-workflow` → `main`
4. **Performance Dashboard**: Add individual sales tracking (targets, progress, rank)
5. **Team Management**: Add upline/team oversight features for team leaders

**Development Environment**:
- Server runs on `http://localhost:3001` (port 3000 was in use)
- All changes committed and pushed to GitHub
- Easy rollback available: `git checkout main` if needed

**Files Ready for Tomorrow**:
- Workflow simplification complete and documented
- All todo items completed
- Clean git history with descriptive commits
- Ready to pick up with performance dashboard or user testing