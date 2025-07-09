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
  relationship_type?: 'family' | 'friend' | 'stranger' | 'referral' | 'existing_customer'
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

## Current System Status

### **✅ Recently Completed (Latest Session):**

**Date**: July 8, 2025
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

**High Priority:**
1. **Complete Contact Workflow**: Finish activity → contact conversion process
2. **Activity Deduplication**: Smart merging across multiple screenshots
3. **Remove Legacy Lead System**: Clean up old `/api/leads` routes and components

**Medium Priority:**
4. **Mobile Optimization**: Touch gestures and responsive design improvements
5. **Performance Optimization**: Large batch processing improvements
6. **Advanced Analytics**: More detailed performance insights and trends

**Future Enhancements:**
7. **Bulk Operations**: Mass edit, delete, export capabilities
8. **Follow-up Automation**: Smart reminders and sequences
9. **Export/Import**: CSV, PDF reporting capabilities

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