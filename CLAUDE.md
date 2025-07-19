# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Activity Performance Dashboard** - An AI-powered sales activity tracking system that transforms social media conversation screenshots into actionable performance insights. Instead of predicting sales outcomes (which is hard), we track **activity levels** - because successful salespeople know they need "1 more call, 1 more text, talk to 1 more person."

## Core Value Proposition

Transform scattered conversation screenshots into a powerful activity performance dashboard that helps sales professionals stay consistent, organized, and motivated in their daily outreach efforts.

## Target Users & User Stories

### **Primary User: Sales Professional**
*"I need to track my daily sales activities to stay motivated and hit my targets"*

**User Stories:**
- "As a salesperson, I want to upload multiple screenshots at once so I can quickly process my daily conversations"
- "As a user, I want to see if conversations are Hot/Warm/Cold so I can prioritize follow-ups"
- "As a professional, I want to organize activities into contacts so I can build relationships"
- "As a goal-oriented person, I want to see my activity streaks and performance metrics"

### **Secondary User: Sales Manager**
*"I need visibility into my team's activity levels, not just outcomes"*

**User Stories:**
- "As a manager, I want to see team activity dashboards to coach effectively"
- "As a leader, I want to track activity trends across different platforms"

## Tech Stack

- **Frontend**: Next.js 15 with React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with better-sqlite3
- **AI**: OpenAI GPT-4 Vision API for screenshot analysis
- **UI Components**: Radix UI with custom toast system
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

## Core User Flows

### 1. **Activity Capture Flow**
```
📱 Multi-Upload → 🎯 Platform Override → 🤖 AI Analysis → 🌡️ Temperature Assignment → 📋 Platform Review → 💾 Save Activities
```

**Detailed Steps:**
1. **Multi-Screenshot Upload**: Drag/drop multiple conversation screenshots at once
2. **Platform Override**: Manual platform selection per screenshot (WhatsApp, Instagram, TikTok, etc.)
3. **AI Processing**: GPT-4 Vision extracts conversation data and assigns Hot/Warm/Cold temperature
4. **Platform-Based Review**: Review activities organized by platform tabs, edit details, exclude group chats
5. **Batch Save**: Save all approved activities to performance dashboard

### 2. **Activity Organization Flow**
```
📋 Unorganized Activities → 👤 Contact Creation → 🔗 Activity Linking → 📈 Relationship Tracking
```

**Detailed Steps:**
1. **Browse Activities**: View all unorganized conversation activities
2. **Create Contacts**: Convert activities into organized relationship contacts
3. **Link Activities**: Associate future activities with existing contacts
4. **Track Performance**: Monitor contact attempts, response rates, follow-up schedules

### 3. **Performance Monitoring Flow**
```
📊 Dashboard View → 📈 Activity Metrics → 🎯 Streak Tracking → 💪 Goal Optimization
```

**Detailed Steps:**
1. **Daily Dashboard**: Activity counts, platform breakdown, temperature distribution
2. **Streak Tracking**: Monitor consecutive days of activity
3. **Platform Analysis**: Understand which platforms drive best engagement
4. **Goal Setting**: Set and track daily/weekly activity targets

## Database Schema

### **Core Tables:**
- **activities**: Raw conversation data from screenshots with Hot/Warm/Cold temperature
- **contacts**: Organized people/relationships with performance metrics  
- **screenshots**: Original images with AI analysis results for traceability

### **Data Model:**
```typescript
interface Activity {
  id: number
  screenshot_id?: number
  person_name: string
  phone?: string
  platform: string
  message_content?: string
  message_from?: string
  timestamp?: string
  temperature: 'hot' | 'warm' | 'cold'  // Replaces numeric scoring
  notes?: string
  is_group_chat: boolean
  contact_id?: number // Links to organized contact
  created_at: string
  updated_at?: string
}

interface Contact {
  id: number
  name: string
  phone?: string
  platforms: string[] // Array of platforms they use
  relationship_status: 'new' | 'active' | 'converted' | 'dormant'
  relationship_type?: 'family' | 'friend'
  last_contact_date?: string
  contact_attempts: number
  response_rate: number
  notes?: string
  follow_up_date?: string
  follow_up_notes?: string
  created_at: string
  updated_at?: string
}
```

## API Endpoints

### **Activity Management:**
- `POST /api/analyze-screenshot` - Processes screenshots with GPT-4 Vision, supports platform override
- `GET /api/activities` - Retrieves activities with optional filtering (?organized=false)
- `POST /api/activities` - Create new activity with temperature
- `PUT /api/activities/[id]` - Update activity details
- `DELETE /api/activities/[id]` - Delete activity

### **Contact Management:**
- `GET /api/contacts` - Retrieve all contacts with optional status filtering
- `POST /api/contacts` - Create new contact from activity
- `PUT /api/contacts/[id]` - Update contact details and metrics
- `DELETE /api/contacts/[id]` - Delete contact

### **Analytics:**
- `GET /api/analytics/activities` - Activity performance metrics
- `GET /api/analytics/contacts` - Contact relationship metrics
- `GET /api/analytics/streaks` - Daily activity streak data

## Key Components

### **Upload & Processing:**
- `MultiScreenshotUpload` - Batch file upload with platform override dropdowns
- `ScreenshotUpload` - Legacy single file upload (being phased out)

### **Review & Organization:**
- `/analyze/batch/page.tsx` - Platform-organized batch review interface with temperature dropdowns
- `/analyze/page.tsx` - Legacy single screenshot review (being phased out)

### **Activity Management:**
- `ActivityList` - Modern activity display with Hot/Warm/Cold temperature badges
- `/activities/page.tsx` - Main activities dashboard
- `LeadsList` - Legacy component (being removed)

### **Contact Management:**
- `ContactsList` - Contact relationship management interface
- `/contacts/page.tsx` - Contact organization dashboard

### **Performance Dashboard:**
- `/dashboard/page.tsx` - Activity performance analytics and streaks

### **Navigation & UI:**
- `Navbar` - Navigation between Activities, Contacts, Dashboard
- `Toaster` - Custom toast notification system for user feedback
- Various Radix UI components for professional interface

## Temperature System (Hot/Warm/Cold)

### **Philosophy:**
Replaced complex 1-10 numeric scoring with simple 3-level temperature system for intuitive prioritization.

### **Temperature Definitions:**
- **🔥 Hot**: Recent active conversation, person asking questions or showing strong interest
- **🌡️ Warm**: Normal conversation, some engagement (default for most interactions)
- **❄️ Cold**: Old messages, one-word responses, or minimal engagement

### **Implementation:**
- AI automatically assigns temperature during screenshot analysis
- Users can override temperature during review process
- Visual badges with emojis for immediate recognition
- No complex scoring logic - just simple categorical prioritization

## Duplicate Detection System

### **Philosophy:**
Prevent duplicate contact creation by intelligently detecting existing contacts before creating new ones. All contact creation features share the same detection logic for consistency.

### **Detection Priority (Highest to Lowest):**
1. **Exact Phone Match**: If phone numbers match exactly, it's the same person (highest confidence)
2. **Exact Name Match**: If names match exactly AND phones are compatible (same or one missing)
3. **Fuzzy Name Match**: Name similarity >70% AND phones are compatible

### **Implementation:**
- Shared `contactDetection.ts` module used by all features
- Fetches existing contacts before any creation operation
- Shows visual indicators when existing contacts are detected
- Automatically suggests linking instead of creating duplicates

### **Features with Duplicate Detection:**
1. **Smart Organize Modal**:
   - Uses `findExistingContact()` function
   - Shows "Link to: [existing contact]" badges
   - Reports count of linked vs created contacts

2. **Merge Activities (Bulk Action)**:
   - Uses `detectExistingContactForActivities()` 
   - Shows confidence levels (high/medium)
   - Auto-switches to "Link" tab for high confidence matches

3. **Convert to Contacts (Bulk Action)**:
   - Detects matches for each individual activity
   - Shows "Will link to: [contact]" for each match
   - Processes linking and creation in batch

### **Key Rules:**
- Different phone numbers = Different people (never merged)
- Phone number matching uses exact comparison only
- Name matching uses fuzzy algorithm (Levenshtein distance)
- Group activities can share contacts if phone numbers match

## Multi-Screenshot Processing

### **Batch Upload Features:**
- Drag-and-drop multiple files simultaneously
- Visual file preview with thumbnails
- Platform override dropdown per screenshot
- Real-time processing status for each file
- Error handling and retry capabilities

### **Platform Organization:**
- Dynamic tabs based on detected platforms (WhatsApp, Instagram, TikTok, etc.)
- Group chat detection with visual warnings
- Bulk operations per platform (exclude all group chats, etc.)
- Platform-specific review workflows

### **Review Interface:**
- Activities organized by platform tabs
- Temperature dropdown for each activity
- Bulk editing capabilities
- Smart group chat filtering
- Custom toast notifications for feedback

## Environment Variables

```bash
OPENAI_API_KEY=sk-... # Required: OpenAI API key for GPT-4 Vision
```

## AI Analysis Structure

GPT-4 Vision extracts activities in this format:
```json
{
  "platform": "whatsapp|instagram|tiktok|messenger|other",
  "activities": [{
    "person_name": "contact name or username",
    "phone": "phone number if visible or null",
    "message_content": "the last message content",
    "message_from": "user|contact",
    "timestamp": "timestamp if visible or null",
    "temperature": "hot|warm|cold",  // AI-assigned temperature
    "notes": "any important context",
    "is_group_chat": true,
    "group_warning": "explanation why this appears to be a group chat"
  }],
  "screenshotId": 123
}
```

## Activity Performance Analytics

### **Key Metrics:**
- **Daily Activity Count**: Screenshots processed per day
- **Platform Distribution**: WhatsApp vs Instagram vs TikTok activity
- **Temperature Breakdown**: Hot vs Warm vs Cold ratio
- **Activity Streaks**: Consecutive days of activity tracking
- **Organization Rate**: Activities converted to contacts
- **Contact Performance**: Response rates and follow-up success

### **Dashboard Features:**
- Visual activity streak tracking
- Platform performance comparison
- Temperature distribution charts
- Goal setting and progress tracking
- Contact relationship analytics

### **Manager Dashboard Requirements:**
**Sales Management Oversight Features:**
1. **New Lead Outreach Tracking**: Monitor how many new leads each salesperson has reached out to
   - Track first-time contact attempts per salesperson
   - Identify new vs. returning contacts in activity feed
   - Measure new lead generation rate and consistency

2. **Active Conversation Monitoring**: Track ongoing conversation engagement levels
   - Monitor active conversation count per salesperson
   - Track response rates and conversation momentum
   - Identify stalled conversations requiring intervention

3. **Inactive Lead Revisitation**: Ensure dormant leads are being followed up
   - Track follow-up activities on previously dormant contacts
   - Monitor time gaps between contact attempts
   - Alert on leads that haven't been contacted within set timeframes

## Current System Status

### **✅ Recently Completed:**

#### **Latest Session - July 13, 2025:**
**Branch**: `contact-auto-calculation`
**Commit**: `a708be9`

**Major Features Implemented:**
1. **Contact Expansion System**: Complete progressive disclosure interface for contacts with activity history and screenshot access
2. **Activity Timeline Component**: Chronological conversation history with platform icons, message direction indicators, and temperature badges
3. **Screenshot Modal System**: Full-size screenshot viewer with download, open, and error handling capabilities
4. **SVG Platform Icons**: Professional icon system replacing emoji with proper WhatsApp, Instagram, TikTok, Messenger, Telegram, and other platform SVGs
5. **Comprehensive TypeScript Cleanup**: Fixed 40+ linting errors for production-ready code quality

**Technical Improvements:**
- **TypeScript Excellence**: Eliminated all `any` types, unused imports, and missing dependencies across 38 files
- **Next.js 15 Compatibility**: Updated all API routes to use Promise-based params format
- **Type Safety**: Added proper interfaces for all data structures and component props
- **Error Handling**: Improved try/catch patterns and removed unused error variables
- **HTML Standards**: Fixed all escaping issues (apostrophes to &apos;, quotes to &ldquo;/&rdquo;)
- **React Best Practices**: Added proper eslint-disable comments for legitimate dependency exclusions
- **Code Quality**: Build now compiles cleanly with zero TypeScript errors

**New Components Created:**
- **`ContactActivityTimeline.tsx`**: Timeline component showing conversation history with visual timeline, platform icons, message direction, and screenshot access
- **`ScreenshotModal.tsx`**: Full-featured modal for viewing screenshots with download/open functionality and error states
- **`/public/icons/`**: 9 professional SVG platform icons (WhatsApp, Instagram, TikTok, Messenger, Telegram, Line, LinkedIn, WeChat, Phone)
- **`/api/contacts/[id]/activities`**: New API endpoint for fetching contact-specific activity history

**UX Enhancements:**
- **Progressive Disclosure**: Contact cards show essential info by default, expand to reveal comprehensive activity history on click
- **Visual Hierarchy**: Clear expansion indicators, loading states, and intuitive click-to-expand interface
- **Professional Icons**: Replaced generic emoji with proper platform SVG icons throughout the application
- **Screenshot Integration**: Screenshot count indicators on contact cards with direct access to full-size viewing
- **Activity Context**: Complete conversation flow visualization with message direction and platform context

#### **Previous Session - July 11, 2025:**
**Branch**: `contact-auto-calculation`
**Commit**: `1277865`

**Major Features Implemented:**
1. **Duolingo-Style Activity Streak Calendar**: Interactive visual 7-day calendar with fire icons, Monday-Sunday weekly view, month headers, and motivational messaging
2. **Complete UX Unification**: Redesigned "Merge" → "Combine and Assign" and "Convert" → "Assign" with identical form patterns, smart detection, and terminology
3. **Simplified Contact Creation**: Removed relationship type requirement across all flows for streamlined user experience
4. **Unified Assignment Interface**: Both flows now use same tabs ("Create New Contact" vs "Assign to Existing"), form fields, and user control
5. **Dashboard Consolidation**: Moved dashboard functionality to main page with prominent streak calendar integration
6. **Navigation Fixes**: Fixed dashboard button visibility and consistent highlighting across all pages
7. **Reusable Components**: Created `ActivityAssignmentCard` for consistent assignment patterns across flows
8. **Database Reset**: Cleared all data for fresh user flow testing with clean slate

**Technical Changes:**
- **New Components**: `ActivityStreakCalendar.tsx`, `ActivityAssignmentCard.tsx` for modular design
- **Major Refactors**: Complete rewrite of `ConvertContactsModal.tsx` to match `OrganizeContactModal.tsx` patterns
- **Terminology Updates**: Updated all button text, modal titles, and toast messages for consistency
- **Architecture Improvements**: Unified detection logic and enhanced user feedback across all contact creation
- **Navigation Structure**: Consolidated dashboard functionality and removed duplicate dashboard page
- **Form Simplification**: Removed relationship type fields and validation from all contact creation flows

**UX Improvements:**
- **Clear Mental Model**: "Assignment" concept instead of confusing "merge vs convert" distinction
- **Visual Engagement**: Motivational streak calendar with fire icons and weekly progress tracking  
- **Consistent Experience**: Identical interface patterns across all contact assignment flows
- **Streamlined Workflows**: Simplified forms focusing on essential fields (Name, Phone, Notes)
- **Enhanced Feedback**: Better progress tracking and status indicators throughout assignment process

#### **Previous Session - July 8, 2025:**
**Branch**: `activity-performance-dashboard`

**Major Features Implemented:**
1. **Bulk Contact Management**: Multi-select with merge/convert workflows - all with duplicate detection
2. **Smart Detection Algorithm**: Fuzzy name matching for recommendations
3. **Targeted Search System**: Field-specific search (Name, Phone, Message, Notes)
4. **React State Bug Fixes**: Resolved sorting dropdown race conditions
5. **Visual UI Enhancements**: Color-coded buttons, progress tracking, animations
6. **Smart Organize All Feature**: One-click automatic contact creation with intelligent grouping and duplicate detection
7. **Conditional Fuzzy Matching**: Phone numbers use exact matching, names use fuzzy matching
8. **Phone Number Validation**: Prevents activities with different phone numbers from merging
9. **Expandable Activity Details**: Shows individual person names for verification transparency
10. **Toast System Consistency**: Removed redundant sonner dependency
11. **Comprehensive Duplicate Detection**: All contact creation features (Smart Organize, Merge, Convert) detect and link to existing contacts

**Technical Changes:**
- New components: `BulkActionBar`, `OrganizeContactModal`, `ConvertContactsModal`, `SmartOrganizeModal`
- Smart detection: `smartDetection.ts` with fuzzy matching algorithms and phone number detection
- Contact detection: `contactDetection.ts` module shared across all contact creation features
- Search filtering: Added `searchType` parameter for targeted results
- State management: Fixed atomic updates in `ActivityFilters`
- UI libraries: Added Framer Motion for animations
- API improvements: Enhanced activity filtering with search type support
- Phone compatibility: `isPhoneNumber()` function prevents false phone number similarities
- Activity transparency: Expandable interface shows individual person names for verification
- Levenshtein distance: Proper similarity algorithm for human names only

**Smart Organize Algorithm:**
1. Fetch existing contacts before processing
2. Group activities by person name similarity
3. Validate phone number compatibility (different phones = different people)
4. Use fuzzy matching for names, exact matching for phone numbers
5. Detect existing contacts and link instead of creating duplicates
6. Show expandable preview with individual activity details
7. Create contacts with batch processing and error handling

### **🎯 Next Development Priorities:**

**Date Updated**: July 11, 2025  
**Status**: Based on user testing feedback

**High Priority:**
1. **Activity Editing**: Add individual & bulk edit functionality for activities
   - Edit activity details (name, phone, platform, temperature, message direction)
   - Bulk edit operations (change platform, temperature, etc.)
   - Allow editing after organization (maintaining contact links)

2. **Screenshot Functionality**: Fix screenshot viewing and indicators
   - Add screenshot indicators to contacts (show if linked activities have screenshots)
   - Create screenshot viewer modal with "View Screenshot" buttons
   - Show screenshot count in contact cards for context

**✅ Recently Completed:**
3. **~~Simplify Convert Flow~~**: ✅ **COMPLETED** - Made merge/convert more intuitive
   - ✅ Removed relationship type requirement from all flows 
   - ✅ Unified terminology: "Combine and Assign" / "Assign to Contacts"
   - ✅ Identical form interfaces across all assignment flows
   - ✅ Streamlined UI focused on activity → contact conversion

**Medium Priority:**
4. **Activity Deduplication**: Smart merging across multiple screenshots
5. **Mobile Optimization**: Touch gestures and responsive design improvements
6. **Performance Optimization**: Large batch processing improvements

**Future Enhancements:**
7. **Advanced Analytics**: More detailed performance insights and trends
8. **Follow-up Automation**: Smart reminders and sequences
9. **Export/Import**: CSV, PDF reporting capabilities
10. **Remove Legacy Lead System**: Clean up old `/api/leads` routes and components (if any exist)

## Troubleshooting

### **Common Issues:**
- **Missing temperature values**: Default to 'warm' if not specified
- **Platform override not working**: Ensure `platformOverride` form field is properly sent
- **Toast notifications not appearing**: Check if `<Toaster />` is added to layout
- **Batch processing errors**: Handle individual file failures gracefully
- **Missing environment variables**: Ensure `OPENAI_API_KEY` is set in `.env.local`

### **Development Notes:**
- **Smart Organize Algorithm**: Phone number validation prevents false merges
- **Conditional Fuzzy Matching**: `isPhoneNumber()` regex detects phone patterns for exact matching
- **Activity Transparency**: Expandable cards show individual person names for verification
- **Duplicate Detection**: All contact creation features detect and link to existing contacts using shared `contactDetection.ts` module
- **Phone Compatibility**: Different phone numbers are never grouped together
- **Toast System**: Consistent `useToast()` hook across all components

## File Structure

```
src/
├── app/
│   ├── activities/              # Activity management pages
│   ├── contacts/                # Contact organization pages
│   ├── dashboard/               # Performance analytics
│   ├── analyze/
│   │   └── batch/              # Multi-screenshot review interface
│   └── api/
│       ├── activities/         # Activity CRUD operations
│       ├── contacts/           # Contact management
│       ├── analytics/          # Performance data
│       └── analyze-screenshot/ # AI processing endpoint
├── components/
│   ├── ActivityList.tsx        # Modern activity display
│   ├── MultiScreenshotUpload.tsx # Batch upload interface
│   ├── ContactsList.tsx        # Contact management
│   └── ui/                     # Radix UI components + toast system
├── hooks/
│   └── use-toast.ts           # Toast notification hook
└── lib/
    └── database.ts            # SQLite operations (activities + contacts)
```

---

**Remember**: This is an Activity Performance Dashboard focused on tracking effort and consistency, not a traditional CRM focused on sales outcomes. The system prioritizes simplicity, visual clarity, and actionable insights for sales professionals who want to improve their activity levels.