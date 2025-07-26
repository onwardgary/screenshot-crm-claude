# Screenshot CRM - System Architecture

## Project Overview

The Screenshot CRM is an AI-powered sales activity tracking system that transforms social media conversation screenshots into actionable performance insights. Built with Next.js 15, it helps sales professionals track their daily activities across platforms like WhatsApp, Instagram, and TikTok.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/Next)  │◄──►│   (API Routes)  │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                      │                      │
│ • Page Components    │ • Screenshot AI      │ • OpenAI GPT-4
│ • UI Components      │ • Activity CRUD      │   Vision API
│ • State Management   │ • Contact Mgmt       │
│ • Client-side Logic  │ • Analytics          │
└──────────────────────┴──────────────────────┴─────────────────────
                      ┌─────────────────┐
                      │   Database      │
                      │   (SQLite)      │
                      └─────────────────┘
                      │
                      │ • activities
                      │ • contacts  
                      │ • screenshots
                      │ • contact_history
```

## Tech Stack Details

### Core Technologies
- **Framework**: Next.js 15.3.4 with React 19
- **Language**: TypeScript for full type safety
- **Styling**: Tailwind CSS 4.0 with utility-first approach
- **Database**: SQLite with better-sqlite3 driver
- **AI**: OpenAI GPT-4 Vision API (`gpt-4o` model)
- **UI Library**: Radix UI primitives + custom components
- **Animation**: Framer Motion for smooth interactions
- **Icons**: Lucide React + custom SVG platform icons

### Key Dependencies
```json
{
  "runtime": ["next", "react", "typescript"],
  "database": ["better-sqlite3", "sqlite3"], 
  "ai": ["openai"],
  "ui": ["@radix-ui/*", "lucide-react", "framer-motion"],
  "styling": ["tailwindcss", "class-variance-authority", "clsx"],
  "utilities": ["tailwind-merge"]
}
```

## File Structure & Component Organization

### 1. Pages (App Router)
```
src/app/
├── page.tsx                    # Main dashboard with activity overview & streak calendar
├── layout.tsx                  # Root layout with fonts, metadata, toast provider
├── loading.tsx                 # Global loading component
├── error.tsx                   # Global error boundary
├── not-found.tsx              # 404 page
├── globals.css                # Global styles and Tailwind imports
├── activities/page.tsx        # Activity management interface with filtering
├── contacts/page.tsx          # Contact organization dashboard
├── upload/page.tsx            # Direct upload interface
└── analyze/
    └── batch/page.tsx         # Multi-screenshot batch processing interface
```

**Page Responsibilities:**
- **Main Dashboard**: Activity overview, streak tracking, analytics cards
- **Activities Page**: List all activities, bulk operations, search/filter
- **Contacts Page**: Contact management, assignment operations
- **Batch Analysis**: Multi-file upload, AI processing, review interface

### 2. API Routes (Backend)
```
src/app/api/
├── analyze-screenshot/route.ts     # GPT-4 Vision processing endpoint
├── analytics/route.ts              # Dashboard analytics aggregation
├── activities/
│   ├── route.ts                   # GET all, POST create activity
│   ├── [id]/route.ts             # GET, PUT, DELETE individual activity
│   ├── [id]/link-contact/route.ts # Link activity to existing contact
│   ├── bulk-assign/route.ts       # Bulk contact assignment operations
│   └── stats/route.ts            # Activity statistics
├── contacts/
│   ├── route.ts                   # GET all, POST create contact
│   ├── [id]/route.ts             # GET, PUT, DELETE individual contact
│   ├── [id]/activities/route.ts   # Get activities for specific contact
│   ├── [id]/contact-attempt/route.ts # Log contact attempt
│   ├── [id]/history/route.ts     # Contact history timeline
│   ├── bulk/route.ts             # Bulk contact operations
│   ├── bulk/customers/route.ts    # Bulk customer conversion
│   ├── due-followups/route.ts    # Contacts needing follow-up
│   └── stats/route.ts            # Contact statistics
└── screenshots/
    └── [id]/route.ts             # Retrieve screenshot by ID
```

**API Architecture:**
- **RESTful Design**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Next.js 15 Format**: Uses Promise-based params for dynamic routes
- **Centralized Database**: All routes use shared `src/lib/database.ts` operations
- **Error Handling**: Consistent error responses and logging

### 3. Components Architecture
```
src/components/
├── Core UI Components
│   ├── ActivityList.tsx           # Activity display with selection, temperature & communication badges
│   ├── ContactsList.tsx           # Contact cards with expansion, timeline integration
│   ├── MultiScreenshotUpload.tsx  # Drag/drop file upload with platform override
│   ├── ActivityFilters.tsx        # Search, sort, platform, temperature filtering
│   ├── ContactFilters.tsx         # Contact-specific filtering controls
│   └── Navbar.tsx                # Main navigation between pages
├── Advanced Features
│   ├── ActivityStreakCalendar.tsx # Duolingo-style 7-day streak visualization
│   ├── ContactActivityTimeline.tsx # Conversation history with screenshots
│   ├── ContactHistoryTimeline.tsx # Audit trail for contact changes
│   ├── ScreenshotModal.tsx       # Full-size screenshot viewer with download
│   ├── BulkActionBar.tsx         # Multi-select operations toolbar for activities
│   └── ContactBulkActionBar.tsx  # Smart bulk actions for contact management
├── Organization Workflows
│   ├── OrganizeContactModal.tsx   # Smart organize all activities
│   ├── ConvertContactsModal.tsx   # Convert selected activities to contacts
│   ├── QuickAssignSection.tsx     # Rapid contact assignment interface
│   ├── StickyQuickAssign.tsx      # Floating quick assignment widget
│   └── ActivityAssignmentCard.tsx # Reusable assignment form pattern
├── Smart Detection
│   ├── ContactDetectionBanner.tsx # Shows when existing contacts detected
│   └── ContactPicker.tsx          # Contact selection with search
├── Utility Components
│   ├── LoadMoreButton.tsx         # Pagination control
│   ├── ContactCardSkeleton.tsx    # Loading skeleton for contacts
│   └── ContactForm.tsx           # Reusable contact creation form
└── ui/ (Radix UI + Custom)
    ├── avatar.tsx, badge.tsx, button.tsx, card.tsx
    ├── checkbox.tsx, dialog.tsx, dropdown-menu.tsx
    ├── input.tsx, label.tsx, progress.tsx, scroll-area.tsx
    ├── select.tsx, separator.tsx, tabs.tsx, textarea.tsx
    └── toast.tsx, toaster.tsx     # Global notification system
```

**Component Interaction Patterns:**
1. **Activity Flow**: `MultiScreenshotUpload` → AI processing → `ActivityList` → bulk selection → assignment modals
2. **Contact Management**: `ContactsList` → expansion → `ContactActivityTimeline` → `ScreenshotModal`
3. **Search & Filter**: `ActivityFilters`/`ContactFilters` → parent components → filtered results
4. **Bulk Operations**: 
   - Activities: `BulkActionBar` → modal workflows → database updates → UI refresh
   - Contacts: `ContactBulkActionBar` → smart action visibility → bulk operations → pagination preservation

### 4. Business Logic Layer
```
src/lib/
├── database.ts              # SQLite operations and schema definitions
├── contactDetection.ts      # Duplicate detection across all contact creation
├── smartDetection.ts        # Activity grouping and fuzzy matching
├── platformUtils.tsx        # Platform icons, temperature badges, utilities
└── utils.ts                # General utilities (cn, date helpers)
```

### 5. Custom Hooks
```
src/hooks/
├── use-toast.ts            # Global toast notification management
└── useContactSearch.ts     # Debounced contact search with fuzzy matching
```

## Database Schema & Relationships

### Core Tables
```sql
-- Raw conversation data from screenshots
activities (
  id INTEGER PRIMARY KEY,
  screenshot_id INTEGER,           -- FK to screenshots table
  person_name TEXT NOT NULL,       -- Contact name or username
  phone TEXT,                      -- Phone number if visible
  platform TEXT NOT NULL,         -- whatsapp, instagram, tiktok, etc.
  message_content TEXT,            -- Last message content
  message_from TEXT,               -- 'user' or 'contact' 
  timestamp TEXT,                  -- Message timestamp if visible
  temperature TEXT DEFAULT 'warm', -- 'hot', 'warm', 'cold'
  notes TEXT,                      -- User notes
  is_group_chat BOOLEAN DEFAULT 0, -- Group conversation detection
  is_two_way_communication BOOLEAN DEFAULT 0, -- User-controlled two-way communication flag
  contact_id INTEGER,              -- FK to contacts table (NULL = unorganized)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Organized contact relationships
contacts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  platforms TEXT DEFAULT '[]',     -- JSON array of platforms
  relationship_status TEXT,        -- NULL=prospect, 'converted'=customer, 'inactive'=dormant
  relationship_type TEXT,          -- 'family', 'friend', 'stranger', 'referral', etc.
  last_contact_date DATE,
  contact_attempts INTEGER DEFAULT 0,
  response_rate REAL DEFAULT 0,
  notes TEXT,
  follow_up_date DATE,
  follow_up_notes TEXT,
  is_new BOOLEAN DEFAULT 1,        -- First 7 days after creation
  is_active BOOLEAN DEFAULT 0,     -- Has two-way communication
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Original screenshot files and AI analysis
screenshots (
  id INTEGER PRIMARY KEY,
  filename TEXT NOT NULL,
  file_data TEXT NOT NULL,         -- Base64 encoded image
  analysis_result TEXT,            -- JSON from GPT-4 Vision
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Audit trail for contact changes
contact_history (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER NOT NULL,     -- FK to contacts
  action_type TEXT NOT NULL,       -- 'customer_conversion', 'status_change', etc.
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Relationship Mapping
```
screenshots (1) ──► (many) activities ──► (many-to-1) contacts
                                                ▲
                                                │
                                    contact_history (many-to-1)
```

## Data Flow & System Interactions

### 1. Screenshot Processing Pipeline
```
User Upload → Multi-file Selection → Platform Override → AI Analysis → Review Interface → Save to Database

Detailed Flow:
1. MultiScreenshotUpload component accepts drag/drop files
2. Files sent to /api/analyze-screenshot with platform override
3. GPT-4 Vision API processes images, extracts conversation data
4. AI assigns temperature (hot/warm/cold) based on engagement level
5. Results returned to batch analysis interface for user review
6. User can edit details, exclude group chats, adjust temperatures
7. Approved activities saved to database with screenshot reference
```

### 2. Contact Organization Workflow
```
Unorganized Activities → Duplicate Detection → Assignment Decision → Contact Creation/Linking → Relationship Tracking

Detailed Flow:
1. Activities displayed in ActivityList with bulk selection
2. User selects activities for organization via BulkActionBar
3. Contact detection runs (phone exact match → name exact match → fuzzy name match)
4. OrganizeContactModal shows "Create New" vs "Link Existing" options
5. User approves assignments, system processes in batch
6. Activities get contact_id assignments, contacts get updated metrics
7. ContactsList shows organized relationships with activity history
```

### 3. Analytics & Performance Tracking
```
Raw Activity Data → Aggregation Queries → Dashboard Visualization → Goal Tracking

Detailed Flow:
1. Dashboard page requests data from /api/analytics
2. Database runs aggregation queries across activities and contacts
3. ActivityStreakCalendar shows 7-day activity pattern
4. Performance cards show platform breakdown, contact metrics
5. Contact status distribution shows prospect → customer conversion
```

## AI Integration Architecture

### GPT-4 Vision Processing
```typescript
// AI Analysis Request Structure
{
  model: "gpt-4o",
  messages: [
    {
      role: "system", 
      content: "Extract conversation data with temperature assessment..."
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this screenshot..." },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." }}
      ]
    }
  ]
}

// AI Response Structure
{
  platform: "whatsapp|instagram|tiktok|messenger|other",
  activities: [{
    person_name: "Contact Name",
    phone: "phone number or null",
    message_content: "last message content", 
    message_from: "user|contact",
    timestamp: "timestamp or null",
    temperature: "hot|warm|cold",        // AI-assigned engagement level
    is_group_chat: boolean,
    group_warning: "reason if group chat"
  }]
}
```

**AI Integration Points:**
- **Input Processing**: Base64 image encoding, platform override handling
- **Response Parsing**: JSON extraction with error handling for malformed responses
- **Temperature Logic**: Hot (active questions/interest), Warm (normal conversation), Cold (minimal engagement)
- **Group Detection**: Multi-participant identification, warning generation

## Smart Detection Algorithms

### Duplicate Contact Prevention
```typescript
// Contact Detection Priority (Highest to Lowest)
1. Exact Phone Match: phone === existing.phone (100% confidence)
2. Exact Name Match: name === existing.name && phones compatible
3. Fuzzy Name Match: similarity > 70% && phones compatible

// Phone Compatibility Rules
- Same phone number: Compatible
- One missing phone: Compatible  
- Different phone numbers: NOT compatible (different people)
```

### Activity Grouping Logic
```typescript
// Smart Organization Algorithm
1. Group activities by person name similarity
2. Validate phone number compatibility (prevent merging different phones)
3. Use fuzzy matching for names only (Levenshtein distance)
4. Detect existing contacts and prefer linking over creation
5. Show expandable preview with individual activity verification
```

## State Management & Performance

### Client-Side State Patterns
- **Component State**: React useState for UI interactions
- **Form Handling**: Controlled components with validation
- **Selection State**: Set-based multi-select with parent communication
- **Loading States**: Per-component loading indicators
- **Toast Notifications**: Global useToast hook for user feedback

### Performance Optimizations
- **Pagination**: 15 items per page with load-more functionality
- **Pagination Preservation**: `refreshAllContacts()` maintains loaded contacts after edits
- **Database Indexing**: Optimized queries for large activity datasets
- **Client-Side Filtering**: Debounced search with multiple field support
- **Lazy Loading**: Progressive screenshot loading in modals
- **Memoization**: React optimization for expensive calculations
- **Smart Bulk Actions**: Intelligent action visibility based on selection analysis

### Mobile Responsiveness
- **Breakpoint Design**: Tailwind responsive classes throughout
- **Touch Interactions**: Mobile-optimized component sizing
- **Responsive Grids**: Card layouts adapt to screen size
- **Progressive Enhancement**: Desktop features gracefully degrade

## Security & Data Protection

### API Security
- **Environment Variables**: OpenAI API key stored securely
- **Input Validation**: TypeScript interfaces + runtime validation
- **Error Handling**: No sensitive data leaked in error responses
- **File Upload**: Controlled file types, size limits

### Data Privacy
- **Local Storage**: SQLite database stays on user's machine
- **Screenshot Data**: Base64 encoded, stored locally only
- **AI Processing**: Screenshots sent to OpenAI but not persistently stored
- **Contact Information**: Phone numbers and names handled securely

## Deployment & Infrastructure

### Vercel Deployment
- **Next.js Optimization**: Static generation where possible
- **Edge Runtime**: API routes optimized for serverless
- **Database**: SQLite file included in deployment bundle
- **Environment**: OpenAI API key configured in Vercel dashboard

### Development Workflow
```bash
npm run dev          # Development server with hot reload
npm run build        # Production build with optimization
npm run start        # Production server
npm run lint         # ESLint with Next.js config
npm run type-check   # TypeScript compilation check
```

## Key Business Features

### Activity Performance Tracking
1. **Duolingo-Style Streaks**: 7-day visual calendar with fire icons
2. **Platform Analytics**: WhatsApp vs Instagram vs TikTok breakdown
3. **Temperature Distribution**: Hot vs Warm vs Cold conversation analysis
4. **Goal Setting**: Daily/weekly activity targets and progress

### Contact Relationship Management
1. **Progressive Disclosure**: Contact cards expand to show full activity history
2. **Two-Way Communication Tracking**: Automatic detection of contact responses
3. **Follow-Up Scheduling**: Date-based reminders with notes
4. **Customer Conversion Tracking**: Prospect → Customer status progression

### Smart Organization Features
1. **Bulk Operations**: Multi-select with intelligent contact assignment
2. **Fuzzy Matching**: Name similarity detection while respecting phone differences
3. **Group Chat Filtering**: Automatic detection and optional exclusion
4. **Platform Integration**: Consistent experience across WhatsApp, Instagram, TikTok
5. **Smart Bulk Actions**: Context-aware action visibility (e.g., "Mark as Customer" only for prospects)
6. **Pagination Preservation**: Maintains contact visibility after edits regardless of load state

### Recent Architecture Improvements

#### July 26, 2025: Navigation & State Synchronization Fixes
1. **Navigation Timing Optimization**: Removed artificial delays from batch save navigation for immediate user feedback
2. **Checkbox State Synchronization**: Implemented bidirectional sync logic between global and individual group chat toggles
3. **User Experience Flow**: Enhanced save completion workflow with instant routing to activities page
4. **State Management Logic**: Added smart detection in toggleActivity() to maintain UI consistency
5. **Component Interaction**: Improved checkbox behavior to reflect actual inclusion/exclusion state

#### July 20, 2025: Communication Badge Implementation
1. **Visual Consistency Enhancement**: Added two-way communication badges to activity cards matching contact card functionality
2. **Component Interface Updates**: Extended Activity interface to include `is_two_way_communication` field
3. **Icon Integration**: Added `ArrowLeftRight` from lucide-react for communication status indicators
4. **Badge System Standardization**: Unified badge design pattern across ActivityList and ContactsList components

#### July 19, 2025: Bulk Action & Pagination Improvements
1. **Enhanced Bulk Action Logic**: `ContactBulkActionBar` now receives full contact objects for intelligent decision making
2. **Pagination State Management**: New `refreshAllContacts()` function prevents data loss during edits
3. **Component Data Flow**: Improved parent-child communication with contact objects alongside IDs
4. **UI Alignment Fixes**: Better visual hierarchy with proper checkbox positioning
5. **TypeScript Type Safety**: Fixed interface compatibility across component boundaries

## Timezone Architecture for Global SaaS

### **Problem Statement**
Traditional web applications store dates in UTC and display them in the server's timezone, causing issues for SaaS applications with international users. Users expect "today" to reflect their local business day, not the server's timezone.

### **Solution Architecture**

#### **1. Multi-Timezone Date Calculation Strategy**

```typescript
// ❌ OLD: Server timezone dependent
const today = new Date().toISOString().split('T')[0] // Always UTC

// ✅ NEW: User timezone aware  
const today = getDateInTimezone(userTimezone) // User's local date
```

#### **2. Timezone Detection Flow**

```
User visits dashboard → Browser detects timezone → Send to API as parameter → 
Server calculates in user timezone → Return timezone-aware metrics → Display matches expectations
```

#### **3. API Design Pattern**

All date-sensitive endpoints accept optional timezone parameter:

```typescript
// API Signature
GET /api/analytics/dashboard?timezone=Asia/Singapore
GET /api/activities/stats?timezone=America/New_York

// Implementation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userTimezone = searchParams.get('timezone') || DEFAULT_TIMEZONE
  
  const todayStr = getDateInTimezone(userTimezone)
  const thisWeekStart = getMondayOfWeekInTimezone(userTimezone)
  // ... use timezone-aware dates for all calculations
}
```

### **Core Timezone Utilities** (`/lib/timezoneUtils.ts`)

#### **Date Calculation Functions**

```typescript
// Primary date calculation using Intl.DateTimeFormat
export const getDateInTimezone = (timezone: string): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit'
  })
  return formatter.format(new Date()) // Returns "2025-07-27"
}

// Calendar week calculation (Monday-Sunday)
export const getMondayOfWeekInTimezone = (timezone: string): string => {
  const today = getTimeDetailsInTimezone(timezone)
  const currentDate = new Date(`${today.date}T00:00:00`)
  const dayOfWeek = currentDate.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  const mondayDate = new Date(currentDate)
  mondayDate.setDate(currentDate.getDate() - daysFromMonday)
  return mondayDate.toISOString().split('T')[0]
}
```

#### **Grace Period Logic**

Activity streaks continue until 23:59 of the user's timezone:

```typescript
export const isWithinGracePeriod = (timezone: string): boolean => {
  const timeDetails = getTimeDetailsInTimezone(timezone)
  return timeDetails.hour < 23 || (timeDetails.hour === 23 && timeDetails.minute < 59)
}
```

### **Frontend Integration**

#### **Automatic Timezone Detection**

```typescript
// Client-side timezone detection
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return DEFAULT_TIMEZONE // Fallback to Singapore
  }
}

// Usage in React components
const fetchAnalytics = async () => {
  const userTimezone = isClient ? getBrowserTimezone() : DEFAULT_TIMEZONE
  const response = await fetch(`/api/analytics/dashboard?timezone=${encodeURIComponent(userTimezone)}`)
}
```

#### **Component Date Matching**

```typescript
// ActivityStreakCalendar.tsx - Match API date format
const getActivityForDate = (date: Date) => {
  const userTimezone = isClient ? getBrowserTimezone() : DEFAULT_TIMEZONE
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: userTimezone })
  return activityStreak.find(a => a.activity_date === dateStr)
}
```

### **Database Strategy**

#### **Storage Pattern**
- **Timestamps**: Store in UTC for consistency (`created_at`, `updated_at`)
- **Date Queries**: Convert to user timezone for calculations
- **Date Comparisons**: Use timezone-aware date strings in WHERE clauses

```sql
-- Example: Get today's activities for Singapore user
SELECT * FROM activities 
WHERE DATE(created_at) = '2025-07-27'  -- Calculated in user's timezone
```

### **Supported Timezone Matrix**

| Region | Timezone | UTC Offset | Business Hours |
|--------|----------|------------|----------------|
| Singapore (Default) | Asia/Singapore | UTC+8 | 9 AM = 01:00 UTC |
| Tokyo | Asia/Tokyo | UTC+9 | 9 AM = 00:00 UTC |
| Hong Kong | Asia/Hong_Kong | UTC+8 | 9 AM = 01:00 UTC |
| New York | America/New_York | UTC-5/-4 | 9 AM = 14:00/13:00 UTC |
| London | Europe/London | UTC+0/+1 | 9 AM = 09:00/08:00 UTC |

### **Deployment Considerations**

#### **Server Location Independence**
- Application works correctly regardless of server timezone
- Cloud deployments (Vercel, AWS, Azure) handle timezone conversion properly
- No server configuration required for timezone support

#### **Performance Impact**
- `Intl.DateTimeFormat` is fast and well-optimized
- Timezone calculations add ~1-2ms per request
- No additional database queries required
- Client-side caching of timezone detection

#### **Error Handling**
```typescript
// Timezone validation
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

// Graceful fallback
const safeTimezone = isValidTimezone(userTimezone) ? userTimezone : DEFAULT_TIMEZONE
```

### **Testing Strategy**

#### **Timezone Test Cases**
```bash
# Test different timezones return correct dates
curl "http://localhost:3000/api/analytics/dashboard?timezone=Asia/Singapore"
curl "http://localhost:3000/api/analytics/dashboard?timezone=America/New_York"

# Verify different "today" counts based on timezone
```

### **Benefits Summary**

✅ **Accurate User Experience**: "Today" means the user's actual today  
✅ **Global SaaS Ready**: Works correctly for users worldwide  
✅ **Performance Optimized**: Minimal overhead for timezone support  
✅ **Developer Friendly**: Simple utility functions for timezone handling  
✅ **Future Proof**: Extensible for user preferences and business hours  
✅ **Zero Configuration**: Works out of the box with automatic detection

This architecture enables efficient screenshot-to-insight conversion while maintaining code quality, user experience, and scalability for growing activity datasets with global timezone support.